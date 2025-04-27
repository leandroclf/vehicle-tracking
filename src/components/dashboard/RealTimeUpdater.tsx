import { useEffect } from 'react';
import { useVehicles } from '@/lib/vehicles';

// Componente para simular atualizações em tempo real dos dados dos veículos
export default function RealTimeUpdater() {
  const { refreshVehicleData } = useVehicles();

  useEffect(() => {
    // Atualizar dados a cada 10 segundos para simular dados em tempo real
    const interval = setInterval(() => {
      refreshVehicleData();
    }, 10000);

    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [refreshVehicleData]);

  // Este componente não renderiza nada visualmente
  return null;
}
