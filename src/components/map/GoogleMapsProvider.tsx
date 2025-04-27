import React from 'react';
import { LoadScriptProps, LoadScript } from '@react-google-maps/api';

// Bibliotecas do Google Maps que queremos carregar
const libraries: LoadScriptProps['libraries'] = ['places', 'geometry', 'drawing'];

// Provedor de contexto para o Google Maps
export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obter a chave da API do Google Maps das variáveis de ambiente
  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    console.error('Chave da API do Google Maps não encontrada nas variáveis de ambiente');
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={<div className="w-full h-full flex items-center justify-center">Carregando Google Maps...</div>}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;
