import { createMocks } from 'node-mocks-http';
import { PUT as handler } from '@/app/api/geofences/route';
import { updateGeofence, getGeofenceById } from '@/lib/db/queries/geofences';
import { verifyAuth } from '@/lib/auth';

// Mock das funções de dependência
jest.mock('@/lib/db/queries/geofences');
jest.mock('@/lib/auth');

const mockGeofence = {
  id: 'geofence-id-123',
  name: 'Área Teste',
  description: 'Descrição da área de teste',
  type: 'polygon',
  coordinates: JSON.stringify([
    { lat: -23.5505, lng: -46.6333 },
    { lat: -23.5605, lng: -46.6433 },
    { lat: -23.5705, lng: -46.6233 }
  ]),
  radius: null,
  company_id: 'company-123',
  created_at: '2023-01-01T00:00:00Z'
};

const mockUpdatedData = {
  name: 'Área Atualizada',
  description: 'Nova descrição da área',
  coordinates: JSON.stringify([
    { lat: -23.5505, lng: -46.6333 },
    { lat: -23.5605, lng: -46.6433 },
    { lat: -23.5705, lng: -46.6233 },
    { lat: -23.5505, lng: -46.6233 }
  ])
};

describe('API Endpoint: /api/geofences/update', () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    jest.clearAllMocks();
    
    // Configura o mock de autenticação para sucesso por padrão
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { id: 'user-123', role: 'admin' }
    });
  });

  it('should update a geofence successfully with valid data', async () => {
    // Configura os mocks
    (getGeofenceById as jest.Mock).mockResolvedValue(mockGeofence);
    (updateGeofence as jest.Mock).mockResolvedValue({
      ...mockGeofence,
      ...mockUpdatedData
    });

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockGeofence.id,
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
      message: 'Geofence atualizado com sucesso',
      geofence: {
        ...mockGeofence,
        ...mockUpdatedData
      }
    });
    
    // Verifica se as funções foram chamadas corretamente
    expect(verifyAuth).toHaveBeenCalledWith(req);
    expect(updateGeofence).toHaveBeenCalledWith(mockGeofence.id, mockUpdatedData);
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
        id: mockGeofence.id,
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
    
    // Verifica que updateGeofence não foi chamado
    expect(updateGeofence).not.toHaveBeenCalled();
  });

  it('should return 400 when geofence ID is missing', async () => {
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
      error: 'ID do geofence é obrigatório'
    });
  });

  it('should return 404 when geofence is not found', async () => {
    // Configura o mock para geofence não encontrado
    (getGeofenceById as jest.Mock).mockResolvedValue(null);

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
      error: 'Geofence não encontrado'
    });
  });

  it('should return 405 for non-PUT methods', async () => {
    // Cria a requisição mock com método incorreto
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        id: mockGeofence.id,
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
    (getGeofenceById as jest.Mock).mockResolvedValue(mockGeofence);
    (updateGeofence as jest.Mock).mockRejectedValue(new Error('Erro de banco de dados'));

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockGeofence.id,
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
      error: 'Erro ao atualizar geofence'
    });
  });

  it('should return 400 when coordinates format is invalid', async () => {
    // Configura os mocks
    (getGeofenceById as jest.Mock).mockResolvedValue(mockGeofence);
    
    // Cria a requisição mock com coordenadas inválidas
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockGeofence.id,
        name: 'Área Atualizada',
        coordinates: 'coordenadas-invalidas'
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Formato de coordenadas inválido'
    });
  });

  it('should return 400 when geofence type is invalid', async () => {
    // Configura os mocks
    (getGeofenceById as jest.Mock).mockResolvedValue(mockGeofence);
    
    // Cria a requisição mock com tipo inválido
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockGeofence.id,
        name: 'Área Atualizada',
        type: 'tipo-invalido' // Tipos válidos geralmente são 'polygon', 'circle', etc.
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Tipo de geofence inválido'
    });
  });

  it('should return 403 when user tries to update geofence from another company', async () => {
    // Configura o mock para usuário de outra empresa
    (verifyAuth as jest.Mock).mockResolvedValue({
      authenticated: true,
      user: { id: 'user-456', role: 'admin', company_id: 'company-456' }
    });
    
    // Configura o mock para encontrar o geofence
    (getGeofenceById as jest.Mock).mockResolvedValue({
      ...mockGeofence,
      company_id: 'company-123' // Empresa diferente do usuário
    });

    // Cria a requisição mock
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: mockGeofence.id,
        ...mockUpdatedData
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Permissão negada para atualizar geofence de outra empresa'
    });
  });

  it('should validate required fields for circle type geofence', async () => {
    // Configura os mocks para um geofence do tipo círculo
    const circleGeofence = {
      ...mockGeofence,
      type: 'circle',
      coordinates: JSON.stringify({ lat: -23.5505, lng: -46.6333 }),
      radius: 1000 // raio em metros
    };
    
    (getGeofenceById as jest.Mock).mockResolvedValue(circleGeofence);
    
    // Cria a requisição mock sem o campo radius (obrigatório para círculos)
    const { req, res } = createMocks({
      method: 'PUT',
      body: {
        id: circleGeofence.id,
        name: 'Círculo Atualizado',
        type: 'circle',
        coordinates: JSON.stringify({ lat: -23.5605, lng: -46.6433 })
        // radius está faltando
      },
      headers: {
        'Authorization': 'Bearer valid-token'
      }
    });

    // Executa o handler
    await handler(req, res);

    // Verifica o resultado
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      error: 'O campo radius é obrigatório para geofences do tipo circle'
    });
  });
});