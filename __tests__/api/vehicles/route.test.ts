/**
 * @jest-environment node
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { makeRequest } from '@/lib/api-test-utils';
import { supabase } from '@/lib/supabase';

// Mock do cliente Supabase
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

describe('Vehicles API Endpoints', () => {
  const mockVehicle = {
    id: '123',
    name: 'Test Vehicle',
    license_plate: 'ABC1234',
    model: 'Test Model',
    year: 2023,
    status: 'active',
    user_id: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/vehicles', () => {
    test('deve retornar lista de veículos quando autenticado', async () => {
      const mockResponse = {
        data: [mockVehicle],
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

      const response = await makeRequest('/vehicles');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        vehicles: [mockVehicle],
        pagination: {
          total: 1,
          limit: 50,
          offset: 0
        }
      });
    });

    test('deve retornar erro 401 quando não autenticado', async () => {
      const response = await makeRequest('/vehicles', 'GET', undefined, false);
      expect(response.status).toBe(401);
    });

    test('deve aplicar filtros corretamente', async () => {
      const mockResponse = {
        data: [mockVehicle],
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

      const response = await makeRequest('/vehicles?status=active&sort=desc&limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });
  });

  describe('POST /api/vehicles', () => {
    const newVehicle = {
      name: 'New Vehicle',
      license_plate: 'XYZ5678',
      model: 'New Model',
      year: 2024
    };

    test('deve criar um novo veículo quando dados válidos', async () => {
      const mockResponse = {
        data: { ...newVehicle, id: '456' },
        error: null
      };

      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(mockResponse)
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/vehicles', 'POST', newVehicle);

      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockResponse.data);
    });

    test('deve retornar erro 400 quando dados inválidos', async () => {
      const invalidVehicle = {
        name: 'A', // nome muito curto
        license_plate: 'B' // placa muito curta
      };

      const response = await makeRequest('/vehicles', 'POST', invalidVehicle);
      expect(response.status).toBe(400);
    });

    test('deve retornar erro 409 quando placa já existe', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnValue({ data: { id: '123' }, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };

      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);

      const response = await makeRequest('/vehicles', 'POST', newVehicle);
      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/vehicles', () => {
    const updateData = {
      id: '123',
      name: 'Updated Vehicle',
      status: 'inactive'
    };

    test('deve atualizar veículo quando dados válidos', async () => {
      const mockResponse = {
        data: { ...mockVehicle, ...updateData },
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

      const response = await makeRequest('/vehicles', 'PUT', updateData);

      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockResponse.data);
    });

    test('deve retornar erro 404 quando veículo não encontrado', async () => {
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

      const response = await makeRequest('/vehicles', 'PUT', updateData);
      expect(response.status).toBe(404);
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const invalidUpdate = {
        name: 'Updated Vehicle'
      };

      const response = await makeRequest('/vehicles', 'PUT', invalidUpdate);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/vehicles', () => {
    test('deve excluir veículo quando ID válido', async () => {
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

      const response = await makeRequest('/vehicles?id=123', 'DELETE');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ message: 'Veículo excluído com sucesso' });
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const response = await makeRequest('/vehicles', 'DELETE');
      expect(response.status).toBe(400);
    });

    test('deve retornar erro 404 quando veículo não encontrado', async () => {
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

      const response = await makeRequest('/vehicles?id=999', 'DELETE');
      expect(response.status).toBe(404);
    });
  });
});
