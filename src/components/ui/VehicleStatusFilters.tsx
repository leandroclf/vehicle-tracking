'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface VehicleFilterOption {
  id: string;
  label: string;
  icon: string;
  count: number;
  percentage: number;
}

interface VehicleTypeOption {
  id: string;
  label: string;
  icon: string;
}

interface VehicleStatusFiltersProps {
  onFilterChange?: (filters: string[]) => void;
  onTypeChange?: (types: string[]) => void;
  onBlockStatusChange?: (hasBlock: boolean | null) => void;
}

export default function VehicleStatusFilters({
  onFilterChange,
  onTypeChange,
  onBlockStatusChange
}: VehicleStatusFiltersProps) {
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([
    'online', 'offline', 'sem_resposta', 'sleep', 'sem_gps', 'ignicao_ligada', 'em_movimento'
  ]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'carro', 'moto', 'caminhao', 'onibus', 'jetski', 'barco', 'trator', 
    'retroescavadeira', 'moto_eletrica', 'pets', 'celular', 'outros'
  ]);
  
  const [blockStatus, setBlockStatus] = useState<boolean | null>(null);

  // Status de veículos
  const statusOptions: VehicleFilterOption[] = [
    { id: 'online', label: 'Online', icon: '🟢', count: 3, percentage: 37.5 },
    { id: 'sem_resposta', label: 'Sem resposta', icon: '📡', count: 0, percentage: 0 },
    { id: 'offline', label: 'Offline', icon: '🔴', count: 3, percentage: 37.5 },
    { id: 'sleep', label: 'Modo sleep', icon: '💤', count: 2, percentage: 25 },
    { id: 'sem_gps', label: 'Sem sinal GPS', icon: '📍', count: 0, percentage: 0 },
    { id: 'ignicao_ligada', label: 'Ignição ligada', icon: '🔑', count: 2, percentage: 25 },
    { id: 'em_movimento', label: 'Em movimento', icon: '🏎️', count: 1, percentage: 12.5 },
  ];

  // Tipos de veículos
  const typeOptions: VehicleTypeOption[] = [
    { id: 'carro', label: 'Carro / Utilitário Pequeno', icon: '🚗' },
    { id: 'moto', label: 'Motocicleta', icon: '🏍️' },
    { id: 'caminhao', label: 'Caminhão', icon: '🚚' },
    { id: 'onibus', label: 'Ônibus e Micro-Ônibus', icon: '🚌' },
    { id: 'jetski', label: 'Jetski', icon: '🛥️' },
    { id: 'barco', label: 'Barco', icon: '🚢' },
    { id: 'trator', label: 'Trator', icon: '🚜' },
    { id: 'retroescavadeira', label: 'Retroescavadeira', icon: '🏗️' },
    { id: 'moto_eletrica', label: 'Moto e Bicicleta elétrica', icon: '🚲' },
    { id: 'pets', label: 'Pets', icon: '🐾' },
    { id: 'celular', label: 'Celular, portátil, relógio e tag', icon: '📱' },
    { id: 'outros', label: 'Outros não especificados', icon: '📦' },
  ];

  const toggleStatusFilter = (id: string) => {
    let newFilters;
    if (selectedStatusFilters.includes(id)) {
      newFilters = selectedStatusFilters.filter(item => item !== id);
    } else {
      newFilters = [...selectedStatusFilters, id];
    }
    
    setSelectedStatusFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleTypeFilter = (id: string) => {
    let newTypes;
    if (selectedTypes.includes(id)) {
      newTypes = selectedTypes.filter(item => item !== id);
    } else {
      newTypes = [...selectedTypes, id];
    }
    
    setSelectedTypes(newTypes);
    onTypeChange?.(newTypes);
  };

  const handleBlockStatusChange = (value: boolean | null) => {
    setBlockStatus(value);
    onBlockStatusChange?.(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🔍</span>
          <h2 className="text-xl font-semibold">Filtros</h2>
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {}}
        >
          <span className="text-2xl">×</span>
        </button>
      </div>
      
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Status</h3>
        </div>
        
        <div className="space-y-2 mt-4">
          {statusOptions.map(option => (
            <div key={option.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`status-${option.id}`}
                  className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  checked={selectedStatusFilters.includes(option.id)}
                  onChange={() => toggleStatusFilter(option.id)}
                />
                <label htmlFor={`status-${option.id}`} className="flex items-center space-x-2">
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                </label>
              </div>
              <span className="text-gray-500 text-sm">
                {option.count} ({option.percentage.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-medium">Tipo do ativo</h3>
        </div>
        
        <div className="space-y-2 mt-4">
          {typeOptions.map(option => (
            <div key={option.id} className="flex items-center">
              <input
                type="checkbox"
                id={`type-${option.id}`}
                className="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                checked={selectedTypes.includes(option.id)}
                onChange={() => toggleTypeFilter(option.id)}
              />
              <label htmlFor={`type-${option.id}`} className="ml-3 flex items-center space-x-2">
                <span className="text-lg">{option.icon}</span>
                <span>{option.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-medium flex items-center space-x-2">
            <span>🔒</span>
            <span>Possui bloqueio</span>
          </h3>
        </div>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="block-yes"
              name="block-status"
              className="h-5 w-5 border-gray-300 text-blue-500 focus:ring-blue-500"
              checked={blockStatus === true}
              onChange={() => handleBlockStatusChange(true)}
            />
            <label htmlFor="block-yes" className="ml-3">Sim</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="block-no"
              name="block-status"
              className="h-5 w-5 border-gray-300 text-blue-500 focus:ring-blue-500"
              checked={blockStatus === false}
              onChange={() => handleBlockStatusChange(false)}
            />
            <label htmlFor="block-no" className="ml-3">Não</label>
          </div>
        </div>
      </div>
    </div>
  );
} 