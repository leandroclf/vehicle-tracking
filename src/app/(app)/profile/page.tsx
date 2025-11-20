'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { SocialAuthError, LinkedSocialAccount } from '@/types/social-auth';

function SocialAccountItem({ account, onUnlink }: { 
  account: LinkedSocialAccount, 
  onUnlink: (provider: string) => void 
}) {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" fill="#1877F2"/>
          </svg>
        );
      case 'apple':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.23 2.31-.94 3.57-.8 1.51.17 2.65.77 3.39 1.95-3.03 1.96-2.48 5.15.22 6.48-.62 1.61-1.42 3.18-2.26 4.55zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.26 2.01-1.76 4.07-3.74 4.25z" fill="#000000"/>
          </svg>
        );
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full"></div>;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google';
      case 'facebook': return 'Facebook';
      case 'apple': return 'Apple';
      default: return provider;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg mb-3 bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {getProviderIcon(account.provider)}
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {getProviderName(account.provider)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {account.email || 'Email não disponível'}
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onUnlink(account.provider)}
      >
        Desvincular
      </Button>
    </div>
  );
}

function ProfileForm() {
  const router = useRouter();
  const { user, getLinkedAccounts, linkSocialAccount, unlinkSocialAccount } = useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedSocialAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    loadLinkedAccounts();
  }, [user, router]);

  const loadLinkedAccounts = async () => {
    setIsLoading(true);
    try {
      const accounts = await getLinkedAccounts();
      setLinkedAccounts(accounts);
    } catch (err) {
      console.error('Erro ao carregar contas vinculadas:', err);
      setError('Não foi possível carregar suas contas vinculadas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (provider: string) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      // Simulação de tokens para demonstração
      const accessToken = 'demo-access-token';
      const idToken = provider === 'apple' || provider === 'google' ? 'demo-id-token' : undefined;
      
      await linkSocialAccount(provider, accessToken, idToken);
      await loadLinkedAccounts();
      setSuccess(`Conta ${provider} vinculada com sucesso!`);
    } catch (err: any) {
      const socialError = err as SocialAuthError;
      setError(socialError.message || 'Erro ao vincular conta social');
      console.error('Erro ao vincular conta:', socialError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkAccount = async (provider: string) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    try {
      await unlinkSocialAccount(provider);
      setLinkedAccounts(prev => prev.filter(account => account.provider !== provider));
      setSuccess(`Conta ${provider} desvinculada com sucesso!`);
    } catch (err: any) {
      const socialError = err as SocialAuthError;
      setError(socialError.message || 'Erro ao desvincular conta social');
      console.error('Erro ao desvincular conta:', socialError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center p-8">Redirecionando para login...</div>;
  }

  return (
    <div className="py-8">
      <Container>
        <h1 className="text-2xl font-bold mb-6 text-[#00315c] dark:text-blue-400">Perfil do Usuário</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                    <p className="font-medium">{user.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
                    <p className="font-medium">{user.phone || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Contas Vinculadas</h2>
                
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert variant="success" className="mb-4">
                    {success}
                  </Alert>
                )}
                
                {isLoading ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : (
                  <>
                    {linkedAccounts.length > 0 ? (
                      <div className="mb-6">
                        {linkedAccounts.map((account) => (
                          <SocialAccountItem 
                            key={account.provider} 
                            account={account} 
                            onUnlink={handleUnlinkAccount} 
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Você não tem contas sociais vinculadas.
                      </p>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3">Vincular Nova Conta</h3>
                      <div className="flex flex-wrap gap-3">
                        {['google', 'facebook', 'apple'].filter(provider => 
                          !linkedAccounts.some(account => account.provider === provider)
                        ).map(provider => (
                          <Button 
                            key={provider}
                            variant="outline"
                            onClick={() => handleLinkAccount(provider)}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                          >
                            {provider === 'google' && (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                            )}
                            {provider === 'facebook' && (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" fill="#1877F2"/>
                              </svg>
                            )}
                            {provider === 'apple' && (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.79 1.18-.23 2.31-.94 3.57-.8 1.51.17 2.65.77 3.39 1.95-3.03 1.96-2.48 5.15.22 6.48-.62 1.61-1.42 3.18-2.26 4.55zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.26 2.01-1.76 4.07-3.74 4.25z" fill="#000000"/>
                              </svg>
                            )}
                            Vincular {provider.charAt(0).toUpperCase() + provider.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-100">Carregando...</div>}>
      <ProfileForm />
    </Suspense>
  );
}