import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent
      )
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then(
        (m) => m.CustomerFormComponent
      )
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./customer-form/customer-form.component').then(
        (m) => m.CustomerFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent
      )
  }
];
