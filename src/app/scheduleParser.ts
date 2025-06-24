import { Workbook } from 'exceljs';
import * as fs from 'node:fs';
import * as path from 'node:path';

// --- 1. Month mapping ---
export const MONTH_MAP: Record<string, number> = {
  STY: 0, LUT: 1, MAR: 2, KWI: 3, MAJ: 4, CZE: 5,
  LIP: 6, SIE: 7, WRZ: 8, 'PAŹ': 9, PAZ: 9,
  LIS: 10, GRU: 11,
};

export function parseMonthHeader(header: string): { month: number; year: number } {
  // Upper-case using Polish locale so “ą” → “Ą”, etc.
  const up = header.toLocaleUpperCase('pl-PL');

  // 3 letters, then any extra letters, then 'YY
  // `u` flag = proper Unicode, so Ą, Ł, Ś, Ź, Ż, Ń are single chars
  const m = up.match(/([A-ZŁŚŹŻĆÓĄĘŃ]{3})[A-ZŁŚŹŻĆÓĄĘŃ]*'(\d{2})/u);
  if (!m) throw new Error('Cannot find month in header');
  const [, abbr, yy] = m;
  const month = MONTH_MAP[abbr];
  if (month === undefined) throw new Error(`Unknown month abbr: ${abbr}`);
  return { month, year: 2000 + Number(yy) };
}

// --- 2. TypeScript models ---
export interface ShiftFlags {
  isSickLeave: boolean;
  isTraining:  boolean;
  isVacation:  boolean;
  isNightShift: boolean;
}

export interface Shift extends ShiftFlags {
  date: string;           // ISO yyyy-mm-dd
  start: string | null;   // "HH:MM" or null
  end:   string | null;
  hours: number;          // 0 if absent
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shifts: Shift[];
}

// --- 3. Core parsing logic ---
const sickKeywords = /(?:L4|CHOR|SICK)/i;
const trgKeywords  = /(?:SZK|TRN|TRAIN)/i;
const vacKeywords  = /(?:UR|URL|VAC|WOLNY|^W$)/i;

export function parseCell(
  startRaw: string,
  endRaw: string,
  hrsRaw: string,
  year: number,
  month: number,
  day: number,
): Shift | null {
  const flags: ShiftFlags = {
    isSickLeave: sickKeywords.test(startRaw + endRaw + hrsRaw),
    isTraining : trgKeywords .test(startRaw + endRaw + hrsRaw),
    isVacation : vacKeywords .test(startRaw + endRaw + hrsRaw),
    isNightShift: false,
  };
  // Special cases: leave / training / vacation with no hours
  if ((flags.isSickLeave || flags.isTraining || flags.isVacation) && !hrsRaw) {
    return { date: isoDate(year, month, day), start: null, end: null, hours: 0, ...flags };
  }
  // Empty → day off
  if (!startRaw || !endRaw || !hrsRaw) return null;
  // Parse times
  const start = toMinutes(startRaw);     // e.g. "22:30" → 1350
  const end   = toMinutes(endRaw);
  const hours = Number(hrsRaw.replace(',', '.'));
  // Night shift?
  if (start >= 22*60 || end <= 6*60 || end < start) flags.isNightShift = true;
  return {
    date: isoDate(year, month, day),
    start: startRaw,
    end:   endRaw,
    hours,
    ...flags,
  };
}

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(':').map(Number);
  return hh * 60 + (mm || 0);
}
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export async function parseSchedule(xlsxPath: string): Promise<Employee[]> {
  const wb = new Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  const header = String(ws.getCell('A1').value ?? '');
  const { month, year } = parseMonthHeader(header);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const employees: Employee[] = [];
  let row = 4; // Excel rows are 1-based
  while (row <= ws.rowCount) {
    const id   = String(ws.getCell(row, 1).value ?? '').trim();
    if (!id) break; // stop at first empty block
    const pos  = String(ws.getCell(row, 2).value ?? '').trim();
    const full = String(ws.getCell(row, 3).value ?? '').trim();
    const [firstName, ...rest] = full.split(' ');
    const lastName = rest.join(' ');
    const shifts: Shift[] = [];
    for (let d = 0; d < daysInMonth; d++) {
      const col = 4 + d; // D = 4 in Excel 1-based
      const startRaw = (ws.getCell(row,     col).text ?? '').trim();
      const endRaw   = (ws.getCell(row + 1, col).text ?? '').trim();
      const hrsRaw   = (ws.getCell(row + 2, col).text ?? '').trim();
      const shift = parseCell(startRaw, endRaw, hrsRaw, year, month, d + 1);
      if (shift) shifts.push(shift);
    }
    employees.push({ id, firstName, lastName, position: pos, shifts });
    row += 3;
  }
  return employees;
}

// --- 4. CLI wrapper ---
if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error('Usage: ts-node scheduleParser.ts <in.xlsx> [--out out.json]');
    process.exit(1);
  }
  const inPath = argv[0];
  const outIdx = argv.indexOf('--out');
  const outPath = outIdx !== -1 ? argv[outIdx + 1] : null;
  parseSchedule(inPath).then(employees => {
    if (outPath) {
      fs.writeFileSync(outPath, JSON.stringify(employees, null, 2), 'utf-8');
      console.log(`Wrote output to ${outPath}`);
    } else {
      console.log(JSON.stringify(employees, null, 2));
    }
  }).catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
} 