import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';
import { Login } from './features/auth/login';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
