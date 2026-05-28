// src/app/features/admin/admin-usuarios.component.ts
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Usuario, RolEnum } from '../../shared/models';
import { MOCK_USUARIOS } from '../../core/services/mock-data';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatTableModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule, MatChipsModule, MatDividerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="admin-usuarios">

      <!-- CABECERA -->
      <div class="page-header">
        <div>
          <h1>Gestión de usuarios</h1>
          <p>{{ usuarios().length }} usuarios registrados en el sistema</p>
        </div>
        <button mat-flat-button color="primary" (click)="mostrarFormulario.set(!mostrarFormulario())">
          <mat-icon>{{ mostrarFormulario() ? 'close' : 'person_add' }}</mat-icon>
          {{ mostrarFormulario() ? 'Cancelar' : 'Nuevo usuario' }}
        </button>
      </div>

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

      <!-- FORMULARIO NUEVO USUARIO -->
      @if (mostrarFormulario()) {
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person_add</mat-icon>
              Crear nuevo usuario
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="nuevoUsuarioForm" (ngSubmit)="crearUsuario()" class="user-form">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre completo</mat-label>
                  <input matInput formControlName="nombre" placeholder="Ej. María Aldana">
                  @if (nuevoUsuarioForm.get('nombre')?.hasError('required') && nuevoUsuarioForm.get('nombre')?.touched) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email institucional</mat-label>
                  <input matInput formControlName="email" placeholder="usuario@muni.pe" type="email">
                  @if (nuevoUsuarioForm.get('email')?.hasError('email') && nuevoUsuarioForm.get('email')?.touched) {
                    <mat-error>Email inválido</mat-error>
                  }
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Rol</mat-label>
                  <mat-select formControlName="rol">
                    @for (r of roles; track r.value) {
                      <mat-option [value]="r.value">{{ r.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Contraseña temporal</mat-label>
                  <input matInput formControlName="password" type="password" placeholder="Mín. 8 caracteres">
                </mat-form-field>
              </div>
              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="nuevoUsuarioForm.invalid || saving()">
                  @if (saving()) { <mat-spinner diameter="18" style="display:inline-block"/> }
                  @else { <mat-icon>check</mat-icon> }
                  Crear usuario
                </button>
                <button mat-button type="button" (click)="mostrarFormulario.set(false)">Cancelar</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- FILTROS -->
      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar usuario</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="searchCtrl" placeholder="Nombre o email...">
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
        <table mat-table [dataSource]="usuariosFiltrados()" class="w-full">

          <ng-container matColumnDef="usuario">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <div class="user-avatar" [style.background]="getRolColor(u.rol).bg">
                  <span [style.color]="getRolColor(u.rol).text">{{ getInitials(u.nombre) }}</span>
                </div>
                <div>
                  <span class="user-name">{{ u.nombre }}</span>
                  <span class="user-email">{{ u.email }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip" [ngClass]="'rol-' + u.rol">
                <mat-icon class="chip-icon">{{ getRolIcon(u.rol) }}</mat-icon>
                {{ getRolLabel(u.rol) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let u">
              <span class="chip" [ngClass]="u.estado === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo'">
                {{ u.estado }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u">
              <div class="actions-cell">
                <button mat-icon-button matTooltip="Cambiar rol" (click)="editarRol(u)">
                  <mat-icon>manage_accounts</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Resetear contraseña" (click)="resetPassword(u)">
                  <mat-icon>lock_reset</mat-icon>
                </button>
                <button mat-icon-button
                        [matTooltip]="u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'"
                        (click)="toggleEstado(u)">
                  <mat-icon>{{ u.estado === 'ACTIVO' ? 'person_off' : 'person' }}</mat-icon>
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
      </mat-card>

    </div>
  `,
  styles: [`
    .admin-usuarios { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }

    .metrics-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .metric-card { display: flex; align-items: center; gap: 12px; padding: 14px !important; }
    .metric-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { font-size: 22px; } }
    .m-val { display: block; font-size: 22px; font-weight: 600; color: #1a1a2e; }
    .m-label { display: block; font-size: 11px; color: #6b6b8a; }

    .form-card { border: 1px solid #2d4a8a !important; }
    .form-card mat-card-title { display: flex; align-items: center; gap: 6px; color: #2d4a8a; }
    .user-form { display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-actions { display: flex; gap: 10px; padding-top: 8px; }

    .filter-card { padding: 16px !important; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .search-field { min-width: 240px; flex: 1; }
    .filter-field { min-width: 160px; }

    .table-card { overflow: hidden; padding: 0 !important; }
    .w-full { width: 100%; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
    }
    .user-name { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; }
    .user-email { display: block; font-size: 11px; color: #6b6b8a; }

    .actions-cell { display: flex; gap: 0; }

    .user-row:hover td { background: #f9f8f5; }

    .no-data { text-align: center; padding: 48px !important; color: #6b6b8a;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: #d0cfe8; display: block; margin: 0 auto 8px; }
      p { margin: 0; }
    }

    .chip { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: .04em; }
    .chip-icon { font-size: 12px; width: 12px; height: 12px; }

    .rol-ROLE_AUTORIDAD { background: #eef1f9; color: #2d4a8a; }
    .rol-ROLE_SUPERVISOR { background: #fff8e8; color: #7a5c00; }
    .rol-ROLE_EMPRESA    { background: #eaf4ef; color: #2d7a5a; }
    .rol-ROLE_ADMIN      { background: #fce8e8; color: #791f1f; }
    .estado-activo   { background: #eaf4ef; color: #27500A; }
    .estado-inactivo { background: #f1efea; color: #666; }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @media (max-width: 700px) {
      .metrics-row { grid-template-columns: repeat(2,1fr); }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  private snack = inject(MatSnackBar);

  usuarios     = signal<Usuario[]>([...MOCK_USUARIOS]);
  saving       = signal(false);
  mostrarFormulario = signal(false);

  searchCtrl = new FormControl('');
  rolCtrl    = new FormControl('');

  displayedColumns = ['usuario', 'rol', 'estado', 'acciones'];

  roles = [
    { value: 'ROLE_AUTORIDAD'  as RolEnum, label: 'Autoridad' },
    { value: 'ROLE_SUPERVISOR' as RolEnum, label: 'Supervisor' },
    { value: 'ROLE_EMPRESA'    as RolEnum, label: 'Empresa' },
    { value: 'ROLE_ADMIN'      as RolEnum, label: 'Admin' }
  ];

  nuevoUsuarioForm = new FormGroup({
    nombre:   new FormControl('', [Validators.required, Validators.minLength(3)]),
    email:    new FormControl('', [Validators.required, Validators.email]),
    rol:      new FormControl<RolEnum>('ROLE_AUTORIDAD', Validators.required),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  rolesStats = computed(() => {
    const counts: Record<string, number> = {};
    this.usuarios().forEach(u => { counts[u.rol] = (counts[u.rol] ?? 0) + 1; });
    return this.roles.map(r => ({ rol: r.value, count: counts[r.value] ?? 0 }));
  });

  usuariosFiltrados = computed(() => {
    let data = this.usuarios();
    const search = this.searchCtrl.value?.toLowerCase() ?? '';
    const rol    = this.rolCtrl.value ?? '';
    if (search) data = data.filter(u => u.nombre.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    if (rol)    data = data.filter(u => u.rol === rol);
    return data;
  });

  ngOnInit() {
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {});
    this.rolCtrl.valueChanges.subscribe(() => {});
  }

  crearUsuario() {
    if (this.nuevoUsuarioForm.invalid) return;
    this.saving.set(true);
    setTimeout(() => {
      const val = this.nuevoUsuarioForm.value;
      const nuevo: Usuario = {
        id: Date.now().toString(),
        nombre: val.nombre!,
        email:  val.email!,
        rol:    val.rol!,
        estado: 'ACTIVO',
        keycloakId: 'kc-' + Date.now()
      };
      this.usuarios.update(list => [...list, nuevo]);
      this.saving.set(false);
      this.mostrarFormulario.set(false);
      this.nuevoUsuarioForm.reset({ rol: 'ROLE_AUTORIDAD' });
      this.snack.open(`Usuario ${nuevo.nombre} creado correctamente`, 'OK', { duration: 3000 });
    }, 600);
  }

  editarRol(u: Usuario) {
    const roles: RolEnum[] = ['ROLE_AUTORIDAD', 'ROLE_SUPERVISOR', 'ROLE_EMPRESA', 'ROLE_ADMIN'];
    const idx = roles.indexOf(u.rol);
    const nuevoRol = roles[(idx + 1) % roles.length];
    this.usuarios.update(list => list.map(x => x.id === u.id ? { ...x, rol: nuevoRol } : x));
    this.snack.open(`Rol de ${u.nombre} cambiado a ${this.getRolLabel(nuevoRol)}`, 'OK', { duration: 3000 });
  }

  toggleEstado(u: Usuario) {
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.usuarios.update(list => list.map(x => x.id === u.id ? { ...x, estado: nuevoEstado } : x));
    this.snack.open(`${u.nombre} ${nuevoEstado === 'ACTIVO' ? 'activado' : 'desactivado'}`, 'OK', { duration: 3000 });
  }

  resetPassword(u: Usuario) {
    this.snack.open(`Contraseña de ${u.nombre} reseteada — se envió email`, 'OK', { duration: 3000 });
  }

  getRolLabel(rol: string)  {
    return this.roles.find(r => r.value === rol)?.label ?? rol;
  }
  getRolIcon(rol: string) {
    const icons: Record<string,string> = {
      ROLE_AUTORIDAD: 'account_balance', ROLE_SUPERVISOR: 'shield',
      ROLE_EMPRESA: 'business', ROLE_ADMIN: 'admin_panel_settings'
    };
    return icons[rol] ?? 'person';
  }
  getRolColor(rol: string) {
    const colors: Record<string,{bg:string;text:string}> = {
      ROLE_AUTORIDAD: { bg: '#eef1f9', text: '#2d4a8a' },
      ROLE_SUPERVISOR:{ bg: '#fff8e8', text: '#7a5c00' },
      ROLE_EMPRESA:   { bg: '#eaf4ef', text: '#2d7a5a' },
      ROLE_ADMIN:     { bg: '#fce8e8', text: '#791f1f' }
    };
    return colors[rol] ?? { bg: '#f1efea', text: '#555' };
  }
  getInitials(nombre: string) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }
}
