import { Routes } from '@angular/router';

export const MEASUREMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./measurement-list/measurement-list.component').then(
        (m) => m.MeasurementListComponent
      )
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./measurement-form/measurement-form.component').then(
        (m) => m.MeasurementFormComponent
      )
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./measurement-form/measurement-form.component').then(
        (m) => m.MeasurementFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./measurement-detail/measurement-detail.component').then(
        (m) => m.MeasurementDetailComponent
      )
  }
];
