// src/app/core/services/empresa.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmpresaServicio, CategoriaEnum } from '../../shared/models';
import { MOCK_EMPRESAS } from './mock-data';

export interface CrearEmpresaRequest {
  nombre:              string;
  ruc:                 string;
  emailCoordinador:    string;
  whatsappCoordinador: string;
  especialidades:      CategoriaEnum[];
  capacidadDiariaMax:  number;
  vigenciaContrato:    string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apis.companies}/companies`;

  getEmpresas(): Observable<EmpresaServicio[]> {
    if (environment.useMocks) return of(MOCK_EMPRESAS).pipe(delay(300));
    return this.http.get<EmpresaServicio[]>(this.baseUrl);
  }

  getEmpresa(id: string): Observable<EmpresaServicio> {
    if (environment.useMocks)
      return of(MOCK_EMPRESAS.find(e => e.id === id)!).pipe(delay(200));
    return this.http.get<EmpresaServicio>(`${this.baseUrl}/${id}`);
  }

  getEmpresasDisponibles(categoria: CategoriaEnum): Observable<EmpresaServicio[]> {
    if (environment.useMocks) {
      return of(MOCK_EMPRESAS.filter(e =>
        e.estado === 'ACTIVA' && e.especialidades.includes(categoria)
        && e.trabajosHoy < e.capacidadDiariaMax)).pipe(delay(200));
    }
    return this.http.get<EmpresaServicio[]>(`${this.baseUrl}/available/${categoria}`);
  }

  crear(request: CrearEmpresaRequest): Observable<EmpresaServicio> {
    if (environment.useMocks) {
      const nueva: EmpresaServicio = {
        id: Date.now().toString(), ...request,
        trabajosHoy: 0, estado: 'ACTIVA'
      };
      MOCK_EMPRESAS.push(nueva);
      return of(nueva).pipe(delay(600));
    }
    return this.http.post<EmpresaServicio>(this.baseUrl, request);
  }

  actualizarCupo(id: string, capacidadDiariaMax: number): Observable<EmpresaServicio> {
    if (environment.useMocks) {
      const e = MOCK_EMPRESAS.find(e => e.id === id);
      if (e) e.capacidadDiariaMax = capacidadDiariaMax;
      return of(e!).pipe(delay(300));
    }
    return this.http.patch<EmpresaServicio>(`${this.baseUrl}/${id}/quota`,
      { capacidadDiariaMax });
  }

  cambiarEstado(id: string, estado: string): Observable<EmpresaServicio> {
    if (environment.useMocks) {
      const e = MOCK_EMPRESAS.find(e => e.id === id);
      if (e) e.estado = estado as any;
      return of(e!).pipe(delay(300));
    }
    return this.http.patch<EmpresaServicio>(`${this.baseUrl}/${id}/status`, { estado });
  }
}
