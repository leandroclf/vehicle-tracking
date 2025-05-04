'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Truck, Battery, Thermometer, Fuel, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { ConfigurableWidget } from '@/components/dashboard/ConfigurableWidget';
import { motion } from 'framer-motion';

interface VehicleStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'alert';
  lastUpdate: string;
  location: string;
  fuelLevel: number;
  batteryLevel: number;
  temperature: number;
  alerts: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

interface VehicleStatusWidgetProps {
  id: string;
  isEditing?: boolean;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: string) => void;
  onMove?: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  onSettings?: (id: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  vehicleId?: string;
}

export function VehicleStatusWidget({
  id,
  isEditing = false,
  onRemove,
  onResize,
  onMove,
  onSettings,
  size = 'medium',
  className,
  vehicleId
}: VehicleStatusWidgetProps) {
  const [vehicleData, setVehicleData] = useState<VehicleStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  
  // Gerenciar navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasFocus) return;
      
      // Implementar navegação por teclado dentro do widget
      if (e.key === 'Escape') {
        setHasFocus(false);
        widgetRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasFocus]);

  // Simular carregamento de dados do veículo
  useEffect(() => {
    const fetchVehicleData = () => {
      // Simulação de dados - em produção, isso viria da API
      setTimeout(() => {
        const mockData: VehicleStatus = {
          id: vehicleId || 'v1',
          name: 'Caminhão 01',
          status: 'online',
          lastUpdate: new Date().toISOString(),
          location: 'São Paulo, SP - Rodovia Anhanguera, km 15',
          fuelLevel: 65,
          batteryLevel: 90,
          temperature: 78,
          alerts: [
            {
              type: 'maintenance',
              message: 'Manutenção preventiva em 500km',
              severity: 'low'
            }
          ]
        };
        
        setVehicleData(mockData);
        setIsLoading(false);
      }, 1000);
    };

    fetchVehicleData();
  }, [vehicleId]);

  // Função para formatar a data de última atualização
  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para determinar a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'offline': return 'gray';
      case 'maintenance': return 'yellow';
      case 'alert': return 'red';
      default: return 'gray';
    }
  };

  // Função para determinar o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Em operação';
      case 'offline': return 'Desconectado';
      case 'maintenance': return 'Em manutenção';
      case 'alert': return 'Alerta';
      default: return 'Desconhecido';
    }
  };

  return (
    <ConfigurableWidget
      id={id}
      title="Status do Veículo"
      description="Monitoramento em tempo real"
      isEditing={isEditing}
      onRemove={onRemove}
      onResize={onResize}
      onMove={onMove}
      onSettings={onSettings}
      size={size}
      className={className}
    >
      <div 
        ref={widgetRef}
        tabIndex={0}
        role="region"
        aria-label="Informações de status do veículo"
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className={`outline-none ${hasFocus ? 'ring-2 ring-blue-500 rounded-md' : ''}`}
      >
      {isLoading ? (
        <motion.div 
          className="h-40 flex items-center justify-center"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
          aria-busy="true"
        >
          <div className="text-center">
            <div 
              className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"
              role="progressbar"
              aria-label="Carregando dados do veículo"
            ></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Carregando dados do veículo...</p>
          </div>
        </motion.div>
      ) : vehicleData ? (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-blue-700 dark:text-blue-500 mr-2" aria-hidden="true" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{vehicleData.name}</h4>
            </div>
            <StatusBadge 
              status={getStatusColor(vehicleData.status)}
              text={getStatusText(vehicleData.status)}
              aria-label={`Status do veículo: ${getStatusText(vehicleData.status)}`}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center" role="group" aria-label="Localização do veículo">
              <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" aria-hidden="true" />
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">{vehicleData.location}</p>
              </div>
            </div>
            
            <div className="flex items-center" role="group" aria-label="Última atualização">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2" aria-hidden="true" />
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  Atualizado: <time dateTime={vehicleData.lastUpdate}>{formatLastUpdate(vehicleData.lastUpdate)}</time>
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div role="group" aria-labelledby="fuel-level-label">
              <div className="flex justify-between mb-1">
                <span id="fuel-level-label" className="text-sm flex items-center font-medium">
                  <Fuel className="h-4 w-4 mr-1 text-blue-700 dark:text-blue-500" aria-hidden="true" />
                  Combustível
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100" aria-live="polite">{vehicleData.fuelLevel}%</span>
              </div>
              <Progress 
                value={vehicleData.fuelLevel} 
                max={100} 
                className="h-2.5 transition-all duration-300" 
                aria-labelledby="fuel-level-label"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={vehicleData.fuelLevel}
                aria-valuetext={`${vehicleData.fuelLevel} por cento`}
              />
            </div>
            
            <div role="group" aria-labelledby="battery-level-label">
              <div className="flex justify-between mb-1">
                <span id="battery-level-label" className="text-sm flex items-center font-medium">
                  <Battery className="h-4 w-4 mr-1 text-green-700 dark:text-green-500" aria-hidden="true" />
                  Bateria
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100" aria-live="polite">{vehicleData.batteryLevel}%</span>
              </div>
              <Progress 
                value={vehicleData.batteryLevel} 
                max={100} 
                className="h-2.5 transition-all duration-300" 
                aria-labelledby="battery-level-label"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={vehicleData.batteryLevel}
                aria-valuetext={`${vehicleData.batteryLevel} por cento`}
              />
            </div>
            
            <div role="group" aria-labelledby="temperature-level-label">
              <div className="flex justify-between mb-1">
                <span id="temperature-level-label" className="text-sm flex items-center font-medium">
                  <Thermometer className="h-4 w-4 mr-1 text-red-700 dark:text-red-500" aria-hidden="true" />
                  Temperatura
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100" aria-live="polite">{vehicleData.temperature}°C</span>
              </div>
              <Progress 
                value={vehicleData.temperature} 
                max={120} 
                className="h-2.5 transition-all duration-300" 
                aria-labelledby="temperature-level-label"
                aria-valuemin={0}
                aria-valuemax={120}
                aria-valuenow={vehicleData.temperature}
                aria-valuetext={`${vehicleData.temperature} graus Celsius`}
              />
            </div>
          </div>
          
          {vehicleData.alerts.length > 0 && (
            <motion.div 
              className="mt-4 border-t pt-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h5 id="alerts-heading" className="text-sm font-medium mb-2 flex items-center text-gray-900 dark:text-gray-100">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-600 dark:text-amber-500" aria-hidden="true" />
                Alertas
              </h5>
              <ul 
                className="space-y-2" 
                aria-labelledby="alerts-heading"
                aria-live="polite"
              >
                {vehicleData.alerts.map((alert, index) => (
                  <motion.li 
                    key={index} 
                    className={`text-sm p-2.5 rounded-md ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100 border-l-4 border-red-600' :
                      alert.severity === 'medium' ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100 border-l-4 border-amber-600' :
                      'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 border-l-4 border-blue-600'
                    }`}
                    role="alert"
                    aria-atomic="true"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <div className="flex items-start">
                      <span className="font-medium">{alert.message}</span>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="h-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
        >
          <p className="text-gray-600 dark:text-gray-300 font-medium">Nenhum veículo selecionado</p>
        </motion.div>
      )}
      </div>
    </ConfigurableWidget>
  );
}