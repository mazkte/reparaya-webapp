// src/app/features/companies/company-list.component.ts
import {
  Component, OnInit, inject, signal, computed,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EmpresaService } from '../../core/services/empresa.service';
import { EmpresaServicio } from '../../shared/models';
import { NuevaEmpresaModalComponent } from './nueva-empresa-modal.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    MatTooltipModule, MatDividerModule, MatSliderModule
  ],
  template: `
    <div class="company-list">

      <div class="page-header">
        <div>
          <h1>Empresas contratadas</h1>
          <p>{{ empresasFiltradas().length }} empresas · {{ activas() }} activas</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirModal()">
          <mat-icon>add_business</mat-icon>
          Nueva empresa
        </button>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" color="primary"/> }

      <!-- ALERTAS CONTRATOS POR VENCER -->
      @if (porVencer().length > 0) {
        <div class="alert-banner">
          <mat-icon>warning</mat-icon>
          <span>
            <strong>{{ porVencer().length }} empresa(s)</strong> con contrato por vencer en 30 días:
            {{ getNombresVencer() }}
          </span>
        </div>
      }

      <!-- FILTROS -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar empresa</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl" placeholder="Nombre o RUC...">
            @if (searchCtrl.value) {
              <button matSuffix mat-icon-button (click)="searchCtrl.setValue('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Estado</mat-label>
            <mat-select [formControl]="estadoCtrl">
              <mat-option value="">Todos</mat-option>
              <mat-option value="ACTIVA">Activa</mat-option>
              <mat-option value="INACTIVA">Inactiva</mat-option>
              <mat-option value="SUSPENDIDA">Suspendida</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- CARDS -->
      <div class="empresas-grid">
        @for (e of empresasFiltradas(); track e.id) {
          <mat-card class="empresa-card"
                    [class.vencida]="isVencida(e)"
                    [class.inactiva]="e.estado !== 'ACTIVA'">

            <div class="empresa-header">
              <div class="empresa-avatar">{{ getInitials(e.nombre) }}</div>
              <div class="empresa-info">
                <span class="empresa-nombre">{{ e.nombre }}</span>
                <span class="empresa-ruc">RUC: {{ e.ruc }}</span>
              </div>
              <span class="chip" [ngClass]="'estado-emp-' + e.estado">{{ e.estado }}</span>
            </div>

            <mat-divider style="margin: 10px 0"/>

            <!-- Especialidades -->
            <div class="especialidades">
              @for (cat of e.especialidades; track cat) {
                <span class="chip cat-chip" [ngClass]="'cat-' + cat">{{ getCatLabel(cat) }}</span>
              }
            </div>

            <!-- Capacidad diaria -->
            <div class="capacidad-section">
              <div class="cap-header">
                <span class="cap-label">Carga hoy</span>
                <span class="cap-val">{{ e.trabajosHoy }}/{{ e.capacidadDiariaMax }} trabajos</span>
              </div>
              <mat-progress-bar
                [value]="getCargaPct(e)"
                [color]="getCargaPct(e) >= 100 ? 'warn' : getCargaPct(e) >= 70 ? 'accent' : 'primary'">
              </mat-progress-bar>
            </div>

            <!-- Contrato -->
            <div class="contrato-row" [class.warn]="isVencida(e)">
              <mat-icon>{{ isVencida(e) ? 'warning' : 'event' }}</mat-icon>
              <span>{{ e.vigenciaContrato ? formatFecha(e.vigenciaContrato) : 'Sin fecha de contrato' }}</span>
            </div>

            <!-- Contacto -->
            <div class="contacto-section">
              <span class="cont-item"><mat-icon>email</mat-icon>{{ e.emailCoordinador }}</span>
              @if (e.whatsappCoordinador) {
                <span class="cont-item"><mat-icon>phone</mat-icon>{{ e.whatsappCoordinador }}</span>
              }
            </div>

            <!-- Acciones -->
            <div class="empresa-actions">
              <button mat-stroked-button (click)="abrirEditarCupo(e)" matTooltip="Ajustar cupo diario">
                <mat-icon>tune</mat-icon>
                Ajustar cupo
              </button>
              <button mat-icon-button
                      [matTooltip]="e.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'"
                      [disabled]="accionando() === e.id"
                      (click)="toggleEstado(e)">
                @if (accionando() === e.id) {
                  <mat-spinner diameter="18"/>
                } @else {
                  <mat-icon>{{ e.estado === 'ACTIVA' ? 'pause_circle' : 'play_circle' }}</mat-icon>
                }
              </button>
            </div>

          </mat-card>
        }
      </div>

      @if (empresasFiltradas().length === 0 && !loading()) {
        <mat-card class="empty-state">
          <mat-icon>business_center</mat-icon>
          <h3>Sin empresas</h3>
          <p>No se encontraron empresas con los filtros aplicados.</p>
        </mat-card>
      }

      <!-- MODAL EDITAR CUPO -->
      @if (empresaEditando()) {
        <div class="cupo-overlay" (click)="cerrarEditarCupo()">
          <mat-card class="cupo-modal" (click)="$event.stopPropagation()">
            <h3>Ajustar cupo — {{ empresaEditando()!.nombre }}</h3>
            <p class="cupo-actual">Cupo actual: <strong>{{ empresaEditando()!.capacidadDiariaMax }} trabajos/día</strong></p>

            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Nuevo cupo diario</mat-label>
              <input matInput [formControl]="nuevoCupoCtrl" type="number" min="1" max="100">
              <span matSuffix>trabajos/día</span>
              @if (nuevoCupoCtrl.hasError('min')) {
                <mat-error>Mínimo 1</mat-error>
              }
              @if (nuevoCupoCtrl.hasError('max')) {
                <mat-error>Máximo 100</mat-error>
              }
            </mat-form-field>

            <div class="cupo-actions">
              <button mat-button (click)="cerrarEditarCupo()">Cancelar</button>
              <button mat-flat-button color="primary"
                      [disabled]="nuevoCupoCtrl.invalid || guardandoCupo()"
                      (click)="guardarCupo()">
                @if (guardandoCupo()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                @else { <mat-icon>check</mat-icon> }
                Guardar
              </button>
            </div>
          </mat-card>
        </div>
      }

    </div>
  `,
  styles: [`
    .company-list { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }
    mat-progress-bar { border-radius: 2px; }
    .alert-banner { display: flex; align-items: flex-start; gap: 10px; background: #fff8e8; border: 1px solid #f0d080; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #7a5c00;
      mat-icon { color: #EF9F27; font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    }
    .filter-card { padding: 16px !important; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-field { min-width: 240px; flex: 1; }
    .filter-field { min-width: 140px; }
    .empresas-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .empresa-card { padding: 16px !important; transition: box-shadow .15s; }
    .empresa-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
    .empresa-card.vencida { border: 1px solid #EF9F27 !important; }
    .empresa-card.inactiva { opacity: .7; }
    .empresa-header { display: flex; align-items: center; gap: 10px; }
    .empresa-avatar { width: 40px; height: 40px; border-radius: 10px; background: #eef1f9; color: #2d4a8a; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .empresa-info { flex: 1; }
    .empresa-nombre { display: block; font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .empresa-ruc    { display: block; font-size: 11px; color: #6b6b8a; font-family: monospace; }
    .especialidades { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .capacidad-section { margin-bottom: 8px; }
    .cap-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .cap-label { font-size: 11px; color: #6b6b8a; }
    .cap-val   { font-size: 11px; font-weight: 600; color: #1a1a2e; }
    .contrato-row { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #6b6b8a; margin-bottom: 8px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }
    .contrato-row.warn { color: #EF9F27; mat-icon { color: #EF9F27; } }
    .contacto-section { display: flex; flex-direction: column; gap: 3px; margin-bottom: 12px; }
    .cont-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6b6b8a;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .empresa-actions { display: flex; justify-content: space-between; align-items: center; }

    /* Chips */
    .chip { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .cat-chip { font-size: 9px; }
    .estado-emp-ACTIVA     { background: #eaf4ef; color: #27500A; }
    .estado-emp-INACTIVA   { background: #f1efea; color: #666; }
    .estado-emp-SUSPENDIDA { background: #fce8e8; color: #791f1f; }
    .cat-VIALIDAD      { background: #eeedfe; color: #3c3489; }
    .cat-ALUMBRADO     { background: #fff8e8; color: #7a5c00; }
    .cat-AGUA_POTABLE  { background: #eef1f9; color: #2d4a8a; }
    .cat-ALCANTARILLADO{ background: #fce8e8; color: #791f1f; }
    .cat-OTRO          { background: #f1efea; color: #555; }

    /* Empty */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px !important; text-align: center; color: #6b6b8a;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d0cfe8; margin-bottom: 12px; }
      h3 { margin: 0 0 6px; } p { margin: 0; font-size: 13px; }
    }

    /* Modal cupo */
    .cupo-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .cupo-modal { padding: 24px !important; width: 360px;
      h3 { font-size: 16px; font-weight: 600; margin: 0 0 4px; }
    }
    .cupo-actual { font-size: 13px; color: #6b6b8a; margin: 0 0 16px; }
    .cupo-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    @media (max-width: 700px) { .empresas-grid { grid-template-columns: 1fr; } }
  `]
})
export class CompanyListComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private dialog         = inject(MatDialog);
  private snack          = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);

  empresas       = signal<EmpresaServicio[]>([]);
  loading        = signal(false);
  accionando     = signal('');
  empresaEditando= signal<EmpresaServicio | null>(null);
  guardandoCupo  = signal(false);

  searchCtrl = new FormControl('');
  estadoCtrl = new FormControl('');
  searchText = signal('');
  estadoFil  = signal('');

  nuevoCupoCtrl = new FormControl(5, [Validators.required, Validators.min(1), Validators.max(100)]);

  activas = computed(() => this.empresas().filter(e => e.estado === 'ACTIVA').length);

  porVencer = computed(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    return this.empresas().filter(e => {
      if (!e.vigenciaContrato) return false;
      return new Date(e.vigenciaContrato) <= limite && e.estado === 'ACTIVA';
    });
  });

  empresasFiltradas = computed(() => {
    const s   = this.searchText().toLowerCase();
    const est = this.estadoFil();
    return this.empresas().filter(e => {
      const matchS = !s || e.nombre.toLowerCase().includes(s) || e.ruc.includes(s);
      const matchE = !est || e.estado === est;
      return matchS && matchE;
    });
  });

  ngOnInit() {
    this.cargarEmpresas();

    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(v => { this.searchText.set(v ?? ''); this.cdr.markForCheck(); });

    this.estadoCtrl.valueChanges
      .subscribe(v => { this.estadoFil.set(v ?? ''); this.cdr.markForCheck(); });
  }

  cargarEmpresas() {
    this.loading.set(true);
    this.empresaService.getEmpresas().subscribe({
      next: list => { this.empresas.set(list); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()  => { this.loading.set(false); this.cdr.markForCheck(); }
    });
  }

  abrirModal() {
    console.log('abrirModal called'); 
    this.dialog.open(NuevaEmpresaModalComponent, { width: '560px', disableClose: true })
      .afterClosed().subscribe(r => { if (r) this.cargarEmpresas(); });
  }

  abrirEditarCupo(e: EmpresaServicio) {
    this.empresaEditando.set(e);
    this.nuevoCupoCtrl.setValue(e.capacidadDiariaMax);
    this.cdr.markForCheck();
  }

  cerrarEditarCupo() {
    this.empresaEditando.set(null);
    this.cdr.markForCheck();
  }

  guardarCupo() {
    const e = this.empresaEditando();
    if (!e || this.nuevoCupoCtrl.invalid) return;
    this.guardandoCupo.set(true);
    this.empresaService.actualizarCupo(e.id, this.nuevoCupoCtrl.value!).subscribe({
      next: updated => {
        this.empresas.update(list => list.map(x => x.id === e.id ? updated : x));
        this.guardandoCupo.set(false);
        this.empresaEditando.set(null);
        this.cdr.markForCheck();
        this.snack.open(`Cupo de ${e.nombre} → ${this.nuevoCupoCtrl.value} trabajos/día`, 'OK', { duration: 3000 });
      },
      error: () => { this.guardandoCupo.set(false); this.cdr.markForCheck(); }
    });
  }

  toggleEstado(e: EmpresaServicio) {
    const nuevo = e.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    this.accionando.set(e.id);
    this.empresaService.cambiarEstado(e.id, nuevo).subscribe({
      next: updated => {
        this.empresas.update(list => list.map(x => x.id === e.id ? updated : x));
        this.accionando.set('');
        this.cdr.markForCheck();
        this.snack.open(`${e.nombre} ${nuevo === 'ACTIVA' ? 'activada' : 'desactivada'}`, 'OK', { duration: 3000 });
      },
      error: () => { this.accionando.set(''); this.cdr.markForCheck(); }
    });
  }

  getNombresVencer(): string {
    return this.porVencer().map(e => e.nombre).join(', ');
  }

  getCargaPct(e: EmpresaServicio): number {
    if (!e.capacidadDiariaMax) return 0;
    return Math.round(e.trabajosHoy / e.capacidadDiariaMax * 100);
  }

  isVencida(e: EmpresaServicio): boolean {
    if (!e.vigenciaContrato) return false;
    const limite = new Date(); limite.setDate(limite.getDate() + 30);
    return new Date(e.vigenciaContrato) <= limite;
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getCatLabel(cat: string) {
    const map: Record<string,string> = { VIALIDAD:'Vialidad', ALUMBRADO:'Alumbrado',
      AGUA_POTABLE:'Agua potable', ALCANTARILLADO:'Alcantarillado', OTRO:'Otro' };
    return map[cat] ?? cat;
  }

  getInitials(n: string) {
    if (!n) return '?';
    return n.split(' ').map(x => x[0] ?? '').join('').substring(0,2).toUpperCase();
  }
}
