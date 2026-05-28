// src/app/features/supervisor/supervisor-pending.component.ts
import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reporte } from '../../shared/models';
import { MOCK_REPORTES } from '../../core/services/mock-data';

@Component({
  selector: 'app-supervisor-pending',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatTooltipModule
  ],
  template: `
    <div class="supervisor-pending">

      <div class="page-header">
        <div>
          <h1>Trabajos por validar</h1>
          <p>{{ pendientes().length }} trabajos esperan tu validación en campo</p>
        </div>
      </div>

      <!-- ALERTA -->
      @if (pendientes().length > 0) {
        <div class="alert-banner">
          <mat-icon>info</mat-icon>
          Debes verificar el trabajo en campo antes de cerrar el reporte.
          El cierre notifica automáticamente al ciudadano por WhatsApp.
        </div>
      }

      <!-- LISTA DE PENDIENTES -->
      @for (r of pendientes(); track r.id) {
        <mat-card class="work-card" [routerLink]="['/supervisor/validar', r.id]">
          <div class="card-inner">

            <!-- ICONO ESTADO -->
            <div class="status-icon">
              <mat-icon>pending_actions</mat-icon>
            </div>

            <!-- INFO -->
            <div class="work-info">
              <div class="work-header">
                <span class="work-id">#{{ r.id }}</span>
                <span class="chip" [ngClass]="'cat-' + r.categoria">
                  {{ getLabelCategoria(r.categoria) }}
                </span>
                <span class="chip" [ngClass]="'prioridad-' + r.prioridad">
                  {{ r.prioridad }}
                </span>
              </div>
              <h3 class="work-title">{{ r.titulo }}</h3>

              <div class="work-meta">
                <span class="meta-item">
                  <mat-icon>business</mat-icon>
                  {{ r.empresaNombre ?? 'Empresa sin nombre' }}
                </span>
                <span class="meta-item">
                  <mat-icon>location_on</mat-icon>
                  {{ getZona(r.ubicacion.direccion) }}
                </span>
                <span class="meta-item">
                  <mat-icon>schedule</mat-icon>
                  Ejecutado {{ formatDate(r.fechaActualizacion) }}
                </span>
              </div>

              <!-- EVIDENCIA PREVIEW -->
              @if (r.mediaEvidenciaUrls.length > 0) {
                <div class="evidencia-preview">
                  <mat-icon class="ev-icon">photo_camera</mat-icon>
                  <span>{{ r.mediaEvidenciaUrls.length }} foto(s) de evidencia adjuntas</span>
                </div>
              } @else {
                <div class="evidencia-preview sin-foto">
                  <mat-icon class="ev-icon">no_photography</mat-icon>
                  <span>Sin foto de evidencia</span>
                </div>
              }
            </div>

            <!-- ACCIÓN -->
            <div class="work-action">
              <button mat-flat-button color="primary"
                      [routerLink]="['/supervisor/validar', r.id]"
                      (click)="$event.stopPropagation()">
                <mat-icon>fact_check</mat-icon>
                Validar
              </button>
            </div>
          </div>
        </mat-card>
      }

      <!-- ESTADO VACÍO -->
      @if (pendientes().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>verified</mat-icon>
          <h3>Todo validado</h3>
          <p>No hay trabajos pendientes de validación en este momento.</p>
        </mat-card>
      }

      <!-- HISTORIAL RECIENTE -->
      @if (validadosRecientes().length > 0) {
        <mat-divider style="margin: 8px 0"/>
        <div class="section-title">
          <mat-icon>history</mat-icon>
          Validados recientemente
        </div>
        @for (r of validadosRecientes(); track r.id) {
          <mat-card class="work-card closed" [routerLink]="['/supervisor/validar', r.id]">
            <div class="card-inner">
              <div class="status-icon closed-icon">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="work-info">
                <div class="work-header">
                  <span class="work-id">#{{ r.id }}</span>
                  <span class="chip estado-CERRADO">Cerrado</span>
                </div>
                <h3 class="work-title">{{ r.titulo }}</h3>
                <div class="work-meta">
                  <span class="meta-item">
                    <mat-icon>business</mat-icon>
                    {{ r.empresaNombre ?? '—' }}
                  </span>
                  <span class="meta-item">
                    <mat-icon>schedule</mat-icon>
                    {{ formatDate(r.fechaActualizacion) }}
                  </span>
                </div>
              </div>
              <button mat-icon-button [routerLink]="['/supervisor/validar', r.id]">
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </mat-card>
        }
      }

    </div>
  `,
  styles: [`
    .supervisor-pending { display: flex; flex-direction: column; gap: 14px; }
    .page-header { h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; } p { font-size: 13px; color: #6b6b8a; margin: 0; } }

    .alert-banner {
      display: flex; align-items: center; gap: 10px;
      background: #eef1f9; border: 1px solid #c8d5ee; border-radius: 8px;
      padding: 12px 16px; font-size: 13px; color: #2d4a8a;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    .work-card { cursor: pointer; transition: box-shadow .15s; border-left: 4px solid #EF9F27 !important; }
    .work-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
    .work-card.closed { border-left-color: #1D9E75 !important; opacity: .8; }

    .card-inner { display: flex; align-items: center; gap: 14px; padding: 16px; }

    .status-icon {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: #fff8e8; display: flex; align-items: center; justify-content: center;
      mat-icon { color: #EF9F27; font-size: 22px; }
    }
    .closed-icon { background: #eaf4ef; mat-icon { color: #1D9E75; } }

    .work-info { flex: 1; }
    .work-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .work-id { font-family: monospace; font-size: 11px; font-weight: 600; color: #6b6b8a; }
    .work-title { font-size: 14px; font-weight: 500; color: #1a1a2e; margin: 0 0 8px; }
    .work-meta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .meta-item { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #6b6b8a; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    .work-action { flex-shrink: 0; }

    .evidencia-preview {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; color: #2d8a6a; background: #eaf4ef;
      padding: 3px 10px; border-radius: 4px;
    }
    .evidencia-preview.sin-foto { color: #aaa; background: #f5f4f0; }
    .ev-icon { font-size: 14px; width: 14px; height: 14px; }

    .section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #6b6b8a; mat-icon { font-size: 18px; width: 18px; height: 18px; } }

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px !important; text-align: center; color: #6b6b8a;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1D9E75; margin-bottom: 12px; }
      h3 { margin: 0 0 6px; }
      p  { margin: 0; font-size: 13px; }
    }

    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .cat-VIALIDAD      { background: #eeedfe; color: #3c3489; }
    .cat-ALUMBRADO     { background: #fff8e8; color: #7a5c00; }
    .cat-AGUA_POTABLE  { background: #eef1f9; color: #2d4a8a; }
    .cat-ALCANTARILLADO{ background: #fce8e8; color: #791f1f; }
    .cat-OTRO          { background: #f1efea; color: #555; }
    .prioridad-BAJA    { background: #f1efea; color: #666; }
    .prioridad-MEDIA   { background: #E6F1FB; color: #0C447C; }
    .prioridad-ALTA    { background: #FAEEDA; color: #633806; }
    .prioridad-CRITICA { background: #FCEBEB; color: #791F1F; }
    .estado-CERRADO    { background: #f1efea; color: #444; }
    .estado-EJECUTADO  { background: #EAF3DE; color: #27500A; }
  `]
})
export class SupervisorPendingComponent implements OnInit {

  pendientes       = signal<Reporte[]>([]);
  validadosRecientes = signal<Reporte[]>([]);

  ngOnInit() {
    this.pendientes.set(MOCK_REPORTES.filter(r => r.estado === 'EJECUTADO'));
    this.validadosRecientes.set(MOCK_REPORTES.filter(r => r.estado === 'CERRADO'));
  }

  getLabelCategoria(cat: string) {
    const map: Record<string,string> = { VIALIDAD:'Vialidad', ALUMBRADO:'Alumbrado', AGUA_POTABLE:'Agua potable', ALCANTARILLADO:'Alcantarillado', OTRO:'Otro' };
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