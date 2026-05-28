// src/app/features/empresa/empresa-detalle.component.ts
import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { switchMap } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { Reporte, EstadoReporteEnum } from '../../shared/models';

@Component({
  selector: 'app-empresa-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatDividerModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatStepperModule
  ],
  template: `
    <div class="empresa-detalle">

      <div class="breadcrumb">
        <a routerLink="/empresa/trabajos" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Volver a mis trabajos
        </a>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"/></div>
      } @else if (reporte()) {

        <!-- CABECERA -->
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
            <p class="report-loc">
              <mat-icon class="loc-icon">location_on</mat-icon>
              {{ reporte()!.ubicacion.direccion ?? 'Sin dirección' }}
            </p>
          </div>
          <span class="estado-badge" [ngClass]="'estado-' + reporte()!.estado">
            {{ getLabelEstado(reporte()!.estado) }}
          </span>
        </div>

        <!-- BARRA DE PROGRESO -->
        <div class="estado-steps">
          @for (step of estadoSteps; track step.estado; let i = $index) {
            <div class="step" [class.done]="isStepDone(step.estado)" [class.active]="reporte()!.estado === step.estado">
              <div class="step-dot">
                @if (isStepDone(step.estado)) {
                  <mat-icon class="step-check">check</mat-icon>
                } @else {
                  <span class="step-num">{{ i + 1 }}</span>
                }
              </div>
              <span class="step-label">{{ step.label }}</span>
            </div>
            @if (i < estadoSteps.length - 1) {
              <div class="step-line" [class.done]="isStepDone(step.estado)"></div>
            }
          }
        </div>

        <div class="detail-grid">

          <!-- COLUMNA IZQUIERDA -->
          <div class="col-left">

            <!-- Descripción del ciudadano -->
            <mat-card>
              <mat-card-header>
                <mat-card-title>Datos del trabajo</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="field-grid">
                  <div class="field">
                    <label>Categoría</label>
                    <span>{{ getLabelCategoria(reporte()!.categoria) }}</span>
                  </div>
                  <div class="field">
                    <label>Prioridad</label>
                    <span class="chip" [ngClass]="'prioridad-' + reporte()!.prioridad">
                      {{ reporte()!.prioridad }}
                    </span>
                  </div>
                  <div class="field">
                    <label>Fecha de asignación</label>
                    <span>{{ formatDate(reporte()!.fechaActualizacion) }}</span>
                  </div>
                  <div class="field">
                    <label>Ciudadano</label>
                    <span>{{ reporte()!.ciudadanoPhone }}</span>
                  </div>
                </div>

                <mat-divider style="margin: 14px 0"/>

                <div class="field">
                  <label>Descripción del ciudadano</label>
                  <p class="desc">{{ reporte()!.descripcion }}</p>
                </div>

                <!-- Foto ciudadano -->
                <div class="field" style="margin-top: 14px">
                  <label>Foto adjunta (ciudadano)</label>
                  @if (reporte()!.mediaUrls.length > 0) {
                    <img [src]="reporte()!.mediaUrls[0]" class="photo" alt="Foto del problema">
                  } @else {
                    <div class="photo-empty">
                      <mat-icon>photo_camera_back</mat-icon>
                      <span>Sin foto del ciudadano</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- MAPA -->
            <mat-card>
              <mat-card-header><mat-card-title>Ubicación</mat-card-title></mat-card-header>
              <mat-card-content>
                <div id="empresa-map" class="map-container"></div>
                <button mat-stroked-button style="width:100%;margin-top:10px">
                  <mat-icon>open_in_new</mat-icon>
                  Abrir en Google Maps
                </button>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- COLUMNA DERECHA -->
          <div class="col-right">

            <!-- ACCIONES SEGÚN ESTADO -->
            @if (reporte()!.estado === 'ASIGNADA' || reporte()!.estado === 'EN_REVISION') {
              <mat-card class="action-card start">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>play_circle</mat-icon>
                    Iniciar trabajo
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="action-desc">Confirma que has llegado al lugar y vas a comenzar la reparación.</p>
                  <button mat-flat-button color="primary" style="width:100%"
                          (click)="iniciarTrabajo()" [disabled]="saving()">
                    @if (saving()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                    @else { <mat-icon>engineering</mat-icon> }
                    Marcar como en ejecución
                  </button>
                </mat-card-content>
              </mat-card>
            }

            @if (reporte()!.estado === 'EN_PROGRESO') {
              <mat-card class="action-card complete">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>task_alt</mat-icon>
                    Marcar como ejecutado
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="upload-zone" (click)="triggerUpload()">
                    @if (evidenciaPreview()) {
                      <img [src]="evidenciaPreview()!" class="evidence-preview" alt="Evidencia">
                    } @else {
                      <mat-icon>add_a_photo</mat-icon>
                      <span>Subir foto de evidencia</span>
                      <small>Foto del trabajo realizado (obligatorio)</small>
                    }
                  </div>
                  <input type="file" #fileInput accept="image/*"
                         style="display:none" (change)="onFileSelected($event)">

                  <mat-form-field appearance="outline" style="width:100%;margin-top:12px">
                    <mat-label>Observaciones técnicas</mat-label>
                    <textarea matInput [formControl]="obsCtrl" rows="3"
                      placeholder="Materiales utilizados, tiempo empleado, observaciones...">
                    </textarea>
                  </mat-form-field>

                  <button mat-flat-button color="accent" style="width:100%"
                          (click)="marcarEjecutado()" [disabled]="saving()">
                    @if (saving()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                    @else { <mat-icon>check_circle</mat-icon> }
                    Marcar como ejecutado
                  </button>
                </mat-card-content>
              </mat-card>
            }

            @if (reporte()!.estado === 'EJECUTADO') {
              <mat-card class="action-card done">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>verified</mat-icon>
                    Trabajo ejecutado
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="action-desc">El trabajo ha sido marcado como ejecutado. Está pendiente de validación por el supervisor municipal.</p>
                  @if (reporte()!.mediaEvidenciaUrls.length > 0) {
                    <img [src]="reporte()!.mediaEvidenciaUrls[0]" class="photo" alt="Evidencia">
                  }
                </mat-card-content>
              </mat-card>
            }

            <!-- HISTORIAL -->
            <mat-card>
              <mat-card-header><mat-card-title>Historial</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="timeline">
                  @for (ev of reporte()!.historialEstados; track ev.timestamp) {
                    <div class="tl-item">
                      <div class="tl-dot"></div>
                      <div class="tl-content">
                        <span class="chip chip-sm" [ngClass]="'estado-' + ev.estado">
                          {{ getLabelEstado(ev.estado) }}
                        </span>
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
                </div>
              </mat-card-content>
            </mat-card>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .empresa-detalle { display: flex; flex-direction: column; gap: 16px; }
    .breadcrumb { margin-bottom: 4px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #6b6b8a; text-decoration: none; }
    .back-link:hover { color: #2d4a8a; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .report-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .report-id { font-family: monospace; font-size: 13px; font-weight: 600; color: #6b6b8a; }
    h1 { font-size: 20px; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; }
    .report-loc { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #6b6b8a; margin: 0; }
    .loc-icon { font-size: 14px; width: 14px; height: 14px; }
    .estado-badge { display: inline-block; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }

    /* ESTADO STEPS */
    .estado-steps { display: flex; align-items: center; background: white; border: 1px solid #e0dfd8; border-radius: 10px; padding: 14px 20px; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 5px; flex-shrink: 0; }
    .step-dot { width: 26px; height: 26px; border-radius: 50%; background: #e8e6e0; display: flex; align-items: center; justify-content: center; }
    .step.done .step-dot { background: #1D9E75; }
    .step.active .step-dot { background: #2d4a8a; }
    .step-check { font-size: 15px; color: white; }
    .step-num { font-size: 11px; font-weight: 600; color: #aaa; }
    .step.done .step-num, .step.active .step-num { color: white; }
    .step-label { font-size: 10px; color: #aaa; text-align: center; white-space: nowrap; font-weight: 500; }
    .step.done .step-label { color: #1D9E75; }
    .step.active .step-label { color: #2d4a8a; }
    .step-line { flex: 1; height: 2px; background: #e8e6e0; margin: 0 4px; margin-bottom: 18px; }
    .step-line.done { background: #1D9E75; }

    /* GRID */
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .col-left, .col-right { display: flex; flex-direction: column; gap: 16px; }

    /* CAMPOS */
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { display: flex; flex-direction: column; gap: 3px; }
    .field label { font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .08em; }
    .field span { font-size: 13px; color: #1a1a2e; }
    .desc { font-size: 13px; color: #444; line-height: 1.6; margin: 0; }
    .photo { width: 100%; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #e0dfd8; margin-top: 6px; }
    .photo-empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 20px; background: #f9f8f5; border-radius: 8px; border: 1px dashed #d0cfe8; color: #aaa; font-size: 12px; margin-top: 6px; }
    .photo-empty mat-icon { font-size: 28px; width: 28px; height: 28px; }

    /* MAPA */
    .map-container { height: 180px; background: #eef1f9; border-radius: 8px; position: relative; overflow: hidden; }

    /* ACCIONES */
    .action-card mat-card-title { display: flex; align-items: center; gap: 6px; }
    .action-card.start mat-card-title { color: #2d4a8a; }
    .action-card.complete mat-card-title { color: #8a6d2d; }
    .action-card.done { border: 1px solid #1D9E75 !important; }
    .action-card.done mat-card-title { color: #1D9E75; }
    .action-desc { font-size: 13px; color: #6b6b8a; margin: 0 0 14px; }

    .upload-zone {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 24px; background: #f9f8f5; border: 2px dashed #d0cfe8;
      border-radius: 8px; cursor: pointer; transition: all .15s; margin-bottom: 2px;
      color: #6b6b8a; font-size: 13px;
      mat-icon { font-size: 32px; width: 32px; height: 32px; color: #d0cfe8; }
      small { font-size: 11px; color: #aaa; }
    }
    .upload-zone:hover { border-color: #2d4a8a; background: #eef1f9; }
    .evidence-preview { width: 100%; max-height: 160px; object-fit: cover; border-radius: 6px; }

    /* TIMELINE */
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .tl-item { display: flex; gap: 12px; padding: 8px 0; position: relative; }
    .tl-item:not(:last-child)::after { content: ''; position: absolute; left: 10px; top: 32px; width: 2px; height: calc(100% - 12px); background: #e8e6e0; }
    .tl-dot { width: 22px; height: 22px; border-radius: 50%; background: #1D9E75; flex-shrink: 0; margin-top: 2px; z-index: 1; }
    .tl-content { flex: 1; }
    .chip-sm { font-size: 9px; padding: 2px 6px; }
    .tl-obs { font-size: 12px; color: #444; margin: 4px 0; }
    .tl-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .tl-actor { font-size: 10px; color: #6b6b8a; }
    .tl-time  { font-size: 10px; color: #aaa; }

    /* CHIPS */
    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
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

    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
  `]
})
export class EmpresaDetalleComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private reporteService = inject(ReporteService);
  private snack  = inject(MatSnackBar);

  reporte  = signal<Reporte | null>(null);
  loading  = signal(true);
  saving   = signal(false);
  evidenciaPreview = signal<string | null>(null);

  obsCtrl = new FormControl('');

  estadoSteps = [
    { estado: 'ASIGNADA' as EstadoReporteEnum,    label: 'Asignado' },
    { estado: 'EN_PROGRESO' as EstadoReporteEnum, label: 'En ejecución' },
    { estado: 'EJECUTADO' as EstadoReporteEnum,   label: 'Ejecutado' },
    { estado: 'CERRADO' as EstadoReporteEnum,     label: 'Cerrado' }
  ];

  estadosOrden: EstadoReporteEnum[] = ['ASIGNADA','EN_REVISION','EN_PROGRESO','EJECUTADO','CERRADO'];

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(p => this.reporteService.getReporte(p.get('id')!))
    ).subscribe(r => {
      this.reporte.set(r);
      this.loading.set(false);
      setTimeout(() => this.initMap(r), 300);
    });
  }

  isStepDone(estado: EstadoReporteEnum): boolean {
    const r = this.reporte();
    if (!r) return false;
    return this.estadosOrden.indexOf(r.estado) > this.estadosOrden.indexOf(estado);
  }

  iniciarTrabajo() {
    const r = this.reporte();
    if (!r) return;
    this.saving.set(true);
    this.reporteService.actualizarEstado(r.id, 'EN_PROGRESO', 'Operarios en campo').subscribe({
      next: updated => { this.reporte.set(updated); this.saving.set(false); this.snack.open('Trabajo iniciado', 'OK', { duration: 3000 }); },
      error: () => this.saving.set(false)
    });
  }

  marcarEjecutado() {
    const r = this.reporte();
    if (!r) return;
    this.saving.set(true);
    const obs = this.obsCtrl.value || 'Trabajo completado por la empresa';
    this.reporteService.actualizarEstado(r.id, 'EJECUTADO', obs).subscribe({
      next: updated => { this.reporte.set(updated); this.saving.set(false); this.snack.open('Trabajo marcado como ejecutado — pendiente supervisión', 'OK', { duration: 4000 }); },
      error: () => this.saving.set(false)
    });
  }

  triggerUpload() {
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => this.evidenciaPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  private initMap(r: Reporte) {
    const el = document.getElementById('empresa-map');
    if (!el) return;
    const L = (window as any).L;
    if (L) {
      const map = L.map(el).setView([r.ubicacion.latitud, r.ubicacion.longitud], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([r.ubicacion.latitud, r.ubicacion.longitud]).addTo(map);
    } else {
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#eef1f9;color:#6b6b8a;font-size:12px;flex-direction:column;gap:4px">
        <span style="font-size:24px">📍</span><span>${r.ubicacion.direccion ?? ''}</span></div>`;
    }
  }

  getLabelEstado(estado: string) {
    const map: Record<string,string> = { PENDIENTE:'Pendiente', EN_REVISION:'En revisión', ASIGNADA:'Asignada', EN_PROGRESO:'En progreso', EJECUTADO:'Ejecutado', CERRADO:'Cerrado' };
    return map[estado] ?? estado;
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
}
