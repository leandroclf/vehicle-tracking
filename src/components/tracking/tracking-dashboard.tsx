/**
 * Painel de Controle de Rastreamento - Yukz Vehicle Tracking
 * 
 * Este componente fornece uma interface completa para monitoramento
 * e controle do sistema de rastreamento de veículos.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Car,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Route,
  Calendar,
  Filter,
  Download,
  Settings,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTracking, useMultiVehicleTracking, useTrackingStats } from '@/lib/tracking/use-tracking';
import { Position, VehicleStatus, Trip, TrackingEvent } from '@/lib/tracking/tracking-service';
import { cn } from '@/lib/utils';

interface TrackingDashboardProps {
  vehicleIds: number[];
  className?: string;
  onVehicleSelect?: (vehicleId: number) => void;
}

/**
 * Componente principal do painel de rastreamento
 */
export function TrackingDashboard({ 
  vehicleIds, 
  className,
  onVehicleSelect 
}: TrackingDashboardProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [showOfflineVehicles, setShowOfflineVehicles] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { vehicles, isLoading, error, loadAllVehicles } = useMultiVehicleTracking(vehicleIds);

  /**
   * Manipula seleção de veículo
   */
  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicle(vehicleId);
    onVehicleSelect?.(vehicleId);
  };

  /**
   * Filtra veículos baseado nas configurações
   */
  const filteredVehicles = Array.from(vehicles.entries()).filter(([vehicleId, state]) => {
    if (!showOfflineVehicles && state.vehicleStatus?.status === 'offline') {
      return false;
    }
    return true;
  });

  /**
   * Calcula estatísticas gerais
   */
  const overallStats = {
    total: vehicles.size,
    online: Array.from(vehicles.values()).filter(v => v.vehicleStatus?.status === 'online').length,
    moving: Array.from(vehicles.values()).filter(v => v.vehicleStatus?.is_moving).length,
    alerts: Array.from(vehicles.values()).reduce((sum, v) => sum + v.recentEvents.length, 0)
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Cabeçalho com estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Veículos</p>
                <p className="text-2xl font-bold">{overallStats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{overallStats.online}</p>
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
                <p className="text-2xl font-bold text-blue-600">{overallStats.moving}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold text-orange-600">{overallStats.alerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Controles de Rastreamento</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOfflineVehicles(!showOfflineVehicles)}
              >
                {showOfflineVehicles ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {showOfflineVehicles ? 'Ocultar Offline' : 'Mostrar Offline'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadAllVehicles}>
                <Activity className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de veículos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredVehicles.map(([vehicleId, state]) => (
                  <VehicleCard
                    key={vehicleId}
                    vehicleId={vehicleId}
                    state={state}
                    isSelected={selectedVehicle === vehicleId}
                    onSelect={() => handleVehicleSelect(vehicleId)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes do veículo selecionado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedVehicle ? `Detalhes do Veículo ${selectedVehicle}` : 'Selecione um veículo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedVehicle ? (
              <VehicleDetails vehicleId={selectedVehicle} />
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  <Car className="h-12 w-12 mx-auto mb-4" />
                  <p>Selecione um veículo para ver os detalhes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas e erros */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Componente de card de veículo
 */
function VehicleCard({
  vehicleId,
  state,
  isSelected,
  onSelect
}: {
  vehicleId: number;
  state: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { vehicleStatus, lastPosition, recentEvents } = state;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLastUpdate = () => {
    if (!lastPosition) return 'Sem dados';
    const diff = Date.now() - new Date(lastPosition.timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(vehicleStatus?.status || 'offline'))} />
              <span className="font-medium">Veículo {vehicleId}</span>
            </div>
            {recentEvents.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {recentEvents.length} eventos
              </Badge>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={vehicleStatus?.status === 'online' ? 'default' : 'secondary'}>
                {vehicleStatus?.status || 'offline'}
              </Badge>
            </div>

            {vehicleStatus?.is_moving && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Velocidade:</span>
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {Math.round(vehicleStatus.speed)} km/h
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Última atualização:</span>
              <span>{getLastUpdate()}</span>
            </div>
          </div>

          {/* Ignição */}
          {lastPosition && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className={cn("h-4 w-4", lastPosition.ignition ? "text-green-500" : "text-red-500")} />
              <span>Ignição {lastPosition.ignition ? 'ligada' : 'desligada'}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente de detalhes do veículo
 */
function VehicleDetails({ vehicleId }: { vehicleId: number }) {
  const { 
    lastPosition, 
    vehicleStatus, 
    currentTrip, 
    recentEvents,
    getTrips,
    getEvents 
  } = useTracking({ vehicleId, enableRealtime: true });

  const { totalTrips, totalDistance, averageSpeed, maxSpeed } = useTrackingStats(vehicleId);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [tripsData, eventsData] = await Promise.all([
        getTrips(vehicleId),
        getEvents(vehicleId)
      ]);
      setTrips(tripsData);
      setEvents(eventsData);
    };

    loadData();
  }, [vehicleId, getTrips, getEvents]);

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="trips">Viagens</TabsTrigger>
        <TabsTrigger value="events">Eventos</TabsTrigger>
        <TabsTrigger value="stats">Estatísticas</TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="space-y-4">
        {/* Posição atual */}
        {lastPosition && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posição Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                  <p className="text-lg">{lastPosition.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                  <p className="text-lg">{lastPosition.longitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Velocidade</p>
                  <p className="text-lg">{Math.round(lastPosition.speed)} km/h</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Direção</p>
                  <p className="text-lg">{lastPosition.direction || 'N/A'}°</p>
                </div>
              </div>

              {lastPosition.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                  <p className="text-sm">{lastPosition.address}</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className={cn("h-4 w-4", lastPosition.ignition ? "text-green-500" : "text-red-500")} />
                  <span className="text-sm">Ignição {lastPosition.ignition ? 'ligada' : 'desligada'}</span>
                </div>
                
                {lastPosition.battery_level && (
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm">Bateria: {lastPosition.battery_level}%</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Última atualização: {new Date(lastPosition.timestamp).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Viagem atual */}
        {currentTrip && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Viagem Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Início:</span>
                  <span className="text-sm">{new Date(currentTrip.start_time).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <span className="text-sm">
                    {currentTrip.duration_seconds ? 
                      `${Math.floor(currentTrip.duration_seconds / 3600)}h ${Math.floor((currentTrip.duration_seconds % 3600) / 60)}m` :
                      'Em andamento'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Distância:</span>
                  <span className="text-sm">
                    {currentTrip.distance_meters ? 
                      `${(currentTrip.distance_meters / 1000).toFixed(1)} km` :
                      'Calculando...'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="trips" className="space-y-4">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {trips.map((trip) => (
              <Card key={trip.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {new Date(trip.start_time).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge variant={trip.end_time ? 'default' : 'secondary'}>
                        {trip.end_time ? 'Concluída' : 'Em andamento'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duração: </span>
                        {trip.duration_seconds ? 
                          `${Math.floor(trip.duration_seconds / 3600)}h ${Math.floor((trip.duration_seconds % 3600) / 60)}m` :
                          'N/A'
                        }
                      </div>
                      <div>
                        <span className="text-muted-foreground">Distância: </span>
                        {trip.distance_meters ? `${(trip.distance_meters / 1000).toFixed(1)} km` : 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vel. Máx: </span>
                        {trip.max_speed ? `${Math.round(trip.max_speed)} km/h` : 'N/A'}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vel. Média: </span>
                        {trip.avg_speed ? `${Math.round(trip.avg_speed)} km/h` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="events" className="space-y-4">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EventIcon type={event.type} />
                      <span className="font-medium">{getEventLabel(event.type)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  
                  {event.details && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {JSON.stringify(event.details)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalTrips}</p>
                <p className="text-sm text-muted-foreground">Total de Viagens</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{(totalDistance / 1000).toFixed(0)} km</p>
                <p className="text-sm text-muted-foreground">Distância Total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{Math.round(averageSpeed)} km/h</p>
                <p className="text-sm text-muted-foreground">Velocidade Média</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{Math.round(maxSpeed)} km/h</p>
                <p className="text-sm text-muted-foreground">Velocidade Máxima</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

/**
 * Componente de ícone para eventos
 */
function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'ignition_on':
      return <Zap className="h-4 w-4 text-green-500" />;
    case 'ignition_off':
      return <Zap className="h-4 w-4 text-red-500" />;
    case 'speed_alert':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'movement_start':
      return <Navigation className="h-4 w-4 text-blue-500" />;
    case 'movement_stop':
      return <MapPin className="h-4 w-4 text-gray-500" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

/**
 * Obtém label do evento
 */
function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    'ignition_on': 'Ignição Ligada',
    'ignition_off': 'Ignição Desligada',
    'speed_alert': 'Alerta de Velocidade',
    'movement_start': 'Movimento Iniciado',
    'movement_stop': 'Movimento Parado',
    'panic': 'Botão de Pânico',
    'battery_low': 'Bateria Baixa',
    'geofence_enter': 'Entrada em Geocerca',
    'geofence_exit': 'Saída de Geocerca',
    'location_update': 'Atualização de Localização'
  };
  
  return labels[type] || type;
}

export default TrackingDashboard;