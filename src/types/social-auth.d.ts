// Tipos para autenticação social
export interface SocialProvider {
  id: 'google' | 'facebook' | 'apple';
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface SocialAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    enabled: boolean;
  };
  facebook: {
    appId: string;
    appSecret: string;
    enabled: boolean;
  };
  apple: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
    enabled: boolean;
  };
}

export interface SocialAuthResponse {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'facebook' | 'apple';
  accessToken: string;
  idToken?: string; // Para Apple/Google
}

export interface SocialSignupRequest extends SocialLoginRequest {
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

export interface LinkedSocialAccount {
  id: string;
  user_id: string;
  provider: 'google' | 'facebook' | 'apple';
  provider_id: string;
  email: string;
  name: string;
  avatar?: string;
  linked_at: Date;
  last_used_at?: Date;
  is_primary: boolean;
}

export interface SocialAuthError {
  code: 'PROVIDER_ERROR' | 'INVALID_TOKEN' | 'EMAIL_EXISTS' | 'ACCOUNT_LINKED' | 'PROVIDER_DISABLED';
  message: string;
  provider?: string;
  details?: any;
}