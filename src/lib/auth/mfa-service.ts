import { supabase } from '@/lib/supabase';
import { MFASetupRequest, MFASetupResponse, MFAVerifyRequest, MFAVerifyResponse, MFAStatus } from '@/types/mfa';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

/**
 * Serviço para autenticação multifatorial (MFA)
 */
export const mfaService = {
  /**
   * Configura MFA para um usuário
   */
  async setupMFA(userId: string, request: MFASetupRequest): Promise<MFASetupResponse> {
    try {
      switch (request.provider) {
        case 'sms':
          return await this.setupSMS(userId, request.phone!);
        case 'totp':
          return await this.setupTOTP(userId);
        case 'email':
          return await this.setupEmail(userId, request.email!);
        default:
          throw new Error('Provedor MFA não suportado');
      }
    } catch (error) {
      console.error('Erro ao configurar MFA:', error);
      throw error;
    }
  },

  /**
   * Configura MFA via SMS
   */
  async setupSMS(userId: string, phone: string): Promise<MFASetupResponse> {
    try {
      // Gerar código de verificação
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salvar configuração temporária
      const { error: insertError } = await supabase
        .from('mfa_setup_temp')
        .insert({
          user_id: userId,
          provider: 'sms',
          phone,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
        });

      if (insertError) throw insertError;

      // Enviar SMS (integração com provedor SMS)
      await this.sendSMS(phone, `Seu código de verificação Yukz: ${verificationCode}`);

      return {
        success: true,
        message: 'Código de verificação enviado via SMS. Verifique seu telefone.'
      };
    } catch (error) {
      console.error('Erro ao configurar SMS MFA:', error);
      throw new Error('Falha ao configurar autenticação por SMS');
    }
  },

  /**
   * Configura MFA via TOTP (Google Authenticator)
   */
  async setupTOTP(userId: string): Promise<MFASetupResponse> {
    try {
      // Gerar secret para TOTP
      const secret = authenticator.generateSecret();
      const serviceName = 'Yukz';
      
      // Buscar dados do usuário
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !user) throw new Error('Usuário não encontrado');

      // Gerar URL para QR Code
      const otpauth = authenticator.keyuri(user.email, serviceName, secret);
      const qrCode = await QRCode.toDataURL(otpauth);

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Salvar configuração temporária
      const { error: insertError } = await supabase
        .from('mfa_setup_temp')
        .insert({
          user_id: userId,
          provider: 'totp',
          secret,
          backup_codes: backupCodes,
          expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
        });

      if (insertError) throw insertError;

      return {
        success: true,
        qrCode,
        backupCodes,
        message: 'Escaneie o QR Code com seu aplicativo autenticador e guarde os códigos de backup.'
      };
    } catch (error) {
      console.error('Erro ao configurar TOTP MFA:', error);
      throw new Error('Falha ao configurar autenticação TOTP');
    }
  },

  /**
   * Configura MFA via Email
   */
  async setupEmail(userId: string, email: string): Promise<MFASetupResponse> {
    try {
      // Gerar código de verificação
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Salvar configuração temporária
      const { error: insertError } = await supabase
        .from('mfa_setup_temp')
        .insert({
          user_id: userId,
          provider: 'email',
          email,
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
        });

      if (insertError) throw insertError;

      // Enviar email de verificação
      await this.sendEmail(email, 'Código de Verificação Yukz', `Seu código: ${verificationCode}`);

      return {
        success: true,
        message: 'Código de verificação enviado para seu email.'
      };
    } catch (error) {
      console.error('Erro ao configurar Email MFA:', error);
      throw new Error('Falha ao configurar autenticação por email');
    }
  },

  /**
   * Verifica código MFA
   */
  async verifyMFA(request: MFAVerifyRequest): Promise<MFAVerifyResponse> {
    try {
      // Buscar sessão MFA
      const { data: session, error: sessionError } = await supabase
        .from('mfa_sessions')
        .select('*')
        .eq('id', request.sessionToken)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        throw new Error('Sessão MFA inválida ou expirada');
      }

      let isValid = false;

      switch (request.provider) {
        case 'sms':
        case 'email':
          isValid = await this.verifyCode(session.user_id, request.provider, request.code);
          break;
        case 'totp':
          isValid = await this.verifyTOTP(session.user_id, request.code);
          break;
        case 'backup':
          isValid = await this.verifyBackupCode(session.user_id, request.code);
          break;
      }

      if (!isValid) {
        throw new Error('Código de verificação inválido');
      }

      // Marcar sessão como verificada
      const { error: updateError } = await supabase
        .from('mfa_sessions')
        .update({ verified: true, verified_at: new Date() })
        .eq('id', request.sessionToken);

      if (updateError) throw updateError;

      // Gerar token de acesso
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      return {
        success: true,
        accessToken: authData.user?.access_token,
        message: 'Autenticação multifatorial concluída com sucesso'
      };
    } catch (error) {
      console.error('Erro ao verificar MFA:', error);
      throw error;
    }
  },

  /**
   * Obtém status MFA do usuário
   */
  async getMFAStatus(userId: string): Promise<MFAStatus> {
    try {
      const { data: mfaConfig, error } = await supabase
        .from('user_mfa_config')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!mfaConfig) {
        return {
          enabled: false,
          providers: {
            sms: { enabled: false },
            totp: { enabled: false },
            email: { enabled: false }
          },
          backupCodes: { count: 0 }
        };
      }

      return {
        enabled: mfaConfig.enabled,
        providers: {
          sms: { 
            enabled: mfaConfig.sms_enabled,
            phone: mfaConfig.sms_phone 
          },
          totp: { enabled: mfaConfig.totp_enabled },
          email: { 
            enabled: mfaConfig.email_enabled,
            email: mfaConfig.email_address 
          }
        },
        backupCodes: {
          count: mfaConfig.backup_codes_count || 0,
          lastUsed: mfaConfig.backup_codes_last_used
        }
      };
    } catch (error) {
      console.error('Erro ao obter status MFA:', error);
      throw error;
    }
  },

  /**
   * Verifica código SMS/Email
   */
  async verifyCode(userId: string, provider: 'sms' | 'email', code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('mfa_setup_temp')
      .select('verification_code')
      .eq('user_id', userId)
      .eq('provider', provider)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return false;
    return data.verification_code === code;
  },

  /**
   * Verifica código TOTP
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_mfa_config')
      .select('totp_secret')
      .eq('user_id', userId)
      .eq('totp_enabled', true)
      .single();

    if (error || !data) return false;
    return authenticator.verify({ token: code, secret: data.totp_secret });
  },

  /**
   * Verifica código de backup
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_mfa_config')
      .select('backup_codes')
      .eq('user_id', userId)
      .single();

    if (error || !data || !data.backup_codes) return false;

    const codes = data.backup_codes as string[];
    const isValid = codes.includes(code);

    if (isValid) {
      // Remover código usado
      const updatedCodes = codes.filter(c => c !== code);
      await supabase
        .from('user_mfa_config')
        .update({ 
          backup_codes: updatedCodes,
          backup_codes_count: updatedCodes.length,
          backup_codes_last_used: new Date()
        })
        .eq('user_id', userId);
    }

    return isValid;
  },

  /**
   * Gera códigos de backup
   */
  generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  },

  /**
   * Envia SMS (integração com provedor)
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    // Implementar integração com provedor SMS (Twilio, AWS SNS, etc.)
    console.log(`SMS para ${phone}: ${message}`);
    // TODO: Implementar envio real
  },

  /**
   * Envia email
   */
  async sendEmail(email: string, subject: string, message: string): Promise<void> {
    // Usar Supabase Auth para envio de email
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { verification_code: message }
      }
    });
    
    if (error) throw error;
  }
};