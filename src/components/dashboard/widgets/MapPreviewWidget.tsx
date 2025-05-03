"use client";

import React, { useState } from 'react';
import { Map } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useRouter } from 'next/navigation';

interface MapPreviewWidgetProps {
  previewOnly?: boolean;
}

export default function MapPreviewWidget({ previewOnly = true }: MapPreviewWidgetProps) {
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large' | 'full'>(
    previewOnly ? 'medium' : 'large'
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const handleViewFullMap = () => {
    router.push('/dashboard/map');
  };
  
  return (
    <DashboardWidget
      title="Mapa de Veículos"
      icon={<Map />}
      size={widgetSize}
      onSizeChange={previewOnly ? undefined : setWidgetSize}
      isLoading={isLoading}
    >
      <div className="w-full h-64 md:h-72 lg:h-80 relative">
        {/* Este iframe seria substituído pelo componente de mapa real integrado ao Google Maps */}
        <iframe 
          src="/dashboard/map?embed=true" 
          className="w-full h-full border-0 rounded-lg" 
          title="Mapa de veículos"
        ></iframe>
        
        {/* Overlay para o modo preview */}
        {previewOnly && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-center p-4">
            <button
              onClick={handleViewFullMap}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Ver mapa completo
            </button>
          </div>
        )}
      </div>
      
      {!previewOnly && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <div className="text-gray-500 dark:text-gray-400">
              <span className="font-medium">8 veículos</span> visíveis na área
            </div>
            <button 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={() => setIsLoading(prev => !prev)} // Para teste de loading
            >
              Atualizar visualização
            </button>
          </div>
        </div>
      )}
    </DashboardWidget>
  );
} 