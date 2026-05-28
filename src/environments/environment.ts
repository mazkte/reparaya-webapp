// src/environments/environment.ts  (base - apunta a development por defecto)
export const environment = {
  production: false,
  useMocks: true,
  apiBaseUrl: 'http://localhost:80/api',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'reparaya',
    clientId: 'reparaya-web'
  }
};
