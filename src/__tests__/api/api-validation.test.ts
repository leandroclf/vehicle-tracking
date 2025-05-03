import { makeRequest } from '../../lib/api-test-utils';

jest.setTimeout(30000); // Aumentar timeout para lidar com requisições reais

describe('API Input Validation Tests', () => {
  // Testes de validação para endpoints específicos
  
  // Teste para POST /auth/login
  test('POST /auth/login deve validar inputs corretamente', async () => {
    // Teste com body vazio
    const emptyBodyResponse = await makeRequest('/auth/login', 'POST', {}, false);
    expect(emptyBodyResponse.status).toBe(400);
    
    // Teste com email inválido
    const invalidEmailResponse = await makeRequest('/auth/login', 'POST', {
      email: 'invalid-email',
      password: 'password123'
    }, false);
    expect(invalidEmailResponse.status).toBe(400);
    
    // Teste sem senha
    const noPasswordResponse = await makeRequest('/auth/login', 'POST', {
      email: 'test@example.com'
    }, false);
    expect(noPasswordResponse.status).toBe(400);
  });
  
  // Teste para POST /auth/register
  test('POST /auth/register deve validar inputs corretamente', async () => {
    // Teste com body vazio
    const emptyBodyResponse = await makeRequest('/auth/register', 'POST', {}, false);
    expect(emptyBodyResponse.status).toBe(400);
    
    // Teste com email inválido
    const invalidEmailResponse = await makeRequest('/auth/register', 'POST', {
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    }, false);
    expect(invalidEmailResponse.status).toBe(400);
    
    // Teste com senha muito curta
    const shortPasswordResponse = await makeRequest('/auth/register', 'POST', {
      name: 'Test User',
      email: 'test@example.com',
      password: '123'
    }, false);
    expect(shortPasswordResponse.status).toBe(400);
  });
  
  // Teste para PATCH /alerts (marcação de alertas lidos)
  test('PATCH /alerts deve validar IDs de alertas', async () => {
    // Teste com array vazio
    const emptyArrayResponse = await makeRequest('/alerts', 'PATCH', {
      alertIds: []
    });
    expect(emptyArrayResponse.status).toBe(400);
    
    // Teste com IDs inválidos
    const invalidIdsResponse = await makeRequest('/alerts', 'PATCH', {
      alertIds: [-1, 0, 'abc']
    });
    expect(invalidIdsResponse.status).toBe(400);
  });
  
  // Teste para POST /vehicles/commands
  test('POST /vehicles/commands deve validar comandos', async () => {
    // Teste sem vehicleId
    const noVehicleIdResponse = await makeRequest('/vehicles/commands', 'POST', {
      command: 'lock'
    });
    expect(noVehicleIdResponse.status).toBe(400);
    
    // Teste com comando inválido
    const invalidCommandResponse = await makeRequest('/vehicles/commands', 'POST', {
      vehicleId: 'test-vehicle-id',
      command: 'invalid-command'
    });
    expect(invalidCommandResponse.status).toBe(400);
  });
  
  // Teste para POST /reports/custom
  test('POST /reports/custom deve validar parâmetros de data', async () => {
    // Teste sem datas
    const noDatesResponse = await makeRequest('/reports/custom', 'POST', {});
    expect(noDatesResponse.status).toBe(400);
    
    // Teste com formato de data inválido
    const invalidDateFormatResponse = await makeRequest('/reports/custom', 'POST', {
      startDate: 'not-a-date',
      endDate: '2023-01-31'
    });
    expect(invalidDateFormatResponse.status).toBe(400);
    
    // Teste com data final anterior à data inicial
    const invalidDateRangeResponse = await makeRequest('/reports/custom', 'POST', {
      startDate: '2023-02-01',
      endDate: '2023-01-01'
    });
    expect(invalidDateRangeResponse.status).toBe(400);
  });
}); 