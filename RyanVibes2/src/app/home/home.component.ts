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
    <div class="upload-container">
      <h1>Schedule Parser</h1>
      <p>Upload your Excel file to parse employee schedules</p>
      
      <div class="file-upload">
        <input 
          type="file" 
          (change)="handleFileInput($event)" 
          accept=".xlsx,.xls" 
          id="fileInput"
          #fileInput
        />
        <label for="fileInput" class="upload-button">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Choose Excel File
        </label>
      </div>
      
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
  `,
  styles: [`
    .upload-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      text-align: center;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    
    p {
      color: #666;
      margin-bottom: 2rem;
      font-size: 1rem;
    }
    
    .file-upload {
      margin: 2rem 0;
    }
    
    input[type="file"] {
      display: none;
    }
    
    .upload-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 16px 32px;
      background: #007bff;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
      font-weight: 500;
      min-height: 44px;
      border: none;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
    }
    
    .upload-button:hover {
      background: #0056b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    }
    
    .upload-button:active {
      background: #004085;
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
    }
    
    .upload-icon {
      width: 20px;
      height: 20px;
    }
    
    .error-message {
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .error-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    
    .processing {
      color: #0066cc;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .processing-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .upload-container {
        margin: 1rem;
        padding: 1.5rem;
        border-radius: 8px;
      }
      
      h1 {
        font-size: 1.5rem;
      }
      
      p {
        font-size: 0.9rem;
      }
      
      .file-upload {
        margin: 1.5rem 0;
      }
      
      .upload-button {
        padding: 14px 24px;
        font-size: 0.9rem;
        width: 100%;
        max-width: 300px;
        justify-content: center;
      }
      
      .upload-icon {
        width: 18px;
        height: 18px;
      }
      
      .error-message {
        padding: 0.75rem;
        font-size: 0.85rem;
        margin-top: 0.75rem;
      }
      
      .error-icon {
        width: 16px;
        height: 16px;
      }
      
      .processing {
        font-size: 0.85rem;
        margin-top: 0.75rem;
      }
      
      .processing-icon {
        width: 16px;
        height: 16px;
      }
    }
    
    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .upload-container {
        margin: 0.5rem;
        padding: 1rem;
      }
      
      h1 {
        font-size: 1.3rem;
      }
      
      p {
        font-size: 0.85rem;
      }
      
      .file-upload {
        margin: 1rem 0;
      }
      
      .upload-button {
        padding: 12px 20px;
        font-size: 0.85rem;
        max-width: 280px;
      }
      
      .upload-icon {
        width: 16px;
        height: 16px;
      }
      
      .error-message {
        padding: 0.5rem;
        font-size: 0.8rem;
        margin-top: 0.5rem;
      }
      
      .error-icon {
        width: 14px;
        height: 14px;
      }
      
      .processing {
        font-size: 0.8rem;
        margin-top: 0.5rem;
      }
      
      .processing-icon {
        width: 14px;
        height: 14px;
      }
    }
    
    /* Extra Small Mobile Styles */
    @media (max-width: 360px) {
      .upload-container {
        margin: 0.25rem;
        padding: 0.75rem;
      }
      
      h1 {
        font-size: 1.2rem;
      }
      
      p {
        font-size: 0.8rem;
      }
      
      .file-upload {
        margin: 0.75rem 0;
      }
      
      .upload-button {
        padding: 10px 16px;
        font-size: 0.8rem;
        max-width: 260px;
      }
      
      .upload-icon {
        width: 14px;
        height: 14px;
      }
      
      .error-message {
        padding: 0.4rem;
        font-size: 0.75rem;
        margin-top: 0.4rem;
      }
      
      .error-icon {
        width: 12px;
        height: 12px;
      }
      
      .processing {
        font-size: 0.75rem;
        margin-top: 0.4rem;
      }
      
      .processing-icon {
        width: 12px;
        height: 12px;
      }
    }
  `]
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