// src/app/features/reports/report-list.component.ts
import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import {
  Reporte, ReporteFilter,
  EstadoReporteEnum, CategoriaEnum, PrioridadEnum
} from '../../shared/models';

@Component({
  selector: 'app-report-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatTableModule,
    MatPaginatorModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="report-list">

      <div class="page-header">
        <div>
          <h1>Gestión de reportes</h1>
          <p>{{ totalElements() }} reportes encontrados</p>
        </div>
      </div>

      <!-- FILTROS -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar reporte</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl" placeholder="Título o descripción...">
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
              @for (e of estados; track e.value) {
                <mat-option [value]="e.value">{{ e.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Categoría</mat-label>
            <mat-select [formControl]="categoriaCtrl">
              <mat-option value="">Todas</mat-option>
              @for (c of categorias; track c.value) {
                <mat-option [value]="c.value">{{ c.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Prioridad</mat-label>
            <mat-select [formControl]="prioridadCtrl">
              <mat-option value="">Todas</mat-option>
              @for (p of prioridades; track p.value) {
                <mat-option [value]="p.value">{{ p.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (hasFilters()) {
            <button mat-stroked-button (click)="clearFilters()" class="clear-btn">
              <mat-icon>filter_alt_off</mat-icon>
              Limpiar
            </button>
          }
        </div>

        @if (hasFilters()) {
          <div class="active-filters">
            @if (estadoCtrl.value) {
              <mat-chip (removed)="estadoCtrl.setValue('')">
                Estado: {{ getLabelEstado(estadoCtrl.value) }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip>
            }
            @if (categoriaCtrl.value) {
              <mat-chip (removed)="categoriaCtrl.setValue('')">
                Categoría: {{ getLabelCategoria(categoriaCtrl.value) }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip>
            }
            @if (prioridadCtrl.value) {
              <mat-chip (removed)="prioridadCtrl.setValue('')">
                Prioridad: {{ prioridadCtrl.value }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip>
            }
          </div>
        }
      </mat-card>

      <!-- TABLA -->
      <mat-card class="table-card">
        @if (loading()) {
          <div class="loading">
            <mat-spinner diameter="36"/>
            <span>Cargando reportes...</span>
          </div>
        } @else {
          <table mat-table [dataSource]="reportes()" class="report-table">

            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let r">
                <span class="report-id">#{{ r.id }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="descripcion">
              <th mat-header-cell *matHeaderCellDef>Reporte</th>
              <td mat-cell *matCellDef="let r">
                <div class="report-info">
                  <span class="report-title">{{ r.titulo }}</span>
                  <span class="report-location">
                    <mat-icon class="loc-icon">location_on</mat-icon>
                    {{ r.ubicacion.direccion ?? 'Sin ubicación' }}
                  </span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="categoria">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [ngClass]="'cat-' + r.categoria">
                  {{ getLabelCategoria(r.categoria) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [ngClass]="'estado-' + r.estado">
                  {{ getLabelEstado(r.estado) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="empresa">
              <th mat-header-cell *matHeaderCellDef>Empresa</th>
              <td mat-cell *matCellDef="let r">
                @if (r.empresaNombre) {
                  <span class="empresa-badge">
                    <mat-icon class="emp-icon">business</mat-icon>
                    {{ r.empresaNombre }}
                  </span>
                } @else {
                  <span class="sin-asignar">Sin asignar</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="prioridad">
              <th mat-header-cell *matHeaderCellDef>Prioridad</th>
              <td mat-cell *matCellDef="let r">
                <span class="chip" [ngClass]="'prioridad-' + r.prioridad">
                  {{ r.prioridad }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let r">
                <span class="fecha">{{ formatDate(r.fechaCreacion) }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button [routerLink]="['/reportes', r.id]" matTooltip="Ver detalle">
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="report-row"
                [routerLink]="['/reportes', row.id]">
            </tr>

            <tr class="mat-row no-data-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>search_off</mat-icon>
                <p>No se encontraron reportes con los filtros aplicados.</p>
                <button mat-button (click)="clearFilters()">Limpiar filtros</button>
              </td>
            </tr>
          </table>

          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25]"
            (page)="onPage($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .report-list { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
    .page-header p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    .filter-card { padding: 16px !important; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .search-field { min-width: 240px; flex: 1; }
    .filter-field { min-width: 140px; }
    .clear-btn { height: 56px; }
    .active-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f0efea; }
    .table-card { overflow: hidden; padding: 0 !important; }
    .loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px; color: #6b6b8a; font-size: 13px; }
    .report-table { width: 100%; }
    .report-id { font-family: monospace; font-size: 12px; font-weight: 600; color: #6b6b8a; }
    .report-info { display: flex; flex-direction: column; gap: 3px; }
    .report-title { font-size: 13px; font-weight: 500; color: #1a1a2e; }
    .report-location { display: flex; align-items: center; gap: 2px; font-size: 11px; color: #6b6b8a; }
    .loc-icon { font-size: 12px; width: 12px; height: 12px; }
    .chip { display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
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
    .empresa-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #2d4a8a; background: #eef1f9; padding: 2px 8px; border-radius: 4px; }
    .emp-icon { font-size: 13px; width: 13px; height: 13px; }
    .sin-asignar { font-size: 11px; color: #aaa; font-style: italic; }
    .fecha { font-size: 11px; color: #6b6b8a; }
    .report-row { cursor: pointer; }
    .report-row:hover td { background: #f9f8f5; }
    .no-data { text-align: center; padding: 48px !important; color: #6b6b8a; }
    .no-data mat-icon { font-size: 40px; width: 40px; height: 40px; color: #d0cfe8; display: block; margin: 0 auto 12px; }
    .no-data p { margin: 0 0 16px; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class ReportListComponent implements OnInit {
  private reporteService = inject(ReporteService);

  reportes      = signal<Reporte[]>([]);
  totalElements = signal(0);
  loading       = signal(false);
  pageSize      = 10;
  currentPage   = 0;

  searchCtrl    = new FormControl('');
  estadoCtrl    = new FormControl('');
  categoriaCtrl = new FormControl('');
  prioridadCtrl = new FormControl('');

  displayedColumns = ['id', 'descripcion', 'categoria', 'estado', 'empresa', 'prioridad', 'fecha', 'acciones'];

  estados = [
    { value: 'PENDIENTE' as EstadoReporteEnum,   label: 'Pendiente' },
    { value: 'EN_REVISION' as EstadoReporteEnum, label: 'En revisión' },
    { value: 'ASIGNADA' as EstadoReporteEnum,    label: 'Asignada' },
    { value: 'EN_PROGRESO' as EstadoReporteEnum, label: 'En progreso' },
    { value: 'EJECUTADO' as EstadoReporteEnum,   label: 'Ejecutado' },
    { value: 'CERRADO' as EstadoReporteEnum,     label: 'Cerrado' }
  ];

  categorias = [
    { value: 'VIALIDAD' as CategoriaEnum,       label: 'Vialidad' },
    { value: 'ALUMBRADO' as CategoriaEnum,      label: 'Alumbrado' },
    { value: 'AGUA_POTABLE' as CategoriaEnum,   label: 'Agua potable' },
    { value: 'ALCANTARILLADO' as CategoriaEnum, label: 'Alcantarillado' },
    { value: 'OTRO' as CategoriaEnum,           label: 'Otro' }
  ];

  prioridades = [
    { value: 'BAJA' as PrioridadEnum,   label: 'Baja' },
    { value: 'MEDIA' as PrioridadEnum,  label: 'Media' },
    { value: 'ALTA' as PrioridadEnum,   label: 'Alta' },
    { value: 'CRITICA' as PrioridadEnum,label: 'Crítica' }
  ];

  hasFilters = computed(() =>
    !!(this.estadoCtrl.value || this.categoriaCtrl.value ||
       this.prioridadCtrl.value || this.searchCtrl.value)
  );

  ngOnInit() {
    this.loadReportes();
    [this.estadoCtrl, this.categoriaCtrl, this.prioridadCtrl].forEach(ctrl =>
      ctrl.valueChanges.subscribe(() => { this.currentPage = 0; this.loadReportes(); })
    );
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.currentPage = 0; this.loadReportes(); });
  }

  loadReportes() {
    this.loading.set(true);
    const filter: ReporteFilter = {
      estado:    (this.estadoCtrl.value as EstadoReporteEnum) || undefined,
      categoria: (this.categoriaCtrl.value as CategoriaEnum) || undefined,
      prioridad: (this.prioridadCtrl.value as PrioridadEnum) || undefined,
      search:    this.searchCtrl.value || undefined
    };
    this.reporteService.getReportes(filter, this.currentPage, this.pageSize).subscribe({
      next: res => { this.reportes.set(res.content); this.totalElements.set(res.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onPage(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize    = event.pageSize;
    this.loadReportes();
  }

  clearFilters() {
    this.estadoCtrl.setValue('');
    this.categoriaCtrl.setValue('');
    this.prioridadCtrl.setValue('');
    this.searchCtrl.setValue('');
  }

  getLabelEstado(estado: string)   { return this.estados.find(e => e.value === estado)?.label ?? estado; }
  getLabelCategoria(cat: string)   { return this.categorias.find(c => c.value === cat)?.label ?? cat; }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 60)   return 'Hace ' + diff + ' min';
    if (diff < 1440) return 'Hace ' + Math.floor(diff / 60) + 'h';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
