import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-app-company-list",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card style="padding:32px;text-align:center">
      <mat-icon style="font-size:48px;color:#d0cfe8;margin-bottom:16px">construction</mat-icon>
      <h2 style="color:#6b6b8a;margin:0 0 8px">Empresas contratadas</h2>
      <p style="color:#aaa;margin:0">Este componente se desarrollará en la siguiente iteración.</p>
    </mat-card>
  `
})
export class CompanyListComponent {}
