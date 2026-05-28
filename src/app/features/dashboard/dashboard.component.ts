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
  template: `
    <div class="dashboard">

      <!-- MÉTRICAS -->
      <div class="metrics-grid">
        <mat-card class="metric-card">
          <div class="metric-icon" style="background:#eef1f9">
            <mat-icon style="color:#2d4a8a">assessment</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-val">{{ metrics()?.totalReportes ?? 0 }}</span>
            <span class="metric-label">Total reportes</span>
            <span class="metric-sub trend-up">+12 hoy</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon" style="background:#fff8e8">
            <mat-icon style="color:#8a6d2d">pending_actions</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-val warn">{{ metrics()?.sinAsignar ?? 0 }}</span>
            <span class="metric-label">Sin asignar</span>
            <span class="metric-sub">Pendientes empresa</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon" style="background:#eef1f9">
            <mat-icon style="color:#2d4a8a">engineering</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-val info">{{ metrics()?.enEjecucion ?? 0 }}</span>
            <span class="metric-label">En ejecución</span>
            <span class="metric-sub">Por empresas</span>
          </div>
        </mat-card>

        <mat-card class="metric-card">
          <div class="metric-icon" style="background:#eaf4ef">
            <mat-icon style="color:#2d8a6a">check_circle</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-val success">{{ metrics()?.cerradosHoy ?? 0 }}</span>
            <span class="metric-label">Cerrados hoy</span>
            <span class="metric-sub trend-up">+3 vs ayer</span>
          </div>
        </mat-card>
      </div>

      <div class="two-col">

        <!-- MAPA -->
        <mat-card class="map-card">
          <mat-card-header>
            <mat-card-title>Mapa de reportes</mat-card-title>
            <mat-card-subtitle>Trujillo — La Libertad</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div id="dashboard-map" class="map-container"></div>
            <div class="map-legend">
              <span class="legend-item"><span class="dot red"></span>Crítico</span>
              <span class="legend-item"><span class="dot amber"></span>Pendiente</span>
              <span class="legend-item"><span class="dot green"></span>Cerrado</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- CARGA POR EMPRESA -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Carga por empresa</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (item of metrics()?.empresasCarga ?? []; track item.empresa.id) {
              <div class="empresa-row">
                <div class="empresa-info">
                  <span class="empresa-name">{{ item.empresa.nombre }}</span>
                  <span class="empresa-esp">{{ item.empresa.especialidades.join(' · ') }}</span>
                </div>
                <div class="empresa-cupo">
                  <span class="cupo-txt">{{ item.empresa.trabajosHoy }}/{{ item.empresa.capacidadDiariaMax }}</span>
                  <mat-progress-bar
                    [value]="item.porcentajeCarga"
                    [color]="item.porcentajeCarga >= 100 ? 'warn' : item.porcentajeCarga >= 70 ? 'accent' : 'primary'"
                    class="cupo-bar">
                  </mat-progress-bar>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>

      </div>

      <!-- REPORTES CRÍTICOS -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            Reportes críticos sin asignar
            <mat-icon class="warn-icon">warning</mat-icon>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="reportesCriticos()" class="w-full">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let r">#{{ r.id }}</td>
            </ng-container>
            <ng-container matColumnDef="descripcion">
              <th mat-header-cell *matHeaderCellDef>Descripción</th>
              <td mat-cell *matCellDef="let r">{{ r.titulo }}</td>
            </ng-container>
            <ng-container matColumnDef="categoria">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [class]="'chip-' + r.categoria.toLowerCase()">{{ r.categoria }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="ubicacion">
              <th mat-header-cell *matHeaderCellDef>Zona</th>
              <td mat-cell *matCellDef="let r">{{ getZona(r.ubicacion.direccion) }}</td>
            </ng-container>
            <ng-container matColumnDef="accion">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-button color="primary" [routerLink]="['/reportes', r.id]">
                  Ver <mat-icon>arrow_forward</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button routerLink="/reportes">Ver todos los reportes</button>
        </mat-card-actions>
      </mat-card>

    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 20px; }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px !important;
    }

    .metric-card mat-card-content { display: flex; align-items: center; gap: 14px; }

    .metric-icon {
      width: 44px; height: 44px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .metric-val {
      display: block;
      font-size: 26px;
      font-weight: 600;
      color: #1a1a2e;
      line-height: 1;
    }
    .metric-val.warn { color: #8a6d2d; }
    .metric-val.info { color: #2d4a8a; }
    .metric-val.success { color: #2d8a6a; }

    .metric-label {
      display: block;
      font-size: 12px;
      color: #6b6b8a;
      margin-top: 3px;
    }

    .metric-sub {
      display: block;
      font-size: 11px;
      color: #aaa;
      margin-top: 2px;
    }

    .trend-up { color: #2d8a6a !important; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .map-container {
      height: 220px;
      background: #eef1f9;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .map-legend {
      display: flex;
      gap: 14px;
      margin-top: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #6b6b8a;
    }

    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot.red { background: #E24B4A; }
    .dot.amber { background: #EF9F27; }
    .dot.green { background: #1D9E75; }

    .empresa-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f0efea;
    }
    .empresa-row:last-child { border-bottom: none; }

    .empresa-info { flex: 1; }
    .empresa-name { display: block; font-size: 13px; font-weight: 500; }
    .empresa-esp { display: block; font-size: 10px; color: #6b6b8a; }

    .empresa-cupo { width: 100px; }
    .cupo-txt { display: block; font-size: 10px; color: #6b6b8a; text-align: right; margin-bottom: 4px; }
    .cupo-bar { height: 6px; border-radius: 3px; }

    .chip {
      display: inline-block;
      font-size: 10px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .chip-vialidad { background: #eeedfe; color: #3c3489; }
    .chip-alumbrado { background: #fff8e8; color: #7a5c00; }
    .chip-agua_potable { background: #eef1f9; color: #2d4a8a; }
    .chip-alcantarillado { background: #fce8e8; color: #791f1f; }
    .chip-otro { background: #f1efea; color: #555; }

    .warn-icon { color: #E24B4A; font-size: 18px; margin-left: 6px; vertical-align: middle; }
    .w-full { width: 100%; }

    @media (max-width: 900px) {
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
    }
  `]
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