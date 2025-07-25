// Tipos para autenticação multifatorial
export interface MFAProvider {
  id: 'sms' | 'totp' | 'email';
  name: string;
  enabled: boolean;
  required: boolean;
}

export interface MFAConfig {
  enabled: boolean;
  requiredForAdmin: boolean;
  providers: MFAProvider[];
  backupCodes: {
    enabled: boolean;
    count: number;
  };
}

export interface MFASetupRequest {
  provider: 'sms' | 'totp' | 'email';
  phone?: string;
  email?: string;
}

export interface MFASetupResponse {
  success: boolean;
  qrCode?: string; // Para TOTP
  backupCodes?: string[];
  message: string;
}

export interface MFAVerifyRequest {
  provider: 'sms' | 'totp' | 'email' | 'backup';
  code: string;
  sessionToken: string;
}

export interface MFAVerifyResponse {
  success: boolean;
  accessToken?: string;
  message: string;
  remainingBackupCodes?: number;
}

export interface MFAStatus {
  enabled: boolean;
  providers: {
    sms: { enabled: boolean; phone?: string };
    totp: { enabled: boolean };
    email: { enabled: boolean; email?: string };
  };
  backupCodes: {
    count: number;
    lastUsed?: Date;
  };
}

export interface MFASession {
  id: string;
  userId: string;
  provider: string;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}