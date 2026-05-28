# ReparaYa Web — Frontend Angular 18

## Stack
- **Angular 18** — standalone components, signals
- **Angular Material** — componentes UI
- **Keycloak Angular** — autenticación OAuth2/OIDC
- **Leaflet.js** — mapas interactivos
- **Mock/Real switch** — `environment.useMocks` controla si se usan mocks o APIs reales

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── auth/
│   │   │   └── auth.service.ts          ← Keycloak wrapper + roles
│   │   ├── guards/
│   │   │   └── auth.guard.ts            ← authGuard + roleGuard
│   │   ├── interceptors/
│   │   │   └── jwt.interceptor.ts       ← adjunta JWT a cada request
│   │   └── services/
│   │       ├── mock-data.ts             ← TODOS los datos de prueba
│   │       ├── reporte.service.ts       ← switch mock/real automático
│   │       └── empresa.service.ts       ← switch mock/real automático
│   │
│   ├── shared/
│   │   └── models/
│   │       └── index.ts                 ← interfaces y tipos del dominio
│   │
│   ├── features/
│   │   ├── dashboard/                   ← ROLE_AUTORIDAD, ROLE_ADMIN
│   │   ├── reports/                     ← lista y detalle de reportes
│   │   ├── companies/                   ← gestión de empresas
│   │   ├── supervisor/                  ← ROLE_SUPERVISOR
│   │   ├── empresa/                     ← ROLE_EMPRESA
│   │   └── admin/                       ← ROLE_ADMIN
│   │
│   ├── app.component.ts                 ← shell con sidebar por rol
│   └── app.routes.ts                    ← rutas con guards por rol
│
├── environments/
│   ├── environment.ts                   ← base
│   ├── environment.development.ts       ← dev (useMocks: true)
│   └── environment.prod.ts              ← prod (useMocks: false)
│
├── index.html
├── main.ts                              ← bootstrap + Keycloak init
└── styles.scss                          ← estilos globales
```

---

## Instalación

```powershell
# 1. Instalar dependencias
npm install

# 2. Levantar en modo desarrollo (con mocks)
npm start

# La app estará en http://localhost:4200
```

---

## Switch Mock ↔ API Real

El flag `useMocks` en `environment.development.ts` controla todo:

```typescript
// CON MOCKS (desarrollo sin backend)
export const environment = {
  useMocks: true,
  ...
};

// CON APIs REALES (backend levantado)
export const environment = {
  useMocks: false,
  apiBaseUrl: 'http://localhost:80/api',
  ...
};
```

**No hay que cambiar ningún componente** — los servicios hacen el switch automáticamente.

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Angular CLI 18: `npm install -g @angular/cli`
- Keycloak corriendo en `http://localhost:8080` con el realm `reparaya`

---

## Usuarios de prueba (Keycloak)

| Usuario | Contraseña | Rol | Vistas |
|---|---|---|---|
| autoridad1 | autoridad123 | ROLE_AUTORIDAD | Dashboard, Reportes, Empresas |
| supervisor1 | supervisor123 | ROLE_SUPERVISOR | Por validar, Historial |
| empresa1 | empresa123 | ROLE_EMPRESA | Mis trabajos |
| admin | admin123 | ROLE_ADMIN | Todo |

---

## Rutas

| Ruta | Roles | Vista |
|---|---|---|
| `/dashboard` | AUTORIDAD, ADMIN | Dashboard con métricas y mapa |
| `/reportes` | AUTORIDAD, ADMIN | Lista de reportes con filtros |
| `/reportes/:id` | AUTORIDAD, SUPERVISOR, ADMIN | Detalle de reporte |
| `/empresas` | AUTORIDAD, ADMIN | Empresas contratadas |
| `/supervisor/pendientes` | SUPERVISOR | Trabajos por validar |
| `/supervisor/validar/:id` | SUPERVISOR | Validar trabajo ejecutado |
| `/empresa/trabajos` | EMPRESA | Mis trabajos asignados |
| `/empresa/trabajo/:id` | EMPRESA | Detalle de trabajo |
| `/admin/usuarios` | ADMIN | Gestión de usuarios |
| `/admin/empresas` | ADMIN | Gestión de empresas |
| `/admin/config` | ADMIN | Configuración del sistema |
