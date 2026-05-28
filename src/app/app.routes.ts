// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  // ── Autoridad ────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['ROLE_AUTORIDAD', 'ROLE_ADMIN'])],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },
  {
    path: 'reportes',
    canActivate: [authGuard, roleGuard(['ROLE_AUTORIDAD', 'ROLE_ADMIN'])],
    loadComponent: () =>
      import('./features/reports/report-list.component')
        .then(m => m.ReportListComponent)
  },
  {
    path: 'reportes/:id',
    canActivate: [authGuard, roleGuard(['ROLE_AUTORIDAD', 'ROLE_SUPERVISOR', 'ROLE_ADMIN'])],
    loadComponent: () =>
      import('./features/reports/report-detail.component')
        .then(m => m.ReportDetailComponent)
  },
  {
    path: 'empresas',
    canActivate: [authGuard, roleGuard(['ROLE_AUTORIDAD', 'ROLE_ADMIN'])],
    loadComponent: () =>
      import('./features/companies/company-list.component')
        .then(m => m.CompanyListComponent)
  },

  // ── Supervisor ───────────────────────────────────────────
  {
    path: 'supervisor',
    canActivate: [authGuard, roleGuard(['ROLE_SUPERVISOR'])],
    children: [
      {
        path: 'pendientes',
        loadComponent: () =>
          import('./features/supervisor/supervisor-pending.component')
            .then(m => m.SupervisorPendingComponent)
      },
      {
        path: 'validar/:id',
        loadComponent: () =>
          import('./features/supervisor/supervisor-validate.component')
            .then(m => m.SupervisorValidateComponent)
      },
      { path: '', redirectTo: 'pendientes', pathMatch: 'full' }
    ]
  },

  // ── Empresa ──────────────────────────────────────────────
  {
    path: 'empresa',
    canActivate: [authGuard, roleGuard(['ROLE_EMPRESA'])],
    children: [
      {
        path: 'trabajos',
        loadComponent: () =>
          import('./features/empresa/empresa-trabajos.component')
            .then(m => m.EmpresaTrabajosComponent)
      },
      {
        path: 'trabajo/:id',
        loadComponent: () =>
          import('./features/empresa/empresa-detalle.component')
            .then(m => m.EmpresaDetalleComponent)
      },
      { path: '', redirectTo: 'trabajos', pathMatch: 'full' }
    ]
  },

  // ── Admin ────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ROLE_ADMIN', 'ROLE_AUTORIDAD'])],
    children: [
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/admin-usuarios.component')
            .then(m => m.AdminUsuariosComponent)
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./features/admin/admin-empresas.component')
            .then(m => m.AdminEmpresasComponent)
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./features/admin/admin-config.component')
            .then(m => m.AdminConfigComponent)
      },
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' }
    ]
  },

  // ── Fallback ─────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
