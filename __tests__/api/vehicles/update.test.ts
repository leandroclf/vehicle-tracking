import { createMocks } from 'node-mocks-http';
import { PUT as handler } from '@/app/api/vehicles/route';
import { updateVehicle, getVehicleById } from '@/lib/db/queries/vehicles';
import { verifyAuth } from '@/lib/auth';

// Mock das funções de dependência
jest.mock('@/lib/db/queries/vehicles');
jest.mock('@/lib/auth');

const mockVehicle = {
  id: 'vehicle-id-123',
  plate: 'ABC1234',
  model: 'Modelo Teste',
  brand: 'Marca Teste',
  year: 2022,
  color: 'Preto',
  status: 'active',
  device_id: 'device-123',
  owner_id: 'owner-123'
};

const mockUpdatedData = {
  plate: 'XYZ5678',
  model: 'Modelo Atualizado',
  color: 'Branco'
};

describe('API Endpoint: /api/vehicles/update', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configura o mock de autenticação para sucesso por padrão
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { id: 'user-123', role: 'admin' }
    });
  });

  it('should update a vehicle successfully with valid data', async () => {
    // Configura os mocks
    (getVehicleById as jest.Mock).mockResolvedValue(mockVehicle);
    (updateVehicle as jest.Mock).mockResolvedValue({
      ...mockVehicle,
      ...mockUpdatedData
    });

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockVehicle.id,
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
      message: 'Veículo atualizado com sucesso',
      vehicle: {
        ...mockVehicle,
        ...mockUpdatedData
      }
    });
    
    // Verifica se as funções foram chamadas corretamente
    expect(verifyAuth).toHaveBeenCalledWith(req);
    expect(updateVehicle).toHaveBeenCalledWith(mockVehicle.id, mockUpdatedData);
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
        id: mockVehicle.id,
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
    
    // Verifica que updateVehicle não foi chamado
    expect(updateVehicle).not.toHaveBeenCalled();
  });

  it('should return 400 when vehicle ID is missing', async () => {
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
      error: 'ID do veículo é obrigatório'
    });
  });

  it('should return 404 when vehicle is not found', async () => {
    // Configura o mock para veículo não encontrado
    (getVehicleById as jest.Mock).mockResolvedValue(null);

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
      error: 'Veículo não encontrado'
    });
  });

  it('should return 405 for non-PUT methods', async () => {
    // Cria a requisição mock com método incorreto
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        id: mockVehicle.id,
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
    (getVehicleById as jest.Mock).mockResolvedValue(mockVehicle);
    (updateVehicle as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockVehicle.id,
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
      error: 'Erro ao atualizar veículo'
    });
  });

  it('should return 400 when vehicle name is too short', async () => {
    (getVehicleById as jest.Mock).mockResolvedValue(mockVehicle);

    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockVehicle.id,
        name: 'A' // Invalid: too short, min is 3
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: 'Dados inválidos',
        details: expect.objectContaining({ name: expect.anything() })
      })
    );
    expect(updateVehicle).not.toHaveBeenCalled();
  });

  it('should return 400 when vehicle license plate is too short', async () => {
    (getVehicleById as jest.Mock).mockResolvedValue(mockVehicle);

    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockVehicle.id,
        license_plate: 'B' // Invalid: too short, min is 3
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: 'Dados inválidos',
        details: expect.objectContaining({ license_plate: expect.anything() })
      })
    );
    expect(updateVehicle).not.toHaveBeenCalled();
  });

  it('should return 400 when vehicle year is invalid', async () => {
    const invalidYears = [0, -2000, 2000.5, 'not-a-year'];

    for (const invalidYear of invalidYears) {
      jest.clearAllMocks(); // Clear mocks for each iteration
      (verifyAuth as jest.Mock).mockResolvedValue({ // Re-mock auth for each iteration
        authenticated: true,
        user: { id: 'user-123', role: 'admin' }
      });
      (getVehicleById as jest.Mock).mockResolvedValue(mockVehicle); // Re-mock for each iteration

      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          id: mockVehicle.id,
          year: invalidYear
        },
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual(
        expect.objectContaining({
          error: 'Dados inválidos',
          details: expect.objectContaining({ year: expect.anything() })
        })
      );
      expect(updateVehicle).not.toHaveBeenCalled();
    }
  });
});