import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../services/employee.service';

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

interface EmployeeShift {
  employee: Employee;
  shift: any;
  timeDifference: number; // in hours
}

@Component({
  selector: 'app-day-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="popup-overlay" (click)="close()">
      <div class="popup-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="popup-header">
          <h2 class="popup-title">{{ getDayTitle() }}</h2>
          <button class="close-button" (click)="close()" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="popup-scrollable-content">
          <!-- Shift Details Section -->
          <div class="shift-details" *ngIf="day?.shift">
            <h3 class="section-title">Shift Details</h3>
            <div class="shift-info-grid">
              <div class="info-item">
                <span class="label">Start Time:</span>
                <span class="value">{{ day?.shift?.start || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">End Time:</span>
                <span class="value">{{ day?.shift?.end || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Total Hours:</span>
                <span class="value">{{ day?.shift?.hours || 0 }}h</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isSickLeave">
                <span class="label">Type:</span>
                <span class="value shift-type sick-leave">Sick Leave (L4)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isTraining">
                <span class="label">Type:</span>
                <span class="value shift-type training">Training (SZK)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isVacation">
                <span class="label">Type:</span>
                <span class="value shift-type vacation">Vacation (URL)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isNightShift">
                <span class="label">Type:</span>
                <span class="value shift-type night-shift">Night Shift (NOC)</span>
              </div>
            </div>
          </div>

          <!-- Time Range Selector -->
          <div class="time-range-section" *ngIf="day?.shift?.start">
            <h3 class="section-title">Employees Starting Around Same Time</h3>
            <div class="time-range-selector">
              <label class="range-label">Time Range:</label>
              <div class="range-buttons">
                <button 
                  *ngFor="let range of timeRanges" 
                  [class.active]="selectedRange === range.value"
                  (click)="selectTimeRange(range.value)"
                  class="range-button"
                >
                  {{ range.label }}
                </button>
              </div>
              <div class="custom-range" *ngIf="selectedRange === 'custom'">
                <label>Custom hours (±):</label>
                <input 
                  type="number" 
                  [(ngModel)]="customHours" 
                  min="0" 
                  max="12" 
                  class="custom-input"
                  (input)="updateCustomRange()"
                >
              </div>
            </div>
          </div>

          <!-- Employees List -->
          <div class="employees-section" *ngIf="day?.shift?.start && filteredEmployees.length > 0">
            <h3 class="section-title">Employees ({{ filteredEmployees.length }})</h3>
            <div class="employees-list">
              <div 
                *ngFor="let empShift of filteredEmployees" 
                class="employee-item"
                [class.current-employee]="empShift.employee.id === selectedEmployeeId"
              >
                <div class="employee-info">
                  <div class="employee-name">{{ empShift.employee.firstName }} {{ empShift.employee.lastName }}</div>
                  <div class="employee-position">{{ empShift.employee.position }}</div>
                </div>
                <div class="shift-time-info">
                  <div class="start-time">{{ empShift.shift.start }}</div>
                  <div class="time-difference" [class.positive]="empShift.timeDifference > 0" [class.negative]="empShift.timeDifference < 0">
                    {{ getTimeDifferenceText(empShift.timeDifference) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Employees Message -->
          <div class="no-employees" *ngIf="day?.shift?.start && filteredEmployees.length === 0">
            <p>No other employees starting within the selected time range.</p>
          </div>

          <!-- No Shift Message -->
          <div class="no-shift" *ngIf="!day?.shift">
            <p>No shift scheduled for this day.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./day-popup.component.css']
})
export class DayPopupComponent implements OnChanges {
  @Input() day: CalendarDay | null = null;
  @Input() selectedEmployeeId: string = '';
  @Output() closePopup = new EventEmitter<void>();

  employees: Employee[] = [];
  filteredEmployees: EmployeeShift[] = [];
  selectedRange: string = '0';
  customHours: number = 1;

  timeRanges = [
    { label: '±3h', value: '3' },
    { label: '±2h', value: '2' },
    { label: '±1h', value: '1' },
    { label: 'Exact', value: '0' },
    { label: 'Custom', value: 'custom' }
  ];

  constructor(private employeeService: EmployeeService) {
    this.employeeService.getEmployeesObservable().subscribe(employees => {
      this.employees = employees;
      this.filterEmployees();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['day']) {
      this.filterEmployees();
    }
  }

  close(): void {
    this.closePopup.emit();
  }

  getDayTitle(): string {
    if (!this.day) return '';
    return this.day.date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  selectTimeRange(range: string): void {
    this.selectedRange = range;
    this.filterEmployees();
  }

  updateCustomRange(): void {
    if (this.selectedRange === 'custom') {
      this.filterEmployees();
    }
  }

  filterEmployees(): void {
    if (!this.day?.shift?.start || !this.employees.length) {
      this.filteredEmployees = [];
      return;
    }

    const currentStartTime = this.day.shift.start;
    const currentStartHour = this.parseTimeToHour(currentStartTime);
    
    let rangeHours = 0;
    if (this.selectedRange === 'custom') {
      rangeHours = this.customHours;
    } else {
      rangeHours = parseInt(this.selectedRange);
    }

    const minHour = currentStartHour - rangeHours;
    const maxHour = currentStartHour + rangeHours;

    this.filteredEmployees = this.employees
      .filter(emp => emp.id !== this.selectedEmployeeId) // Exclude current employee
      .map(emp => {
        const shift = this.getShiftForEmployee(emp, this.day!.date);
        if (shift && shift.start) {
          const shiftHour = this.parseTimeToHour(shift.start);
          const timeDifference = shiftHour - currentStartHour;
          
          if (shiftHour >= minHour && shiftHour <= maxHour) {
            return {
              employee: emp,
              shift: shift,
              timeDifference: timeDifference
            };
          }
        }
        return null;
      })
      .filter((item): item is EmployeeShift => item !== null)
      .sort((a, b) => Math.abs(a.timeDifference) - Math.abs(b.timeDifference));
  }

  getShiftForEmployee(employee: Employee, date: Date): any {
    const dateString = this.formatDate(date);
    return employee.shifts.find(shift => shift.date === dateString) || null;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  parseTimeToHour(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
  }

  getTimeDifferenceText(difference: number): string {
    if (difference === 0) return 'Same time';
    const absDiff = Math.abs(difference);
    const hours = Math.floor(absDiff);
    const minutes = Math.round((absDiff - hours) * 60);
    
    let text = '';
    if (hours > 0) text += `${hours}h`;
    if (minutes > 0) text += ` ${minutes}m`;
    
    return difference > 0 ? `+${text}` : `-${text}`;
  }
} 