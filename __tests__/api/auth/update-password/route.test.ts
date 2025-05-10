import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/update-password/route';
import { setupAuthMocks, mockUnauthorized, VALID_TOKEN } from '../../../setup/auth-mocks';

// Mock do Supabase
const mockUpdateUser = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: (...args: any[]) => mockUpdateUser(...args)
    }
  }
}));

const createTestRequest = (method: string, body?: any, token?: string): NextRequest => {
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = new URL('http://localhost/api/auth/update-password');
  
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    duplex: 'half'
  });
};

describe('Auth Update Password API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupAuthMocks();
    mockUpdateUser.mockResolvedValue({ data: {}, error: null });
  });

  describe('POST /api/auth/update-password', () => {
    test('retorna 405 para requisições não-POST', async () => {
      const req = createTestRequest('GET');
      const res = await POST(req);
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data).toEqual({ error: 'Método não permitido' });
    });

    test('retorna 401 quando token não é fornecido', async () => {
      const req = createTestRequest('POST', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Token não fornecido' });
    });

    test('retorna 401 para token inválido', async () => {
      mockUnauthorized('Token inválido');
      const req = createTestRequest('POST', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      }, 'invalid-token');
      const res = await POST(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toEqual({ error: 'Token inválido' });
    });

    test('atualiza senha com sucesso', async () => {
      const req = createTestRequest('POST', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      }, VALID_TOKEN);
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ message: 'Senha atualizada com sucesso' });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newpass123'
      });
    });

    test('retorna 400 quando senhas não são fornecidas', async () => {
      const req = createTestRequest('POST', {
        currentPassword: '',
        newPassword: ''
      }, VALID_TOKEN);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: 'Senha atual e nova senha são obrigatórias' });
    });

    test('retorna 400 para senhas com menos de 8 caracteres', async () => {
      const req = createTestRequest('POST', {
        currentPassword: '123',
        newPassword: 'newpass123'
      }, VALID_TOKEN);
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toEqual({ error: 'As senhas devem ter no mínimo 8 caracteres' });
    });

    test('retorna 500 quando Supabase falha', async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: new Error('Erro do Supabase')
      });

      const req = createTestRequest('POST', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      }, VALID_TOKEN);
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data).toEqual({ error: 'Erro ao atualizar senha' });
    });
  });
});
