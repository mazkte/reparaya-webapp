// src/app/features/reports/report-detail.component.ts
import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { switchMap } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { EmpresaService } from '../../core/services/empresa.service';
import { AuthService } from '../../core/auth/auth.service';
import { Reporte, EmpresaServicio, EstadoReporteEnum } from '../../shared/models';

@Component({
  selector: 'app-report-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatChipsModule, MatDialogModule
  ],
  template: `
    <div class="detail-page">

      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <a routerLink="/reportes" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Volver a reportes
        </a>
      </div>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40"/>
        </div>
      } @else if (reporte()) {

        <div class="detail-header">
          <div>
            <div class="report-meta">
              <span class="report-id">#{{ reporte()!.id }}</span>
              <span class="chip" [ngClass]="'cat-' + reporte()!.categoria">
                {{ getLabelCategoria(reporte()!.categoria) }}
              </span>
              <span class="chip" [ngClass]="'prioridad-' + reporte()!.prioridad">
                {{ reporte()!.prioridad }}
              </span>
            </div>
            <h1>{{ reporte()!.titulo }}</h1>
            <p class="report-date">
              <mat-icon class="meta-icon">schedule</mat-icon>
              Creado {{ formatDate(reporte()!.fechaCreacion) }}
              &nbsp;·&nbsp;
              <mat-icon class="meta-icon">phone</mat-icon>
              {{ reporte()!.ciudadanoPhone }}
            </p>
          </div>
          <span class="estado-badge" [ngClass]="'estado-' + reporte()!.estado">
            {{ getLabelEstado(reporte()!.estado) }}
          </span>
        </div>

        <!-- BARRA DE PROGRESO DE ESTADOS -->
        <div class="estado-steps">
          @for (step of estadoSteps; track step.estado) {
            <div class="step" [class.done]="isStepDone(step.estado)" [class.active]="reporte()!.estado === step.estado">
              <div class="step-dot">
                @if (isStepDone(step.estado)) {
                  <mat-icon class="step-check">check</mat-icon>
                } @else {
                  <span class="step-num">{{ $index + 1 }}</span>
                }
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
            @if (!$last) { <div class="step-line" [class.done]="isStepDone(step.estado)"></div> }
          }
        </div>

        <div class="detail-grid">

          <!-- COLUMNA IZQUIERDA -->
          <div class="col-left">

            <!-- Datos del reporte -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Datos del reporte</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="field-grid">
                  <div class="field">
                    <label>Categoría</label>
                    <span>{{ getLabelCategoria(reporte()!.categoria) }}</span>
                  </div>
                  <div class="field">
                    <label>Estado actual</label>
                    <span class="chip" [ngClass]="'estado-' + reporte()!.estado">
                      {{ getLabelEstado(reporte()!.estado) }}
                    </span>
                  </div>
                  <div class="field">
                    <label>Empresa asignada</label>
                    <span>{{ reporte()!.empresaNombre ?? '—' }}</span>
                  </div>
                  <div class="field">
                    <label>Última actualización</label>
                    <span>{{ formatDate(reporte()!.fechaActualizacion) }}</span>
                  </div>
                </div>

                <mat-divider style="margin: 16px 0"/>

                <div class="field full">
                  <label>Descripción del ciudadano</label>
                  <p class="descripcion">{{ reporte()!.descripcion }}</p>
                </div>

                <div class="field full" style="margin-top:12px">
                  <label>Ubicación</label>
                  <p class="descripcion">
                    <mat-icon class="loc-icon">location_on</mat-icon>
                    {{ reporte()!.ubicacion.direccion ?? 'Sin dirección registrada' }}
                  </p>
                </div>

                <!-- Foto ciudadano -->
                @if (reporte()!.mediaUrls.length > 0) {
                  <div class="field full" style="margin-top:12px">
                    <label>Foto adjunta por el ciudadano</label>
                    <div class="photo-grid">
                      @for (url of reporte()!.mediaUrls; track url) {
                        <img [src]="url" class="photo-thumb" alt="Foto del reporte">
                      }
                    </div>
                  </div>
                } @else {
                  <div class="photo-placeholder">
                    <mat-icon>photo_camera</mat-icon>
                    <span>Sin foto adjunta</span>
                  </div>
                }
              </mat-card-content>
            </mat-card>

            <!-- MAPA -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Ubicación en el mapa</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div id="detail-map" class="map-container"></div>
              </mat-card-content>
            </mat-card>

            <!-- ASIGNACIÓN DE EMPRESA (solo autoridad) -->
            @if (auth.isAutoridad() || auth.isAdmin()) {
              <mat-card class="assign-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>business</mat-icon>
                    Asignar empresa de servicios
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  @if (empresasDisponibles().length === 0) {
                    <p class="no-empresas">No hay empresas disponibles para la categoría
                      <strong>{{ getLabelCategoria(reporte()!.categoria) }}</strong>
                      en este momento.</p>
                  } @else {
                    <mat-form-field appearance="outline" style="width:100%">
                      <mat-label>Seleccionar empresa</mat-label>
                      <mat-select [formControl]="empresaCtrl">
                        <mat-option value="">— Seleccionar —</mat-option>
                        @for (e of empresasDisponibles(); track e.id) {
                          <mat-option [value]="e.id">
                            {{ e.nombre }} &nbsp;·&nbsp;
                            {{ e.trabajosHoy }}/{{ e.capacidadDiariaMax }} trabajos hoy
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <div class="assign-actions">
                      <button mat-flat-button color="primary"
                              [disabled]="!empresaCtrl.value || assigning()"
                              (click)="asignarEmpresa()">
                        @if (assigning()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                        @else { <mat-icon>assignment_turned_in</mat-icon> }
                        Asignar empresa
                      </button>
                      <button mat-stroked-button color="warn" (click)="escalarPrioridad()">
                        <mat-icon>priority_high</mat-icon>
                        Escalar prioridad
                      </button>
                    </div>
                  }
                </mat-card-content>
              </mat-card>
            }

          </div>

          <!-- COLUMNA DERECHA -->
          <div class="col-right">

            <!-- HISTORIAL DE ESTADOS -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Historial de estados</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="timeline">
                  @for (ev of reporte()!.historialEstados; track ev.timestamp) {
                    <div class="tl-item">
                      <div class="tl-dot" [class.done]="true"></div>
                      <div class="tl-content">
                        <div class="tl-estado">
                          <span class="chip chip-sm" [ngClass]="'estado-' + ev.estado">
                            {{ getLabelEstado(ev.estado) }}
                          </span>
                        </div>
                        @if (ev.observacion) {
                          <p class="tl-obs">{{ ev.observacion }}</p>
                        }
                        <div class="tl-meta">
                          <span class="tl-actor">{{ ev.actor }}</span>
                          <span class="tl-time">{{ formatDate(ev.timestamp) }}</span>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Pasos pendientes -->
                  @for (step of estadosPendientes(); track step.estado) {
                    <div class="tl-item pending">
                      <div class="tl-dot pending-dot"></div>
                      <div class="tl-content">
                        <span class="tl-pending">{{ step.label }}</span>
                      </div>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- EVIDENCIA EMPRESA -->
            @if (reporte()!.mediaEvidenciaUrls.length > 0) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Evidencia de ejecución</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="photo-grid">
                    @for (url of reporte()!.mediaEvidenciaUrls; track url) {
                      <img [src]="url" class="photo-thumb" alt="Evidencia del trabajo">
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            }

            <!-- ACCIÓN DE CIERRE (supervisor) -->
            @if (auth.isSupervisor() && reporte()!.estado === 'EJECUTADO') {
              <mat-card class="close-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>fact_check</mat-icon>
                    Validar y cerrar reporte
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-form-field appearance="outline" style="width:100%">
                    <mat-label>Observaciones del supervisor</mat-label>
                    <textarea matInput [formControl]="obsCtrl" rows="3"
                      placeholder="Trabajo conforme, sin observaciones..."></textarea>
                  </mat-form-field>
                  <div class="assign-actions">
                    <button mat-flat-button color="primary" (click)="cerrarReporte()">
                      <mat-icon>check_circle</mat-icon>
                      Cerrar reporte
                    </button>
                    <button mat-stroked-button color="warn" (click)="rechazarEjecucion()">
                      <mat-icon>cancel</mat-icon>
                      Devolver a empresa
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page { display: flex; flex-direction: column; gap: 16px; }
    .breadcrumb { margin-bottom: 4px; }
    .back-link {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 13px; color: #6b6b8a; text-decoration: none;
      transition: color .15s;
    }
    .back-link:hover { color: #2d4a8a; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .detail-header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
    }
    .report-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .report-id { font-family: monospace; font-size: 13px; font-weight: 600; color: #6b6b8a; }
    h1 { font-size: 22px; font-weight: 600; color: #1a1a2e; margin: 0 0 6px; }
    .report-date {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #6b6b8a; margin: 0;
    }
    .meta-icon { font-size: 14px; width: 14px; height: 14px; }
    .estado-badge {
      display: inline-block; font-size: 12px; font-weight: 600;
      padding: 6px 14px; border-radius: 999px; white-space: nowrap; flex-shrink: 0;
    }

    /* BARRA DE ESTADOS */
    .estado-steps {
      display: flex; align-items: center;
      background: white; border: 1px solid #e0dfd8; border-radius: 10px;
      padding: 16px 20px;
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #e8e6e0; display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .step.done .step-dot { background: #1D9E75; }
    .step.active .step-dot { background: #2d4a8a; }
    .step-check { font-size: 16px; color: white; }
    .step-num { font-size: 11px; font-weight: 600; color: #aaa; }
    .step.done .step-num, .step.active .step-num { color: white; }
    .step-label { font-size: 10px; color: #aaa; text-align: center; white-space: nowrap; font-weight: 500; }
    .step.done .step-label { color: #1D9E75; }
    .step.active .step-label { color: #2d4a8a; }
    .step-line { flex: 1; height: 2px; background: #e8e6e0; margin: 0 4px; margin-bottom: 20px; }
    .step-line.done { background: #1D9E75; }

    /* GRID */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .col-left, .col-right { display: flex; flex-direction: column; gap: 16px; }

    /* CAMPOS */
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 3px; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .08em; }
    .field span, .field p { font-size: 13px; color: #1a1a2e; margin: 0; }
    .descripcion { font-size: 13px; color: #444; line-height: 1.6; margin: 0; display: flex; align-items: flex-start; gap: 4px; }
    .loc-icon { font-size: 14px; width: 14px; height: 14px; color: #6b6b8a; flex-shrink: 0; margin-top: 2px; }

    /* FOTOS */
    .photo-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .photo-thumb { width: 100%; max-height: 180px; object-fit: cover; border-radius: 6px; border: 1px solid #e0dfd8; }
    .photo-placeholder {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 24px; background: #f9f8f5; border-radius: 8px; border: 1px dashed #d0cfe8;
      color: #aaa; font-size: 12px; margin-top: 8px;
    }
    .photo-placeholder mat-icon { font-size: 32px; width: 32px; height: 32px; }

    /* MAPA */
    .map-container {
      height: 200px; background: #eef1f9; border-radius: 8px;
      position: relative; overflow: hidden;
    }

    /* TIMELINE */
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .tl-item { display: flex; gap: 12px; padding: 10px 0; position: relative; }
    .tl-item:not(:last-child)::after {
      content: ''; position: absolute; left: 11px; top: 36px;
      width: 2px; height: calc(100% - 16px); background: #e8e6e0;
    }
    .tl-dot {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      background: #1D9E75; margin-top: 2px;
      display: flex; align-items: center; justify-content: center; z-index: 1;
    }
    .tl-dot.done { background: #1D9E75; }
    .pending-dot { background: #e8e6e0; }
    .tl-content { flex: 1; }
    .tl-estado { margin-bottom: 4px; }
    .tl-obs { font-size: 12px; color: #444; margin: 4px 0; }
    .tl-meta { display: flex; justify-content: space-between; margin-top: 4px; }
    .tl-actor { font-size: 10px; color: #6b6b8a; }
    .tl-time { font-size: 10px; color: #aaa; }
    .tl-pending { font-size: 12px; color: #aaa; font-style: italic; }

    /* CHIPS */
    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .chip-sm { font-size: 9px; padding: 2px 6px; }
    .cat-VIALIDAD      { background: #eeedfe; color: #3c3489; }
    .cat-ALUMBRADO     { background: #fff8e8; color: #7a5c00; }
    .cat-AGUA_POTABLE  { background: #eef1f9; color: #2d4a8a; }
    .cat-ALCANTARILLADO{ background: #fce8e8; color: #791f1f; }
    .cat-OTRO          { background: #f1efea; color: #555; }
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

    /* ASIGNACIÓN */
    .assign-card mat-card-title { display: flex; align-items: center; gap: 6px; }
    .assign-actions { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
    .no-empresas { font-size: 13px; color: #6b6b8a; }

    /* CIERRE */
    .close-card { border: 1px solid #1D9E75 !important; }
    .close-card mat-card-title { display: flex; align-items: center; gap: 6px; color: #1D9E75; }

    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportDetailComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private reporteService  = inject(ReporteService);
  private empresaService  = inject(EmpresaService);
  private snack   = inject(MatSnackBar);
  auth            = inject(AuthService);

  reporte             = signal<Reporte | null>(null);
  empresasDisponibles = signal<EmpresaServicio[]>([]);
  loading             = signal(true);
  assigning           = signal(false);

  empresaCtrl = new FormControl('');
  obsCtrl     = new FormControl('');

  estadoSteps = [
    { estado: 'PENDIENTE' as EstadoReporteEnum,   label: 'Pendiente' },
    { estado: 'EN_REVISION' as EstadoReporteEnum, label: 'En revisión' },
    { estado: 'ASIGNADA' as EstadoReporteEnum,    label: 'Asignada' },
    { estado: 'EN_PROGRESO' as EstadoReporteEnum, label: 'En progreso' },
    { estado: 'EJECUTADO' as EstadoReporteEnum,   label: 'Ejecutado' },
    { estado: 'CERRADO' as EstadoReporteEnum,     label: 'Cerrado' }
  ];

  estadosOrden: EstadoReporteEnum[] = ['PENDIENTE','EN_REVISION','ASIGNADA','EN_PROGRESO','EJECUTADO','CERRADO'];

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id')!;
        return this.reporteService.getReporte(id);
      })
    ).subscribe(r => {
      this.reporte.set(r);
      this.loading.set(false);
      this.loadEmpresas(r);
      setTimeout(() => this.initMap(r), 300);
    });
  }

  loadEmpresas(r: Reporte) {
    if (!r.empresaId) {
      this.empresaService.getEmpresasDisponibles(r.categoria).subscribe(list => {
        this.empresasDisponibles.set(list);
      });
    }
  }

  isStepDone(estado: EstadoReporteEnum): boolean {
    const r = this.reporte();
    if (!r) return false;
    const idx = this.estadosOrden.indexOf(r.estado);
    const stepIdx = this.estadosOrden.indexOf(estado);
    return stepIdx < idx;
  }

  estadosPendientes() {
    const r = this.reporte();
    if (!r) return [];
    const idx = this.estadosOrden.indexOf(r.estado);
    return this.estadoSteps.filter((_, i) => i > idx);
  }

  asignarEmpresa() {
    const r = this.reporte();
    if (!r || !this.empresaCtrl.value) return;
    this.assigning.set(true);
    this.reporteService.asignarEmpresa(r.id, this.empresaCtrl.value).subscribe({
      next: updated => {
        this.reporte.set(updated);
        this.assigning.set(false);
        this.snack.open('Empresa asignada correctamente', 'OK', { duration: 3000 });
      },
      error: () => { this.assigning.set(false); this.snack.open('Error al asignar empresa', 'OK', { duration: 3000 }); }
    });
  }

  escalarPrioridad() {
    const r = this.reporte();
    if (!r) return;
    this.reporteService.actualizarEstado(r.id, r.estado, 'Prioridad escalada manualmente').subscribe(updated => {
      this.reporte.set({ ...updated, prioridad: 'CRITICA' });
      this.snack.open('Prioridad escalada a CRÍTICA', 'OK', { duration: 3000 });
    });
  }

  cerrarReporte() {
    const r = this.reporte();
    if (!r) return;
    this.reporteService.actualizarEstado(r.id, 'CERRADO', this.obsCtrl.value || 'Trabajo validado por supervisor').subscribe(updated => {
      this.reporte.set(updated);
      this.snack.open('Reporte cerrado correctamente', 'OK', { duration: 3000 });
      setTimeout(() => this.router.navigate(['/reportes']), 1500);
    });
  }

  rechazarEjecucion() {
    const r = this.reporte();
    if (!r) return;
    this.reporteService.actualizarEstado(r.id, 'EN_PROGRESO', 'Devuelto a empresa para corrección').subscribe(updated => {
      this.reporte.set(updated);
      this.snack.open('Trabajo devuelto a la empresa', 'OK', { duration: 3000 });
    });
  }

  private initMap(r: Reporte) {
    const el = document.getElementById('detail-map');
    if (!el) return;
    const L = (window as any).L;
    if (L) {
      const map = L.map(el).setView([r.ubicacion.latitud, r.ubicacion.longitud], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([r.ubicacion.latitud, r.ubicacion.longitud])
        .bindPopup(`<b>#${r.id}</b><br>${r.titulo}`).addTo(map).openPopup();
    } else {
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#eef1f9;color:#6b6b8a;font-size:12px;flex-direction:column;gap:6px">
        <span style="font-size:24px">📍</span>
        <span>${r.ubicacion.direccion ?? 'Ubicación registrada'}</span>
        <small>Lat: ${r.ubicacion.latitud} · Lng: ${r.ubicacion.longitud}</small>
      </div>`;
    }
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
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
