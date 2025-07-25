/**
 * Testes básicos para o serviço MFA
 * @description Testes unitários para validar funcionalidades críticas do MFA
 */

import { mfaService } from '../mfa-service';
import { MfaProvider, MfaSetupRequest } from '@/types/mfa';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn()
      }))
    }))
  }
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
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' } // Not found
      });

      const status = await mfaService.getMfaStatus(mockUserId);

      expect(status.isEnabled).toBe(false);
      expect(status.enabledProviders).toEqual([]);
    });

    it('deve retornar status correto quando MFA está configurado', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          sms_enabled: true,
          totp_enabled: false,
          email_enabled: true,
          phone_number: mockPhoneNumber,
          email: mockEmail
        },
        error: null
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

      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { temp_secret: 'temp-secret-123' },
        error: null
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

      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { 
          temp_secret: 'JBSWY3DPEHPK3PXP',
          qr_code_url: 'data:image/png;base64,mock-qr-code'
        },
        error: null
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
      const mockSupabase = require('@/lib/supabase').supabase;
      
      // Mock para buscar configuração temporária
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({
          data: {
            provider: MfaProvider.SMS,
            temp_secret: 'temp-secret-123',
            phone_number: mockPhoneNumber
          },
          error: null
        })
        // Mock para inserir configuração permanente
        .mockResolvedValueOnce({
          data: { id: 'config-123' },
          error: null
        });

      const result = await mfaService.verifyMfaCode(mockUserId, '123456', 'temp-secret-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('configurado com sucesso');
    });

    it('deve retornar erro para código inválido', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await mfaService.verifyMfaCode(mockUserId, '000000', 'invalid-secret');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Código inválido');
    });
  });

  describe('disableMfa', () => {
    it('deve desabilitar MFA corretamente', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from().delete().eq.mockResolvedValue({
        error: null
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