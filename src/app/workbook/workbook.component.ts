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
      font-size: 2rem;
    }
    
    p {
      color: #666;
      margin-bottom: 2rem;
      font-size: 1rem;
    }
    
    .employee-selector {
      margin: 2rem 0;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
      font-size: 1rem;
    }
    
    .employee-dropdown {
      width: 100%;
      max-width: 400px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 16px;
      background: white;
      min-height: 44px;
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
    
    .employee-details h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
      font-size: 1.3rem;
    }
    
    .employee-info p {
      margin: 0.5rem 0;
      font-size: 1rem;
    }
    
    .no-data {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
    
    .no-data p {
      margin-bottom: 1rem;
    }
    
    .actions {
      margin-top: 2rem;
      text-align: center;
    }
    
    .btn-primary, .btn-secondary {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin: 0 0.5rem;
      transition: background-color 0.3s;
      min-height: 44px;
      min-width: 120px;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-primary:active {
      background: #004085;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #545b62;
    }
    
    .btn-secondary:active {
      background: #3d4449;
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .workbook-container {
        margin: 1rem;
        padding: 1.5rem;
        border-radius: 8px;
      }
      
      h1 {
        font-size: 1.5rem;
        text-align: center;
      }
      
      p {
        font-size: 0.9rem;
        text-align: center;
      }
      
      .employee-selector {
        margin: 1.5rem 0;
      }
      
      label {
        font-size: 0.9rem;
        text-align: center;
      }
      
      .employee-dropdown {
        max-width: 100%;
        font-size: 16px; /* Prevents zoom on iOS */
        padding: 10px;
      }
      
      .employee-details {
        margin-top: 1.5rem;
        padding: 1rem;
      }
      
      .employee-details h3 {
        font-size: 1.2rem;
        text-align: center;
      }
      
      .employee-info p {
        font-size: 0.9rem;
        text-align: center;
      }
      
      .no-data {
        padding: 1.5rem;
      }
      
      .no-data p {
        font-size: 0.9rem;
      }
      
      .actions {
        margin-top: 1.5rem;
      }
      
      .btn-primary, .btn-secondary {
        padding: 10px 20px;
        font-size: 14px;
        min-width: 100px;
        margin: 0.25rem;
      }
    }
    
    /* Small Mobile Styles */
    @media (max-width: 480px) {
      .workbook-container {
        margin: 0.5rem;
        padding: 1rem;
      }
      
      h1 {
        font-size: 1.3rem;
      }
      
      p {
        font-size: 0.85rem;
      }
      
      .employee-selector {
        margin: 1rem 0;
      }
      
      label {
        font-size: 0.85rem;
      }
      
      .employee-dropdown {
        padding: 8px;
        font-size: 16px;
      }
      
      .employee-details {
        margin-top: 1rem;
        padding: 0.75rem;
      }
      
      .employee-details h3 {
        font-size: 1.1rem;
      }
      
      .employee-info p {
        font-size: 0.85rem;
      }
      
      .no-data {
        padding: 1rem;
      }
      
      .no-data p {
        font-size: 0.85rem;
      }
      
      .btn-primary, .btn-secondary {
        padding: 8px 16px;
        font-size: 13px;
        min-width: 90px;
        margin: 0.2rem;
      }
    }
    
    /* Extra Small Mobile Styles */
    @media (max-width: 360px) {
      .workbook-container {
        margin: 0.25rem;
        padding: 0.75rem;
      }
      
      h1 {
        font-size: 1.2rem;
      }
      
      p {
        font-size: 0.8rem;
      }
      
      .employee-selector {
        margin: 0.75rem 0;
      }
      
      label {
        font-size: 0.8rem;
      }
      
      .employee-dropdown {
        padding: 6px;
        font-size: 16px;
      }
      
      .employee-details {
        margin-top: 0.75rem;
        padding: 0.5rem;
      }
      
      .employee-details h3 {
        font-size: 1rem;
      }
      
      .employee-info p {
        font-size: 0.8rem;
      }
      
      .no-data {
        padding: 0.75rem;
      }
      
      .no-data p {
        font-size: 0.8rem;
      }
      
      .btn-primary, .btn-secondary {
        padding: 6px 12px;
        font-size: 12px;
        min-width: 80px;
        margin: 0.15rem;
      }
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