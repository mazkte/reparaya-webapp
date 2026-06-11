// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

// Lista de todas las URLs de APIs que requieren JWT
const API_URLS = Object.values(environment.apis);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo agregar token a llamadas a nuestras APIs
  const esApiReparaya = API_URLS.some(url => req.url.startsWith(url));
  if (!esApiReparaya) return next(req);

  const auth = inject(AuthService);

  return from(auth.getToken()).pipe(
    switchMap(token => {
      if (!token) return next(req);
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(authReq);
    })
  );
};
