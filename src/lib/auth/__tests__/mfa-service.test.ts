/**
 * Testes básicos para o serviço MFA
 * @description Testes unitários para validar funcionalidades críticas do MFA
 */

import { mfaService } from '../mfa-service';
import { MfaProvider, MfaSetupRequest } from '@/types/mfa';

// Mock do banco de dados PostgreSQL
jest.mock('@/lib/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  executeQuery: jest.fn()
}));

// Mock do sistema de cache Redis
jest.mock('@/lib/supabase', () => ({
  executeQuery: jest.fn(),
  getRedisClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }))
}));

describe('MfaService', () => {
  const mockUserId = 'test-user-123';
  const mockPhoneNumber = '+5565999887766';
  const mockEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMfaStatus', () => {
    it('deve retornar status correto quando MFA não está configurado', async () => {
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const status = await mfaService.getMfaStatus(mockUserId);

      expect(status.isEnabled).toBe(false);
      expect(status.enabledProviders).toEqual([]);
    });

    it('deve retornar status correto quando MFA está configurado', async () => {
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [{
          sms_enabled: true,
          totp_enabled: false,
          email_enabled: true,
          phone_number: mockPhoneNumber,
          email: mockEmail
        }],
        rowCount: 1
      });

      const status = await mfaService.getMfaStatus(mockUserId);

      expect(status.isEnabled).toBe(true);
      expect(status.enabledProviders).toContain(MfaProvider.SMS);
      expect(status.enabledProviders).toContain(MfaProvider.EMAIL);
      expect(status.enabledProviders).not.toContain(MfaProvider.TOTP);
    });
  });

  describe('setupMfa', () => {
    it('deve configurar MFA SMS corretamente', async () => {
      const setupRequest: MfaSetupRequest = {
        provider: MfaProvider.SMS,
        phoneNumber: mockPhoneNumber
      };

      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [{ temp_secret: 'temp-secret-123' }],
        rowCount: 1
      });

      const result = await mfaService.setupMfa(mockUserId, setupRequest);

      expect(result.success).toBe(true);
      expect(result.tempSecret).toBe('temp-secret-123');
      expect(result.message).toContain('SMS');
    });

    it('deve configurar MFA TOTP corretamente', async () => {
      const setupRequest: MfaSetupRequest = {
        provider: MfaProvider.TOTP
      };

      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [{ 
          temp_secret: 'JBSWY3DPEHPK3PXP',
          qr_code_url: 'data:image/png;base64,mock-qr-code'
        }],
        rowCount: 1
      });

      const result = await mfaService.setupMfa(mockUserId, setupRequest);

      expect(result.success).toBe(true);
      expect(result.tempSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeUrl).toBeDefined();
    });

    it('deve retornar erro para provider inválido', async () => {
      const setupRequest: MfaSetupRequest = {
        provider: 'INVALID' as MfaProvider
      };

      const result = await mfaService.setupMfa(mockUserId, setupRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider inválido');
    });
  });

  describe('verifyMfaCode', () => {
    it('deve verificar código SMS corretamente', async () => {
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      
      // Mock para buscar configuração temporária
      mockExecuteQuery
        .mockResolvedValueOnce({
          rows: [{
            provider: MfaProvider.SMS,
            temp_secret: 'temp-secret-123',
            phone_number: mockPhoneNumber
          }],
          rowCount: 1
        })
        // Mock para inserir configuração permanente
        .mockResolvedValueOnce({
          rows: [{ id: 'config-123' }],
          rowCount: 1
        });

      const result = await mfaService.verifyMfaCode(mockUserId, '123456', 'temp-secret-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('configurado com sucesso');
    });

    it('deve retornar erro para código inválido', async () => {
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await mfaService.verifyMfaCode(mockUserId, '000000', 'invalid-secret');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Código inválido');
    });
  });

  describe('disableMfa', () => {
    it('deve desabilitar MFA corretamente', async () => {
      const mockExecuteQuery = require('@/lib/supabase').executeQuery;
      mockExecuteQuery.mockResolvedValue({
        rows: [],
        rowCount: 1
      });

      const result = await mfaService.disableMfa(mockUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('desabilitado com sucesso');
    });
  });

  describe('generateBackupCodes', () => {
    it('deve gerar códigos de backup válidos', () => {
      const codes = mfaService.generateBackupCodes();

      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('deve gerar códigos únicos', () => {
      const codes1 = mfaService.generateBackupCodes();
      const codes2 = mfaService.generateBackupCodes();

      expect(codes1).not.toEqual(codes2);
    });
  });
});