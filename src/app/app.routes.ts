import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout-shell/layout-shell').then(
        m => m.LayoutShell
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(
            m => m.Dashboard
          )
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./pages/pos/pos').then(m => m.Pos)
      },
      {
        path: 'tables',
        loadComponent: () =>
          import('./pages/tables/tables').then(m => m.Tables)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders').then(m => m.Orders)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions').then(
            m => m.Transactions
          )
      },
      {
        path: 'shift',
        loadComponent: () =>
          import('./pages/shift/shift').then(m => m.Shift)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(
            m => m.Settings
          )
      },
      {
        path: 'scheduler-booking',
        loadComponent: () =>
          import('./pages/scheduler-booking/scheduler-booking')
            .then(m => m.SchedulerBooking),
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];