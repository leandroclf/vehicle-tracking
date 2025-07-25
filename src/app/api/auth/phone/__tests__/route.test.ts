/**
 * Testes de integração para API de autenticação por telefone
 * @description Testes para validar endpoints de SMS OTP
 */

import { NextRequest } from 'next/server';
import { POST, PUT } from '../route';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn()
    }))
  }
}));

describe('/api/auth/phone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Enviar código OTP', () => {
    it('deve enviar código OTP com sucesso', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: { messageId: 'msg-123' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({
          phone: '+5565999887766'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('enviado');
    });

    it('deve retornar erro para telefone inválido', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({
          phone: '123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('telefone');
    });

    it('deve retornar erro quando Supabase falha', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' }
      });

      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'POST',
        body: JSON.stringify({
          phone: '+5565999887766'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Rate limit');
    });
  });

  describe('PUT - Verificar código OTP', () => {
    it('deve verificar código OTP com sucesso', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock para verificação OTP
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            phone: '+5565999887766',
            user_metadata: {}
          },
          session: { access_token: 'token-123' }
        },
        error: null
      });

      // Mock para verificar se perfil existe
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'profile-123' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'PUT',
        body: JSON.stringify({
          phone: '+5565999887766',
          token: '123456'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
    });

    it('deve criar perfil para novo usuário', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock para verificação OTP
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            phone: '+5565999887766',
            user_metadata: {}
          },
          session: { access_token: 'token-123' }
        },
        error: null
      });

      // Mock para verificar se perfil existe (não existe)
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock para criar perfil
      mockSupabase.from().insert.mockResolvedValue({
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'PUT',
        body: JSON.stringify({
          phone: '+5565999887766',
          token: '123456'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });

    it('deve retornar erro para código inválido', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid token' }
      });

      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'PUT',
        body: JSON.stringify({
          phone: '+5565999887766',
          token: '000000'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid token');
    });

    it('deve validar dados de entrada', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/phone', {
        method: 'PUT',
        body: JSON.stringify({
          phone: '123',
          token: '12'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});