'use client';

import React from 'react';
import { composeRefs } from '@/lib/utils';

/**
 * Patch para sobrescrever a implementação de composeRefs do Radix UI
 * que está causando loops infinitos de atualização
 */
export function applyRadixComposeRefsPatch() {
  try {
    if (typeof window === 'undefined') return;

    // Criar um objeto substituto para o módulo @radix-ui/react-compose-refs
    const safeComposeRefsModule = {
      composeRefs: composeRefs,
      useComposedRefs: function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return React.useCallback(composeRefs(...refs), refs);
      }
    };

    // Tentar sobrescrever o módulo no webpack
    // @ts-ignore - Acessando propriedades internas do webpack para sobrescrever o módulo
    if (window.__webpack_require__) {
      const cache = window.__webpack_require__.c;
      if (cache) {
        Object.keys(cache).forEach(moduleId => {
          const mod = cache[moduleId];
          if (mod && mod.exports) {
            const exports = mod.exports;
            
            // Verificar se é o módulo do Radix UI que queremos sobrescrever
            if (
              typeof exports === 'object' && 
              exports.composeRefs && 
              String(exports.composeRefs).includes('radix') &&
              !String(exports.composeRefs).includes('isUpdating')
            ) {
              console.log('[Radix Patch] Sobrescrevendo módulo react-compose-refs');
              mod.exports = safeComposeRefsModule;
            }
          }
        });
      }
    }

    // Definir uma propriedade global para indicar que o patch foi aplicado
    window.__RADIX_COMPOSE_REFS_PATCHED__ = true;
    
    console.log('[Radix Patch] Patch aplicado com sucesso');
  } catch (error) {
    console.error('[Radix Patch] Erro ao aplicar patch:', error);
  }
} 