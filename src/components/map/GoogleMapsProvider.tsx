import React, { useState, useEffect, memo } from 'react';
import { LoadScriptProps, LoadScript } from '@react-google-maps/api';

// Bibliotecas do Google Maps que queremos carregar
const libraries: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing'];

// Verificar se a API do Google Maps está carregada
const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.google && !!window.google.maps;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

// Provedor de contexto para o Google Maps
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children,
  onLoadSuccess,
  onLoadError,
}) => {
  // Obter a chave da API do Google Maps das variáveis de ambiente
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Estado para controlar se a API já foi carregada
  const [isLoaded, setIsLoaded] = useState<boolean>(isGoogleMapsLoaded());
  
  // Estado para controlar erros de carregamento
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  // Usar useEffect para verificar se a API já está carregada
  useEffect(() => {
    if (isGoogleMapsLoaded()) {
      setIsLoaded(true);
      if (onLoadSuccess) {
        onLoadSuccess();
      }
    }
  }, [onLoadSuccess]);

  // Verificar se a chave da API está disponível
  useEffect(() => {
    if (!apiKey) {
      console.error('Chave da API do Google Maps não encontrada nas variáveis de ambiente');
      const error = new Error('Chave da API do Google Maps não encontrada');
      setLoadError(error);
      if (onLoadError) {
        onLoadError(error);
      }
    }
  }, [apiKey, onLoadError]);

  // Se a API já estiver carregada, renderizar diretamente os filhos
  if (isLoaded) {
    return <>{children}</>;
  }

  // Se houver um erro, mostrar mensagem de erro
  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50 p-4 text-red-600">
        Erro ao carregar o Google Maps: {loadError.message}
      </div>
    );
  }

  // Configuração de carga para o LoadScript
  const loadingOptions = {
    googleMapsApiKey: apiKey,
    libraries,
    // Desativar o carregamento em diferido para melhorar o desempenho após o carregamento inicial
    preventGoogleFontsLoading: true,
  };

  return (
    <LoadScript
      {...loadingOptions}
      onLoad={() => {
        setIsLoaded(true);
        if (onLoadSuccess) {
          onLoadSuccess();
        }
      }}
      onError={(error) => {
        console.error('Erro ao carregar Google Maps:', error);
        setLoadError(error as Error);
        if (onLoadError) {
          onLoadError(error as Error);
        }
      }}
      loadingElement={
        <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Carregando Google Maps...</span>
        </div>
      }
    >
      {children}
    </LoadScript>
  );
};

export default memo(GoogleMapsProvider);
