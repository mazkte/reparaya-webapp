// src/app/features/supervisor/supervisor-validate.component.ts
import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { Reporte } from '../../shared/models';

@Component({
  selector: 'app-supervisor-validate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="supervisor-validate">

      <div class="breadcrumb">
        <a routerLink="/supervisor/pendientes" class="back-link">
          <mat-icon>arrow_back</mat-icon>
          Volver a pendientes
        </a>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"/></div>
      } @else if (reporte()) {

        <div class="detail-header">
          <div>
            <div class="report-meta">
              <span class="report-id">#{{ reporte()!.id }}</span>
              <span class="chip" [ngClass]="'cat-' + reporte()!.categoria">{{ getLabelCategoria(reporte()!.categoria) }}</span>
            </div>
            <h1>{{ reporte()!.titulo }}</h1>
            <p class="empresa-info">
              <mat-icon class="meta-icon">business</mat-icon>
              Ejecutado por <strong>{{ reporte()!.empresaNombre ?? 'Empresa' }}</strong>
            </p>
          </div>
          <span class="estado-badge" [ngClass]="'estado-' + reporte()!.estado">
            {{ getLabelEstado(reporte()!.estado) }}
          </span>
        </div>

        <div class="validate-grid">

          <!-- COLUMNA IZQUIERDA: comparativa fotos -->
          <div class="col-left">

            <mat-card>
              <mat-card-header>
                <mat-card-title>Comparativa del trabajo</mat-card-title>
                <mat-card-subtitle>Verifica que el problema fue resuelto correctamente</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>

                <div class="photo-compare">

                  <div class="photo-col">
                    <div class="photo-label before">
                      <mat-icon>photo_camera</mat-icon>
                      Antes — foto del ciudadano
                    </div>
                    @if (reporte()!.mediaUrls.length > 0) {
                      <img [src]="reporte()!.mediaUrls[0]" class="compare-photo" alt="Foto antes">
                    } @else {
                      <div class="photo-empty">
                        <mat-icon>no_photography</mat-icon>
                        <span>Sin foto del ciudadano</span>
                      </div>
                    }
                  </div>

                  <div class="photo-divider">
                    <mat-icon>compare_arrows</mat-icon>
                  </div>

                  <div class="photo-col">
                    <div class="photo-label after">
                      <mat-icon>photo_camera</mat-icon>
                      Después — evidencia empresa
                    </div>
                    @if (reporte()!.mediaEvidenciaUrls.length > 0) {
                      <img [src]="reporte()!.mediaEvidenciaUrls[0]" class="compare-photo" alt="Foto después">
                    } @else {
                      <div class="photo-empty sin">
                        <mat-icon>no_photography</mat-icon>
                        <span>Sin evidencia de la empresa</span>
                      </div>
                    }
                  </div>

                </div>

                <mat-divider style="margin: 16px 0"/>

                <div class="field-grid">
                  <div class="field">
                    <label>Descripción ciudadano</label>
                    <p>{{ reporte()!.descripcion }}</p>
                  </div>
                  <div class="field">
                    <label>Ubicación</label>
                    <p>{{ reporte()!.ubicacion.direccion ?? 'Sin dirección' }}</p>
                  </div>
                  <div class="field">
                    <label>Empresa</label>
                    <p>{{ reporte()!.empresaNombre ?? '—' }}</p>
                  </div>
                  <div class="field">
                    <label>Ejecutado</label>
                    <p>{{ formatDate(reporte()!.fechaActualizacion) }}</p>
                  </div>
                </div>

              </mat-card-content>
            </mat-card>

            <!-- MAPA -->
            <mat-card>
              <mat-card-header><mat-card-title>Ubicación del trabajo</mat-card-title></mat-card-header>
              <mat-card-content>
                <div id="supervisor-map" class="map-container"></div>
              </mat-card-content>
            </mat-card>

          </div>

          <!-- COLUMNA DERECHA: validación -->
          <div class="col-right">

            <!-- HISTORIAL -->
            <mat-card>
              <mat-card-header><mat-card-title>Historial de estados</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="timeline">
                  @for (ev of reporte()!.historialEstados; track ev.timestamp) {
                    <div class="tl-item">
                      <div class="tl-dot"></div>
                      <div class="tl-content">
                        <span class="chip chip-sm" [ngClass]="'estado-' + ev.estado">{{ getLabelEstado(ev.estado) }}</span>
                        @if (ev.observacion) { <p class="tl-obs">{{ ev.observacion }}</p> }
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

            <!-- PANEL DE DECISIÓN -->
            @if (reporte()!.estado === 'EJECUTADO') {

              <!-- FOTO DEL SUPERVISOR -->
              <mat-card>
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>photo_camera</mat-icon>
                    Foto de conformidad (opcional)
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="upload-zone" (click)="triggerUpload()">
                    @if (fotoConformidad()) {
                      <img [src]="fotoConformidad()!" class="conformidad-preview" alt="Foto conformidad">
                    } @else {
                      <mat-icon>add_a_photo</mat-icon>
                      <span>Tomar foto en campo</span>
                      <small>Documenta tu inspección</small>
                    }
                  </div>
                  <input type="file" #fileInput accept="image/*"
                         style="display:none" (change)="onFileSelected($event)">
                </mat-card-content>
              </mat-card>

              <!-- APROBAR -->
              <mat-card class="confirm-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>check_circle</mat-icon>
                    Confirmar cierre del reporte
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="action-desc">
                    El trabajo cumple con los estándares municipales.
                    El ciudadano recibirá una notificación por WhatsApp.
                  </p>
                  <mat-form-field appearance="outline" style="width:100%">
                    <mat-label>Observaciones del supervisor</mat-label>
                    <textarea matInput [formControl]="obsCtrl" rows="3"
                      placeholder="Trabajo conforme, sin observaciones adicionales...">
                    </textarea>
                  </mat-form-field>
                  <button mat-flat-button color="primary" style="width:100%"
                          (click)="cerrarReporte()" [disabled]="saving()">
                    @if (saving()) { <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"/> }
                    @else { <mat-icon>verified</mat-icon> }
                    Cerrar reporte y notificar ciudadano
                  </button>
                </mat-card-content>
              </mat-card>

              <!-- RECHAZAR -->
              <mat-card class="reject-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>cancel</mat-icon>
                    Devolver a empresa
                  </mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="action-desc">El trabajo no cumple los estándares. La empresa deberá corregirlo.</p>
                  <mat-form-field appearance="outline" style="width:100%">
                    <mat-label>Motivo del rechazo</mat-label>
                    <textarea matInput [formControl]="rechazarCtrl" rows="3"
                      placeholder="Describe qué debe corregirse...">
                    </textarea>
                  </mat-form-field>
                  <button mat-stroked-button color="warn" style="width:100%"
                          (click)="rechazarTrabajo()" [disabled]="saving()">
                    <mat-icon>undo</mat-icon>
                    Devolver para corrección
                  </button>
                </mat-card-content>
              </mat-card>

            } @else {
              <mat-card class="already-closed">
                <mat-icon>{{ reporte()!.estado === 'CERRADO' ? 'verified' : 'info' }}</mat-icon>
                <p>Este reporte está en estado <strong>{{ getLabelEstado(reporte()!.estado) }}</strong>.</p>
              </mat-card>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .supervisor-validate { display: flex; flex-direction: column; gap: 16px; }
    .breadcrumb { margin-bottom: 4px; }
    .back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #6b6b8a; text-decoration: none; }
    .back-link:hover { color: #2d4a8a; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .report-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .report-id { font-family: monospace; font-size: 13px; font-weight: 600; color: #6b6b8a; }
    h1 { font-size: 20px; font-weight: 600; color: #1a1a2e; margin: 0 0 4px; }
    .empresa-info { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #6b6b8a; margin: 0; }
    .meta-icon { font-size: 15px; width: 15px; height: 15px; }
    .estado-badge { display: inline-block; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 999px; flex-shrink: 0; }

    .validate-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .col-left, .col-right { display: flex; flex-direction: column; gap: 16px; }

    /* PHOTO COMPARE */
    .photo-compare { display: flex; align-items: center; gap: 12px; }
    .photo-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .photo-label { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; mat-icon { font-size: 14px; width: 14px; height: 14px; } }
    .photo-label.before { color: #6b6b8a; }
    .photo-label.after  { color: #2d8a6a; }
    .compare-photo { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #e0dfd8; }
    .photo-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; height: 160px; background: #f9f8f5; border: 1px dashed #d0cfe8; border-radius: 8px; justify-content: center; color: #aaa; font-size: 12px; mat-icon { font-size: 28px; width: 28px; height: 28px; } }
    .photo-empty.sin { border-color: #fce8e8; background: #fff5f5; color: #c0392b; }
    .photo-divider { display: flex; align-items: center; justify-content: center; color: #aaa; flex-shrink: 0; mat-icon { font-size: 28px; } }

    /* CAMPOS */
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { display: flex; flex-direction: column; gap: 3px; label { font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: .08em; } p { font-size: 13px; color: #1a1a2e; margin: 0; line-height: 1.5; } }

    /* MAPA */
    .map-container { height: 180px; background: #eef1f9; border-radius: 8px; overflow: hidden; }

    /* TIMELINE */
    .timeline { display: flex; flex-direction: column; }
    .tl-item { display: flex; gap: 12px; padding: 8px 0; position: relative; }
    .tl-item:not(:last-child)::after { content: ''; position: absolute; left: 10px; top: 30px; width: 2px; height: calc(100% - 10px); background: #e8e6e0; }
    .tl-dot { width: 22px; height: 22px; border-radius: 50%; background: #1D9E75; flex-shrink: 0; z-index: 1; }
    .tl-content { flex: 1; }
    .tl-obs { font-size: 12px; color: #444; margin: 4px 0; }
    .tl-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .tl-actor { font-size: 10px; color: #6b6b8a; }
    .tl-time  { font-size: 10px; color: #aaa; }

    /* UPLOAD */
    .upload-zone { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 20px; background: #f9f8f5; border: 2px dashed #d0cfe8; border-radius: 8px; cursor: pointer; color: #6b6b8a; font-size: 13px; mat-icon { font-size: 30px; width: 30px; height: 30px; color: #d0cfe8; } small { font-size: 11px; color: #aaa; } }
    .upload-zone:hover { border-color: #2d4a8a; background: #eef1f9; }
    .conformidad-preview { width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; }

    /* CONFIRM / REJECT */
    .confirm-card { border: 1px solid #1D9E75 !important; }
    .confirm-card mat-card-title { display: flex; align-items: center; gap: 6px; color: #1D9E75; }
    .reject-card { border: 1px solid #E24B4A !important; }
    .reject-card mat-card-title { display: flex; align-items: center; gap: 6px; color: #E24B4A; }
    .action-desc { font-size: 13px; color: #6b6b8a; margin: 0 0 14px; }

    .already-closed { display: flex; align-items: center; gap: 10px; padding: 20px !important; font-size: 13px; color: #6b6b8a; mat-icon { font-size: 24px; color: #1D9E75; } p { margin: 0; } }

    /* CHIPS */
    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .chip-sm { font-size: 9px; padding: 1px 6px; }
    .cat-VIALIDAD { background: #eeedfe; color: #3c3489; }
    .cat-ALUMBRADO { background: #fff8e8; color: #7a5c00; }
    .cat-AGUA_POTABLE { background: #eef1f9; color: #2d4a8a; }
    .cat-ALCANTARILLADO { background: #fce8e8; color: #791f1f; }
    .cat-OTRO { background: #f1efea; color: #555; }
    .estado-PENDIENTE { background: #FAEEDA; color: #633806; }
    .estado-EN_REVISION { background: #E6F1FB; color: #0C447C; }
    .estado-ASIGNADA { background: #eeedfe; color: #3c3489; }
    .estado-EN_PROGRESO { background: #eeedfe; color: #3c3489; }
    .estado-EJECUTADO { background: #EAF3DE; color: #27500A; }
    .estado-CERRADO { background: #f1efea; color: #444; }

    @media (max-width: 900px) { .validate-grid { grid-template-columns: 1fr; } .photo-compare { flex-direction: column; } .photo-divider { transform: rotate(90deg); } }
  `]
})
export class SupervisorValidateComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private reporteService = inject(ReporteService);
  private snack  = inject(MatSnackBar);

  reporte  = signal<Reporte | null>(null);
  loading  = signal(true);
  saving   = signal(false);
  fotoConformidad = signal<string | null>(null);

  obsCtrl      = new FormControl('');
  rechazarCtrl = new FormControl('');

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(p => this.reporteService.getReporte(p.get('id')!))
    ).subscribe(r => {
      this.reporte.set(r);
      this.loading.set(false);
      setTimeout(() => this.initMap(r), 300);
    });
  }

  cerrarReporte() {
    const r = this.reporte();
    if (!r) return;
    this.saving.set(true);
    const obs = this.obsCtrl.value || 'Trabajo validado por supervisor municipal';
    this.reporteService.actualizarEstado(r.id, 'CERRADO', obs).subscribe({
      next: updated => {
        this.reporte.set(updated);
        this.saving.set(false);
        this.snack.open('Reporte cerrado — ciudadano notificado por WhatsApp', 'OK', { duration: 4000 });
        setTimeout(() => this.router.navigate(['/supervisor/pendientes']), 1500);
      },
      error: () => this.saving.set(false)
    });
  }

  rechazarTrabajo() {
    const r = this.reporte();
    if (!r) return;
    const obs = this.rechazarCtrl.value || 'Devuelto para corrección';
    this.reporteService.actualizarEstado(r.id, 'EN_PROGRESO', obs).subscribe(updated => {
      this.reporte.set(updated);
      this.snack.open('Trabajo devuelto a la empresa', 'OK', { duration: 3000 });
      setTimeout(() => this.router.navigate(['/supervisor/pendientes']), 1500);
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
      reader.onload = e => this.fotoConformidad.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  private initMap(r: Reporte) {
    const el = document.getElementById('supervisor-map');
    if (!el) return;
    const L = (window as any).L;
    if (L) {
      const map = L.map(el).setView([r.ubicacion.latitud, r.ubicacion.longitud], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      L.marker([r.ubicacion.latitud, r.ubicacion.longitud]).addTo(map);
    } else {
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#eef1f9;color:#6b6b8a;font-size:12px;flex-direction:column;gap:4px"><span style="font-size:24px">📍</span><span>${r.ubicacion.direccion ?? ''}</span></div>`;
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
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
