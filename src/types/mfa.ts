export type MfaProvider = 'sms' | 'totp' | 'email';

export interface MfaSetupRequest {
  provider: MfaProvider;
  phoneNumber?: string;
  email?: string;
}

export interface MfaSetupResponse {
  success: boolean;
  tempSecret?: string;
  qrCodeUrl?: string;
  message: string;
}

export interface MfaVerifyResponse {
  success: boolean;
  message: string;
  error?: string;
}

export type MFASetupRequest = MfaSetupRequest;
export type MFASetupResponse = MfaSetupResponse;
export type MFAVerifyRequest = {
  provider: MfaProvider | 'backup';
  code: string;
  sessionToken: string;
};
export type MFAVerifyResponse = MfaVerifyResponse;
export type MFAStatus = {
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
};
