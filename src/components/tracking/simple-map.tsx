/**
 * Componente de Mapa Simples - Yukz Vehicle Tracking
 * 
 * Este componente exibe um mapa simples com rastreamento em tempo real
 * dos veículos usando uma implementação básica sem Google Maps API.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  Navigation, 
  Zap,
  AlertTriangle,
  Clock,
  Gauge,
  Car,
  Truck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

interface VehicleStatus {
  status: 'online' | 'offline' | 'idle';
  is_moving: boolean;
  last_update: Date;
  lat: number;
  lng: number;
  address?: string;
  speed: number;
  direction?: string;
  ignition: boolean;
  battery: number;
  satellites: number;
}

interface Vehicle {
  id: number;
  name: string;
  plate: string;
  type: 'car' | 'truck' | 'motorcycle';
  color: string;
  status: VehicleStatus;
  position: Position;
}

interface SimpleMapProps {
  className?: string;
  height?: string;
  showControls?: boolean;
  autoRefresh?: boolean;
}

// Dados de exemplo dos veículos
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    name: 'Civic Executivo',
    plate: 'ABC-1234',
    type: 'car',
    color: '#3B82F6',
    status: {
      status: 'online',
      is_moving: true,
      last_update: new Date(),
      lat: -23.5565,
      lng: -46.6273,
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      speed: 42.1,
      direction: 'NE',
      ignition: true,
      battery: 74.0,
      satellites: 8
    },
    position: {
      latitude: -23.5565,
      longitude: -46.6273,
      timestamp: new Date(),
      speed: 42.1,
      heading: 45
    }
  },
  {
    id: 2,
    name: 'Corolla Comercial',
    plate: 'XYZ-5678',
    type: 'car',
    color: '#EF4444',
    status: {
      status: 'online',
      is_moving: true,
      last_update: new Date(),
      lat: -23.5200,
      lng: -46.6800,
      address: 'Marginal Tietê - São Paulo, SP',
      speed: 73.2,
      direction: 'W',
      ignition: true,
      battery: 65.0,
      satellites: 9
    },
    position: {
      latitude: -23.5200,
      longitude: -46.6800,
      timestamp: new Date(),
      speed: 73.2,
      heading: 270
    }
  },
  {
    id: 3,
    name: 'HB20 Delivery',
    plate: 'DEF-9012',
    type: 'car',
    color: '#10B981',
    status: {
      status: 'online',
      is_moving: true,
      last_update: new Date(),
      lat: -23.5540,
      lng: -46.6920,
      address: 'Vila Madalena - São Paulo, SP',
      speed: 31.5,
      direction: 'S',
      ignition: true,
      battery: 81.1,
      satellites: 7
    },
    position: {
      latitude: -23.5540,
      longitude: -46.6920,
      timestamp: new Date(),
      speed: 31.5,
      heading: 180
    }
  },
  {
    id: 4,
    name: 'Onix Vendas',
    plate: 'GHI-3456',
    type: 'car',
    color: '#6B7280',
    status: {
      status: 'offline',
      is_moving: false,
      last_update: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lat: -23.5600,
      lng: -46.6500,
      address: 'Centro - São Paulo, SP',
      speed: 0,
      direction: 'N',
      ignition: false,
      battery: 45.2,
      satellites: 0
    },
    position: {
      latitude: -23.5600,
      longitude: -46.6500,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      speed: 0,
      heading: 0
    }
  },
  {
    id: 5,
    name: 'Strada Obras',
    plate: 'JKL-7890',
    type: 'truck',
    color: '#F59E0B',
    status: {
      status: 'offline',
      is_moving: false,
      last_update: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lat: -23.5800,
      lng: -46.7000,
      address: 'Zona Oeste - São Paulo, SP',
      speed: 0,
      direction: 'N',
      ignition: false,
      battery: 78.5,
      satellites: 0
    },
    position: {
      latitude: -23.5800,
      longitude: -46.7000,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      speed: 0,
      heading: 0
    }
  }
];

/**
 * Componente principal do mapa simples
 */
export function SimpleMap({
  className,
  height = '500px',
  showControls = true,
  autoRefresh = true
}: SimpleMapProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isTracking, setIsTracking] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simular atualizações em tempo real
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.status.status === 'online' && vehicle.status.is_moving) {
            // Simular movimento pequeno
            const deltaLat = (Math.random() - 0.5) * 0.001;
            const deltaLng = (Math.random() - 0.5) * 0.001;
            const deltaSpeed = (Math.random() - 0.5) * 5;
            
            return {
              ...vehicle,
              status: {
                ...vehicle.status,
                lat: vehicle.status.lat + deltaLat,
                lng: vehicle.status.lng + deltaLng,
                speed: Math.max(0, vehicle.status.speed + deltaSpeed),
                last_update: new Date()
              },
              position: {
                ...vehicle.position,
                latitude: vehicle.position.latitude + deltaLat,
                longitude: vehicle.position.longitude + deltaLng,
                speed: Math.max(0, vehicle.position.speed! + deltaSpeed),
                timestamp: new Date()
              }
            };
          }
          return vehicle;
        })
      );
      setLastUpdate(new Date());
    }, 3000); // Atualizar a cada 3 segundos

    return () => clearInterval(interval);
  }, [isTracking]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const refreshData = () => {
    setLastUpdate(new Date());
    // Simular refresh dos dados
    setVehicles([...mockVehicles]);
  };

  const getVehicleIcon = (vehicle: Vehicle) => {
    if (vehicle.type === 'truck') {
      return <Truck size={20} />;
    }
    return <Car size={20} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <div className={cn("flex flex-col h-full", className)} style={{ height }}>
      {/* Controles */}
      {showControls && (
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b">
          <div className="flex items-center space-x-2">
            <Button
              variant={isTracking ? "default" : "outline"}
              size="sm"
              onClick={toggleTracking}
            >
              {isTracking ? <Pause size={16} /> : <Play size={16} />}
              {isTracking ? 'Pausar' : 'Iniciar'} Rastreamento
            </Button>
            
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RotateCcw size={16} />
              Atualizar
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Área do Mapa Simulado */}
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900">
            {/* Grid de fundo para simular mapa */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-10 grid-rows-10 h-full w-full">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="border border-gray-300 dark:border-gray-600" />
                ))}
              </div>
            </div>
            
            {/* Marcadores dos veículos */}
            {vehicles.map((vehicle, index) => {
              // Converter coordenadas para posição na tela (simulação)
              const x = ((vehicle.position.longitude + 46.7) / 0.2) * 100;
              const y = ((23.6 - vehicle.position.latitude) / 0.1) * 100;
              
              return (
                <div
                  key={vehicle.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${Math.max(5, Math.min(95, x))}%`,
                    top: `${Math.max(5, Math.min(95, y))}%`
                  }}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-white shadow-lg transition-all hover:scale-110",
                      vehicle.status.is_moving && "animate-pulse"
                    )}
                    style={{ backgroundColor: vehicle.color }}
                  >
                    {getVehicleIcon(vehicle)}
                  </div>
                  
                  {/* Indicador de status */}
                  <div
                    className={cn(
                      "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                      getStatusColor(vehicle.status.status)
                    )}
                  />
                  
                  {/* Label do veículo */}
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                    {vehicle.name}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legenda */}
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
            <h4 className="font-semibold text-sm mb-2">Legenda</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Offline</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Parado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Painel lateral com lista de veículos */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4">Veículos ({vehicles.length})</h3>
            
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedVehicle?.id === vehicle.id && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: vehicle.color }}
                        />
                        <span className="font-medium text-sm">{vehicle.name}</span>
                      </div>
                      <Badge
                        variant={vehicle.status.status === 'online' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {vehicle.status.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin size={12} />
                        <span>{vehicle.plate}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Gauge size={12} />
                        <span>{vehicle.status.speed.toFixed(1)} km/h</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>{formatLastUpdate(vehicle.status.last_update)}</span>
                      </div>
                      
                      {vehicle.status.address && (
                        <div className="text-xs text-gray-500 truncate">
                          {vehicle.status.address}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do veículo */}
      {selectedVehicle && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedVehicle.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVehicle(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Placa:</span>
                    <div>{selectedVehicle.plate}</div>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <div>
                      <Badge variant={selectedVehicle.status.status === 'online' ? 'default' : 'secondary'}>
                        {selectedVehicle.status.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Velocidade:</span>
                    <div>{selectedVehicle.status.speed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <span className="font-medium">Bateria:</span>
                    <div>{selectedVehicle.status.battery.toFixed(1)}%</div>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Endereço:</span>
                  <div className="text-gray-600 dark:text-gray-400">
                    {selectedVehicle.status.address || 'Não disponível'}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium">Última atualização:</span>
                  <div>{formatLastUpdate(selectedVehicle.status.last_update)}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Ignição:</span>
                    <div>{selectedVehicle.status.ignition ? 'Ligada' : 'Desligada'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Satélites:</span>
                    <div>{selectedVehicle.status.satellites}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}