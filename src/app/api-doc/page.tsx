'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Importar SwaggerUI com dynamic import e SSR desabilitado
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
});

export default function ApiDoc() {
  const [specUrl, setSpecUrl] = useState('/api/swagger.json');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Documentação da API</h1>
      <div className="bg-white p-4 rounded shadow-md">
        <SwaggerUI url={specUrl} />
      </div>
    </div>
  );
}