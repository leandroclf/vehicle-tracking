'use client';

import React, { useState, useEffect } from 'react';
import { useVehicles } from '@/lib/vehicles';
import { Truck, MapPin } from 'lucide-react';

/**
 * Componente leve para exibir uma prévia do mapa sem carregar o iframe completo
 * Evita a duplicação do cabeçalho e outros elementos da UI
 */
export default function MapPreview() {
  const { vehicles } = useVehicles();
  const [vehiclesInView, setVehiclesInView] = useState(0);

  // Simular contagem de veículos em movimento
  useEffect(() => {
    if (vehicles && vehicles.length) {
      // Calcular veículos em movimento (simulação)
      const inMovement = vehicles.filter(v => v.speed > 0).length;
      setVehiclesInView(inMovement);
    }
  }, [vehicles]);

  return (
    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/20 rounded-lg flex flex-col relative overflow-hidden">
      {/* Mapa estilizado minimalista */}
      <div className="w-full h-full bg-[#e8f0f8] dark:bg-[#0a2040] relative p-4">
        {/* Simulação estilizada de mapa */}
        <div className="absolute inset-0">
          {/* Linhas horizontais */}
          <div className="w-full h-px bg-blue-200 dark:bg-blue-700/30 absolute top-1/4"></div>
          <div className="w-full h-px bg-blue-200 dark:bg-blue-700/30 absolute top-2/4"></div>
          <div className="w-full h-px bg-blue-200 dark:bg-blue-700/30 absolute top-3/4"></div>
          
          {/* Linhas verticais */}
          <div className="h-full w-px bg-blue-200 dark:bg-blue-700/30 absolute left-1/4"></div>
          <div className="h-full w-px bg-blue-200 dark:bg-blue-700/30 absolute left-2/4"></div>
          <div className="h-full w-px bg-blue-200 dark:bg-blue-700/30 absolute left-3/4"></div>
        </div>
        
        {/* Posicionamento aleatório para pontos de veículos */}
        {vehicles.slice(0, 5).map((vehicle, index) => (
          <div 
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              left: `${20 + Math.random() * 60}%`, 
              top: `${20 + Math.random() * 60}%`,
              zIndex: 2
            }}
          >
            <div className={`flex flex-col items-center ${vehicle.speed > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
              <Truck className="h-6 w-6" />
              <span className="text-xs font-semibold mt-1 bg-white dark:bg-gray-800 px-2 py-0.5 rounded shadow-sm">
                {vehicle.plate}
              </span>
            </div>
          </div>
        ))}
        
        {/* Pontos de geocerca */}
        <div 
          className="absolute bg-red-200 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-700 rounded-full w-16 h-16 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: '70%', top: '30%' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="text-red-500 h-5 w-5" />
          </div>
        </div>
      </div>
      
      {/* Informações do rodapé */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-xs z-10">
        <div className="flex justify-between">
          <span>
            <span className="font-medium">{vehicles.length}</span> veículos monitorados
          </span>
          <span>
            <span className="font-medium text-green-600 dark:text-green-400">{vehiclesInView}</span> em movimento
          </span>
        </div>
      </div>
    </div>
  );
} 