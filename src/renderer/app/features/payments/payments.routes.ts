import { Routes } from '@angular/router';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./payment-list/payment-list.component').then((m) => m.PaymentListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then((m) => m.PaymentFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./payment-form/payment-form.component').then((m) => m.PaymentFormComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./payment-detail/payment-detail.component').then((m) => m.PaymentDetailComponent)
  }
];
