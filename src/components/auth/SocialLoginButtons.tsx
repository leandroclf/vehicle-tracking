'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SocialProvider } from '@/types/social-auth';

interface SocialLoginButtonsProps {
  onSocialLogin: (provider: string) => Promise<void>;
  isLoading?: boolean;
  providers?: SocialProvider[];
}

export function SocialLoginButtons({ 
  onSocialLogin, 
  isLoading = false,
  providers = [
    { id: 'google', name: 'Google', icon: 'google', color: '#DB4437', enabled: true },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#4267B2', enabled: true },
    { id: 'apple', name: 'Apple', icon: 'apple', color: '#000000', enabled: true },
  ] 
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    if (isLoading || loadingProvider) return;
    
    setLoadingProvider(provider);
    try {
      await onSocialLogin(provider);
    } catch (error) {
      console.error(`Erro ao autenticar com ${provider}:`, error);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Filtrar apenas provedores habilitados
  const enabledProviders = providers.filter(p => p.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center justify-center text-xs uppercase my-4">
        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
          ou continue com
        </span>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gray-300 dark:bg-gray-700"></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {enabledProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="h-10"
            style={{ borderColor: provider.color }}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={isLoading || !!loadingProvider}
            isLoading={loadingProvider === provider.id}
          >
            <SocialIcon provider={provider.id} color={provider.color} />
          </Button>
        ))}
      </div>
    </div>
  );
}

function SocialIcon({ provider, color }: { provider: string, color: string }) {
  switch (provider) {
    case 'google':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case 'apple':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20.94c1.5 0 2.75-.67 4.13-1.5 1.38-.83 2.38-1.93 2.38-3.93 0-2.25-1.85-3.2-3.6-4.03-1.76-.83-3.16-1.48-3.16-2.97 0-1.25.95-2.27 2.58-2.27 1.28 0 2.3.47 3.12 1.2.83.73 1.5 1.73 1.5 2.97h2.25c0-1.5-.83-3.09-2.25-4.09-1.42-1-3.16-1.5-4.88-1.5-3.62 0-6.45 2.33-6.45 5.4 0 2.25 1.85 3.2 3.6 4.03 1.76.83 3.16 1.48 3.16 2.97 0 1.25-.95 2.27-2.58 2.27-1.28 0-2.3-.47-3.12-1.2-.83-.73-1.5-1.73-1.5-2.97H4.5c0 1.5.83 3.09 2.25 4.09 1.42 1 3.16 1.5 4.88 1.5z" />
        </svg>
      );
    default:
      return null;
  }
}