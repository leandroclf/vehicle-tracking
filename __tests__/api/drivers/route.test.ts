/**
 * @jest-environment node
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { makeRequest } from '@/lib/api-test-utils';
import { supabase } from '@/lib/supabase';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/drivers';

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

describe('Drivers API Endpoints', () => {
  const mockDriver = {
    id: '123',
    name: 'João Motorista',
    license_number: '123456789',
    license_type: 'AE',
    license_expiry: '2025-12-31',
    phone: '(11) 98765-4321',
    email: 'joao@exemplo.com',
    status: 'active',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/drivers', () => {
    test('deve retornar lista de motoristas quando autenticado', async () => {
      const mockResponse = {
        data: [mockDriver],
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
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const { req, res } = createMocks({ method: 'GET', headers: { authorization: 'Bearer test' } });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        data: {
          drivers: [mockDriver],
          count: 1,
          limit: 10,
          offset: 0
        }
      });
    });

    test('deve retornar erro 401 quando não autenticado', async () => {
      const { req, res } = createMocks({ method: 'GET', headers: {} });
      // Simular ausência de autenticação (exemplo: sem cookie/token)
      await handler(req, res);
      expect(res._getStatusCode()).toBe(401);
    });

    test('deve aplicar filtros corretamente', async () => {
      const mockResponse = {
        data: [mockDriver],
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
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers?status=active&sort=desc&limit=10&offset=0', 'GET', undefined, true, false, true);
      expect(response.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('drivers');
    });
  });

  describe('POST /api/drivers', () => {
    const newDriver = {
      name: 'Maria Motorista',
      license_number: '987654321',
      license_type: 'AB',
      license_expiry: '2025-12-31',
      phone: '(11) 98765-4321',
      email: 'maria@exemplo.com'
    };

    test('deve criar um novo motorista quando dados válidos', async () => {
      const mockResponse = {
        data: { ...newDriver, id: '456' },
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
      const { req, res } = createMocks({ method: 'POST', body: newDriver, headers: { authorization: 'Bearer test' } });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(201);
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'Motorista criado com sucesso',
        data: {
          driver: mockResponse.data
        }
      });
    });

    test('deve retornar erro 400 quando dados inválidos', async () => {
      const invalidDriver = {
        name: 'M',
        license_number: '123',
        license_type: 'X',
        email: 'email-invalido'
      };
      const { req, res } = createMocks({ method: 'POST', body: invalidDriver, headers: { authorization: 'Bearer test' } });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(400);
    });

    test('deve validar formato de telefone', async () => {
      const driverWithInvalidPhone = {
        ...newDriver,
        phone: '123' // formato inválido
      };
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers', 'POST', driverWithInvalidPhone, true, false, true);
      expect(response.status).toBe(400);
    });

    test('deve validar data de validade da CNH', async () => {
      const driverWithInvalidDate = {
        ...newDriver,
        license_expiry: '31-12-2025' // formato inválido, deve ser YYYY-MM-DD
      };
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers', 'POST', driverWithInvalidDate, true, false, true);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/drivers', () => {
    const updateData = {
      name: 'João Motorista Atualizado',
      license_type: 'AE',
      status: 'inactive'
    };

    test('deve atualizar motorista quando dados válidos', async () => {
      const updateData = { id: '123', name: 'Novo Nome' };
      const mockResponse = { data: { ...mockDriver, ...updateData }, error: null };
      const builder: SupabaseBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(mockResponse),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);
      const { req, res } = createMocks({ method: 'PUT', body: updateData, headers: { authorization: 'Bearer test' } });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({ success: true, data: mockResponse.data });
    });

    test('deve retornar erro 404 quando motorista não encontrado', async () => {
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
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers?id=999', 'PUT', updateData, true, false, true);
      expect(response.status).toBe(404);
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers', 'PUT', updateData, true, false, true);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/drivers', () => {
    test('deve excluir motorista quando ID válido', async () => {
      const mockResponse = { data: mockDriver, error: null };
      const builder: SupabaseBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnValue(mockResponse),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockImplementationOnce(() => builder);
      const { req, res } = createMocks({ method: 'DELETE', query: { id: '123' }, headers: { authorization: 'Bearer test' } });
      await handler(req, res);
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({ success: true, data: mockResponse.data });
    });

    test('deve retornar erro 400 quando ID não fornecido', async () => {
      const builder: SupabaseBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis()
      };
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers', 'DELETE', undefined, true, false, true);
      expect(response.status).toBe(400);
    });

    test('deve retornar erro 404 quando motorista não encontrado', async () => {
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
      (supabase.from as jest.Mock).mockReturnValue(builder);
      const response = await makeRequest('/drivers?id=999', 'DELETE', undefined, true, false, true);
      expect(response.status).toBe(404);
    });
  });
});
