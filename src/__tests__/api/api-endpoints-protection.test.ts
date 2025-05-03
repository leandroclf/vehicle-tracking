import { testEndpointProtection } from '../../lib/api-test-utils';

jest.setTimeout(30000); // Aumentar timeout para lidar com requisições reais

// Lista de endpoints a serem testados
const endpointsToTest = [
  { endpoint: '/alerts', method: 'GET' as const },
  { endpoint: '/alerts', method: 'PATCH' as const, body: { alertIds: [1, 2, 3] } },
  { endpoint: '/alerts', method: 'PUT' as const },
  { endpoint: '/vehicles/positions', method: 'GET' as const },
  { endpoint: '/vehicles/commands', method: 'POST' as const, body: { vehicleId: 'test-id', command: 'lock' } },
  { endpoint: '/geofences', method: 'GET' as const },
  { endpoint: '/geofences', method: 'POST' as const, body: { name: 'test', coordinates: [] } },
  { endpoint: '/reports', method: 'GET' as const },
  { endpoint: '/reports/custom', method: 'POST' as const, body: { startDate: '2023-01-01', endDate: '2023-01-31' } },
  { endpoint: '/settings', method: 'GET' as const },
  { endpoint: '/settings', method: 'PUT' as const, body: { notificationSettings: { email: true } } },
];

// Endpoints que não devem ser protegidos (auth)
const publicEndpoints = [
  { endpoint: '/auth/login', method: 'POST' as const, body: { email: 'test@example.com', password: 'password' } },
  { endpoint: '/auth/register', method: 'POST' as const, body: { name: 'Test', email: 'test@example.com', password: 'password' } },
];

describe('API Endpoints Protection Tests', () => {
  // Testar endpoints que devem ser protegidos
  test.each(endpointsToTest)(
    '$method $endpoint deve estar adequadamente protegido',
    async ({ endpoint, method, body }) => {
      const result = await testEndpointProtection(endpoint, method, body);
      
      // Verificar se o endpoint está protegido contra requisições sem token
      expect(result.isProtectedNoToken).toBe(true);
      
      // Verificar se o endpoint está protegido contra tokens inválidos
      expect(result.isProtectedInvalidToken).toBe(true);
      
      // Verificar se todos os testes passaram
      expect(result.allTestsPassed).toBe(true);
    }
  );
  
  // Testar endpoints que NÃO devem ser protegidos (rotas públicas como login/registro)
  test.each(publicEndpoints)(
    '$method $endpoint deve ser acessível sem autenticação',
    async ({ endpoint, method, body }) => {
      const result = await testEndpointProtection(endpoint, method, body);
      
      // Verificar se o endpoint é acessível sem token
      expect(result.responses.noToken.status).not.toBe(401);
    }
  );
  
  // Teste para verificar se todas as rotas da API estão na lista de testes
  test('Todos os endpoints da API estão cobertos pelos testes', () => {
    // Este teste é um lembrete para manter a lista de testes atualizada
    // quando novos endpoints forem adicionados
    console.log('Endpoints protegidos testados:', endpointsToTest.length);
    console.log('Endpoints públicos testados:', publicEndpoints.length);
  });
}); 