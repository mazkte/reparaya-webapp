// src/app/shared/components/error-dialog/error-dialog.service.ts
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from './error-dialog.component';

@Injectable({ providedIn: 'root' })
export class ErrorDialogService {
  private dialog = inject(MatDialog);

  mostrar(data: ErrorDialogData): void {
    // Evitar múltiples dialogs de error apilados
    if (this.dialog.openDialogs.length > 0) return;

    this.dialog.open(ErrorDialogComponent, {
      data,
      width: '440px',
      disableClose: false,
      panelClass: 'error-dialog-panel'
    });
  }
}
