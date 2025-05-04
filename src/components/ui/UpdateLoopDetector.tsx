'use client';

import React, { useEffect, useRef } from 'react';

interface UpdateLoopDetectorProps {
  children: React.ReactNode;
  maxUpdatesPerSecond?: number;
  onLoopDetected?: () => void;
}

/**
 * Componente que detecta e previne loops infinitos de atualização
 * Monitora a frequência de renderizações e intervém quando ultrapassar o limite
 */
export function UpdateLoopDetector({
  children,
  maxUpdatesPerSecond = 50,
  onLoopDetected
}: UpdateLoopDetectorProps) {
  const renderCountRef = useRef(0);
  const timeWindowRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  useEffect(() => {
    // Incrementar contador de renderizações
    renderCountRef.current += 1;
    
    const now = Date.now();
    const timeWindow = timeWindowRef.current;
    const elapsed = now - timeWindow;
    
    // Verificar se estamos dentro de uma janela de tempo (1 segundo)
    if (elapsed >= 1000) {
      // Reiniciar contador para nova janela de tempo
      const updatesPerSecond = renderCountRef.current;
      renderCountRef.current = 0;
      timeWindowRef.current = now;
      
      // Se o número de atualizações por segundo exceder o limite e o aviso não foi mostrado
      if (updatesPerSecond > maxUpdatesPerSecond && !warningShownRef.current) {
        warningShownRef.current = true;
        
        console.warn(
          `[UpdateLoopDetector] Possível loop de atualizações detectado: ${updatesPerSecond} atualizações/segundo`,
          {
            limite: maxUpdatesPerSecond,
            medido: updatesPerSecond
          }
        );
        
        // Chamar callback se fornecido
        if (onLoopDetected) {
          onLoopDetected();
        }
        
        // Aplicar patch Radix se disponível
        if (typeof window !== 'undefined' && !window.__RADIX_COMPOSE_REFS_PATCHED__) {
          console.log('[UpdateLoopDetector] Aplicando RadixPatch de emergência');
          
          // Importação dinâmica para evitar problemas de SSR
          import('@/lib/radix-patch').then(module => {
            module.applyRadixComposeRefsPatch();
          });
        }
      }
    }
  });

  return <>{children}</>;
}

// Adicionar tipagem para a extensão do objeto window
declare global {
  interface Window {
    __RADIX_COMPOSE_REFS_PATCHED__?: boolean;
  }
} 