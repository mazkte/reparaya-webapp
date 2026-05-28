// src/app/core/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { RolEnum } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private keycloak = inject(KeycloakService);

  private _userProfile = signal<any>(null);

  readonly userProfile = this._userProfile.asReadonly();

  readonly userName = computed(() => {
    const p = this._userProfile();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });

  readonly userEmail = computed(() =>
    this._userProfile()?.email ?? ''
  );

  readonly userRoles = computed((): RolEnum[] =>
    (this.keycloak.getUserRoles() as RolEnum[]) ?? []
  );

  readonly isAutoridad = computed(() =>
    this.userRoles().includes('ROLE_AUTORIDAD')
  );

  readonly isSupervisor = computed(() =>
    this.userRoles().includes('ROLE_SUPERVISOR')
  );

  readonly isEmpresa = computed(() =>
    this.userRoles().includes('ROLE_EMPRESA')
  );

  readonly isAdmin = computed(() =>
    this.userRoles().includes('ROLE_ADMIN')
  );

  async loadProfile(): Promise<void> {
    try {
      const profile = await this.keycloak.loadUserProfile();
      this._userProfile.set(profile);
    } catch {
      this._userProfile.set(null);
    }
  }

  isLoggedIn(): boolean {
    return this.keycloak.isLoggedIn();
  }

  hasRole(role: RolEnum): boolean {
    return this.keycloak.isUserInRole(role);
  }

  login(): void {
    this.keycloak.login({ redirectUri: window.location.origin });
  }

  logout(): void {
    this.keycloak.logout(window.location.origin);
  }

  getToken(): Promise<string> {
    return this.keycloak.getToken();
  }

  // Retorna la ruta home según el rol del usuario
  getHomeRoute(): string {
    if (this.isAdmin()) return '/admin/usuarios';
    if (this.isAutoridad()) return '/dashboard';
    if (this.isSupervisor()) return '/supervisor/pendientes';
    if (this.isEmpresa()) return '/empresa/trabajos';
    return '/';
  }
}
