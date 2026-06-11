// src/app/core/services/mock-data.ts
// ============================================================
// MOCK DATA — ReparaYa
// Todos los datos de prueba centralizados aquí.
// Cuando las APIs estén listas, solo se cambia useMocks=false
// en environment.ts y estos datos dejan de usarse.
// ============================================================

import {
  Reporte, EmpresaServicio, Usuario,
  DashboardMetrics, Notificacion
} from '../../shared/models';

export const MOCK_EMPRESAS: EmpresaServicio[] = [
  {
    id: '1',
    nombre: 'Constructora Lima SAC',
    ruc: '20789002',
    emailCoordinador: 'coord@constructorima.pe',
    whatsappCoordinador: '+51987000001',
    especialidades: ['VIALIDAD'],
    capacidadDiariaMax: 15,
    trabajosHoy: 3,
    estado: 'ACTIVA',
    vigenciaContrato: '2025-12-31'
  },
  {
    id: '2',
    nombre: 'Electro Norte SAC',
    ruc: '20131887',
    emailCoordinador: 'coord@electronorte.pe',
    whatsappCoordinador: '+51987000002',
    especialidades: ['ALUMBRADO'],
    capacidadDiariaMax: 10,
    trabajosHoy: 6,
    estado: 'ACTIVA',
    vigenciaContrato: '2025-12-31'
  },
  {
    id: '3',
    nombre: 'AquaTec SRL',
    ruc: '20445621',
    emailCoordinador: 'coord@aquatec.pe',
    especialidades: ['AGUA_POTABLE', 'ALCANTARILLADO'],
    capacidadDiariaMax: 10,
    trabajosHoy: 10,
    estado: 'ACTIVA',
    vigenciaContrato: '2025-02-15'
  },
  {
    id: '4',
    nombre: 'ServiRed Trujillo',
    ruc: '20334455',
    emailCoordinador: 'coord@servired.pe',
    especialidades: ['VIALIDAD', 'OTRO'],
    capacidadDiariaMax: 12,
    trabajosHoy: 8,
    estado: 'ACTIVA',
    vigenciaContrato: '2025-06-30'
  }
];

export const MOCK_REPORTES: Reporte[] = [
  {
    id: '247',
    titulo: 'Bache profundo en Av. España cdra 4',
    descripcion: 'Tiene aproximadamente 1 metro de diámetro. Peligro para vehículos y peatones.',
    categoria: 'VIALIDAD',
    estado: 'PENDIENTE',
    prioridad: 'CRITICA',
    ubicacion: { latitud: -8.1116, longitud: -79.0352, direccion: 'Av. España 1234, Centro, Trujillo' },
    ciudadanoPhone: '+51987654321',
    empresaId: undefined,
    mediaUrls: [],
    mediaEvidenciaUrls: [],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-27T10:03:44Z', observacion: 'Reporte creado vía WhatsApp' }
    ],
    fechaCreacion: '2026-05-27T10:03:44Z',
    fechaActualizacion: '2026-05-27T10:03:44Z'
  },
  {
    id: '246',
    titulo: 'Alumbrado apagado Jr. Pizarro',
    descripcion: '3 postes consecutivos sin luz desde hace 2 días.',
    categoria: 'ALUMBRADO',
    estado: 'EN_PROGRESO',
    prioridad: 'MEDIA',
    ubicacion: { latitud: -8.1098, longitud: -79.0289, direccion: 'Jr. Pizarro 456, Centro, Trujillo' },
    ciudadanoPhone: '+51987654322',
    empresaId: '2',
    empresaNombre: 'Electro Norte SAC',
    mediaUrls: [],
    mediaEvidenciaUrls: [],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-27T08:00:00Z' },
      { estado: 'EN_REVISION', actor: 'worker-service', timestamp: '2026-05-27T08:05:00Z' },
      { estado: 'ASIGNADA', actor: 'worker-service', timestamp: '2026-05-27T08:10:00Z', observacion: 'Asignada a Electro Norte SAC' },
      { estado: 'EN_PROGRESO', actor: 'empresa:2', timestamp: '2026-05-27T09:00:00Z', observacion: 'Operarios en campo' }
    ],
    fechaCreacion: '2026-05-27T08:00:00Z',
    fechaActualizacion: '2026-05-27T09:00:00Z'
  },
  {
    id: '245',
    titulo: 'Tubería rota Ca. Los Pinos',
    descripcion: 'Fuga de agua significativa, calle inundada.',
    categoria: 'AGUA_POTABLE',
    estado: 'ASIGNADA',
    prioridad: 'ALTA',
    ubicacion: { latitud: -8.1145, longitud: -79.0412, direccion: 'Ca. Los Pinos 789, Florencia de Mora' },
    ciudadanoPhone: '+51987654323',
    empresaId: '3',
    empresaNombre: 'AquaTec SRL',
    mediaUrls: [],
    mediaEvidenciaUrls: [],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-27T07:00:00Z' },
      { estado: 'ASIGNADA', actor: 'worker-service', timestamp: '2026-05-27T07:15:00Z' }
    ],
    fechaCreacion: '2026-05-27T07:00:00Z',
    fechaActualizacion: '2026-05-27T07:15:00Z'
  },
  {
    id: '244',
    titulo: 'Vereda deteriorada Urb. California',
    descripcion: 'Vereda rota, riesgo de caída para adultos mayores.',
    categoria: 'VIALIDAD',
    estado: 'EJECUTADO',
    prioridad: 'BAJA',
    ubicacion: { latitud: -8.1067, longitud: -79.0301, direccion: 'Urb. California, Trujillo' },
    ciudadanoPhone: '+51987654324',
    empresaId: '1',
    empresaNombre: 'Constructora Lima SAC',
    mediaUrls: [],
    mediaEvidenciaUrls: ['https://picsum.photos/400/300?random=1'],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-26T10:00:00Z' },
      { estado: 'ASIGNADA', actor: 'worker-service', timestamp: '2026-05-26T10:30:00Z' },
      { estado: 'EN_PROGRESO', actor: 'empresa:1', timestamp: '2026-05-26T14:00:00Z' },
      { estado: 'EJECUTADO', actor: 'empresa:1', timestamp: '2026-05-27T09:00:00Z', observacion: 'Vereda reparada con concreto f\'c=175' }
    ],
    fechaCreacion: '2026-05-26T10:00:00Z',
    fechaActualizacion: '2026-05-27T09:00:00Z'
  },
  {
    id: '243',
    titulo: 'Semáforo dañado Av. Larco',
    descripcion: 'Semáforo sin funcionar en hora punta, causa accidentes.',
    categoria: 'VIALIDAD',
    estado: 'EN_REVISION',
    prioridad: 'ALTA',
    ubicacion: { latitud: -8.1089, longitud: -79.0378, direccion: 'Av. Larco cruce con Av. Perú, Trujillo' },
    ciudadanoPhone: '+51987654325',
    empresaId: undefined,
    mediaUrls: [],
    mediaEvidenciaUrls: [],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-27T06:00:00Z' },
      { estado: 'EN_REVISION', actor: 'worker-service', timestamp: '2026-05-27T06:05:00Z' }
    ],
    fechaCreacion: '2026-05-27T06:00:00Z',
    fechaActualizacion: '2026-05-27T06:05:00Z'
  },
  {
    id: '242',
    titulo: 'Alcantarilla tapada Jr. Independencia',
    descripcion: 'Alcantarilla desbordada, mal olor y riesgo sanitario.',
    categoria: 'ALCANTARILLADO',
    estado: 'CERRADO',
    prioridad: 'MEDIA',
    ubicacion: { latitud: -8.1112, longitud: -79.0334, direccion: 'Jr. Independencia 321, Centro' },
    ciudadanoPhone: '+51987654326',
    empresaId: '3',
    empresaNombre: 'AquaTec SRL',
    supervisorId: 'sup1',
    mediaUrls: [],
    mediaEvidenciaUrls: ['https://picsum.photos/400/300?random=2'],
    historialEstados: [
      { estado: 'PENDIENTE', actor: 'bot-service', timestamp: '2026-05-25T08:00:00Z' },
      { estado: 'ASIGNADA', actor: 'worker-service', timestamp: '2026-05-25T08:30:00Z' },
      { estado: 'EN_PROGRESO', actor: 'empresa:3', timestamp: '2026-05-25T10:00:00Z' },
      { estado: 'EJECUTADO', actor: 'empresa:3', timestamp: '2026-05-25T16:00:00Z' },
      { estado: 'CERRADO', actor: 'supervisor:sup1', timestamp: '2026-05-26T09:00:00Z', observacion: 'Trabajo conforme, alcantarilla limpia' }
    ],
    fechaCreacion: '2026-05-25T08:00:00Z',
    fechaActualizacion: '2026-05-26T09:00:00Z'
  }
];

export const MOCK_DASHBOARD: DashboardMetrics = {
  totalReportes: 248,
  sinAsignar: 47,
  enEjecucion: 31,
  cerradosHoy: 9,
  criticos: 3,
  porCategoria: [
    { categoria: 'VIALIDAD', total: 98 },
    { categoria: 'ALUMBRADO', total: 67 },
    { categoria: 'AGUA_POTABLE', total: 48 },
    { categoria: 'ALCANTARILLADO', total: 23 },
    { categoria: 'OTRO', total: 12 }
  ],
  porEstado: [
    { estado: 'PENDIENTE', total: 47 },
    { estado: 'EN_REVISION', total: 22 },
    { estado: 'ASIGNADA', total: 18 },
    { estado: 'EN_PROGRESO', total: 31 },
    { estado: 'EJECUTADO', total: 15 },
    { estado: 'CERRADO', total: 115 }
  ],
  empresasCarga: [
    { empresa: MOCK_EMPRESAS[0], porcentajeCarga: 20 },
    { empresa: MOCK_EMPRESAS[1], porcentajeCarga: 60 },
    { empresa: MOCK_EMPRESAS[2], porcentajeCarga: 100 },
    { empresa: MOCK_EMPRESAS[3], porcentajeCarga: 67 }
  ]
};

export const MOCK_USUARIOS: Usuario[] = [
  { id: '1', fullName: 'María Aldana', email: 'autoridad1@reparaya.pe', rol: 'ROLE_AUTORIDAD', status: 'ACTIVE', keycloakId: 'kc-1' },
  { id: '2', fullName: 'José Sánchez', email: 'supervisor1@reparaya.pe', rol: 'ROLE_SUPERVISOR', status: 'ACTIVE', keycloakId: 'kc-2' },
  { id: '3', fullName: 'Roberto Torres', email: 'empresa1@reparaya.pe', rol: 'ROLE_EMPRESA', status: 'ACTIVE', keycloakId: 'kc-3' },
  { id: '4', fullName: 'Admin Sistema', email: 'admin@reparaya.pe', rol: 'ROLE_ADMIN', status: 'ACTIVE', keycloakId: 'kc-4' }
];
