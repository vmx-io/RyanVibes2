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
    <div class="workbook-container">
      <h1>Employee Selection</h1>
      <p>Select an employee from the list below to view their schedule:</p>
      
      <div class="employee-selector">
        <label for="employeeSelect">Choose Employee:</label>
        <select 
          id="employeeSelect" 
          [(ngModel)]="selectedEmployeeId"
          (change)="onEmployeeChange()"
          class="employee-dropdown"
        >
          <option value="">-- Select an employee --</option>
          <option 
            *ngFor="let employee of employees" 
            [value]="employee.id"
          >
            {{ employee.firstName }} {{ employee.lastName }}
          </option>
        </select>
      </div>
      
      <div *ngIf="selectedEmployee" class="employee-details">
        <h3>Selected Employee Details:</h3>
        <div class="employee-info">
          <p><strong>ID:</strong> {{ selectedEmployee.id }}</p>
          <p><strong>Name:</strong> {{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</p>
          <p><strong>Position:</strong> {{ selectedEmployee.position }}</p>
          <p><strong>Total Shifts:</strong> {{ selectedEmployee.shifts.length }}</p>
        </div>
      </div>
      
      <!-- Calendar Component -->
      <app-calendar [employee]="selectedEmployee"></app-calendar>
      
      <div *ngIf="!employees.length" class="no-data">
        <p>No employee data available. Please upload a file first.</p>
        <button (click)="goToHome()" class="btn-primary">Go to Upload</button>
      </div>
      
      <div class="actions">
        <button (click)="goToHome()" class="btn-secondary">Upload New File</button>
      </div>
    </div>
  `,
  styles: [`
    .workbook-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    p {
      color: #666;
      margin-bottom: 2rem;
    }
    
    .employee-selector {
      margin: 2rem 0;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
    
    .employee-dropdown {
      width: 100%;
      max-width: 400px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      background: white;
    }
    
    .employee-dropdown:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .employee-details {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .employee-info p {
      margin: 0.5rem 0;
    }
    
    .no-data {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    
    .actions {
      margin-top: 2rem;
      text-align: center;
    }
    
    .btn-primary, .btn-secondary {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin: 0 0.5rem;
      transition: background-color 0.3s;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #545b62;
    }
  `]
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