import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmployeeService, Employee } from '../services/employee.service';
import { CalendarComponent } from '../calendar/calendar.component';

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
          <option 
            *ngFor="let employee of employees" 
            [value]="employee.id"
          >
            {{ employee.firstName }} {{ employee.lastName }}
          </option>
        </select>
      </div>
      <div *ngIf="!employees.length" class="no-data">
        <p>No employee data available. Please upload a file first.</p>
        <button (click)="goToHome()" class="btn-primary">Go to Upload</button>
      </div>
    </div>
    <div *ngIf="selectedEmployee" class="workbook-container calendar-full-width">
      <div class="calendar-container">
        <app-calendar [employee]="selectedEmployee"></app-calendar>
      </div>
    </div>
  `,
  styleUrls: ['./workbook.component.css'],
})
export class WorkbookComponent implements OnInit {
  employees: Employee[] = [];
  selectedEmployeeId: string = '';
  selectedEmployee: Employee | null = null;

  constructor(
    private employeeService: EmployeeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.employeeService.getEmployeesObservable().subscribe(employees => {
      this.employees = employees;
      if (employees.length === 0) {
        // If no employees, redirect to home
        this.router.navigate(['/']);
      }
    });
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
} 