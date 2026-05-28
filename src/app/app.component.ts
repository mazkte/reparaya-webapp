// src/app/app.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatBadgeModule, MatTooltipModule, MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="app-container">

      <!-- SIDEBAR -->
      <mat-sidenav #sidenav mode="side" [opened]="sidenavOpen()" class="app-sidenav">
        <div class="sidenav-header">
          <div class="logo">
            <mat-icon class="logo-icon">construction</mat-icon>
            <div>
              <span class="logo-title">ReparaYa</span>
              <span class="logo-sub">{{ roleLabel() }}</span>
            </div>
          </div>
        </div>

        <mat-nav-list class="nav-list">
          @for (item of visibleNavItems(); track item.route) {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active-link"
               [matTooltip]="item.label"
               matTooltipPosition="right">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <mat-divider/>
          <div class="user-info">
            <div class="user-avatar">{{ userInitials() }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.userName() }}</span>
              <span class="user-email">{{ auth.userEmail() }}</span>
            </div>
          </div>
          <button mat-icon-button (click)="auth.logout()" matTooltip="Cerrar sesión" class="logout-btn">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content class="app-content">

        <!-- TOPBAR -->
        <mat-toolbar class="app-topbar">
          <button mat-icon-button (click)="toggleSidenav()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="topbar-title">{{ pageTitle() }}</span>
          <span class="spacer"></span>

          @if (auth.isAutoridad() || auth.isAdmin()) {
            <button mat-icon-button matBadge="3" matBadgeColor="warn" matTooltip="Alertas críticas">
              <mat-icon>notifications</mat-icon>
            </button>
          }

          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <div class="topbar-avatar">{{ userInitials() }}</div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="menu-user-info">
              <strong>{{ auth.userName() }}</strong>
              <small>{{ auth.userEmail() }}</small>
            </div>
            <mat-divider/>
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              Cerrar sesión
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- ROUTER -->
        <div class="page-content">
          <router-outlet/>
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      --primary: #2d4a8a;
      --primary-dark: #1e3366;
      --accent: #1D9E75;
      --warn: #E24B4A;
      --sidebar-width: 220px;
      --topbar-height: 56px;
      --bg: #f5f4f0;
      --surface: #ffffff;
      --border: #e0dfd8;
      --text-primary: #1a1a2e;
      --text-secondary: #6b6b8a;
    }

    .app-container { height: 100vh; }

    .app-sidenav {
      width: var(--sidebar-width);
      background: var(--primary-dark);
      border-right: none;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 20px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-icon {
      color: var(--accent);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .logo-title {
      display: block;
      font-size: 16px;
      font-weight: 600;
      color: white;
      letter-spacing: .02em;
    }

    .logo-sub {
      display: block;
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      text-transform: uppercase;
      letter-spacing: .08em;
    }

    .nav-list {
      flex: 1;
      padding: 8px 0;
    }

    .nav-list a {
      color: rgba(255,255,255,0.7);
      border-radius: 0;
      margin: 2px 8px;
      border-radius: 6px;
      font-size: 13px;
    }

    .nav-list a:hover {
      background: rgba(255,255,255,0.08);
      color: white;
    }

    .nav-list a.active-link {
      background: var(--accent) !important;
      color: white !important;
    }

    .nav-list mat-icon { color: inherit; }

    .sidenav-footer {
      padding: 8px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-name {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .user-email {
      display: block;
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .logout-btn { color: rgba(255,255,255,0.5); }
    .logout-btn:hover { color: var(--warn); }

    .app-topbar {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      color: var(--text-primary);
      height: var(--topbar-height);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .topbar-title {
      font-size: 15px;
      font-weight: 500;
      margin-left: 8px;
      color: var(--text-primary);
    }

    .spacer { flex: 1; }

    .topbar-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
    }

    .app-content { background: var(--bg); }

    .page-content {
      padding: 24px;
      min-height: calc(100vh - var(--topbar-height));
    }

    .menu-user-info {
      padding: 12px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      strong { font-size: 13px; }
      small { font-size: 11px; color: var(--text-secondary); }
    }

    mat-divider { margin: 4px 0; }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  sidenavOpen = signal(true);

  private navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',      route: '/dashboard',             roles: ['ROLE_AUTORIDAD'] },
    { label: 'Reportes',     icon: 'report',         route: '/reportes',              roles: ['ROLE_AUTORIDAD'] },
    { label: 'Empresas',     icon: 'business',       route: '/admin/empresas',        roles: ['ROLE_AUTORIDAD'] },
    { label: 'Por validar',  icon: 'fact_check',     route: '/supervisor/pendientes', roles: ['ROLE_SUPERVISOR'] },
    { label: 'Mis trabajos', icon: 'engineering',    route: '/empresa/trabajos',      roles: ['ROLE_EMPRESA'] },
    { label: 'Dashboard',    icon: 'dashboard',      route: '/dashboard',             roles: ['ROLE_ADMIN'] },
    { label: 'Reportes',     icon: 'report',         route: '/reportes',              roles: ['ROLE_ADMIN'] },
    { label: 'Usuarios',     icon: 'people',         route: '/admin/usuarios',        roles: ['ROLE_ADMIN'] },
    { label: 'Empresas',     icon: 'corporate_fare', route: '/admin/empresas',        roles: ['ROLE_ADMIN'] },
    { label: 'Configuración',icon: 'settings',       route: '/admin/config',          roles: ['ROLE_ADMIN'] },
  ];

  visibleNavItems = computed(() =>
    this.navItems.filter(item =>
      item.roles.some(r => this.auth.hasRole(r as any))
    )
  );

  roleLabel = computed(() => {
    if (this.auth.isAdmin()) return 'Administrador';
    if (this.auth.isAutoridad()) return 'Autoridad municipal';
    if (this.auth.isSupervisor()) return 'Supervisor';
    if (this.auth.isEmpresa()) return 'Empresa';
    return '';
  });

  userInitials = computed(() => {
    const name = this.auth.userName();
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  });

  pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard general';
    if (url.includes('reportes')) return 'Gestión de reportes';
    if (url.includes('empresas')) return 'Empresas contratadas';
    if (url.includes('supervisor/pendientes')) return 'Trabajos por validar';
    if (url.includes('empresa/trabajos')) return 'Mis trabajos asignados';
    if (url.includes('admin/usuarios')) return 'Gestión de usuarios';
    if (url.includes('admin/empresas')) return 'Gestión de empresas';
    if (url.includes('admin/config')) return 'Configuración';
    return 'ReparaYa';
  });

  async ngOnInit() {
    await this.auth.loadProfile();
  }

  toggleSidenav() {
    this.sidenavOpen.update(v => !v);
  }
}
