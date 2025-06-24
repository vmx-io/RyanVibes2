import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shifts: Shift[];
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeesSubject.asObservable();

  constructor() {}

  setEmployees(employees: Employee[]): void {
    this.employeesSubject.next(employees);
  }

  getEmployees(): Employee[] {
    return this.employeesSubject.value;
  }

  getEmployeesObservable(): Observable<Employee[]> {
    return this.employees$;
  }
} 