// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { ReporteService } from '../../core/services/reporte.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { DashboardMetrics, Reporte } from '../../shared/models';
import { MOCK_DASHBOARD, MOCK_REPORTES } from '../../core/services/mock-data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatTableModule, MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private reporteService = inject(ReporteService);

  metrics = signal<DashboardMetrics | null>(null);
  reportesCriticos = signal<Reporte[]>([]);
  displayedColumns = ['id', 'descripcion', 'categoria', 'ubicacion', 'accion'];

  ngOnInit() {
    this.metrics.set(MOCK_DASHBOARD);
    this.reportesCriticos.set(
      MOCK_REPORTES.filter(r => r.prioridad === 'CRITICA' && !r.empresaId).slice(0, 3)
    );
    this.initMap();
  }

  private initMap() {
    setTimeout(() => {
      const el = document.getElementById('dashboard-map');
      if (!el) return;
      try {
        const L = (window as any).L;
        if (!L) { this.renderMockMap(el); return; }
        const map = L.map(el).setView([-8.1116, -79.0352], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        MOCK_REPORTES.forEach(r => {
          const color = r.prioridad === 'CRITICA' ? '#E24B4A' : r.estado === 'CERRADO' ? '#1D9E75' : '#EF9F27';
          L.circleMarker([r.ubicacion.latitud, r.ubicacion.longitud], {
            radius: 8, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9
          }).bindPopup(`<b>#${r.id}</b><br>${r.titulo}`).addTo(map);
        });
      } catch { this.renderMockMap(el); }
    }, 300);
  }

  private renderMockMap(el: HTMLElement) {
    el.innerHTML = `
      <div style="position:relative;width:100%;height:100%;background:linear-gradient(135deg,#e8ecf4 0%,#dde4f0 100%);display:flex;align-items:center;justify-content:center;">
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:.15" viewBox="0 0 400 220">
          <defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke="#2d4a8a" stroke-width="0.5"/></pattern></defs>
          <rect width="400" height="220" fill="url(#g)"/>
        </svg>
        <div style="position:absolute;top:30%;left:40%;transform:translate(-50%,-50%)">
          <div style="width:12px;height:12px;border-radius:50%;background:#E24B4A;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>
        </div>
        <div style="position:absolute;top:55%;left:62%">
          <div style="width:12px;height:12px;border-radius:50%;background:#E24B4A;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>
        </div>
        <div style="position:absolute;top:45%;left:28%">
          <div style="width:10px;height:10px;border-radius:50%;background:#EF9F27;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>
        </div>
        <div style="position:absolute;top:65%;left:48%">
          <div style="width:10px;height:10px;border-radius:50%;background:#1D9E75;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>
        </div>
        <span style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);font-size:11px;color:#6b6b8a;z-index:1">Trujillo — La Libertad</span>
      </div>`;
  }

  getZona(direccion?: string): string {
    if (!direccion) return 'Centro';
    const parts = direccion.split(',');
    return parts[1]?.trim() ?? parts[0] ?? 'Centro';
  }

}