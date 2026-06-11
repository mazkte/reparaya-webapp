// src/app/features/companies/nueva-empresa-modal.component.ts
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
import { EmpresaService } from '../../core/services/empresa.service';
import { CategoriaEnum } from '../../shared/models';

@Component({
  selector: 'app-nueva-empresa-modal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-icon">
          <mat-icon>add_business</mat-icon>
        </div>
        <div>
          <h2 class="modal-title">Nueva empresa</h2>
          <p class="modal-subtitle">Registra una nueva empresa contratada</p>
        </div>
        <button mat-icon-button (click)="cerrar()" [disabled]="saving()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="empresa-form">

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre de la empresa</mat-label>
              <mat-icon matPrefix>business</mat-icon>
              <input matInput formControlName="nombre" placeholder="Ej. Constructora Lima SAC">
              @if (f['nombre'].hasError('required') && f['nombre'].touched) {
                <mat-error>Requerido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>RUC</mat-label>
              <mat-icon matPrefix>badge</mat-icon>
              <input matInput formControlName="ruc" placeholder="20XXXXXXXXX" maxlength="11">
              @if (f['ruc'].hasError('pattern') && f['ruc'].touched) {
                <mat-error>RUC inválido — 11 dígitos</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Email coordinador</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput formControlName="emailCoordinador" type="email">
              @if (f['emailCoordinador'].hasError('email') && f['emailCoordinador'].touched) {
                <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>WhatsApp coordinador</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
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
              @if (f['especialidades'].hasError('required') && f['especialidades'].touched) {
                <mat-error>Selecciona al menos una</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Capacidad diaria máx.</mat-label>
              <mat-icon matPrefix>groups</mat-icon>
              <input matInput formControlName="capacidadDiariaMax" type="number" min="1" max="100">
              <span matSuffix>trabajos</span>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Vigencia del contrato</mat-label>
            <mat-icon matPrefix>event</mat-icon>
            <input matInput formControlName="vigenciaContrato" type="date">
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()" [disabled]="saving()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="guardar()"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" style="display:inline-block;margin-right:8px"/>
            Registrando...
          } @else {
            <mat-icon>check</mat-icon>
            Registrar empresa
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .modal-container { min-width: 500px; }
    .modal-header { display: flex; align-items: flex-start; gap: 12px; padding: 20px 20px 4px; }
    .header-icon { width: 42px; height: 42px; border-radius: 10px; background: #eaf4ef; display: flex; align-items: center; justify-content: center; flex-shrink: 0; mat-icon { color: #1D9E75; font-size: 22px; } }
    .modal-title    { font-size: 17px; font-weight: 600; margin: 0 0 2px; color: #1a1a2e; }
    .modal-subtitle { font-size: 12px; color: #6b6b8a; margin: 0; }
    .empresa-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; }
    mat-dialog-actions { padding: 8px 20px 16px; gap: 8px; }
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class NuevaEmpresaModalComponent {
  private empresaService = inject(EmpresaService);
  private dialogRef      = inject(MatDialogRef<NuevaEmpresaModalComponent>);
  private snack          = inject(MatSnackBar);

  saving = signal(false);

  categorias = [
    { value: 'VIALIDAD'       as CategoriaEnum, label: 'Vialidad'       },
    { value: 'ALUMBRADO'      as CategoriaEnum, label: 'Alumbrado'      },
    { value: 'AGUA_POTABLE'   as CategoriaEnum, label: 'Agua potable'   },
    { value: 'ALCANTARILLADO' as CategoriaEnum, label: 'Alcantarillado' },
    { value: 'OTRO'           as CategoriaEnum, label: 'Otro'           }
  ];

  form = new FormGroup({
    nombre:              new FormControl('', Validators.required),
    ruc:                 new FormControl('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    emailCoordinador:    new FormControl('', [Validators.required, Validators.email]),
    whatsappCoordinador: new FormControl(''),
    especialidades:      new FormControl<CategoriaEnum[]>([], Validators.required),
    capacidadDiariaMax:  new FormControl(5, [Validators.required, Validators.min(1)]),
    vigenciaContrato:    new FormControl('')
  });

  get f() { return this.form.controls; }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.value;
    this.empresaService.crear({
      nombre:              val.nombre!,
      ruc:                 val.ruc!,
      emailCoordinador:    val.emailCoordinador!,
      whatsappCoordinador: val.whatsappCoordinador!,
      especialidades:      val.especialidades!,
      capacidadDiariaMax:  val.capacidadDiariaMax!,
      vigenciaContrato:    val.vigenciaContrato!
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Empresa registrada correctamente', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false)
    });
  }

  cerrar() { if (!this.saving()) this.dialogRef.close(false); }
}
