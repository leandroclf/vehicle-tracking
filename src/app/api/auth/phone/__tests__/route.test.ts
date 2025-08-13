/**
 * Testes de integração para API de autenticação por telefone
 * @description Testes para validar endpoints de SMS OTP
 */

import { NextRequest } from 'next/server';
import { POST, PUT } from '../route';

// Mock do banco de dados PostgreSQL e sistema de autenticação
jest.mock('@/lib/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  executeQuery: jest.fn()
}));

jest.mock('@/lib/supabase', () => ({
  executeQuery: jest.fn(),
  generateToken: jest.fn(),
  verifyToken: jest.fn()
}));

// Mock do serviço de SMS
jest.mock('@/lib/services/sms-service', () => ({
  sendOtpCode: jest.fn(),
  verifyOtpCode: jest.fn()
}));

describe('/api/auth/phone', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Enviar código OTP', () => {
    it('deve enviar código OTP com sucesso', async () => {
      const mockSmsService = require('@/lib/services/sms-service');
      mockSmsService.sendOtpCode.mockResolvedValue({
        success: true,
        messageId: 'msg-123'
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

    it('deve retornar erro quando serviço SMS falha', async () => {
      const mockSmsService = require('@/lib/services/sms-service');
      mockSmsService.sendOtpCode.mockResolvedValue({
        success: false,
        error: 'Rate limit exceeded'
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
      const mockSmsService = require('@/lib/services/sms-service');
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      const mockGenerateToken = require('@/lib/supabase').generateToken;
      
      // Mock para verificação OTP
      mockSmsService.verifyOtpCode.mockResolvedValue({
        success: true,
        phone: '+5565999887766'
      });

      // Mock para verificar se usuário existe
      mockExecuteQuery.mockResolvedValue({
        rows: [{ id: 'user-123', phone: '+5565999887766' }],
        rowCount: 1
      });

      // Mock para gerar token JWT
      mockGenerateToken.mockReturnValue('jwt-token-123');

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
      const mockSmsService = require('@/lib/services/sms-service');
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      const mockGenerateToken = require('@/lib/supabase').generateToken;
      
      // Mock para verificação OTP
      mockSmsService.verifyOtpCode.mockResolvedValue({
        success: true,
        phone: '+5565999887766'
      });

      // Mock para verificar se usuário existe (não existe)
      mockExecuteQuery
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0
        })
        // Mock para criar usuário
        .mockResolvedValueOnce({
          rows: [{ id: 'user-123' }],
          rowCount: 1
        });

      // Mock para gerar token JWT
      mockGenerateToken.mockReturnValue('jwt-token-123');

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
      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
    });

    it('deve retornar erro para código inválido', async () => {
      const mockSmsService = require('@/lib/services/sms-service');
      mockSmsService.verifyOtpCode.mockResolvedValue({
        success: false,
        error: 'Invalid token'
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