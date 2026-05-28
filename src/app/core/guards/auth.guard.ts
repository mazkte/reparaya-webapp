// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RolEnum } from '../../shared/models';

// ── Guard de autenticación — requiere estar logueado ──────
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isLoggedIn()) return true;

  auth.login();
  return false;
};

// ── Guard de rol — requiere uno de los roles indicados ────
export const roleGuard = (roles: RolEnum[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const hasRole = roles.some(r => auth.hasRole(r));
    if (hasRole) return true;

    // Redirigir a la home del rol actual
    router.navigate([auth.getHomeRoute()]);
    return false;
  };
};
