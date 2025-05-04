'use client';

import React, { useEffect } from 'react';
import { applyRadixComposeRefsPatch } from '@/lib/radix-patch';

interface RadixPatchProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que aplica um patch para corrigir problemas com o módulo @radix-ui/react-compose-refs
 * Este componente deve envolver toda a aplicação
 */
export function RadixPatchProvider({ children }: RadixPatchProviderProps) {
  useEffect(() => {
    // Aplicar o patch uma vez quando o componente for montado
    if (typeof window !== 'undefined' && !window.__RADIX_COMPOSE_REFS_PATCHED__) {
      applyRadixComposeRefsPatch();
    }
  }, []);

  return <>{children}</>;
}

// Adicionar tipagem para a extensão do objeto window
declare global {
  interface Window {
    __RADIX_COMPOSE_REFS_PATCHED__?: boolean;
    __webpack_require__?: {
      c: Record<string, { exports: any }>;
    };
    __WEBPACK_IMPORTED_MODULES__?: Record<string, any>;
  }
} 