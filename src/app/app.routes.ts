import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WorkbookComponent } from './workbook/workbook.component';
import { MobileCalendarComponent } from './mobile-calendar/mobile-calendar.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'workbook', component: WorkbookComponent },
  { path: 'mobile-calendar', component: MobileCalendarComponent },
  { path: '**', redirectTo: '' }
];
