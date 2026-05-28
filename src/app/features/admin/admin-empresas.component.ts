// src/app/features/admin/admin-empresas.component.ts
import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmpresaServicio, CategoriaEnum } from '../../shared/models';
import { MOCK_EMPRESAS } from '../../core/services/mock-data';

@Component({
  selector: 'app-admin-empresas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatTableModule,
    MatSnackBarModule, MatTooltipModule, MatChipsModule,
    MatProgressBarModule, MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-empresas">

      <!-- CABECERA -->
      <div class="page-header">
        <div>
          <h1>Empresas contratadas</h1>
          <p>{{ empresas().length }} empresas registradas · {{ activas() }} activas</p>
        </div>
        <button mat-flat-button color="primary" (click)="mostrarForm.set(!mostrarForm())">
          <mat-icon>{{ mostrarForm() ? 'close' : 'add_business' }}</mat-icon>
          {{ mostrarForm() ? 'Cancelar' : 'Nueva empresa' }}
        </button>
      </div>

      <!-- ALERTAS CONTRATOS POR VENCER -->
      @if (porVencer().length > 0) {
        <div class="alert-banner warn">
          <mat-icon>warning</mat-icon>
          <span>
            <strong>{{ porVencer().length }} empresa(s)</strong> con contrato por vencer en los próximos 30 días:
            {{ porVencerNombres() }}
          </span>
        </div>
      }

      <!-- FORMULARIO NUEVA EMPRESA -->
      @if (mostrarForm()) {
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>add_business</mat-icon>
              Registrar nueva empresa
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="empresaForm" (ngSubmit)="crearEmpresa()" class="empresa-form">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre de la empresa</mat-label>
                  <input matInput formControlName="nombre" placeholder="Ej. Constructora Lima SAC">
                  @if (f['nombre'].hasError('required') && f['nombre'].touched) {
                    <mat-error>Requerido</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>RUC</mat-label>
                  <input matInput formControlName="ruc" placeholder="20XXXXXXXXX" maxlength="11">
                  @if (f['ruc'].hasError('pattern') && f['ruc'].touched) {
                    <mat-error>RUC inválido (11 dígitos)</mat-error>
                  }
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Email coordinador</mat-label>
                  <input matInput formControlName="emailCoordinador" type="email">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>WhatsApp coordinador</mat-label>
                  <input matInput formControlName="whatsappCoordinador" placeholder="+51 9XX XXX XXX">
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Especialidades</mat-label>
                  <mat-select formControlName="especialidades" multiple>
                    @for (c of categorias; track c.value) {
                      <mat-option [value]="c.value">{{ c.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Capacidad diaria máx.</mat-label>
                  <input matInput formControlName="capacidadDiariaMax" type="number" min="1" max="50">
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Vigencia del contrato</mat-label>
                  <input matInput formControlName="vigenciaContrato" type="date">
                </mat-form-field>
              </div>
              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit"
                        [disabled]="empresaForm.invalid || saving()">
                  @if (saving()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                  @else { <mat-icon>check</mat-icon> }
                  Registrar empresa
                </button>
                <button mat-button type="button" (click)="mostrarForm.set(false)">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- FILTRO -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar empresa</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl" placeholder="Nombre o RUC...">
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

      <!-- CARDS DE EMPRESAS -->
      <div class="empresas-grid">
        @for (e of empresasFiltradas(); track e.id) {
          <mat-card class="empresa-card" [class.vencida]="isVencida(e)" [class.inactiva]="e.estado !== 'ACTIVA'">
            <div class="empresa-header">
              <div class="empresa-avatar">{{ getInitials(e.nombre) }}</div>
              <div class="empresa-info">
                <span class="empresa-nombre">{{ e.nombre }}</span>
                <span class="empresa-ruc">RUC: {{ e.ruc }}</span>
              </div>
              <span class="chip" [ngClass]="'estado-emp-' + e.estado">{{ e.estado }}</span>
            </div>

            <mat-divider style="margin: 12px 0"/>

            <!-- ESPECIALIDADES -->
            <div class="especialidades">
              @for (cat of e.especialidades; track cat) {
                <span class="chip cat-chip" [ngClass]="'cat-' + cat">{{ getCatLabel(cat) }}</span>
              }
            </div>

            <!-- CAPACIDAD -->
            <div class="capacidad-section">
              <div class="cap-header">
                <span class="cap-label">Capacidad hoy</span>
                <span class="cap-val">{{ e.trabajosHoy }}/{{ e.capacidadDiariaMax }}</span>
              </div>
              <mat-progress-bar
                [value]="(e.trabajosHoy / e.capacidadDiariaMax) * 100"
                [color]="e.trabajosHoy >= e.capacidadDiariaMax ? 'warn' : e.trabajosHoy / e.capacidadDiariaMax >= 0.7 ? 'accent' : 'primary'">
              </mat-progress-bar>
            </div>

            <!-- CONTRATO -->
            <div class="contrato-section" [class.warn]="isVencida(e)">
              <mat-icon class="cont-icon">{{ isVencida(e) ? 'warning' : 'description' }}</mat-icon>
              <span class="cont-text">
                Contrato: {{ e.vigenciaContrato ? formatVigencia(e.vigenciaContrato) : 'Sin fecha' }}
              </span>
            </div>

            <!-- CONTACTO -->
            <div class="contacto-section">
              <span class="cont-item">
                <mat-icon>email</mat-icon>
                {{ e.emailCoordinador }}
              </span>
              @if (e.whatsappCoordinador) {
                <span class="cont-item">
                  <mat-icon>phone</mat-icon>
                  {{ e.whatsappCoordinador }}
                </span>
              }
            </div>

            <!-- ACCIONES -->
            <div class="empresa-actions">
              <button mat-stroked-button (click)="editarCupo(e)">
                <mat-icon>tune</mat-icon>
                Ajustar cupo
              </button>
              <button mat-icon-button
                      [matTooltip]="e.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'"
                      (click)="toggleEstado(e)">
                <mat-icon>{{ e.estado === 'ACTIVA' ? 'pause_circle' : 'play_circle' }}</mat-icon>
              </button>
            </div>
          </mat-card>
        }
      </div>

      <!-- ESTADO VACÍO -->
      @if (empresasFiltradas().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>business_center</mat-icon>
          <h3>Sin empresas</h3>
          <p>No se encontraron empresas con los filtros aplicados.</p>
        </mat-card>
      }

    </div>
  `,
  styles: [`
    .admin-empresas { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }

    .alert-banner { display: flex; align-items: flex-start; gap: 10px; border-radius: 8px; padding: 12px 16px; font-size: 13px; }
    .alert-banner.warn { background: #fff8e8; border: 1px solid #f0d080; color: #7a5c00;
      mat-icon { color: #EF9F27; font-size: 18px; flex-shrink: 0; margin-top: 1px; }
    }

    .form-card { border: 1px solid #2d4a8a !important; }
    .form-card mat-card-title { display: flex; align-items: center; gap: 6px; color: #2d4a8a; }
    .empresa-form { display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-actions { display: flex; gap: 10px; padding-top: 8px; }

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
    .empresa-avatar {
      width: 40px; height: 40px; border-radius: 10px;
      background: #eef1f9; color: #2d4a8a;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .empresa-info { flex: 1; }
    .empresa-nombre { display: block; font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .empresa-ruc { display: block; font-size: 11px; color: #6b6b8a; font-family: monospace; }

    .especialidades { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }

    .capacidad-section { margin-bottom: 10px; }
    .cap-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .cap-label { font-size: 11px; color: #6b6b8a; }
    .cap-val { font-size: 11px; font-weight: 600; color: #1a1a2e; }

    .contrato-section {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #6b6b8a; margin-bottom: 8px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }
    .contrato-section.warn { color: #EF9F27; mat-icon { color: #EF9F27; } }

    .contacto-section { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .cont-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6b6b8a;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .empresa-actions { display: flex; justify-content: space-between; align-items: center; }

    /* CHIPS */
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

    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px !important; text-align: center; color: #6b6b8a;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d0cfe8; margin-bottom: 12px; }
      h3 { margin: 0 0 6px; }
      p  { margin: 0; font-size: 13px; }
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @media (max-width: 700px) {
      .empresas-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminEmpresasComponent implements OnInit {
  private snack = inject(MatSnackBar);

  empresas = signal<EmpresaServicio[]>([...MOCK_EMPRESAS]);
  saving   = signal(false);
  mostrarForm = signal(false);

  searchCtrl = new FormControl('');
  estadoCtrl = new FormControl('');

  categorias = [
    { value: 'VIALIDAD'       as CategoriaEnum, label: 'Vialidad' },
    { value: 'ALUMBRADO'      as CategoriaEnum, label: 'Alumbrado' },
    { value: 'AGUA_POTABLE'   as CategoriaEnum, label: 'Agua potable' },
    { value: 'ALCANTARILLADO' as CategoriaEnum, label: 'Alcantarillado' },
    { value: 'OTRO'           as CategoriaEnum, label: 'Otro' }
  ];

  empresaForm = new FormGroup({
    nombre:            new FormControl('', Validators.required),
    ruc:               new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    emailCoordinador:  new FormControl('', [Validators.required, Validators.email]),
    whatsappCoordinador: new FormControl(''),
    especialidades:    new FormControl<CategoriaEnum[]>([], Validators.required),
    capacidadDiariaMax: new FormControl(5, [Validators.required, Validators.min(1)]),
    vigenciaContrato:  new FormControl('')
  });

  get f() { return this.empresaForm.controls; }

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
    let data = this.empresas();
    const s = this.searchCtrl.value?.toLowerCase() ?? '';
    const est = this.estadoCtrl.value ?? '';
    if (s)   data = data.filter(e => e.nombre.toLowerCase().includes(s) || e.ruc.includes(s));
    if (est) data = data.filter(e => e.estado === est);
    return data;
  });

  ngOnInit() {}

  crearEmpresa() {
    if (this.empresaForm.invalid) return;
    this.saving.set(true);
    setTimeout(() => {
      const val = this.empresaForm.value;
      const nueva: EmpresaServicio = {
        id:                 Date.now().toString(),
        nombre:             val.nombre!,
        ruc:                val.ruc!,
        emailCoordinador:   val.emailCoordinador!,
        whatsappCoordinador:val.whatsappCoordinador ?? undefined,
        especialidades:     val.especialidades ?? [],
        capacidadDiariaMax: val.capacidadDiariaMax ?? 5,
        trabajosHoy:        0,
        estado:             'ACTIVA',
        vigenciaContrato:   val.vigenciaContrato ?? undefined
      };
      this.empresas.update(list => [...list, nueva]);
      this.saving.set(false);
      this.mostrarForm.set(false);
      this.empresaForm.reset({ capacidadDiariaMax: 5, especialidades: [] });
      this.snack.open(`Empresa ${nueva.nombre} registrada correctamente`, 'OK', { duration: 3000 });
    }, 600);
  }

  editarCupo(e: EmpresaServicio) {
    const nuevoCupo = prompt(`Nuevo cupo diario para ${e.nombre} (actual: ${e.capacidadDiariaMax})`);
    if (!nuevoCupo || isNaN(+nuevoCupo)) return;
    this.empresas.update(list =>
      list.map(x => x.id === e.id ? { ...x, capacidadDiariaMax: +nuevoCupo } : x)
    );
    this.snack.open(`Cupo de ${e.nombre} actualizado a ${nuevoCupo} trabajos/día`, 'OK', { duration: 3000 });
  }

  toggleEstado(e: EmpresaServicio) {
    const nuevo = e.estado === 'ACTIVA' ? 'INACTIVA' as const : 'ACTIVA' as const;
    this.empresas.update(list => list.map(x => x.id === e.id ? { ...x, estado: nuevo } : x));
    this.snack.open(`${e.nombre} ${nuevo === 'ACTIVA' ? 'activada' : 'desactivada'}`, 'OK', { duration: 3000 });
  }

  isVencida(e: EmpresaServicio): boolean {
    if (!e.vigenciaContrato) return false;
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    return new Date(e.vigenciaContrato) <= limite;
  }

  formatVigencia(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getCatLabel(cat: string) {
    return this.categorias.find(c => c.value === cat)?.label ?? cat;
  }

  getInitials(nombre: string) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  porVencerNombres(): string {
    return this.porVencer().map(e => e.nombre).join(', ');
  }

}