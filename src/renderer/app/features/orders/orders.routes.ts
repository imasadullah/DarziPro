import { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./order-list/order-list.component').then((m) => m.OrderListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./order-wizard/order-wizard.component').then((m) => m.OrderWizardComponent)
  },
  {
    path: 'kanban',
    loadComponent: () =>
      import('./order-kanban/order-kanban.component').then((m) => m.OrderKanbanComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./order-wizard/order-wizard.component').then((m) => m.OrderWizardComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./order-detail/order-detail.component').then((m) => m.OrderDetailComponent)
  }
];
