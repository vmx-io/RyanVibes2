import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WorkbookComponent } from './workbook/workbook.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'workbook', component: WorkbookComponent },
  { path: '**', redirectTo: '' }
];
