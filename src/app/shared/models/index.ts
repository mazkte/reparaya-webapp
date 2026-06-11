// src/app/shared/models/index.ts

// ─── Enumeraciones ────────────────────────────────────────
export type CategoriaEnum =
  | 'VIALIDAD'
  | 'ALUMBRADO'
  | 'AGUA_POTABLE'
  | 'ALCANTARILLADO'
  | 'OTRO';

export type EstadoReporteEnum =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'ASIGNADA'
  | 'EN_PROGRESO'
  | 'EJECUTADO'
  | 'CERRADO';

export type PrioridadEnum = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type RolEnum = 'ROLE_AUTORIDAD' | 'ROLE_SUPERVISOR' | 'ROLE_EMPRESA' | 'ROLE_ADMIN';

export type CanalEnum = 'WHATSAPP' | 'EMAIL';

export type EmpresaEstadoEnum = 'ACTIVA' | 'INACTIVA' | 'SUSPENDIDA';

// ─── Modelos ──────────────────────────────────────────────

export interface EstadoEvento {
  estado: EstadoReporteEnum;
  actor: string;
  timestamp: string;
  observacion?: string;
}

export interface GeoPoint {
  latitud: number;
  longitud: number;
  direccion?: string;
}

export interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEnum;
  estado: EstadoReporteEnum;
  prioridad: PrioridadEnum;
  ubicacion: GeoPoint;
  ciudadanoPhone: string;
  empresaId?: string;
  empresaNombre?: string;
  supervisorId?: string;
  mediaUrls: string[];
  mediaEvidenciaUrls: string[];
  historialEstados: EstadoEvento[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EmpresaServicio {
  id: string;
  nombre: string;
  ruc: string;
  emailCoordinador: string;
  whatsappCoordinador?: string;
  especialidades: CategoriaEnum[];
  capacidadDiariaMax: number;
  trabajosHoy: number;
  estado: EmpresaEstadoEnum;
  vigenciaContrato?: string;
}

export interface Usuario {
  id: string;
  fullName: string;
  email: string;
  rol: RolEnum;
  status: string;
  keycloakId: string;
}

export interface DashboardMetrics {
  totalReportes: number;
  sinAsignar: number;
  enEjecucion: number;
  cerradosHoy: number;
  criticos: number;
  porCategoria: { categoria: CategoriaEnum; total: number }[];
  porEstado: { estado: EstadoReporteEnum; total: number }[];
  empresasCarga: { empresa: EmpresaServicio; porcentajeCarga: number }[];
}

export interface Notificacion {
  id: string;
  tipo: string;
  canal: CanalEnum;
  destinatario: string;
  mensaje: string;
  estado: string;
  fechaEnvio?: string;
  fechaCreacion: string;
}

// ─── Paginación ───────────────────────────────────────────
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Filtros ──────────────────────────────────────────────
export interface ReporteFilter {
  estado?: EstadoReporteEnum;
  categoria?: CategoriaEnum;
  prioridad?: PrioridadEnum;
  empresaId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
}
