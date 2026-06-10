import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';

// Desarrollo modularizado: cada página es un componente standalone
// con carga perezosa (lazy loading) y protección de rutas por rol
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'welcome', loadComponent: () => import('./pages/welcome.component').then(m => m.WelcomeComponent) },
      { path: 'dashboard', canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR'] },
        loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users', canActivate: [roleGuard], data: { roles: ['ADMINISTRADOR', 'GESTOR'] },
        loadComponent: () => import('./pages/users.component').then(m => m.UsersComponent) },
      { path: 'turns', loadComponent: () => import('./pages/turns.component').then(m => m.TurnsComponent) },
      { path: 'caja', canActivate: [roleGuard], data: { roles: ['CAJERO'] },
        loadComponent: () => import('./pages/caja.component').then(m => m.CajaComponent) },
      { path: 'clients', canActivate: [roleGuard], data: { roles: ['CAJERO'] },
        loadComponent: () => import('./pages/clients.component').then(m => m.ClientsComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'welcome' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
