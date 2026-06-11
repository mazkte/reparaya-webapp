// src/app/shared/components/error-dialog/error-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ErrorDialogData {
  titulo:   string;
  mensaje:  string;
  detalle?: string[];
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-dialog">
      <div class="dialog-header">
        <div class="error-icon">
          <mat-icon>error_outline</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">{{ data.titulo }}</h2>
        </div>
        <button mat-icon-button (click)="cerrar()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p class="error-mensaje">{{ data.mensaje }}</p>

        @if (data.detalle && data.detalle.length > 0) {
          <div class="error-detalle">
            <p class="detalle-titulo">Detalle de errores:</p>
            <ul>
              @for (d of data.detalle; track d) {
                <li>{{ d }}</li>
              }
            </ul>
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-flat-button color="warn" (click)="cerrar()">
          Entendido
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .error-dialog { min-width: 360px; }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 8px;
    }

    .error-icon {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #fce8e8;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { color: #E24B4A; font-size: 22px; }
    }

    .dialog-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
      flex: 1;
    }

    .close-btn { color: #aaa; margin-left: auto; }

    .error-mensaje {
      font-size: 14px;
      color: #444;
      margin: 0 0 12px;
      line-height: 1.5;
    }

    .error-detalle {
      background: #f9f8f5;
      border: 1px solid #e0dfd8;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 8px;
    }

    .detalle-titulo {
      font-size: 12px;
      font-weight: 600;
      color: #6b6b8a;
      margin: 0 0 6px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      li {
        font-size: 13px;
        color: #444;
        margin-bottom: 3px;
      }
    }
  `]
})
export class ErrorDialogComponent {
  data    = inject<ErrorDialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<ErrorDialogComponent>);

  cerrar() { this.ref.close(); }
}
