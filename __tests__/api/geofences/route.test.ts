/**
 * @jest-environment node
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { makeRequest } from '@/lib/api-test-utils';
import { supabase } from '@/lib/supabase';

// Types para os mocks do Supabase
type SupabaseResponse<T> = {
  data: T | null;
  error: any | null;
  count?: number;
};

type SupabaseBuilder = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  range: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then?: jest.Mock;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
      return builder;
    })
  }
}));

describe('Geofences API Endpoints', () => {
  const mockGeofence = {
    id: '123',
    name: 'Área Central',
    description: 'Centro da cidade',
    type: 'circle',
    coordinates: '[-23.550520, -46.633308]',
    radius: 1000,
    color: '#FF0000',
    status: 'active',
    user_id: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/geofences', () => {
    test('deve retornar lista de geocercas quando autenticado', async () => {
      const mockResponse = {
        data: [mockGeofence],
        error: null,
        count: 1
      };

      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue(mockResponse),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        geofences: [mockGeofence],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0
        }
      });
    });

    test('deve retornar erro 401 quando não autenticado', async () => {
      const response = await makeRequest('/geofences', 'GET', undefined, false);
      expect(response.status).toBe(401);
    });

    test('deve aplicar filtros corretamente', async () => {
      const mockResponse = {
        data: [mockGeofence],
        error: null,
        count: 1
      };

      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnValue(mockResponse),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences?status=active&sort=desc');

      expect(response.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('geofences');
    });
  });

  describe('POST /api/geofences', () => {
    const newGeofence = {
      name: 'Nova Área',
      description: 'Área de teste',
      type: 'polygon',
      coordinates: '[[-23.550520, -46.633308], [-23.550620, -46.633408]]',
      color: '#00FF00',
      status: 'active'
    };

    test('deve criar uma nova geocerca quando dados válidos', async () => {
      const mockResponse = {
        data: { ...newGeofence, id: '456' },
        error: null
      };

      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(mockResponse),
        maybeSingle: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences', 'POST', newGeofence);

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockResponse.data);
    });

    test('deve retornar erro 400 quando dados inválidos', async () => {
      const invalidGeofence = {
        name: 'A', // nome muito curto
        type: 'invalid', // tipo inválido
        coordinates: '' // coordenadas vazias
      };

      const response = await makeRequest('/geofences', 'POST', invalidGeofence);
      expect(response.status).toBe(400);
    });

    test('deve validar tipo de geocerca', async () => {
      const geofenceWithInvalidType = {
        ...newGeofence,
        type: 'invalid'
      };

      const response = await makeRequest('/geofences', 'POST', geofenceWithInvalidType);
      expect(response.status).toBe(400);
    });

    test('deve requerer raio para geocercas do tipo círculo', async () => {
      const circleGeofenceWithoutRadius = {
        ...newGeofence,
        type: 'circle',
        radius: undefined
      };

      const response = await makeRequest('/geofences', 'POST', circleGeofenceWithoutRadius);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/geofences', () => {
    const updateData = {
      id: '123',
      name: 'Área Central Atualizada',
      description: 'Nova descrição',
      status: 'inactive'
    };

    test('deve atualizar geocerca quando dados válidos', async () => {
      const mockResponse = {
        data: { ...mockGeofence, ...updateData },
        error: null
      };

      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: { id: '123' }, error: null }),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(mockResponse)
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences', 'PUT', updateData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockResponse.data);
    });

    test('deve retornar erro 404 quando geocerca não encontrada', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: null, error: null }),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences', 'PUT', { ...updateData, id: '999' });
      expect(response.status).toBe(404);
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const { id, ...dataWithoutId } = updateData;
      const response = await makeRequest('/geofences', 'PUT', dataWithoutId);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/geofences', () => {
    test('deve excluir geocerca quando ID válido', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: { id: '123' }, error: null }),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        then: jest.fn().mockReturnValue({ error: null })
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences?id=123', 'DELETE');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const response = await makeRequest('/geofences', 'DELETE');
      expect(response.status).toBe(400);
    });

    test('deve retornar erro 404 quando geocerca não encontrada', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/geofences?id=999', 'DELETE');
      expect(response.status).toBe(404);
    });
  });
});
