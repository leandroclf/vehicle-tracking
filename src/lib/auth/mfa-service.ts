import { getConnection } from '@/lib/database';
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
      const client = await getConnection();
      const insertQuery = `
        INSERT INTO mfa_setup_temp (user_id, provider, phone, verification_code, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertQuery, [
        userId,
        'sms',
        phone,
        verificationCode,
        new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
      ]);
      client.release();

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
      const client = await getConnection();
      const userQuery = `
        SELECT email FROM users WHERE id = $1
      `;
      
      const userResult = await client.query(userQuery, [userId]);
      
      if (!userResult || userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = userResult.rows[0];

      // Gerar URL para QR Code
      const otpauth = authenticator.keyuri(user.email, serviceName, secret);
      const qrCode = await QRCode.toDataURL(otpauth);

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Salvar configuração temporária
      const insertQuery = `
        INSERT INTO mfa_setup_temp (user_id, provider, secret, backup_codes, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertQuery, [
        userId,
        'totp',
        secret,
        JSON.stringify(backupCodes),
        new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
      ]);
      client.release();

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
      const client = await getConnection();
      const insertQuery = `
        INSERT INTO mfa_setup_temp (user_id, provider, email, verification_code, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(insertQuery, [
        userId,
        'email',
        email,
        verificationCode,
        new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      ]);
      client.release();

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
      const client = await getConnection();
      const sessionQuery = `
        SELECT * FROM mfa_sessions 
        WHERE id = $1 AND verified = false AND expires_at > $2
      `;
      
      const sessionResult = await client.query(sessionQuery, [
        request.sessionToken,
        new Date().toISOString()
      ]);

      if (!sessionResult || sessionResult.rows.length === 0) {
        throw new Error('Sessão MFA inválida ou expirada');
      }
      
      const session = sessionResult.rows[0];

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
      const updateQuery = `
        UPDATE mfa_sessions 
        SET verified = true, verified_at = $1 
        WHERE id = $2
      `;
      
      await client.query(updateQuery, [new Date(), request.sessionToken]);
      client.release();

      // Gerar token de acesso JWT
      const jwt = require('jsonwebtoken');
      const accessToken = jwt.sign(
        { userId: session.user_id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return {
        success: true,
        accessToken,
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
      const client = await getConnection();
      const configQuery = `
        SELECT * FROM user_mfa_config WHERE user_id = $1
      `;
      
      const configResult = await client.query(configQuery, [userId]);
      client.release();
      const mfaConfig = configResult.rows[0];

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
    const client = await getConnection();
    const query = `
      SELECT verification_code FROM mfa_setup_temp 
      WHERE user_id = $1 AND provider = $2 AND expires_at > $3
    `;
    
    const result = await client.query(query, [userId, provider, new Date().toISOString()]);
    client.release();
    
    if (!result || result.rows.length === 0) return false;
    return result.rows[0].verification_code === code;
  },

  /**
   * Verifica código TOTP
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const client = await getConnection();
    const query = `
      SELECT totp_secret FROM user_mfa_config 
      WHERE user_id = $1 AND totp_enabled = true
    `;
    
    const result = await client.query(query, [userId]);
    client.release();
    
    if (!result || result.rows.length === 0) return false;
    return authenticator.verify({ token: code, secret: result.rows[0].totp_secret });
  },

  /**
   * Verifica código de backup
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const client = await getConnection();
    const query = `
      SELECT backup_codes FROM user_mfa_config WHERE user_id = $1
    `;
    
    const result = await client.query(query, [userId]);
    
    if (!result || result.rows.length === 0 || !result.rows[0].backup_codes) return false;

    const codes = JSON.parse(result.rows[0].backup_codes) as string[];
    const isValid = codes.includes(code);

    if (isValid) {
      // Remover código usado
      const updatedCodes = codes.filter(c => c !== code);
      const updateQuery = `
        UPDATE user_mfa_config 
        SET backup_codes = $1, backup_codes_count = $2, backup_codes_last_used = $3
        WHERE user_id = $4
      `;
      
      await client.query(updateQuery, [
        JSON.stringify(updatedCodes),
        updatedCodes.length,
        new Date(),
        userId
      ]);
      client.release();
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
    // Implementar envio de email (integração com provedor SMTP)
    console.log(`Email para ${email}: ${subject} - ${message}`);
    // TODO: Implementar envio real com provedor SMTP (SendGrid, AWS SES, etc.)
  }
};