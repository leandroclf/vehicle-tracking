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

    // Verificar se o patch já foi aplicado
    if (window.__RADIX_COMPOSE_REFS_PATCHED__) {
      console.log('[Radix Patch] Patch já foi aplicado anteriormente');
      return;
    }

    // Criar objeto substituto para o módulo @radix-ui/react-compose-refs
    const safeComposeRefsModule = {
      composeRefs: composeRefs,
      useComposedRefs: function useComposedRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return React.useCallback(composeRefs(...refs), refs);
      }
    };

    // Também adicionar no escopo global para interceptar chamadas diretas
    // @ts-ignore - Sobrescrever módulo global para interceptar chamadas diretas
    window.__RADIX_COMPOSE_REFS__ = safeComposeRefsModule;

    // Tentar sobrescrever o módulo no webpack
    // @ts-ignore - Acessando propriedades internas do webpack
    if (window.__webpack_require__) {
      // @ts-ignore
      const cache = window.__webpack_require__.c || {};
      
      Object.keys(cache).forEach(moduleId => {
        const mod = cache[moduleId];
        if (!mod || !mod.exports) return;
        
        const exports = mod.exports;
        
        // Verificar o módulo do Radix UI que queremos sobrescrever
        if (
          typeof exports === 'object' && 
          exports.composeRefs && 
          String(exports.composeRefs).includes('radix') &&
          !String(exports.composeRefs).includes('isUpdating')
        ) {
          console.log('[Radix Patch] Sobrescrevendo módulo react-compose-refs', moduleId);
          
          // Fazer backup das funções originais
          const originalComposeRefs = exports.composeRefs;
          const originalUseComposedRefs = exports.useComposedRefs;
          
          // Substituir com versões seguras
          Object.defineProperty(exports, 'composeRefs', {
            value: composeRefs,
            writable: true,
            configurable: true
          });
          
          Object.defineProperty(exports, 'useComposedRefs', {
            value: safeComposeRefsModule.useComposedRefs,
            writable: true,
            configurable: true
          });
          
          // Substituir todo o módulo
          mod.exports = safeComposeRefsModule;
        }
      });
    }

    // Definir uma propriedade global para indicar que o patch foi aplicado
    window.__RADIX_COMPOSE_REFS_PATCHED__ = true;
    
    console.log('[Radix Patch] Patch aplicado com sucesso');
  } catch (error) {
    console.error('[Radix Patch] Erro ao aplicar patch:', error);
  }
} 