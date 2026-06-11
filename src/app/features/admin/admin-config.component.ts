// src/app/features/admin/admin-config.component.ts
import {
  Component, signal, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { inject } from '@angular/core';

interface ConfigToggle {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

interface LogEntry {
  timestamp: string;
  servicio: string;
  tipo: string;
  descripcion: string;
  actor: string;
}

@Component({
  selector: 'app-admin-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSlideToggleModule, MatDividerModule,
    MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <div class="admin-config">

      <div class="page-header">
        <div>
          <h1>Configuración del sistema</h1>
          <p>Parámetros globales y reglas de negocio de ReparaYa</p>
        </div>
        <button mat-flat-button color="primary" (click)="guardarTodo()">
          <mat-icon>save</mat-icon>
          Guardar cambios
        </button>
      </div>

      <div class="config-grid">

        <!-- COLUMNA IZQUIERDA -->
        <div class="col">

          <!-- TOGGLES DE REGLAS -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>rule</mat-icon>
                Reglas del sistema
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @for (toggle of toggles(); track toggle.key) {
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">{{ toggle.label }}</span>
                    <span class="toggle-desc">{{ toggle.description }}</span>
                  </div>
                  <mat-slide-toggle
                    [checked]="toggle.value"
                    (change)="onToggle(toggle, $event.checked)"
                    color="primary">
                  </mat-slide-toggle>
                </div>
                <mat-divider/>
              }
            </mat-card-content>
          </mat-card>

          <!-- PARÁMETROS NUMÉRICOS -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>tune</mat-icon>
                Parámetros globales
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="paramsForm" class="params-form">

                <div class="param-row">
                  <div class="param-info">
                    <span class="param-label">Horas para escalación automática</span>
                    <span class="param-desc">Tiempo sin asignar antes de escalar prioridad</span>
                  </div>
                  <mat-form-field appearance="outline" class="param-field">
                    <input matInput formControlName="horasEscalacion" type="number" min="1" max="72">
                    <span matSuffix>h</span>
                  </mat-form-field>
                </div>

                <mat-divider/>

                <div class="param-row">
                  <div class="param-info">
                    <span class="param-label">Horas alerta inactividad</span>
                    <span class="param-desc">Tiempo EN_PROGRESO sin actualizar antes de alertar</span>
                  </div>
                  <mat-form-field appearance="outline" class="param-field">
                    <input matInput formControlName="horasInactividad" type="number" min="1" max="168">
                    <span matSuffix>h</span>
                  </mat-form-field>
                </div>

                <mat-divider/>

                <div class="param-row">
                  <div class="param-info">
                    <span class="param-label">Radio duplicados (metros)</span>
                    <span class="param-desc">Radio para agrupar reportes del mismo problema</span>
                  </div>
                  <mat-form-field appearance="outline" class="param-field">
                    <input matInput formControlName="radioMetros" type="number" min="10" max="500">
                    <span matSuffix>m</span>
                  </mat-form-field>
                </div>

                <mat-divider/>

                <div class="param-row">
                  <div class="param-info">
                    <span class="param-label">Timeout sesión bot (minutos)</span>
                    <span class="param-desc">Tiempo de inactividad para cancelar conversación WhatsApp</span>
                  </div>
                  <mat-form-field appearance="outline" class="param-field">
                    <input matInput formControlName="timeoutBot" type="number" min="5" max="120">
                    <span matSuffix>min</span>
                  </mat-form-field>
                </div>

                <mat-divider/>

                <div class="param-row">
                  <div class="param-info">
                    <span class="param-label">Cupo diario por defecto</span>
                    <span class="param-desc">Capacidad inicial asignada a nuevas empresas</span>
                  </div>
                  <mat-form-field appearance="outline" class="param-field">
                    <input matInput formControlName="cupoDefault" type="number" min="1" max="50">
                    <span matSuffix>trab.</span>
                  </mat-form-field>
                </div>

              </form>
            </mat-card-content>
          </mat-card>

        </div>

        <!-- COLUMNA DERECHA -->
        <div class="col">

          <!-- ESTADO DEL SISTEMA -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>monitor_heart</mat-icon>
                Estado del sistema
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @for (svc of servicios(); track svc.nombre) {
                <div class="service-row">
                  <div class="service-dot" [class]="svc.status"></div>
                  <div class="service-info">
                    <span class="service-name">{{ svc.nombre }}</span>
                    <span class="service-desc">{{ svc.descripcion }}</span>
                  </div>
                  <span class="service-status" [class]="svc.status">{{ svc.statusLabel }}</span>
                </div>
                <mat-divider/>
              }
            </mat-card-content>
          </mat-card>

          <!-- LOG DE EVENTOS -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>list_alt</mat-icon>
                Log de eventos recientes
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="log-list">
                @for (log of logs(); track log.timestamp) {
                  <div class="log-row">
                    <span class="log-time">{{ log.timestamp }}</span>
                    <div class="log-body">
                      <span class="log-servicio">{{ log.servicio }}</span>
                      <span class="log-desc">{{ log.descripcion }}</span>
                    </div>
                    <span class="log-actor">{{ log.actor }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- ACCIONES DE MANTENIMIENTO -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>
                <mat-icon>build</mat-icon>
                Mantenimiento
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="maintenance-grid">
                <button mat-stroked-button (click)="accion('Cupos reiniciados manualmente')">
                  <mat-icon>refresh</mat-icon>
                  Reiniciar cupos ahora
                </button>
                <button mat-stroked-button (click)="accion('Caché de empresas invalidada')">
                  <mat-icon>cached</mat-icon>
                  Limpiar caché Redis
                </button>
                <button mat-stroked-button (click)="accion('Sesiones bot expiradas eliminadas')">
                  <mat-icon>chat_bubble</mat-icon>
                  Limpiar sesiones bot
                </button>
                <button mat-stroked-button color="warn" (click)="accion('Exportación de reportes iniciada')">
                  <mat-icon>download</mat-icon>
                  Exportar reportes CSV
                </button>
              </div>
            </mat-card-content>
          </mat-card>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-config { display: flex; flex-direction: column; gap: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start;
      h1 { font-size: 20px; font-weight: 600; margin: 0 0 4px; color: #1a1a2e; }
      p  { font-size: 13px; color: #6b6b8a; margin: 0; }
    }

    .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .col { display: flex; flex-direction: column; gap: 16px; }

    /* TOGGLES */
    mat-card-title { display: flex; align-items: center; gap: 6px; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; gap: 16px; }
    .toggle-info { flex: 1; }
    .toggle-label { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; margin-bottom: 2px; }
    .toggle-desc  { display: block; font-size: 11px; color: #6b6b8a; }

    /* PARAMS */
    .params-form { display: flex; flex-direction: column; }
    .param-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; gap: 16px; }
    .param-info { flex: 1; }
    .param-label { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; margin-bottom: 2px; }
    .param-desc  { display: block; font-size: 11px; color: #6b6b8a; }
    .param-field { width: 110px; flex-shrink: 0; }

    /* SERVICIOS */
    .service-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; }
    .service-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .service-dot.ok   { background: #1D9E75; }
    .service-dot.warn { background: #EF9F27; }
    .service-dot.err  { background: #E24B4A; }
    .service-info { flex: 1; }
    .service-name { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; }
    .service-desc { display: block; font-size: 11px; color: #6b6b8a; }
    .service-status { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
    .service-status.ok   { color: #1D9E75; }
    .service-status.warn { color: #EF9F27; }
    .service-status.err  { color: #E24B4A; }

    /* LOG */
    .log-list { display: flex; flex-direction: column; gap: 0; max-height: 280px; overflow-y: auto; }
    .log-row { display: flex; gap: 8px; padding: 7px 0; border-bottom: 1px solid #f5f4f0; font-size: 12px; }
    .log-row:last-child { border-bottom: none; }
    .log-time   { color: #aaa; white-space: nowrap; font-family: monospace; font-size: 11px; flex-shrink: 0; width: 50px; }
    .log-body   { flex: 1; display: flex; flex-direction: column; gap: 1px; }
    .log-servicio { font-size: 10px; font-weight: 600; color: #2d4a8a; text-transform: uppercase; letter-spacing: .06em; }
    .log-desc   { font-size: 12px; color: #1a1a2e; }
    .log-actor  { font-size: 10px; color: #aaa; white-space: nowrap; flex-shrink: 0; }

    /* MANTENIMIENTO */
    .maintenance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .maintenance-grid button { font-size: 12px; }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @media (max-width: 900px) {
      .config-grid { grid-template-columns: 1fr; }
      .maintenance-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminConfigComponent {
  private snack = inject(MatSnackBar);

  toggles = signal<ConfigToggle[]>([
    { key: 'escalacion',       label: 'Escalación automática',      description: 'Escalar prioridad tras N horas sin asignar',         value: true  },
    { key: 'duplicados',       label: 'Agrupación de duplicados',    description: 'Agrupar reportes en el mismo radio geográfico',       value: true  },
    { key: 'notifWhatsapp',    label: 'Notificaciones WhatsApp',     description: 'Enviar actualizaciones al ciudadano',                 value: true  },
    { key: 'notifEmail',       label: 'Notificaciones email',        description: 'Alertas a empresas y supervisores',                   value: true  },
    { key: 'resetCupos',       label: 'Reinicio automático de cupos',description: 'Resetear trabajos_hoy a medianoche',                  value: true  },
    { key: 'modoMantenimiento',label: 'Modo mantenimiento',          description: 'Deshabilitar el bot de WhatsApp temporalmente',       value: false }
  ]);

  paramsForm = new FormGroup({
    horasEscalacion: new FormControl(24,  [Validators.required, Validators.min(1)]),
    horasInactividad:new FormControl(48,  [Validators.required, Validators.min(1)]),
    radioMetros:     new FormControl(50,  [Validators.required, Validators.min(10)]),
    timeoutBot:      new FormControl(30,  [Validators.required, Validators.min(5)]),
    cupoDefault:     new FormControl(5,   [Validators.required, Validators.min(1)])
  });

  servicios = signal([
    { nombre: 'Keycloak',         descripcion: 'IAM · OAuth2/OIDC · :8080',          status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'Traefik',          descripcion: 'API Gateway · :80',                   status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'Kafka (RedPandas)',  descripcion: 'Mensajería asíncrona · 4 topics',     status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'Redis (Upstash)',  descripcion: 'Caché + sesiones + idempotencia',     status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'MongoDB Atlas',    descripcion: 'report-service · M0',                 status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'PostgreSQL (Neon)',descripcion: '4 schemas · company/user/worker/notif',status: 'ok',   statusLabel: 'Activo'  },
    { nombre: 'WhatsApp API',     descripcion: 'Meta Cloud API · webhook activo',     status: 'warn', statusLabel: 'Simulado' }
  ]);

  logs = signal<LogEntry[]>([
    { timestamp: '21:04',  servicio: 'worker-service',       tipo: 'INFO',  descripcion: 'Reporte #247 asignado a Constructora Lima', actor: 'sistema' },
    { timestamp: '21:03',  servicio: 'bot-service',          tipo: 'INFO',  descripcion: 'Reporte #247 creado vía WhatsApp',           actor: 'bot'     },
    { timestamp: '21:00',  servicio: 'scheduler',            tipo: 'INFO',  descripcion: 'Cupos diarios reiniciados (00:00)',           actor: 'sistema' },
    { timestamp: '20:58',  servicio: 'report-service',       tipo: 'INFO',  descripcion: 'Reporte #246 → CERRADO',                     actor: 'sup1'    },
    { timestamp: '20:45',  servicio: 'notification-service', tipo: 'INFO',  descripcion: 'WhatsApp enviado a +51987654321',             actor: 'sistema' },
    { timestamp: '20:30',  servicio: 'admin',                tipo: 'INFO',  descripcion: 'Cupo de AquaTec SRL actualizado a 10',        actor: 'admin'   },
    { timestamp: '20:15',  servicio: 'worker-service',       tipo: 'WARN',  descripcion: 'Reporte #243 sin asignar > 2h — escalado',   actor: 'sistema' },
    { timestamp: '20:00',  servicio: 'keycloak',             tipo: 'INFO',  descripcion: 'Login exitoso: autoridad1@reparaya.pe',       actor: 'auth'    }
  ]);

  onToggle(toggle: ConfigToggle, value: boolean) {
    this.toggles.update(list =>
      list.map(t => t.key === toggle.key ? { ...t, value } : t)
    );
    this.snack.open(
      `${toggle.label}: ${value ? 'activado' : 'desactivado'}`,
      'OK', { duration: 2000 }
    );
  }

  guardarTodo() {
    this.snack.open('Configuración guardada correctamente', 'OK', { duration: 3000 });
  }

  accion(msg: string) {
    this.snack.open(msg, 'OK', { duration: 3000 });
    const now = new Date();
    const time = now.toTimeString().substring(0, 5);
    this.logs.update(list => [{
      timestamp: time,
      servicio:  'admin',
      tipo:      'INFO',
      descripcion: msg,
      actor:     'admin'
    }, ...list.slice(0, 9)]);
  }
}
