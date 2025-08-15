/**
 * Dashboard de Rastreamento Simples - Yukz Vehicle Tracking
 * 
 * Este componente fornece uma interface simples para monitoramento
 * de veículos sem dependências complexas.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { 
  Car,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle,
  Truck,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleData {
  id: number;
  name: string;
  plate: string;
  type: 'car' | 'truck' | 'motorcycle';
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

interface TrackingDashboardProps {
  className?: string;
}

// Dados de exemplo dos veículos
const mockVehicleData: VehicleData[] = [
  {
    id: 1,
    name: 'Civic Executivo',
    plate: 'ABC-1234',
    type: 'car',
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
  {
    id: 2,
    name: 'Corolla Comercial',
    plate: 'XYZ-5678',
    type: 'car',
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
  {
    id: 3,
    name: 'HB20 Delivery',
    plate: 'DEF-9012',
    type: 'car',
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
  {
    id: 4,
    name: 'Onix Vendas',
    plate: 'GHI-3456',
    type: 'car',
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
  {
    id: 5,
    name: 'Strada Obras',
    plate: 'JKL-7890',
    type: 'truck',
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
  }
];

/**
 * Componente principal do dashboard de rastreamento
 */
export function TrackingDashboard({ className }: TrackingDashboardProps) {
  const [vehicles, setVehicles] = useState<VehicleData[]>(mockVehicleData);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Simular atualizações automáticas
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          if (vehicle.status === 'online' && vehicle.is_moving) {
            // Simular pequenas mudanças
            const deltaSpeed = (Math.random() - 0.5) * 5;
            return {
              ...vehicle,
              speed: Math.max(0, vehicle.speed + deltaSpeed),
              last_update: new Date()
            };
          }
          return vehicle;
        })
      );
      setLastUpdate(new Date());
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const refreshData = () => {
    setLastUpdate(new Date());
    setVehicles([...mockVehicleData]);
  };

  const getVehicleIcon = (vehicle: VehicleData) => {
    if (vehicle.type === 'truck') {
      return <Truck size={16} />;
    }
    return <Car size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-red-600';
      case 'idle':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="secondary">Offline</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Parado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
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

  // Calcular estatísticas
  const stats = {
    total: vehicles.length,
    online: vehicles.filter(v => v.status === 'online').length,
    moving: vehicles.filter(v => v.is_moving).length,
    offline: vehicles.filter(v => v.status === 'offline').length
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Movimento</p>
                <p className="text-2xl font-bold text-blue-600">{stats.moving}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Controle de Rastreamento</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                <Activity className="h-4 w-4 mr-2" />
                {isAutoRefresh ? 'Pausar' : 'Iniciar'} Auto-refresh
              </Button>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </CardHeader>
      </Card>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Veículos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Veículos ({vehicles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
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
                          {getVehicleIcon(vehicle)}
                          <span className="font-medium text-sm">{vehicle.name}</span>
                        </div>
                        {getStatusBadge(vehicle.status)}
                      </div>
                      
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center space-x-1">
                          <MapPin size={12} />
                          <span>{vehicle.plate}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Gauge size={12} />
                          <span>{vehicle.speed.toFixed(1)} km/h</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock size={12} />
                          <span>{formatLastUpdate(vehicle.last_update)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes do Veículo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedVehicle ? `Detalhes - ${selectedVehicle.name}` : 'Selecione um veículo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVehicle ? (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Placa</p>
                    <p className="text-lg">{selectedVehicle.plate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="text-lg capitalize">{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className={cn("text-lg font-medium", getStatusColor(selectedVehicle.status))}>
                      {selectedVehicle.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Movimento</p>
                    <p className="text-lg">{selectedVehicle.is_moving ? 'Em movimento' : 'Parado'}</p>
                  </div>
                </div>

                {/* Localização */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Localização</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                      <p className="text-lg">{selectedVehicle.lat.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                      <p className="text-lg">{selectedVehicle.lng.toFixed(6)}</p>
                    </div>
                  </div>
                  {selectedVehicle.address && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedVehicle.address}
                      </p>
                    </div>
                  )}
                </div>

                {/* Dados do Veículo */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Dados do Veículo</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Velocidade</p>
                      <p className="text-lg">{selectedVehicle.speed.toFixed(1)} km/h</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Direção</p>
                      <p className="text-lg">{selectedVehicle.direction || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ignição</p>
                      <p className="text-lg">{selectedVehicle.ignition ? 'Ligada' : 'Desligada'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bateria</p>
                      <p className="text-lg">{selectedVehicle.battery.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Satélites</p>
                      <p className="text-lg">{selectedVehicle.satellites}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última atualização</p>
                      <p className="text-lg">{formatLastUpdate(selectedVehicle.last_update)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Selecione um veículo da lista para ver os detalhes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}