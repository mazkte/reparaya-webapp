// src/app/features/admin/nuevo-usuario-modal.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuarioService } from '../../core/services/user.service';
import { RolEnum } from '../../shared/models';

@Component({
  selector: 'app-nuevo-usuario-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="modal-container">

      <!-- HEADER -->
      <div class="modal-header">
        <div class="header-icon">
          <mat-icon>person_add</mat-icon>
        </div>
        <div>
          <h2 class="modal-title">Nuevo usuario</h2>
          <p class="modal-subtitle">Completa los datos del nuevo usuario del sistema</p>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn" [disabled]="saving()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- FORM -->
      <mat-dialog-content>
        <form [formGroup]="form" class="user-form">

          <!-- Nombre -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre completo</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input matInput formControlName="nombre" placeholder="Ej. María Aldana">
            @if (f['nombre'].hasError('required') && f['nombre'].touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
            @if (f['nombre'].hasError('minlength') && f['nombre'].touched) {
              <mat-error>Mínimo 3 caracteres</mat-error>
            }
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email institucional</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput formControlName="email" type="email" placeholder="usuario@muni-trujillo.gob.pe">
            @if (f['email'].hasError('required') && f['email'].touched) {
              <mat-error>El email es requerido</mat-error>
            }
            @if (f['email'].hasError('email') && f['email'].touched) {
              <mat-error>Ingresa un email válido</mat-error>
            }
          </mat-form-field>

          <!-- Keycloak ID -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Keycloak ID</mat-label>
            <mat-icon matPrefix>key</mat-icon>
            <input matInput formControlName="keycloakId"
                   placeholder="UUID del usuario en Keycloak">
            <mat-hint>Encontrar en Keycloak Admin → Users → ID del usuario</mat-hint>
            @if (f['keycloakId'].hasError('required') && f['keycloakId'].touched) {
              <mat-error>El Keycloak ID es requerido</mat-error>
            }
          </mat-form-field>

          <!-- Rol -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Rol en el sistema</mat-label>
            <mat-icon matPrefix>badge</mat-icon>
            <mat-select formControlName="rol">
              @for (r of roles; track r.value) {
                <mat-option [value]="r.value">
                  {{ r.label }} — {{ r.descripcion }}
                </mat-option>
              }
            </mat-select>
            @if (f['rol'].hasError('required') && f['rol'].touched) {
              <mat-error>Selecciona un rol</mat-error>
            }
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <!-- ACTIONS -->
      <mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()" [disabled]="saving()">
          Cancelar
        </button>
        <button mat-flat-button color="primary"
                (click)="guardar()"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"/>
            Creando...
          } @else {
            <mat-icon>check</mat-icon>
            Crear usuario
          }
        </button>
      </mat-dialog-actions>

    </div>
  `,
  styles: [`
    .modal-container { min-width: 420px; }

    .modal-header {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 20px 20px 4px;
    }

    .header-icon {
      width: 42px; height: 42px; border-radius: 10px;
      background: #eef1f9; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
      mat-icon { color: #2d4a8a; font-size: 22px; }
    }

    .modal-title    { font-size: 17px; font-weight: 600; margin: 0 0 2px; color: #1a1a2e; }
    .modal-subtitle { font-size: 12px; color: #6b6b8a; margin: 0; }
    .close-btn      { margin-left: auto; color: #aaa; }

    .user-form {
      display: flex; flex-direction: column; gap: 4px;
      padding-top: 8px;
    }

    .full-width { width: 100%; }

    mat-dialog-actions { padding: 8px 20px 16px; gap: 8px; }
  `]
})
export class NuevoUsuarioModalComponent {
  private usuarioService = inject(UsuarioService);
  private dialogRef      = inject(MatDialogRef<NuevoUsuarioModalComponent>);
  private snack          = inject(MatSnackBar);

  saving = signal(false);

  roles = [
    { value: 'ROLE_AUTORIDAD'  as RolEnum, label: 'Autoridad',  descripcion: 'Funcionario municipal' },
    { value: 'ROLE_SUPERVISOR' as RolEnum, label: 'Supervisor', descripcion: 'Inspector municipal' },
    { value: 'ROLE_EMPRESA'    as RolEnum, label: 'Empresa',    descripcion: 'Coordinador de empresa' },
    { value: 'ROLE_ADMIN'      as RolEnum, label: 'Admin',      descripcion: 'Administrador TI' }
  ];

  form = new FormGroup({
    nombre:     new FormControl('', [Validators.required, Validators.minLength(3)]),
    email:      new FormControl('', [Validators.required, Validators.email]),
    keycloakId: new FormControl('', Validators.required),
    rol:        new FormControl<RolEnum>('ROLE_AUTORIDAD', Validators.required)
  });

  get f() { return this.form.controls; }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.value;

    this.usuarioService.crear({
      fullName:     val.nombre!,
      email:      val.email!,
      keycloakId: val.keycloakId!,
      rol:        val.rol!
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Usuario creado correctamente', 'OK', { duration: 3000 });
        this.dialogRef.close(true); // true = recargar lista
      },
      error: () => this.saving.set(false)
    });
  }

  cerrar() {
    if (!this.saving()) this.dialogRef.close(false);
  }
}
