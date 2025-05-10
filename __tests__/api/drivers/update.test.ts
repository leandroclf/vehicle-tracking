import { createMocks } from 'node-mocks-http';
import { PUT as handler } from '@/app/api/drivers/route';
import { updateDriver, getDriverById } from '@/lib/db/queries/drivers';
import { verifyAuth } from '@/lib/auth';

// Mock das funções de dependência
jest.mock('@/lib/db/queries/drivers');
jest.mock('@/lib/auth');

const mockDriver = {
  id: 'driver-id-123',
  name: 'Motorista Teste',
  license: 'ABC123456',
  phone: '11999998888',
  status: 'active',
  company_id: 'company-123',
  created_at: '2023-01-01T00:00:00Z'
};

const mockUpdatedData = {
  name: 'Motorista Atualizado',
  phone: '11988887777',
  status: 'inactive'
};

describe('API Endpoint: /api/drivers/update', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configura o mock de autenticação para sucesso por padrão
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { id: 'user-123', role: 'admin' }
    });
  });

  it('should update a driver successfully with valid data', async () => {
    // Configura os mocks
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    (updateDriver as jest.Mock).mockResolvedValue({
      ...mockDriver,
      ...mockUpdatedData
    });

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockDriver.id,
        ...mockUpdatedData
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Motorista atualizado com sucesso',
      driver: {
        ...mockDriver,
        ...mockUpdatedData
      }
    });
    
    // Verifica se as funções foram chamadas corretamente
    expect(verifyAuth).toHaveBeenCalledWith(req);
    expect(updateDriver).toHaveBeenCalledWith(mockDriver.id, mockUpdatedData);
  });

  it('should return 401 when user is not authenticated', async () => {
    // Configura o mock para falha de autenticação
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: false,
      error: 'Token inválido'
    });

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockDriver.id,
        ...mockUpdatedData
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Não autorizado'
    });
    
    // Verifica que updateDriver não foi chamado
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when driver ID is missing', async () => {
    // Cria a requisição mock sem ID
    const { req, res } = createMocks({
      method: 'PUT',
      body: mockUpdatedData,
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'ID do motorista é obrigatório'
    });
  });

  it('should return 404 when driver is not found', async () => {
    // Configura o mock para motorista não encontrado
    (getDriverById as jest.Mock).mockResolvedValue(null);

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: 'non-existent-id',
        ...mockUpdatedData
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Motorista não encontrado'
    });
  });

  it('should return 405 for non-PUT methods', async () => {
    // Cria a requisição mock com método incorreto
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        id: mockDriver.id,
        ...mockUpdatedData
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Método não permitido'
    });
  });

  it('should handle server errors during update', async () => {
    // Configura os mocks
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    (updateDriver as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockDriver.id,
        ...mockUpdatedData
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Erro ao atualizar motorista'
    });
  });

  it('should return 400 when driver name is too short', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, name: 'A' }, // Invalid: too short
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ name: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when license number is invalid', async () => {
    const invalidLicenses = ['123', 'ABCDEFGHI', '123456789012'];
    for (const license of invalidLicenses) {
      jest.clearAllMocks();
      (verifyAuth as jest.Mock).mockResolvedValue({ authenticated: true, user: { id: 'user-123', role: 'admin' } });
      (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
      const { req, res } = createMocks({
        method: 'PUT',
        body: { id: mockDriver.id, license_number: license },
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ license_number: expect.anything() }) }));
      expect(updateDriver).not.toHaveBeenCalled();
    }
  });

  it('should return 400 when license expiry date format is invalid', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, license_expiry: '2023/12/31' }, // Invalid format
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ license_expiry: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when phone format is invalid', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, phone: '12345' }, // Invalid format
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ phone: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when email format is invalid', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, email: 'invalid-email' }, // Invalid format
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ email: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when driver name is too long', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, name: 'A'.repeat(101) }, // Invalid: too long
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ name: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when license_type is invalid', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, license_type: 'Z' }, // Invalid type
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ license_type: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when status is invalid', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, status: 'pending' }, // Invalid status
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ status: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });

  it('should return 400 when notes are too long', async () => {
    (getDriverById as jest.Mock).mockResolvedValue(mockDriver);
    const { req, res } = createMocks({
      method: 'PUT',
      body: { id: mockDriver.id, notes: 'A'.repeat(501) }, // Invalid: too long
      headers: { 'Authorization': 'Bearer valid-token' }
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(expect.objectContaining({ error: 'Dados inválidos', details: expect.objectContaining({ notes: expect.anything() }) }));
    expect(updateDriver).not.toHaveBeenCalled();
  });
});