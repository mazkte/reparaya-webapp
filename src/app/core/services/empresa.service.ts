// src/app/core/services/empresa.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmpresaServicio, CategoriaEnum } from '../../shared/models';
import { MOCK_EMPRESAS } from './mock-data';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/companies`;

  getEmpresas(): Observable<EmpresaServicio[]> {
    if (environment.useMocks) return of(MOCK_EMPRESAS).pipe(delay(300));
    return this.http.get<EmpresaServicio[]>(this.baseUrl);
  }

  getEmpresa(id: string): Observable<EmpresaServicio> {
    if (environment.useMocks) {
      return of(MOCK_EMPRESAS.find(e => e.id === id)!).pipe(delay(200));
    }
    return this.http.get<EmpresaServicio>(`${this.baseUrl}/${id}`);
  }

  getEmpresasDisponibles(categoria: CategoriaEnum): Observable<EmpresaServicio[]> {
    if (environment.useMocks) {
      const disponibles = MOCK_EMPRESAS.filter(e =>
        e.estado === 'ACTIVA' &&
        e.especialidades.includes(categoria) &&
        e.trabajosHoy < e.capacidadDiariaMax
      );
      return of(disponibles).pipe(delay(200));
    }
    return this.http.get<EmpresaServicio[]>(`${this.baseUrl}/available/${categoria}`);
  }

  actualizarCupo(empresaId: string, capacidadDiariaMax: number): Observable<EmpresaServicio> {
    if (environment.useMocks) {
      const e = MOCK_EMPRESAS.find(e => e.id === empresaId);
      if (e) e.capacidadDiariaMax = capacidadDiariaMax;
      return of(e!).pipe(delay(200));
    }
    return this.http.patch<EmpresaServicio>(`${this.baseUrl}/${empresaId}`, { capacidadDiariaMax });
  }
}
