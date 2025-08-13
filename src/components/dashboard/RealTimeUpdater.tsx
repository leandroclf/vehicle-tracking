"use client";

import { useEffect } from 'react';
import { useVehicles } from '@/lib/vehicles-client';

/**
 * Componente invisível que atualiza dados em tempo real
 * Este componente não renderiza nada visível na interface,
 * mas gerencia atualizações de dados em tempo real
 */
export const RealTimeUpdater = () => {
  const { refreshVehicles } = useVehicles();

  useEffect(() => {
    // Atualizar dados a cada 10 segundos para simular dados em tempo real
    const interval = setInterval(() => {
      refreshVehicles();
    }, 10000);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [refreshVehicles]);

  // Este componente não renderiza nada visualmente
  return null;
};

// Também exportar como default para compatibilidade
export default RealTimeUpdater;
