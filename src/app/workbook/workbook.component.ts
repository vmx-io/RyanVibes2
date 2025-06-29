import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, Employee } from '../services/employee.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { CookieService } from '../cookie.service';
import { DeviceService } from '../services/device.service';

@Component({
  selector: 'app-workbook',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarComponent],
  template: `
    <div class="workbook-container gradient-bg">
      <div class="employee-selector">
        <select 
          id="employeeSelect" 
          [(ngModel)]="selectedEmployeeId"
          (change)="onEmployeeChange()"
          class="employee-dropdown"
        >
          <option value="" disabled selected class="placeholder-option">Wybierz pracownika</option>
          <ng-container *ngIf="favouriteEmployees.length">
            <optgroup label="Ulubieni">
              <option 
                *ngFor="let employee of favouriteEmployees" 
                [value]="employee.id"
              >
                {{ employee.firstName }} {{ employee.lastName }}
              </option>
            </optgroup>
          </ng-container>
          <ng-container *ngIf="otherEmployees.length">
            <optgroup label="Inni">
              <option 
                *ngFor="let employee of otherEmployees" 
                [value]="employee.id"
              >
                {{ employee.firstName }} {{ employee.lastName }}
              </option>
            </optgroup>
          </ng-container>
        </select>
        <button 
          *ngIf="selectedEmployee && deviceService.isDesktop()" 
          (click)="goToMobileView()" 
          class="mobile-view-button"
          title="Widok mobilny"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
      </div>
      <div *ngIf="!employees.length" class="no-data">
        <p>Brak danych pracowników. Proszę najpierw przesłać plik.</p>
        <button (click)="goToHome()" class="btn-primary">Przejdź do przesyłania</button>
      </div>
    </div>
    <div *ngIf="selectedEmployee" class="workbook-container calendar-full-width">
      <div class="calendar-container">
        <app-calendar 
          [employee]="selectedEmployee"
          [isFavourite]="selectedEmployee && isFavourite(selectedEmployee.id)"
          (toggleFavourite)="toggleFavourite()"
          [initialMonth]="scheduleMonth"
          [initialYear]="scheduleYear"
        ></app-calendar>
      </div>
    </div>
  `,
  styleUrls: ['./workbook.component.css'],
})
export class WorkbookComponent implements OnInit {
  employees: Employee[] = [];
  selectedEmployeeId: string = '';
  selectedEmployee: Employee | null = null;
  favouriteNames: string[] = [];
  favouriteEmployees: Employee[] = [];
  otherEmployees: Employee[] = [];
  scheduleMonth: number | null = null;
  scheduleYear: number | null = null;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    public cookieService: CookieService,
    public deviceService: DeviceService
  ) {}

  ngOnInit(): void {
    this.favouriteNames = this.getFavouritesFromCookie();
    this.employeeService.getEmployeesObservable().subscribe(employees => {
      this.employees = employees;
      if (employees.length === 0) {
        // If no employees, redirect to home
        this.router.navigate(['/']);
      } else {
        this.splitEmployees();
        this.scheduleMonth = this.employeeService.getScheduleMonth();
        this.scheduleYear = this.employeeService.getScheduleYear();
        
        // Always redirect to mobile view after file upload
        this.router.navigate(['/mobile-calendar']);
      }
    });
  }

  getEmployeeFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  splitEmployees(): void {
    this.favouriteEmployees = this.employees.filter(e => this.favouriteNames.includes(this.getEmployeeFullName(e)));
    this.otherEmployees = this.employees.filter(e => !this.favouriteNames.includes(this.getEmployeeFullName(e)));
  }

  onEmployeeChange(): void {
    if (this.selectedEmployeeId) {
      this.selectedEmployee = this.employees.find(emp => emp.id === this.selectedEmployeeId) || null;
      
      // Always redirect to mobile view when employee is selected
      if (this.selectedEmployee) {
        this.router.navigate(['/mobile-calendar']);
      }
    } else {
      this.selectedEmployee = null;
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToMobileView(): void {
    this.router.navigate(['/mobile-calendar']);
  }

  toggleFavourite(): void {
    if (!this.selectedEmployee) return;
    
    const employeeName = this.getEmployeeFullName(this.selectedEmployee);
    
    if (this.favouriteNames.includes(employeeName)) {
      this.favouriteNames = this.favouriteNames.filter(name => name !== employeeName);
    } else {
      this.favouriteNames.push(employeeName);
    }
    this.setFavouritesToCookie(this.favouriteNames);
    this.splitEmployees();
  }

  isFavourite(id: string): boolean {
    const employee = this.employees.find(emp => emp.id === id);
    if (!employee) return false;
    return this.favouriteNames.includes(this.getEmployeeFullName(employee));
  }

  getFavouritesFromCookie(): string[] {
    const cookie = this.cookieService.get('favouriteEmployees');
    if (!cookie) return [];
    try {
      return JSON.parse(cookie);
    } catch {
      return [];
    }
  }

  setFavouritesToCookie(names: string[]): void {
    this.cookieService.set('favouriteEmployees', JSON.stringify(names), 365);
  }
} 