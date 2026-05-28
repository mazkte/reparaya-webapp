// src/app/features/empresa/empresa-trabajos.component.ts
import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { ReporteService } from '../../core/services/reporte.service';
import { AuthService } from '../../core/auth/auth.service';
import { Reporte, EstadoReporteEnum } from '../../shared/models';
import { MOCK_REPORTES } from '../../core/services/mock-data';

@Component({
  selector: 'app-empresa-trabajos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatTooltipModule,
    MatDividerModule, MatBadgeModule
  ],
  template: `
    <div class="empresa-trabajos">

      <!-- CABECERA -->
      <div class="page-header">
        <div>
          <h1>Mis trabajos asignados</h1>
          <p>Constructora Lima SAC &nbsp;·&nbsp; Especialidad: Vialidad</p>
        </div>
        <div class="header-meta">
          <div class="cupo-info">
            <span class="cupo-label">Capacidad hoy</span>
            <div class="cupo-bar-wrap">
              <span class="cupo-val">{{ trabajosHoy() }}/{{ capacidadMax }}</span>
              <mat-progress-bar
                [value]="(trabajosHoy() / capacidadMax) * 100"
                [color]="trabajosHoy() >= capacidadMax ? 'warn' : 'primary'"
                class="cupo-bar">
              </mat-progress-bar>
            </div>
          </div>
        </div>
      </div>

      <!-- MÉTRICAS RÁPIDAS -->
      <div class="metrics-row">
        <mat-card class="metric-card">
          <mat-icon style="color:#2d4a8a">assignment</mat-icon>
          <div>
            <span class="m-val">{{ trabajosAsignados().length }}</span>
            <span class="m-label">Asignados hoy</span>
          </div>
        </mat-card>
        <mat-card class="metric-card">
          <mat-icon style="color:#8a6d2d">engineering</mat-icon>
          <div>
            <span class="m-val warn">{{ enEjecucion().length }}</span>
            <span class="m-label">En ejecución</span>
          </div>
        </mat-card>
        <mat-card class="metric-card">
          <mat-icon style="color:#1D9E75">check_circle</mat-icon>
          <div>
            <span class="m-val success">{{ completados().length }}</span>
            <span class="m-label">Completados</span>
          </div>
        </mat-card>
      </div>

      <!-- TRABAJOS URGENTES -->
      @if (urgentes().length > 0) {
        <div class="section-title">
          <mat-icon class="warn-icon">priority_high</mat-icon>
          Críticos — atención inmediata
        </div>
        @for (r of urgentes(); track r.id) {
          <mat-card class="work-card urgent" [routerLink]="['/empresa/trabajo', r.id]">
            <div class="work-card-inner">
              <div class="work-urgency">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="work-info">
                <div class="work-header">
                  <span class="work-id">#{{ r.id }}</span>
                  <span class="work-time">{{ formatDate(r.fechaCreacion) }}</span>
                </div>
                <h3 class="work-title">{{ r.titulo }}</h3>
                <div class="work-meta">
                  <span class="meta-item">
                    <mat-icon>location_on</mat-icon>
                    {{ getZona(r.ubicacion.direccion) }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>category</mat-icon>
                    {{ getLabelCategoria(r.categoria) }}
                  </span>
                  <span class="chip" [ngClass]="'estado-' + r.estado">
                    {{ getLabelEstado(r.estado) }}
                  </span>
                  <span class="chip prioridad-CRITICA">Crítica</span>
                </div>
              </div>
              <div class="work-action">
                <button mat-flat-button color="primary" [routerLink]="['/empresa/trabajo', r.id]"
                        (click)="$event.stopPropagation()">
                  Ver trabajo
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-card>
        }
      }

      <!-- TRABAJOS EN EJECUCIÓN -->
      @if (enEjecucion().length > 0) {
        <div class="section-title">
          <mat-icon style="color:#2d4a8a">engineering</mat-icon>
          En ejecución
        </div>
        <div class="work-grid">
          @for (r of enEjecucion(); track r.id) {
            <mat-card class="work-card-small" [routerLink]="['/empresa/trabajo', r.id]">
              <div class="wcs-header">
                <span class="work-id">#{{ r.id }}</span>
                <span class="chip" [ngClass]="'prioridad-' + r.prioridad">{{ r.prioridad }}</span>
              </div>
              <h3 class="wcs-title">{{ r.titulo }}</h3>
              <div class="wcs-meta">
                <mat-icon>location_on</mat-icon>
                {{ getZona(r.ubicacion.direccion) }}
              </div>
              <div class="wcs-footer">
                <span class="chip" [ngClass]="'estado-' + r.estado">{{ getLabelEstado(r.estado) }}</span>
                <span class="work-time">{{ formatDate(r.fechaCreacion) }}</span>
              </div>
            </mat-card>
          }
        </div>
      }

      <!-- TRABAJOS ASIGNADOS (pendientes de iniciar) -->
      @if (pendientesIniciar().length > 0) {
        <div class="section-title">
          <mat-icon style="color:#8a6d2d">pending_actions</mat-icon>
          Asignados — pendientes de iniciar
        </div>
        <div class="work-grid">
          @for (r of pendientesIniciar(); track r.id) {
            <mat-card class="work-card-small" [routerLink]="['/empresa/trabajo', r.id]">
              <div class="wcs-header">
                <span class="work-id">#{{ r.id }}</span>
                <span class="chip" [ngClass]="'prioridad-' + r.prioridad">{{ r.prioridad }}</span>
              </div>
              <h3 class="wcs-title">{{ r.titulo }}</h3>
              <div class="wcs-meta">
                <mat-icon>location_on</mat-icon>
                {{ getZona(r.ubicacion.direccion) }}
              </div>
              <div class="wcs-footer">
                <span class="chip estado-ASIGNADA">Asignado</span>
                <span class="work-time">{{ formatDate(r.fechaCreacion) }}</span>
              </div>
            </mat-card>
          }
        </div>
      }

      <!-- COMPLETADOS HOY -->
      @if (completados().length > 0) {
        <div class="section-title">
          <mat-icon style="color:#1D9E75">check_circle</mat-icon>
          Completados hoy
        </div>
        @for (r of completados(); track r.id) {
          <mat-card class="work-card completed" [routerLink]="['/empresa/trabajo', r.id]">
            <div class="work-card-inner">
              <div class="work-info">
                <div class="work-header">
                  <span class="work-id">#{{ r.id }}</span>
                  <span class="chip estado-EJECUTADO">Ejecutado — pendiente supervisor</span>
                </div>
                <h3 class="work-title">{{ r.titulo }}</h3>
                <div class="work-meta">
                  <span class="meta-item">
                    <mat-icon>location_on</mat-icon>
                    {{ getZona(r.ubicacion.direccion) }}
                  </span>
                </div>
              </div>
              <button mat-icon-button [routerLink]="['/empresa/trabajo', r.id]"
                      (click)="$event.stopPropagation()">
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-card>
        }
      }

      <!-- ESTADO VACÍO -->
      @if (trabajosAsignados().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>assignment_turned_in</mat-icon>
          <h3>Sin trabajos asignados hoy</h3>
          <p>Cuando se le asignen trabajos aparecerán aquí.</p>
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .empresa-trabajos { display: flex; flex-direction: column; gap: 16px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }

    .header-meta { display: flex; align-items: center; gap: 16px; }
    .cupo-info { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
    .cupo-label { font-size: 11px; color: #6b6b8a; text-transform: uppercase; letter-spacing: .06em; }
    .cupo-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .cupo-val { font-size: 13px; font-weight: 600; color: #1a1a2e; white-space: nowrap; }
    .cupo-bar { width: 100px; }

    .metrics-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .metric-card {
      display: flex; align-items: center; gap: 12px; padding: 14px !important;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    .m-val { display: block; font-size: 24px; font-weight: 600; color: #1a1a2e; }
    .m-val.warn { color: #8a6d2d; }
    .m-val.success { color: #1D9E75; }
    .m-label { display: block; font-size: 11px; color: #6b6b8a; }

    .section-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #1a1a2e;
      padding: 4px 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .warn-icon { color: #E24B4A; }

    /* WORK CARD URGENTE */
    .work-card {
      border-left: 4px solid #e0dfd8 !important;
      cursor: pointer; transition: box-shadow .15s;
    }
    .work-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
    .work-card.urgent { border-left-color: #E24B4A !important; }
    .work-card.completed { border-left-color: #1D9E75 !important; opacity: .85; }

    .work-card-inner {
      display: flex; align-items: center; gap: 14px; padding: 14px;
    }
    .work-urgency {
      width: 36px; height: 36px; border-radius: 50%;
      background: #fce8e8; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #E24B4A; font-size: 20px; }
    }
    .work-info { flex: 1; }
    .work-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .work-id { font-family: monospace; font-size: 11px; font-weight: 600; color: #6b6b8a; }
    .work-time { font-size: 11px; color: #aaa; }
    .work-title { font-size: 14px; font-weight: 500; color: #1a1a2e; margin: 0 0 6px; }
    .work-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .meta-item {
      display: flex; align-items: center; gap: 3px;
      font-size: 12px; color: #6b6b8a;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .work-action { flex-shrink: 0; }

    /* WORK CARD PEQUEÑA */
    .work-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
    .work-card-small {
      padding: 14px !important; cursor: pointer; transition: box-shadow .15s;
    }
    .work-card-small:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
    .wcs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .wcs-title { font-size: 13px; font-weight: 500; color: #1a1a2e; margin: 0 0 6px; }
    .wcs-meta {
      display: flex; align-items: center; gap: 3px;
      font-size: 11px; color: #6b6b8a; margin-bottom: 10px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .wcs-footer { display: flex; justify-content: space-between; align-items: center; }

    /* CHIPS */
    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .estado-PENDIENTE  { background: #FAEEDA; color: #633806; }
    .estado-EN_REVISION{ background: #E6F1FB; color: #0C447C; }
    .estado-ASIGNADA   { background: #eeedfe; color: #3c3489; }
    .estado-EN_PROGRESO{ background: #eeedfe; color: #3c3489; }
    .estado-EJECUTADO  { background: #EAF3DE; color: #27500A; }
    .estado-CERRADO    { background: #f1efea; color: #444; }
    .prioridad-BAJA    { background: #f1efea; color: #666; }
    .prioridad-MEDIA   { background: #E6F1FB; color: #0C447C; }
    .prioridad-ALTA    { background: #FAEEDA; color: #633806; }
    .prioridad-CRITICA { background: #FCEBEB; color: #791F1F; }

    /* EMPTY */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px !important; text-align: center; color: #6b6b8a;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d0cfe8; margin-bottom: 12px; }
      h3 { margin: 0 0 8px; font-size: 16px; }
      p  { margin: 0; font-size: 13px; }
    }

    @media (max-width: 700px) {
      .work-grid { grid-template-columns: 1fr; }
      .metrics-row { grid-template-columns: 1fr; }
    }
  `]
})
export class EmpresaTrabajosComponent implements OnInit {
  auth = inject(AuthService);

  capacidadMax = 15;

  // Simulamos que la empresa es "Constructora Lima" (id: '1')
  todosLosTabajos = signal<Reporte[]>([]);

  trabajosAsignados = computed(() =>
    this.todosLosTabajos().filter(r =>
      ['ASIGNADA','EN_REVISION','EN_PROGRESO','EJECUTADO'].includes(r.estado)
    )
  );

  urgentes = computed(() =>
    this.todosLosTabajos().filter(r =>
      r.prioridad === 'CRITICA' &&
      ['ASIGNADA','EN_REVISION','EN_PROGRESO'].includes(r.estado)
    )
  );

  enEjecucion = computed(() =>
    this.todosLosTabajos().filter(r => r.estado === 'EN_PROGRESO')
  );

  pendientesIniciar = computed(() =>
    this.todosLosTabajos().filter(r =>
      ['ASIGNADA','EN_REVISION'].includes(r.estado) && r.prioridad !== 'CRITICA'
    )
  );

  completados = computed(() =>
    this.todosLosTabajos().filter(r => r.estado === 'EJECUTADO')
  );

  trabajosHoy = computed(() => this.trabajosAsignados().length);

  ngOnInit() {
    // Filtrar reportes asignados a la empresa 1 (Constructora Lima)
    const misTrabajos = MOCK_REPORTES.filter(r =>
      r.empresaId === '1' ||
      ['EN_PROGRESO','ASIGNADA','EN_REVISION','EJECUTADO'].includes(r.estado)
    );
    this.todosLosTabajos.set(misTrabajos);
  }

  getLabelEstado(estado: string) {
    const map: Record<string,string> = {
      PENDIENTE:'Pendiente', EN_REVISION:'En revisión', ASIGNADA:'Asignada',
      EN_PROGRESO:'En progreso', EJECUTADO:'Ejecutado', CERRADO:'Cerrado'
    };
    return map[estado] ?? estado;
  }

  getLabelCategoria(cat: string) {
    const map: Record<string,string> = {
      VIALIDAD:'Vialidad', ALUMBRADO:'Alumbrado', AGUA_POTABLE:'Agua potable',
      ALCANTARILLADO:'Alcantarillado', OTRO:'Otro'
    };
    return map[cat] ?? cat;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 60)   return 'Hace ' + diff + ' min';
    if (diff < 1440) return 'Hace ' + Math.floor(diff / 60) + 'h';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  getZona(direccion?: string): string {
    if (!direccion) return 'Sin dirección';
    const parts = direccion.split(',');
    return parts[0] ?? 'Sin dirección';
  }

}