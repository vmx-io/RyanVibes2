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
        <h2>{{ employee.firstName }} {{ employee.lastName }} - {{ getMonthYearString() }}</h2>
        <div class="calendar-nav">
          <button (click)="previousMonth()" class="nav-btn">&lt;</button>
          <button (click)="nextMonth()" class="nav-btn">&gt;</button>
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
  styles: [`
    .calendar-container {
      margin-top: 2rem;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .calendar-header h2 {
      margin: 0;
      color: #333;
    }
    
    .calendar-nav {
      display: flex;
      gap: 0.5rem;
    }
    
    .nav-btn {
      padding: 8px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .nav-btn:hover {
      background: #f8f9fa;
    }
    
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .day-header {
      background: #f8f9fa;
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      color: #495057;
      border-bottom: 1px solid #dee2e6;
    }
    
    .calendar-day {
      background: white;
      min-height: 100px;
      padding: 0.5rem;
      position: relative;
      border: 1px solid #e9ecef;
    }
    
    .calendar-day.other-month {
      background: #f8f9fa;
      color: #adb5bd;
    }
    
    .calendar-day.has-shift {
      background: #e3f2fd;
    }
    
    .calendar-day.sick-leave {
      background: #ffebee;
    }
    
    .calendar-day.training {
      background: #fff3e0;
    }
    
    .calendar-day.vacation {
      background: #e8f5e8;
    }
    
    .calendar-day.night-shift {
      background: #f3e5f5;
    }
    
    .day-number {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }
    
    .shift-info {
      font-size: 0.8rem;
    }
    
    .shift-time {
      font-weight: 600;
      color: #007bff;
      margin-bottom: 0.25rem;
    }
    
    .shift-hours {
      color: #28a745;
      font-weight: 500;
    }
    
    .shift-type {
      font-weight: 600;
      margin-top: 0.25rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      text-align: center;
    }
    
    .sick-leave .shift-type {
      background: #dc3545;
      color: white;
    }
    
    .training .shift-type {
      background: #fd7e14;
      color: white;
    }
    
    .vacation .shift-type {
      background: #28a745;
      color: white;
    }
    
    .night-shift .shift-type {
      background: #6f42c1;
      color: white;
    }
    
    .calendar-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #dee2e6;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }
    
    .legend-color.regular {
      background: #e3f2fd;
    }
    
    .legend-color.night-shift {
      background: #f3e5f5;
    }
    
    .legend-color.vacation {
      background: #e8f5e8;
    }
    
    .legend-color.sick-leave {
      background: #ffebee;
    }
    
    .legend-color.training {
      background: #fff3e0;
    }
  `]
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