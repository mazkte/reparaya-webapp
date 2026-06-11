export const environment = {
  production: false,
  useMocks: false,
  apis: {
    users:         'http://localhost:8084/api',
    companies:     'http://localhost:8083/api',
    reports:       'http://localhost:8082/api',
    notifications: 'http://localhost:8086/api',
    bot:           'http://localhost:8081/api'
  },
  keycloak: {
    url:      'http://localhost:8080',
    realm:    'reparaya',
    clientId: 'reparaya-web'
  }
};
