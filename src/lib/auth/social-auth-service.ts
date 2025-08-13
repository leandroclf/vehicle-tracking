import { getDbPool } from '@/lib/database';
import { SocialLoginRequest, SocialSignupRequest, SocialAuthResponse, SocialAuthError } from '@/types/social-auth';

/**
 * Serviço para autenticação social
 */
export const socialAuthService = {
  /**
   * Realiza login com provedor social
   */
  async login(request: SocialLoginRequest): Promise<SocialAuthResponse> {
    try {
      let authResponse;
      
      switch (request.provider) {
        case 'google':
          authResponse = await // TODO: Implementar autenticação JWT // signInWithIdToken({
            provider: 'google',
            token: request.idToken || '',
          });
          break;
        case 'facebook':
          authResponse = await // TODO: Implementar autenticação JWT // signInWithOAuth({
            provider: 'facebook',
            options: {
              scopes: 'email,public_profile',
              queryParams: {
                access_token: request.accessToken,
              },
            },
          });
          break;
        case 'apple':
          authResponse = await // TODO: Implementar autenticação JWT // signInWithIdToken({
            provider: 'apple',
            token: request.idToken || '',
          });
          break;
        default:
          throw {
            code: 'PROVIDER_ERROR',
            message: `Provedor ${request.provider} não suportado`,
            provider: request.provider,
          } as SocialAuthError;
      }

      if (authResponse.error) {
        throw {
          code: 'INVALID_TOKEN',
          message: authResponse.error.message,
          provider: request.provider,
          details: authResponse.error,
        } as SocialAuthError;
      }

      // Obter dados do usuário
      const user = authResponse.data.user;
      if (!user) {
        throw {
          code: 'PROVIDER_ERROR',
          message: 'Não foi possível obter dados do usuário',
          provider: request.provider,
        } as SocialAuthError;
      }

      // Registrar o login na tabela de logs
      await this.logAuthAction({
        userId: user.id,
        provider: request.provider,
        action: 'login',
        success: true,
      });

      return {
        provider: request.provider,
        providerId: user.identities?.[0]?.identity_data?.sub || user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        avatar: user.user_metadata?.avatar_url || '',
        accessToken: authResponse.data.session?.access_token || '',
        refreshToken: authResponse.data.session?.refresh_token,
      };
    } catch (error) {
      console.error('Erro na autenticação social:', error);
      
      // Registrar falha no log
      await this.logAuthAction({
        userId: null,
        provider: request.provider,
        action: 'login',
        success: false,
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
      });
      
      if ((error as SocialAuthError).code) {
        throw error;
      }
      
      throw {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Erro desconhecido na autenticação social',
        provider: request.provider,
        details: error,
      } as SocialAuthError;
    }
  },

  /**
   * Realiza cadastro com provedor social
   */
  async signup(request: SocialSignupRequest): Promise<SocialAuthResponse> {
    if (!request.acceptTerms) {
      throw {
        code: 'PROVIDER_ERROR',
        message: 'É necessário aceitar os termos de uso',
        provider: request.provider,
      } as SocialAuthError;
    }

    // TODO: Migrado do Supabase para PostgreSQL direto
    const response = await this.login(request);
    
    // Atualizar metadados do usuário para incluir aceitação dos termos
    // TODO: Implementar query SQL direta
    const error = null; // await pool.query(...).auth.updateUser({
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        marketing_consent: request.marketingConsent || false,
      },
    });

    if (error) {
      console.error('Erro ao atualizar metadados do usuário:', error);
    }

    // Registrar o signup na tabela de logs
    await this.logAuthAction({
      userId: response.providerId,
      provider: request.provider,
      action: 'signup',
      success: true,
    });

    return response;
  },

  /**
   * Vincula uma conta social a um usuário existente
   */
  async linkAccount(userId: string, request: SocialLoginRequest): Promise<boolean> {
    try {
      // TODO: Migrado do Supabase para PostgreSQL direto
      // Esta é uma implementação simulada
      console.log(`Vinculando conta ${request.provider} ao usuário ${userId}`);
      
      // Registrar a vinculação na tabela de logs
      await this.logAuthAction({
        userId,
        provider: request.provider,
        action: 'link',
        success: true,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao vincular conta social:', error);
      
      // Registrar falha no log
      await this.logAuthAction({
        userId,
        provider: request.provider,
        action: 'link',
        success: false,
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
      });
      
      throw {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao vincular conta social',
        provider: request.provider,
        details: error,
      } as SocialAuthError;
    }
  },

  /**
   * Desvincula uma conta social de um usuário
   */
  async unlinkAccount(userId: string, provider: string): Promise<boolean> {
    try {
      // TODO: Migrado do Supabase para PostgreSQL direto
      // Esta é uma implementação simulada
      console.log(`Desvinculando conta ${provider} do usuário ${userId}`);
      
      // Registrar a desvinculação na tabela de logs
      await this.logAuthAction({
        userId,
        provider: provider as any,
        action: 'unlink',
        success: true,
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao desvincular conta social:', error);
      
      // Registrar falha no log
      await this.logAuthAction({
        userId,
        provider: provider as any,
        action: 'unlink',
        success: false,
        errorMessage: error instanceof Error ? error.message : JSON.stringify(error),
      });
      
      throw {
        code: 'PROVIDER_ERROR',
        message: error instanceof Error ? error.message : 'Erro ao desvincular conta social',
        provider,
        details: error,
      } as SocialAuthError;
    }
  },

  /**
   * Obtém as contas sociais vinculadas a um usuário
   */
  async getLinkedAccounts(userId: string) {
    try {
      // TODO: Implementar query SQL direta
    const data = null;`r`n    const error = null;`r`n    // await pool.query(...)
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erro ao obter contas vinculadas:', error);
      return [];
    }
  },

  /**
   * Registra uma ação de autenticação no log
   */
  async logAuthAction({
    userId,
    provider,
    action,
    success,
    errorMessage,
    errorCode,
  }: {
    userId: string | null;
    provider: 'google' | 'facebook' | 'apple';
    action: 'login' | 'signup' | 'link' | 'unlink';
    success: boolean;
    errorMessage?: string;
    errorCode?: string;
  }) {
    try {
      // TODO: Implementar query SQL direta
    // await pool.query.from('social_auth_logs').insert({
        user_id: userId,
        provider,
        action,
        success,
        error_message: errorMessage,
        error_code: errorCode,
      });
    } catch (error) {
      console.error('Erro ao registrar log de autenticação:', error);
    }
  },
};