// src/environments/environment.development.ts
export const environment = {
  production: false,
  useMocks: true,           // ← SWITCH: true = mocks, false = APIs reales

  apiBaseUrl: 'http://localhost:80/api',

  keycloak: {
    url: 'http://localhost:8080',
    realm: 'reparaya',
    clientId: 'reparaya-web'
  }
};
