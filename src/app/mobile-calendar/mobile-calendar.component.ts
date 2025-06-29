import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../services/employee.service';
import { DayPopupComponent } from '../day-popup/day-popup.component';
import { DeviceService } from '../services/device.service';
import { CookieService } from '../cookie.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  shift?: {
    start: string | null;
    end: string | null;
    hours: number;
    isSickLeave: boolean;
    isTraining: boolean;
    isVacation: boolean;
    isNightShift: boolean;
  };
}

@Component({
  selector: 'app-mobile-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DayPopupComponent],
  template: `
    <div class="mobile-calendar-container">
      <!-- Header -->
      <header class="calendar-header">
        <button class="back-button" (click)="goHome()" aria-label="Back to home">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div class="year-label">{{ currentDate.getFullYear() }}</div>
        
        <div class="header-actions">
          <button 
            *ngIf="selectedEmployee"
            class="icon-button favourite-button" 
            (click)="toggleFavourite()" 
            aria-label="Toggle favourite"
            [class.favourite-active]="isFavourite"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path 
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                [attr.fill]="isFavourite ? 'currentColor' : 'none'"
              />
            </svg>
          </button>
        </div>
      </header>

      <!-- Employee Selector -->
      <div class="employee-selector">
        <select 
          [(ngModel)]="selectedEmployeeId" 
          (change)="onEmployeeChange()"
          class="employee-select"
        >
          <option value="">Select Employee</option>
          <ng-container *ngIf="favouriteEmployees.length">
            <optgroup label="Favourites">
              <option 
                *ngFor="let emp of favouriteEmployees" 
                [value]="emp.id"
              >
                {{ emp.firstName }} {{ emp.lastName }}
              </option>
            </optgroup>
          </ng-container>
          <ng-container *ngIf="otherEmployees.length">
            <optgroup label="Others">
              <option 
                *ngFor="let emp of otherEmployees" 
                [value]="emp.id"
              >
                {{ emp.firstName }} {{ emp.lastName }}
              </option>
            </optgroup>
          </ng-container>
        </select>
      </div>

      <!-- Month Navigation -->
      <div class="month-navigation">
        <button class="nav-button" (click)="previousMonth()" aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <h1 class="month-title">{{ getMonthYearString() }}</h1>
        
        <button class="nav-button" (click)="nextMonth()" aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Weekday Headers -->
      <div class="weekday-headers">
        <div class="weekday-header" *ngFor="let day of weekDays">{{ day }}</div>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div 
          *ngFor="let day of calendarDays; let i = index" 
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.today]="day.isToday"
          [class.selected]="day.isSelected"
          [class.has-shift]="day.shift"
          [class.sick-leave]="day.shift?.isSickLeave"
          [class.training]="day.shift?.isTraining"
          [class.vacation]="day.shift?.isVacation"
          [class.night-shift]="day.shift?.isNightShift"
          (click)="selectDay(day)"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="shift-info" *ngIf="day.shift">
            <div class="shift-time" *ngIf="day.shift.start && day.shift.end">
              {{ day.shift.start }} - {{ day.shift.end }}
            </div>
            <div class="shift-hours" *ngIf="day.shift.hours > 0">
              {{ day.shift.hours }}h
            </div>
            <div class="shift-type" *ngIf="day.shift.isSickLeave">L4</div>
            <div class="shift-type" *ngIf="day.shift.isTraining">SZK</div>
            <div class="shift-type" *ngIf="day.shift.isVacation">URL</div>
            <div class="shift-type" *ngIf="day.shift.isNightShift">NOC</div>
          </div>
        </div>
      </div>

      <!-- Bottom Tab Bar -->
      <nav class="tab-bar">
        <button class="tab-item active" (click)="goToToday()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Today</span>
        </button>
        <button class="tab-item" (click)="openGithub()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
          </svg>
          <span>Github</span>
        </button>
      </nav>

      <!-- Day Popup -->
      <app-day-popup 
        *ngIf="showPopup"
        [day]="selectedDay"
        [selectedEmployeeId]="selectedEmployeeId"
        (closePopup)="closePopup()"
      ></app-day-popup>
    </div>
  `,
  styleUrls: ['./mobile-calendar.component.css']
})
export class MobileCalendarComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  @Input() initialMonth: number | null = null;
  @Input() initialYear: number | null = null;
  
  calendarDays: CalendarDay[] = [];
  currentDate = new Date();
  weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  employees: Employee[] = [];
  selectedEmployeeId: string = '';
  selectedEmployee: Employee | null = null;
  showPopup: boolean = false;
  selectedDay: CalendarDay | null = null;
  favouriteNames: string[] = [];
  favouriteEmployees: Employee[] = [];
  otherEmployees: Employee[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    public deviceService: DeviceService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.favouriteNames = this.getFavouritesFromCookie();
    
    // Check for query parameters (when switching from popup)
    this.route.queryParams.subscribe(params => {
      if (params['employeeId']) {
        this.selectedEmployeeId = params['employeeId'];
      }
      if (params['month'] && params['year']) {
        this.currentDate = new Date(parseInt(params['year']), parseInt(params['month']), 1);
      }
    });
    
    this.employeeService.getEmployeesObservable().subscribe(employees => {
      this.employees = employees;
      if (employees.length > 0 && !this.selectedEmployeeId) {
        this.selectedEmployeeId = employees[0].id;
        this.selectedEmployee = employees[0];
      }
      if (this.employee) {
        this.selectedEmployee = this.employee;
        this.selectedEmployeeId = this.employee.id;
      }
      
      // Set selected employee from query params if available
      if (this.selectedEmployeeId) {
        this.selectedEmployee = employees.find(emp => emp.id === this.selectedEmployeeId) || null;
      }
      
      this.favouriteEmployees = employees.filter(emp => this.favouriteNames.includes(this.getEmployeeFullName(emp)));
      this.otherEmployees = employees.filter(emp => !this.favouriteNames.includes(this.getEmployeeFullName(emp)));
    });
    
    // Get month and year from service (from uploaded file) - only if not set by query params
    if (!this.route.snapshot.queryParams['month']) {
      const scheduleMonth = this.employeeService.getScheduleMonth();
      const scheduleYear = this.employeeService.getScheduleYear();
      
      if (scheduleMonth !== null && scheduleYear !== null) {
        this.currentDate = new Date(scheduleYear, scheduleMonth, 1);
      } else if (this.initialMonth !== null && this.initialYear !== null) {
        // Fallback to input properties if service doesn't have data
        this.currentDate = new Date(this.initialYear, this.initialMonth, 1);
      }
    }
    
    this.generateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.generateCalendar();
    }
  }

  onEmployeeChange(): void {
    this.selectedEmployee = this.employees.find(emp => emp.id === this.selectedEmployeeId) || null;
    this.generateCalendar();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goToDesktopView(): void {
    this.router.navigate(['/workbook']);
  }

  selectDay(day: CalendarDay): void {
    // Clear previous selection
    this.calendarDays.forEach(d => d.isSelected = false);
    // Select clicked day
    day.isSelected = true;
    
    // Show popup
    this.selectedDay = day;
    this.showPopup = true;
  }

  closePopup(): void {
    this.showPopup = false;
    this.selectedDay = null;
    // Clear selection when popup is closed
    this.calendarDays.forEach(d => d.isSelected = false);
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const today = new Date();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the first day of the week (Monday = 0)
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    // Get the last day of the week (Sunday = 6)
    const lastDayOfWeek = (lastDay.getDay() + 6) % 7;
    
    this.calendarDays = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonth.getDate() - i);
      this.calendarDays.push({
        date: day,
        dayNumber: day.getDate(),
        isCurrentMonth: false,
        isToday: this.isSameDay(day, today),
        isSelected: false
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const shift = this.getShiftForDate(date);
      
      this.calendarDays.push({
        date: date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        isSelected: false,
        shift: shift
      });
    }
    
    // Add days from next month
    for (let day = 1; day <= 6 - lastDayOfWeek; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date: date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, today),
        isSelected: false
      });
    }
  }

  getShiftForDate(date: Date): any {
    if (!this.selectedEmployee) return null;
    
    const dateString = this.formatDate(date);
    return this.selectedEmployee.shifts.find(shift => shift.date === dateString) || null;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleDateString('en-US', { 
      month: 'long'
    });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getEmployeeFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
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

  toggleFavourite(): void {
    if (!this.selectedEmployee) return;

    const employeeName = this.getEmployeeFullName(this.selectedEmployee);
    
    if (this.favouriteNames.includes(employeeName)) {
      this.favouriteNames = this.favouriteNames.filter(name => name !== employeeName);
    } else {
      this.favouriteNames.push(employeeName);
    }
    this.setFavouritesToCookie(this.favouriteNames);
    
    // Update employee lists
    this.favouriteEmployees = this.employees.filter(emp => this.favouriteNames.includes(this.getEmployeeFullName(emp)));
    this.otherEmployees = this.employees.filter(emp => !this.favouriteNames.includes(this.getEmployeeFullName(emp)));
  }

  get isFavourite(): boolean {
    if (!this.selectedEmployee) return false;
    return this.favouriteNames.includes(this.getEmployeeFullName(this.selectedEmployee));
  }

  goToToday(): void {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.generateCalendar();
    
    // Find today's day in the calendar and open popup
    const todayDay = this.calendarDays.find(day => 
      day.date.getDate() === today.getDate() &&
      day.date.getMonth() === today.getMonth() &&
      day.date.getFullYear() === today.getFullYear()
    );
    
    if (todayDay) {
      this.selectDay(todayDay);
    }
  }

  openGithub(): void {
    window.open('https://github.com/vmx-io', '_blank');
  }
} 