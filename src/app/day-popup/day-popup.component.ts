import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Employee, EmployeeService } from '../services/employee.service';
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
          <button class="close-button" (click)="close()" aria-label="Zamknij">
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
            <h3 class="section-title">Szczegóły zmiany</h3>
            <div class="shift-info-grid">
              <div class="info-item">
                <span class="label">Godzina rozpoczęcia:</span>
                <span class="value">{{ day?.shift?.start || 'Nie określono' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Godzina zakończenia:</span>
                <span class="value">{{ day?.shift?.end || 'Nie określono' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Łączne godziny:</span>
                <span class="value">{{ day?.shift?.hours || 0 }}h</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isSickLeave">
                <span class="label">Typ:</span>
                <span class="value shift-type sick-leave">Zwolnienie lekarskie (L4)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isTraining">
                <span class="label">Typ:</span>
                <span class="value shift-type training">Szkolenie (SZK)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isVacation">
                <span class="label">Typ:</span>
                <span class="value shift-type vacation">Urlop (URL)</span>
              </div>
              <div class="info-item" *ngIf="day?.shift?.isNightShift">
                <span class="label">Typ:</span>
                <span class="value shift-type night-shift">Zmiana nocna (NOC)</span>
              </div>
            </div>
          </div>

          <!-- Time Range Selector -->
          <div class="time-range-section" *ngIf="day?.shift?.start">
            <h3 class="section-title">Pracownicy rozpoczynający o podobnej porze</h3>
            <div class="time-range-selector">
              <label class="range-label">Zakres czasowy:</label>
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
                <label>Niestandardowe godziny (±):</label>
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
            <div class="employees-header">
              <h3 class="section-title">Pracownicy ({{ filteredEmployees.length }})</h3>
              <div class="sort-toggle">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="sortFavouritesFirst"
                    (change)="onSortToggleChange()"
                    class="toggle-input"
                  >
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">Ulubieni pierwsi</span>
                </label>
              </div>
            </div>
            <div class="employees-list">
              <div 
                *ngFor="let empShift of sortedEmployees" 
                class="employee-item"
                [class.current-employee]="empShift.employee.id === selectedEmployeeId"
                [class.favourite-employee]="isFavourite(empShift.employee)"
                (click)="onEmployeeClick(empShift.employee)"
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
            <p>Brak innych pracowników rozpoczynających w wybranym zakresie czasowym.</p>
          </div>

          <!-- No Shift Message -->
          <div class="no-shift" *ngIf="!day?.shift">
            <p>Brak zaplanowanej zmiany na ten dzień.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Switch Employee Confirmation Popup -->
    <div class="confirmation-overlay" *ngIf="showSwitchConfirmation">
      <div class="confirmation-popup">
        <div class="confirmation-header">
          <h3>Przełączyć na kalendarz pracownika?</h3>
        </div>
        <div class="confirmation-content">
          <p>Czy chcesz przełączyć na kalendarz <strong>{{ employeeToSwitch?.firstName }} {{ employeeToSwitch?.lastName }}</strong>?</p>
          <p class="confirmation-note">To zamknie obecny widok i pokaże ich harmonogram.</p>
        </div>
        <div class="confirmation-actions">
          <button class="btn-cancel" (click)="cancelSwitch()">Anuluj</button>
          <button class="btn-confirm" (click)="confirmSwitch()">Przełącz</button>
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
  favouriteNames: string[] = [];
  sortFavouritesFirst: boolean = false;
  showSwitchConfirmation: boolean = false;
  employeeToSwitch: Employee | null = null;

  timeRanges = [
    { label: '±3h', value: '3' },
    { label: '±2h', value: '2' },
    { label: '±1h', value: '1' },
    { label: 'Dokładnie', value: '0' },
    { label: 'Niestandardowe', value: 'custom' }
  ];

  constructor(
    private employeeService: EmployeeService,
    private cookieService: CookieService,
    private router: Router
  ) {
    this.favouriteNames = this.getFavouritesFromCookie();
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
    
    const weekdays = [
      'Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 
      'Czwartek', 'Piątek', 'Sobota'
    ];
    
    const months = [
      'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
      'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'
    ];
    
    const weekday = weekdays[this.day.date.getDay()];
    const day = this.day.date.getDate();
    const month = months[this.day.date.getMonth()];
    const year = this.day.date.getFullYear();
    
    return `${weekday}, ${day} ${month} ${year}`;
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
    if (difference === 0) return 'Ten sam czas';
    const absDiff = Math.abs(difference);
    const hours = Math.floor(absDiff);
    const minutes = Math.round((absDiff - hours) * 60);
    
    let text = '';
    if (hours > 0) text += `${hours}h`;
    if (minutes > 0) text += ` ${minutes}m`;
    
    return difference > 0 ? `+${text}` : `-${text}`;
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

  getEmployeeFullName(employee: Employee): string {
    return `${employee.firstName} ${employee.lastName}`;
  }

  isFavourite(employee: Employee): boolean {
    return this.favouriteNames.includes(this.getEmployeeFullName(employee));
  }

  onSortToggleChange(): void {
    this.filterEmployees();
  }

  get sortedEmployees(): EmployeeShift[] {
    if (!this.filteredEmployees.length) return [];

    const favourites = this.filteredEmployees.filter(emp => this.isFavourite(emp.employee));
    const others = this.filteredEmployees.filter(emp => !this.isFavourite(emp.employee));

    if (this.sortFavouritesFirst) {
      return [...favourites, ...others];
    } else {
      return [...others, ...favourites];
    }
  }

  onEmployeeClick(employee: Employee): void {
    this.employeeToSwitch = employee;
    this.showSwitchConfirmation = true;
  }

  confirmSwitch(): void {
    if (this.employeeToSwitch) {
      // Close all popups and navigate to mobile calendar with the selected employee
      this.closePopup.emit();
      this.router.navigate(['/mobile-calendar'], { 
        queryParams: { 
          employeeId: this.employeeToSwitch.id,
          month: this.day?.date.getMonth(),
          year: this.day?.date.getFullYear()
        }
      });
    }
  }

  cancelSwitch(): void {
    this.showSwitchConfirmation = false;
    this.employeeToSwitch = null;
  }
} 