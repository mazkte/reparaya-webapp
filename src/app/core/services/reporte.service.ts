// src/app/core/services/reporte.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reporte, PageResponse, ReporteFilter, EstadoReporteEnum, DashboardMetrics } from '../../shared/models';
import { MOCK_REPORTES, MOCK_DASHBOARD } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apis.reports}/reports`;

  getReportes(filter?: ReporteFilter, page = 0, size = 10): Observable<PageResponse<Reporte>> {
    if (environment.useMocks) {
      let data = [...MOCK_REPORTES];
      if (filter?.estado)    data = data.filter(r => r.estado === filter.estado);
      if (filter?.categoria) data = data.filter(r => r.categoria === filter.categoria);
      if (filter?.prioridad) data = data.filter(r => r.prioridad === filter.prioridad);
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        data = data.filter(r =>
          r.titulo.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q));
      }
      const start = page * size;
      return of({ content: data.slice(start, start + size),
        totalElements: data.length, totalPages: Math.ceil(data.length / size),
        page, size }).pipe(delay(300));
    }
    let params = new HttpParams().set('page', page).set('size', size);
    if (filter?.estado)    params = params.set('estado',    filter.estado);
    if (filter?.categoria) params = params.set('categoria', filter.categoria);
    if (filter?.prioridad) params = params.set('prioridad', filter.prioridad);
    if (filter?.search)    params = params.set('search',    filter.search);
    console.log('Fetching reportes with params:', params.toString());
    return this.http.get<PageResponse<Reporte>>(this.baseUrl, { params });
  }

  getReporte(id: string): Observable<Reporte> {
    if (environment.useMocks)
      return of(MOCK_REPORTES.find(r => r.id === id)!).pipe(delay(200));
    return this.http.get<Reporte>(`${this.baseUrl}/${id}`);
  }

  getDashboard(): Observable<DashboardMetrics> {
    if (environment.useMocks) return of(MOCK_DASHBOARD).pipe(delay(400));
    return this.http.get<DashboardMetrics>(`${this.baseUrl}/dashboard`);
  }

  actualizarEstado(id: string, estado: EstadoReporteEnum, observacion?: string): Observable<Reporte> {
    if (environment.useMocks) {
      const r = MOCK_REPORTES.find(r => r.id === id);
      if (r) {
        r.estado = estado;
        r.historialEstados.push({ estado, actor: 'usuario-actual',
          timestamp: new Date().toISOString(), observacion });
        r.fechaActualizacion = new Date().toISOString();
      }
      return of(r!).pipe(delay(300));
    }
    return this.http.patch<Reporte>(`${this.baseUrl}/${id}/status`, { estado, observacion });
  }

  asignarEmpresa(reporteId: string, empresaId: string): Observable<Reporte> {
    if (environment.useMocks) {
      const r = MOCK_REPORTES.find(r => r.id === reporteId);
      if (r) { r.empresaId = empresaId; r.estado = 'EN_REVISION'; }
      return of(r!).pipe(delay(300));
    }
    return this.http.patch<Reporte>(`${this.baseUrl}/${reporteId}/assign`, { empresaId });
  }

  escalarPrioridad(id: string): Observable<Reporte> {
    if (environment.useMocks) {
      const r = MOCK_REPORTES.find(r => r.id === id);
      return of(r!).pipe(delay(300));
    }
    return this.http.patch<Reporte>(`${this.baseUrl}/${id}/escalate`, {});
  }
}
