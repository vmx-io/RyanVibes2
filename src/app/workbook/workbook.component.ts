import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, Employee } from '../services/employee.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { CookieService } from '../cookie.service';

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
          <option value="" disabled selected class="placeholder-option">Select an employee</option>
          <ng-container *ngIf="favouriteEmployees.length">
            <optgroup label="Favourites">
              <option 
                *ngFor="let employee of favouriteEmployees" 
                [value]="employee.id"
              >
                {{ employee.firstName }} {{ employee.lastName }}
              </option>
            </optgroup>
          </ng-container>
          <ng-container *ngIf="otherEmployees.length">
            <optgroup label="Others">
              <option 
                *ngFor="let employee of otherEmployees" 
                [value]="employee.id"
              >
                {{ employee.firstName }} {{ employee.lastName }}
              </option>
            </optgroup>
          </ng-container>
        </select>
      </div>
      <div *ngIf="!employees.length" class="no-data">
        <p>No employee data available. Please upload a file first.</p>
        <button (click)="goToHome()" class="btn-primary">Go to Upload</button>
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
  favouriteIds: string[] = [];
  favouriteEmployees: Employee[] = [];
  otherEmployees: Employee[] = [];
  scheduleMonth: number | null = null;
  scheduleYear: number | null = null;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    public cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.favouriteIds = this.getFavouritesFromCookie();
    this.employeeService.getEmployeesObservable().subscribe(employees => {
      this.employees = employees;
      if (employees.length === 0) {
        // If no employees, redirect to home
        this.router.navigate(['/']);
      }
      this.splitEmployees();
      this.scheduleMonth = this.employeeService.getScheduleMonth();
      this.scheduleYear = this.employeeService.getScheduleYear();
    });
  }

  splitEmployees(): void {
    this.favouriteEmployees = this.employees.filter(e => this.favouriteIds.includes(e.id));
    this.otherEmployees = this.employees.filter(e => !this.favouriteIds.includes(e.id));
  }

  onEmployeeChange(): void {
    if (this.selectedEmployeeId) {
      this.selectedEmployee = this.employees.find(emp => emp.id === this.selectedEmployeeId) || null;
    } else {
      this.selectedEmployee = null;
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  toggleFavourite(): void {
    if (!this.selectedEmployee) return;
    const id = this.selectedEmployee.id;
    if (this.isFavourite(id)) {
      this.favouriteIds = this.favouriteIds.filter(fid => fid !== id);
    } else {
      this.favouriteIds.push(id);
    }
    this.setFavouritesToCookie(this.favouriteIds);
    this.splitEmployees();
  }

  isFavourite(id: string): boolean {
    return this.favouriteIds.includes(id);
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

  setFavouritesToCookie(ids: string[]): void {
    this.cookieService.set('favouriteEmployees', JSON.stringify(ids), 365);
  }
} 