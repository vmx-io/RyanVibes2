import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { EmployeeService, Employee } from '../services/employee.service';

interface ShiftFlags {
  isSickLeave: boolean;
  isTraining:  boolean;
  isVacation:  boolean;
  isNightShift: boolean;
}

interface Shift extends ShiftFlags {
  date: string;           // ISO yyyy-mm-dd
  start: string | null;   // "HH:MM" or null
  end:   string | null;
  hours: number;          // 0 if absent
}

const MONTH_MAP: Record<string, number> = {
  STY: 0, LUT: 1, MAR: 2, KWI: 3, MAJ: 4, CZE: 5,
  LIP: 6, SIE: 7, WRZ: 8, 'PAŹ': 9, PAZ: 9,
  LIS: 10, GRU: 11,
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-bg">
      <div class="center-container">
        <div class="fancy-title">Hello! ✈️</div>
        <input 
          type="file" 
          (change)="handleFileInput($event)" 
          accept=".xlsx,.xls" 
          id="fileInput"
          #fileInput
        />
        <label for="fileInput" class="upload-circle">
          <svg class="upload-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="2" fill="none"/>
            <polyline points="16,26 24,18 32,26" stroke="currentColor" stroke-width="2" fill="none"/>
            <line x1="24" y1="18" x2="24" y2="34" stroke="currentColor" stroke-width="2"/>
          </svg>
        </label>
        <div *ngIf="error" class="error-message">
          <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Error: {{error}}
        </div>
        <div *ngIf="isProcessing" class="processing">
          <svg class="processing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
          Processing file...
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  error: string | null = null;
  isProcessing = false;

  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    this.isProcessing = true;
    this.error = null;
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const sheet = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false });
        
        const header = this.findHeaderCell(sheet);
        const { month, year } = this.parseMonthHeader(header);
        const employees = this.parseSchedule(sheet, month, year);
        
        // Store employees in service
        this.employeeService.setEmployees(employees);
        this.employeeService.setScheduleMonthYear(month, year);
        
        // Navigate to workbook page
        this.router.navigate(['/workbook']);
        
      } catch (e: any) {
        this.error = e.message || String(e);
        this.isProcessing = false;
      }
    };
    
    reader.onerror = () => {
      this.error = 'Error reading file';
      this.isProcessing = false;
    };
    
    reader.readAsArrayBuffer(file);
  }

  /**
   * Look for the header that contains the month token (e.g. "CZERWIEC'25")
   * within the first 3 rows of the sheet.
   */
  findHeaderCell(sheet: any[][]): string {
    const maxRows = Math.min(3, sheet.length);
    for (let r = 0; r < maxRows; r++) {
      const row = sheet[r] || [];
      for (let c = 0; c < row.length; c++) {
        const text = String(row[c] ?? '').trim();
        if (!text && r > 30) continue;
        // Fast pre-filter: must contain 'YY
        if (!/(?:'(\d{2})|\s+(\d{4}))/u.test(text)) continue;
        // Full match against our month-regex (same one used in parseMonthHeader)
        if (/([A-ZŁŚŹŻĆÓĄĘŃ]{3})[A-ZŁŚŹŻĆÓĄĘŃ]*(?:'(\d{2})|(\s\d{4}))/u.test(text.toLocaleUpperCase('pl-PL')))
          return text;
      }
    }
    throw new Error('Month header not found in rows 1-3');
  }

  parseSchedule(sheet: any[][], month: number, year: number): Employee[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const employees: Employee[] = [];
    let row = 3; // 0-based, row 4 in Excel
    while (row < sheet.length) {
      const id   = String(sheet[row]?.[0] ?? '').trim();
      if (!id) break;
      const pos  = String(sheet[row]?.[1] ?? '').trim();
      const full = String(sheet[row]?.[2] ?? '').trim();
      const [firstName, ...rest] = full.split(' ');
      const lastName = rest.join(' ');
      const shifts: Shift[] = [];
      for (let d = 0; d < daysInMonth; d++) {
        const col = 3 + d; // D = 4 in Excel 1-based
        const startRaw = (sheet[row]?.[col] ?? '').trim();
        const endRaw   = (sheet[row+1]?.[col] ?? '').trim();
        const hrsRaw   = (sheet[row+2]?.[col] ?? '').trim();
        const shift = this.parseCell(startRaw, endRaw, hrsRaw, year, month, d + 1);
        if (shift) shifts.push(shift);
      }
      employees.push({ id, firstName, lastName, position: pos, shifts });
      row += 3;
    }
    return employees;
  }

  parseMonthHeader(header: string): { month: number; year: number } {
    // Upper-case using Polish locale so "ą" → "Ą", etc.
    const up = header.toLocaleUpperCase('pl-PL');

    // 3 letters, then any extra letters, then 'YY
    // `u` flag = proper Unicode, so Ą, Ł, Ś, Ź, Ż, Ń are single chars
    const m = up.match(/([A-ZŁŚŹŻĆÓĄĘŃ]{3})[A-ZŁŚŹŻĆÓĄĘŃ]*(?:'(\d{2})|(\s\d{4}))/u);
    if (!m) throw new Error('Cannot find month in header: ' + header);
    const [, abbr, yy, xx] = m;
    const month = MONTH_MAP[abbr];
    if (month === undefined) throw new Error(`Unknown month abbr: ${abbr}`);
    if (xx != null) return { month, year: Number(xx) };
    return { month, year: 2000 + Number(yy) };
  }

  parseCell(
    startRaw: string,
    endRaw: string,
    hrsRaw: string,
    year: number,
    month: number,
    day: number,
  ): Shift | null {
    const sickKeywords = /(?:L4|CHOR|SICK)/i;
    const trgKeywords  = /(?:SZK|TRN|TRAIN)/i;
    const vacKeywords  = /(?:UR|URL|UW|WOLNY|^W$)/i;
    const flags: ShiftFlags = {
      isSickLeave: sickKeywords.test(startRaw + endRaw + hrsRaw),
      isTraining : trgKeywords .test(startRaw + endRaw + hrsRaw),
      isVacation : vacKeywords .test(startRaw + endRaw + hrsRaw),
      isNightShift: false,
    };
    if ((flags.isSickLeave || flags.isTraining || flags.isVacation) && !hrsRaw) {
      return { date: this.isoDate(year, month, day), start: null, end: null, hours: 0, ...flags };
    }
    if (!startRaw || !endRaw || !hrsRaw) return null;
    const start = this.toMinutes(startRaw);
    const end   = this.toMinutes(endRaw);
    const hours = Number(hrsRaw.replace(',', '.'));
    if (start >= 22*60 || end <= 6*60 || end < start) flags.isNightShift = true;
    return {
      date: this.isoDate(year, month, day),
      start: startRaw,
      end:   endRaw,
      hours,
      ...flags,
    };
  }

  toMinutes(hhmm: string): number {
    const [hh, mm] = hhmm.split(':').map(Number);
    return hh * 60 + (mm || 0);
  }
  
  isoDate(y: number, m: number, d: number) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
} 