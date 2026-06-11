// src/app/core/services/usuario.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, RolEnum } from '../../shared/models';
import { MOCK_USUARIOS } from './mock-data';

export interface CrearUsuarioRequest {
  fullName:     string;
  email:      string;
  keycloakId: string;
  rol:        RolEnum;
}

export interface CambiarRolRequest    { rol:    RolEnum; }
export interface CambiarEstadoRequest { status: string;  }

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apis.users}/users`;

  listarTodos(): Observable<Usuario[]> {
    if (environment.useMocks) return of(MOCK_USUARIOS).pipe(delay(300));
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  obtenerPorId(id: string): Observable<Usuario> {
    if (environment.useMocks)
      return of(MOCK_USUARIOS.find(u => u.id === id)!).pipe(delay(200));
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  crear(request: CrearUsuarioRequest): Observable<Usuario> {
    if (environment.useMocks) {
      const nuevo: Usuario = {
        id: Date.now().toString(), ...request,
        status: 'ACTIVE', keycloakId: request.keycloakId
      };
      MOCK_USUARIOS.push(nuevo);
      return of(nuevo).pipe(delay(600));
    }
    return this.http.post<Usuario>(this.baseUrl, request);
  }

  cambiarRol(id: string, request: CambiarRolRequest): Observable<Usuario> {
    if (environment.useMocks) {
      const u = MOCK_USUARIOS.find(u => u.id === id);
      if (u) u.rol = request.rol;
      return of(u!).pipe(delay(400));
    }
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/role`, request);
  }

  cambiarEstado(id: string, request: CambiarEstadoRequest): Observable<Usuario> {
    if (environment.useMocks) {
      const u = MOCK_USUARIOS.find(u => u.id === id);
      if (u) u.status = request.status;
      return of(u!).pipe(delay(400));
    }
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/status`, request);
  }

  resetPassword(id: string): Observable<void> {
    if (environment.useMocks) return of(undefined).pipe(delay(400));
    return this.http.post<void>(`${this.baseUrl}/${id}/reset-password`, {});
  }
}
