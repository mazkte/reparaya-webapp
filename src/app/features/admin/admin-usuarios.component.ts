// src/app/features/admin/admin-usuarios.component.ts
import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuarioService, CrearUsuarioRequest } from '../../core/services/user.service';
import { Usuario, RolEnum } from '../../shared/models';
import { NuevoUsuarioModalComponent } from './nuevo-usuario-modal.component';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatTableModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule, MatChipsModule,
    MatProgressSpinnerModule, MatProgressBarModule
  ],
  template: `
    <div class="admin-usuarios">

      <!-- CABECERA -->
      <div class="page-header">
        <div>
          <h1>Gestión de usuarios</h1>
          <p>{{ usuariosFiltrados().length }} usuarios encontrados</p>
        </div>
        <button mat-flat-button color="primary" (click)="abrirModalNuevoUsuario()">
          <mat-icon>person_add</mat-icon>
          Nuevo usuario
        </button>
      </div>

      <!-- LOADING BAR global -->
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" color="primary"/>
      }

      <!-- MÉTRICAS -->
      <div class="metrics-row">
        @for (rol of rolesStats(); track rol.rol) {
          <mat-card class="metric-card">
            <div class="metric-icon" [style.background]="getRolColor(rol.rol).bg">
              <mat-icon [style.color]="getRolColor(rol.rol).text">{{ getRolIcon(rol.rol) }}</mat-icon>
            </div>
            <div>
              <span class="m-val">{{ rol.count }}</span>
              <span class="m-label">{{ getRolLabel(rol.rol) }}s</span>
            </div>
          </mat-card>
        }
      </div>

      <!-- FILTROS -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar usuario</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl" placeholder="Nombre o email...">
            @if (searchCtrl.value) {
              <button matSuffix mat-icon-button (click)="searchCtrl.setValue('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Rol</mat-label>
            <mat-select [formControl]="rolCtrl">
              <mat-option value="">Todos</mat-option>
              @for (r of roles; track r.value) {
                <mat-option [value]="r.value">{{ r.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- TABLA -->
      <mat-card class="table-card">
        @if (loading() && usuarios().length === 0) {
          <div class="loading-center">
            <mat-spinner diameter="36"/>
            <span>Cargando usuarios...</span>
          </div>
        } @else {
          <table mat-table [dataSource]="usuariosFiltrados()" class="w-full">

            <ng-container matColumnDef="usuario">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let u">
                <div class="user-cell">
                  <div class="user-avatar" [style.background]="getRolColor(u.rol).bg">
                    <span [style.color]="getRolColor(u.rol).text">{{ getInitials(u.fullName) }}</span>
                  </div>
                  <div>
                    <span class="user-name">{{ u.fullName }}</span>
                    <span class="user-email">{{ u.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="rol">
              <th mat-header-cell *matHeaderCellDef>Rol</th>
              <td mat-cell *matCellDef="let u">
                <span class="chip" [ngClass]="'rol-' + u.rol">
                  {{ getRolLabel(u.rol) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let u">
                <span class="chip" [ngClass]="u.status === 'ACTIVE' ? 'estado-activo' : 'estado-inactivo'">
                  {{ u.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <div class="actions-cell">

                  <!-- Cambiar rol -->
                  <button mat-icon-button matTooltip="Cambiar rol"
                          [disabled]="accionando() === u.id"
                          (click)="abrirCambiarRol(u)">
                    @if (accionando() === u.id + '_rol') {
                      <mat-spinner diameter="18"/>
                    } @else {
                      <mat-icon>manage_accounts</mat-icon>
                    }
                  </button>

                  <!-- Resetear contraseña -->
                  <button mat-icon-button matTooltip="Resetear contraseña"
                          [disabled]="accionando() === u.id + '_pass'"
                          (click)="resetPassword(u)">
                    @if (accionando() === u.id + '_pass') {
                      <mat-spinner diameter="18"/>
                    } @else {
                      <mat-icon>lock_reset</mat-icon>
                    }
                  </button>

                  <!-- Activar/Desactivar -->
                  <button mat-icon-button
                          [matTooltip]="u.estado === 'ACTIVE' ? 'Desactivar' : 'Activar'"
                          [disabled]="accionando() === u.id + '_estado'"
                          (click)="toggleEstado(u)">
                    @if (accionando() === u.id + '_estado') {
                      <mat-spinner diameter="18"/>
                    } @else {
                      <mat-icon>{{ u.estado === 'ACTIVE' ? 'person_off' : 'person' }}</mat-icon>
                    }
                  </button>

                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="user-row"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>search_off</mat-icon>
                <p>No se encontraron usuarios</p>
              </td>
            </tr>
          </table>
        }
      </mat-card>

    </div>
  `,
  styles: [`
    .admin-usuarios { display: flex; flex-direction: column; gap: 16px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }

    mat-progress-bar { border-radius: 2px; }

    .metrics-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .metric-card { display: flex; align-items: center; gap: 12px; padding: 14px !important; }
    .metric-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .m-val   { display: block; font-size: 22px; font-weight: 600; color: #1a1a2e; }
    .m-label { display: block; font-size: 11px; color: #6b6b8a; }

    .filter-card { padding: 16px !important; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-field { min-width: 240px; flex: 1; }
    .filter-field { min-width: 160px; }

    .table-card { overflow: hidden; padding: 0 !important; }
    .w-full { width: 100%; }

    .loading-center {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; color: #6b6b8a; font-size: 13px;
    }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
    }
    .user-name  { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; }
    .user-email { display: block; font-size: 11px; color: #6b6b8a; }

    .actions-cell { display: flex; gap: 0; }
    .user-row:hover td { background: #f9f8f5; }

    .no-data { text-align: center; padding: 48px !important; color: #6b6b8a;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: #d0cfe8; display: block; margin: 0 auto 8px; }
      p { margin: 0; }
    }

    .chip { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .rol-ROLE_AUTORIDAD  { background: #eef1f9; color: #2d4a8a; }
    .rol-ROLE_SUPERVISOR { background: #fff8e8; color: #7a5c00; }
    .rol-ROLE_EMPRESA    { background: #eaf4ef; color: #2d7a5a; }
    .rol-ROLE_ADMIN      { background: #fce8e8; color: #791f1f; }
    .estado-activo   { background: #eaf4ef; color: #27500A; }
    .estado-inactivo { background: #f1efea; color: #666; }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @media (max-width: 700px) { .metrics-row { grid-template-columns: repeat(2,1fr); } }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private dialog         = inject(MatDialog);
  private snack          = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);

  usuarios   = signal<Usuario[]>([]);
  loading    = signal(false);
  accionando = signal<string>(''); 

  // Signals para los filtros
  searchText = signal('');
  rolFilter  = signal('');

  searchCtrl = new FormControl('');
  rolCtrl    = new FormControl('');

  displayedColumns = ['usuario', 'rol', 'estado', 'acciones'];

  roles = [
    { value: 'ROLE_AUTORIDAD'  as RolEnum, label: 'Autoridad' },
    { value: 'ROLE_SUPERVISOR' as RolEnum, label: 'Supervisor' },
    { value: 'ROLE_EMPRESA'    as RolEnum, label: 'Empresa' },
    { value: 'ROLE_ADMIN'      as RolEnum, label: 'Admin' }
  ];

  rolesStats = computed(() => {
    const counts: Record<string, number> = {};
    this.usuarios().forEach(u => { counts[u.rol] = (counts[u.rol] ?? 0) + 1; });
    return this.roles.map(r => ({ rol: r.value, count: counts[r.value] ?? 0 }));
  });

 usuariosFiltrados = computed(() => {
    const s = this.searchText().toLowerCase();
    const r = this.rolFilter();
    return this.usuarios().filter(u => {
      const matchSearch = !s ||
        (u.fullName?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
      const matchRol = !r || u.rol === r;
      return matchSearch && matchRol;
    });
  });

  ngOnInit() {
    this.cargarUsuarios();
    
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.searchText.set(val ?? '');
      this.cdr.markForCheck();
    });

    this.rolCtrl.valueChanges.subscribe(val => {
      this.rolFilter.set(val ?? '');
      this.cdr.markForCheck();
    });

  }

   limpiarBusqueda() {
    this.searchCtrl.setValue('');
    this.searchText.set('');
    this.cdr.markForCheck();
  }

  cargarUsuarios() {
    this.loading.set(true);
    this.usuarioService.listarTodos().subscribe({
      next:  us => { 
        this.usuarios.set(us); 
        this.loading.set(false); 
        this.cdr.markForCheck();
      },
      error: ()  => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  abrirModalNuevoUsuario() {
    const ref = this.dialog.open(NuevoUsuarioModalComponent, {
      width: '480px',
      disableClose: true
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.cargarUsuarios();
    });
  }

  abrirCambiarRol(u: Usuario) {
    const roles: RolEnum[] = ['ROLE_AUTORIDAD','ROLE_SUPERVISOR','ROLE_EMPRESA','ROLE_ADMIN'];
    const idx = roles.indexOf(u.rol);
    const nuevoRol = roles[(idx + 1) % roles.length];

    this.accionando.set(u.id + '_rol');
    this.usuarioService.cambiarRol(u.id, { rol: nuevoRol }).subscribe({
      next: updated => {
        this.usuarios.update(list => list.map(x => x.id === u.id ? updated : x));
        this.accionando.set('');
        this.cdr.markForCheck();
        this.snack.open(`Rol de ${u.fullName} → ${this.getRolLabel(nuevoRol)}`, 'OK', { duration: 3000 });
      },
      error: () => { this.accionando.set(''); this.cdr.markForCheck(); }
    });
  }

  toggleEstado(u: Usuario) {
    const nuevoEstado = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.accionando.set(u.id + '_estado');
    this.usuarioService.cambiarEstado(u.id, { status: nuevoEstado }).subscribe({
      next: updated => {
        this.usuarios.update(list => list.map(x => x.id === u.id ? updated : x));
        this.accionando.set('');
        this.cdr.markForCheck();
        this.snack.open(`${u.fullName} ${nuevoEstado === 'ACTIVE' ? 'activado' : 'desactivado'}`, 'OK', { duration: 3000 });
      },
      error: () => { this.accionando.set(''); this.cdr.markForCheck(); }
    });
  }

  resetPassword(u: Usuario) {
    this.accionando.set(u.id + '_pass');
    this.usuarioService.resetPassword(u.id).subscribe({
      next: () => {
        this.accionando.set('');
        this.cdr.markForCheck();
        this.snack.open(`Contraseña de ${u.fullName} reseteada`, 'OK', { duration: 3000 });
      },
      error: () => { this.accionando.set(''); this.cdr.markForCheck(); }
    });
  }

  getRolLabel(rol: string)  { return this.roles.find(r => r.value === rol)?.label ?? rol; }
  getRolIcon(rol: string) {
    const icons: Record<string,string> = {
      ROLE_AUTORIDAD: 'account_balance', ROLE_SUPERVISOR: 'shield',
      ROLE_EMPRESA: 'business', ROLE_ADMIN: 'admin_panel_settings'
    };
    return icons[rol] ?? 'person';
  }
  getRolColor(rol: string) {
    const colors: Record<string,{bg:string;text:string}> = {
      ROLE_AUTORIDAD:  { bg: '#eef1f9', text: '#2d4a8a' },
      ROLE_SUPERVISOR: { bg: '#fff8e8', text: '#7a5c00' },
      ROLE_EMPRESA:    { bg: '#eaf4ef', text: '#2d7a5a' },
      ROLE_ADMIN:      { bg: '#fce8e8', text: '#791f1f' }
    };
    return colors[rol] ?? { bg: '#f1efea', text: '#555' };
  }
  getInitials(fullName: string) {
    console.log('fullName:' +fullName);
     if (!fullName) return '?';
    return fullName.split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .substring(0, 2)
    .toUpperCase();
  }
}
