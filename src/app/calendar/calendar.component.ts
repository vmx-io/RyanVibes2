import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../services/employee.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
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
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calendar-container" *ngIf="employee">
      <div class="calendar-header">
        <h2>{{ employee.firstName }} {{ employee.lastName }}</h2>
        <div class="month-year">{{ getMonthYearString() }}</div>
        <div class="calendar-nav">
          <button (click)="previousMonth()" class="nav-btn" aria-label="Previous month">&lt;</button>
          <button (click)="nextMonth()" class="nav-btn" aria-label="Next month">&gt;</button>
        </div>
      </div>
      
      <div class="calendar-grid">
        <!-- Day headers -->
        <div class="day-header" *ngFor="let day of weekDays">{{ day }}</div>
        
        <!-- Calendar days -->
        <div 
          *ngFor="let day of calendarDays" 
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.has-shift]="day.shift"
          [class.sick-leave]="day.shift?.isSickLeave"
          [class.training]="day.shift?.isTraining"
          [class.vacation]="day.shift?.isVacation"
          [class.night-shift]="day.shift?.isNightShift"
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
      
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-color regular"></div>
          <span>Regular Shift</span>
        </div>
        <div class="legend-item">
          <div class="legend-color night-shift"></div>
          <span>Night Shift</span>
        </div>
        <div class="legend-item">
          <div class="legend-color vacation"></div>
          <span>Vacation</span>
        </div>
        <div class="legend-item">
          <div class="legend-color sick-leave"></div>
          <span>Sick Leave</span>
        </div>
        <div class="legend-item">
          <div class="legend-color training"></div>
          <span>Training</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() employee: Employee | null = null;
  
  calendarDays: CalendarDay[] = [];
  currentDate = new Date();
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  ngOnInit(): void {
    this.generateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee) {
      this.generateCalendar();
    }
  }

  generateCalendar(): void {
    if (!this.employee) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
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
        isCurrentMonth: false
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
        shift: shift
      });
    }
    
    // Add days from next month
    for (let day = 1; day <= 6 - lastDayOfWeek; day++) {
      const date = new Date(year, month + 1, day);
      this.calendarDays.push({
        date: date,
        dayNumber: day,
        isCurrentMonth: false
      });
    }
  }

  getShiftForDate(date: Date): any {
    if (!this.employee) return null;
    
    const dateString = this.formatDate(date);
    return this.employee.shifts.find(shift => shift.date === dateString) || null;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
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
} 