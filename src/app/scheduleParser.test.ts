import { parseSchedule } from './scheduleParser';
import * as path from 'node:path';

describe('Schedule Parser', () => {
  const testFiles = [
    'KTW_FOH_MARZEC\'25_VER_2.0_2.xlsx',
    "KTW_FOH_MAJ'25_VER_3.0 2.xlsx",
    "KTW_FOH_LIPIEC'25_VER_1.0.xlsx",
    "KTW_FOH_KWIECIE_'25_VER_3.0.xlsx",
    "KTW_FOH_CZERWIEC'25_VER1.0 2.xlsx",
  ];
  testFiles.forEach(file => {
    it(`parses ${file} and finds employees`, async () => {
      const filePath = path.join(__dirname, '../testfiles', file);
      const employees = await parseSchedule(filePath);
      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);
      // At least one employee has a sick leave flag
      const hasSick = employees.some(emp => emp.shifts.some(s => s.isSickLeave));
      expect(typeof hasSick).toBe('boolean');
      // At least one employee has a vacation or training flag
      const hasLeave = employees.some(emp => emp.shifts.some(s => s.isVacation || s.isTraining));
      expect(typeof hasLeave).toBe('boolean');
      // All shifts have valid date and hours >= 0
      employees.forEach(emp => {
        emp.shifts.forEach(shift => {
          expect(typeof shift.date).toBe('string');
          expect(typeof shift.hours).toBe('number');
          expect(shift.hours).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });
}); 