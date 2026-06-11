// src/app/core/interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorDialogService } from '../../shared/components/error-dialog/error-dialog.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorDialog = inject(ErrorDialogService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // No mostrar dialog para errores de autenticación (los maneja Keycloak)
      if (error.status === 401) return throwError(() => error);

      let titulo  = 'Error del servidor';
      let mensaje = 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
      let detalle: string[] | undefined;

      switch (error.status) {
        case 0:
          titulo  = 'Sin conexión';
          mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          titulo  = 'Datos inválidos';
          mensaje = error.error?.message ?? 'Los datos enviados no son válidos.';
          detalle = error.error?.details;
          break;
        case 403:
          titulo  = 'Sin permisos';
          mensaje = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          titulo  = 'No encontrado';
          mensaje = error.error?.message ?? 'El recurso solicitado no existe.';
          break;
        case 409:
          titulo  = 'Conflicto';
          mensaje = error.error?.message ?? 'Ya existe un registro con esos datos.';
          break;
        case 500:
        case 503:
          titulo  = 'Error del servidor';
          mensaje = 'El servidor no pudo procesar la solicitud. Intenta más tarde.';
          break;
      }

      errorDialog.mostrar({ titulo, mensaje, detalle });
      return throwError(() => error);
    })
  );
};
