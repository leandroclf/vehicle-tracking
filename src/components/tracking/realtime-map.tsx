/**
 * Componente de Mapa em Tempo Real - Yukz Vehicle Tracking
 * 
 * Este componente exibe um mapa interativo com rastreamento em tempo real
 * dos veículos, incluindo posições atuais, histórico de rotas e eventos.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow, Circle } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  MapPin, 
  Navigation, 
  Zap,
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';
import { useTracking, Position, VehicleStatus } from '@/lib/tracking/use-tracking';
import { cn } from '@/lib/utils';

interface RealtimeMapProps {
  vehicleIds: number[];
  className?: string;
  height?: string;
  showControls?: boolean;
  showTrails?: boolean;
  autoCenter?: boolean;
  onVehicleSelect?: (vehicleId: number) => void;
}

interface VehicleMarkerData {
  id: number;
  position: Position;
  status: VehicleStatus;
  name: string;
  color: string;
  trail: Position[];
}

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const defaultCenter = {
  lat: -23.5505,
  lng: -46.6333 // São Paulo, SP
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

/**
 * Componente principal do mapa em tempo real
 */
export function RealtimeMap({
  vehicleIds,
  className,
  height = '500px',
  showControls = true,
  showTrails = true,
  autoCenter = true,
  onVehicleSelect
}: RealtimeMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [vehicleData, setVehicleData] = useState<Map<number, VehicleMarkerData>>(new Map());
  const [isTracking, setIsTracking] = useState(false);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  const trackingRef = useRef<any>(null);

  // Hook de rastreamento para múltiplos veículos
  const { vehicles, loadAllVehicles } = useTracking({
    vehicleIds,
    autoStart: true,
    enableRealtime: true
  });

  /**
   * Cores para diferentes veículos
   */
  const getVehicleColor = useCallback((index: number): string => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    return colors[index % colors.length];
  }, []);

  /**
   * Obtém ícone do marcador baseado no status do veículo
   */
  const getVehicleIcon = useCallback((status: VehicleStatus, color: string) => {
    const isOnline = status.status === 'online';
    const isMoving = status.is_moving;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: isOnline ? 1 : 0.5,
      strokeColor: isMoving ? '#ffffff' : '#666666',
      strokeWeight: isMoving ? 3 : 1,
      scale: isOnline ? 12 : 8,
    };
  }, []);

  /**
   * Atualiza dados dos veículos
   */
  const updateVehicleData = useCallback(() => {
    const newVehicleData = new Map<number, VehicleMarkerData>();

    vehicleIds.forEach((vehicleId, index) => {
      const vehicleState = vehicles.get(vehicleId);
      if (vehicleState?.lastPosition && vehicleState?.vehicleStatus) {
        const existingData = vehicleData.get(vehicleId);
        const trail = existingData?.trail || [];
        
        // Adicionar nova posição ao trail se for diferente da última
        const lastTrailPosition = trail[trail.length - 1];
        if (!lastTrailPosition || 
            lastTrailPosition.latitude !== vehicleState.lastPosition.latitude ||
            lastTrailPosition.longitude !== vehicleState.lastPosition.longitude) {
          trail.push(vehicleState.lastPosition);
          
          // Manter apenas as últimas 50 posições no trail
          if (trail.length > 50) {
            trail.shift();
          }
        }

        newVehicleData.set(vehicleId, {
          id: vehicleId,
          position: vehicleState.lastPosition,
          status: vehicleState.vehicleStatus,
          name: `Veículo ${vehicleId}`,
          color: getVehicleColor(index),
          trail: showTrails ? trail : []
        });
      }
    });

    setVehicleData(newVehicleData);
  }, [vehicleIds, vehicles, vehicleData, getVehicleColor, showTrails]);

  /**
   * Centraliza o mapa nos veículos
   */
  const centerMapOnVehicles = useCallback(() => {
    if (!map || vehicleData.size === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPositions = false;

    vehicleData.forEach((vehicle) => {
      if (vehicle.position) {
        bounds.extend({
          lat: vehicle.position.latitude,
          lng: vehicle.position.longitude
        });
        hasPositions = true;
      }
    });

    if (hasPositions) {
      map.fitBounds(bounds);
      
      // Se há apenas um veículo, definir zoom apropriado
      if (vehicleData.size === 1) {
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom()! > 16) {
            map.setZoom(16);
          }
        });
      }
    }
  }, [map, vehicleData]);

  /**
   * Manipula clique no marcador do veículo
   */
  const handleMarkerClick = useCallback((vehicleId: number) => {
    setSelectedVehicle(vehicleId);
    setShowInfoWindow(true);
    onVehicleSelect?.(vehicleId);
  }, [onVehicleSelect]);

  /**
   * Inicia/para o rastreamento
   */
  const toggleTracking = useCallback(() => {
    setIsTracking(!isTracking);
  }, [isTracking]);

  /**
   * Recarrega dados dos veículos
   */
  const refreshData = useCallback(() => {
    loadAllVehicles();
  }, [loadAllVehicles]);

  // Efeito para atualizar dados dos veículos
  useEffect(() => {
    updateVehicleData();
  }, [updateVehicleData]);

  // Efeito para centralizar mapa automaticamente
  useEffect(() => {
    if (autoCenter && vehicleData.size > 0) {
      centerMapOnVehicles();
    }
  }, [autoCenter, centerMapOnVehicles, vehicleData.size]);

  // Efeito para rastreamento em tempo real
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        refreshData();
      }, 30000); // Atualizar a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [isTracking, refreshData]);

  /**
   * Renderiza controles do mapa
   */
  const renderControls = () => {
    if (!showControls) return null;

    return (
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <Card className="p-2">
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={isTracking ? "default" : "outline"}
                  onClick={toggleTracking}
                >
                  {isTracking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isTracking ? 'Pausar rastreamento' : 'Iniciar rastreamento'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={refreshData}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar dados</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={centerMapOnVehicles}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Centralizar no(s) veículo(s)</TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Status dos veículos */}
        <Card className="p-3 max-w-xs">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm">Status dos Veículos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2">
              {Array.from(vehicleData.values()).map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: vehicle.color }}
                    />
                    <span>{vehicle.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Badge 
                      variant={vehicle.status.status === 'online' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {vehicle.status.status}
                    </Badge>
                    {vehicle.status.is_moving && (
                      <Badge variant="outline" className="text-xs">
                        <Navigation className="h-3 w-3 mr-1" />
                        {Math.round(vehicle.status.speed)} km/h
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /**
   * Renderiza janela de informações do veículo
   */
  const renderInfoWindow = () => {
    if (!showInfoWindow || !selectedVehicle) return null;

    const vehicle = vehicleData.get(selectedVehicle);
    if (!vehicle) return null;

    return (
      <InfoWindow
        position={{
          lat: vehicle.position.latitude,
          lng: vehicle.position.longitude
        }}
        onCloseClick={() => setShowInfoWindow(false)}
      >
        <div className="p-2 min-w-[200px]">
          <h3 className="font-semibold mb-2">{vehicle.name}</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: vehicle.color }}
              />
              <Badge variant={vehicle.status.status === 'online' ? 'default' : 'secondary'}>
                {vehicle.status.status}
              </Badge>
            </div>

            {vehicle.status.is_moving ? (
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-500" />
                <span>Em movimento - {Math.round(vehicle.status.speed)} km/h</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Parado</span>
              </div>
            )}

            {vehicle.position.ignition ? (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Ignição ligada</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-red-500" />
                <span>Ignição desligada</span>
              </div>
            )}

            {vehicle.position.battery_level && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <span>Bateria: {vehicle.position.battery_level}%</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(vehicle.position.timestamp).toLocaleString('pt-BR')}
              </span>
            </div>

            {vehicle.position.address && (
              <div className="text-xs text-gray-600 mt-2">
                {vehicle.position.address}
              </div>
            )}
          </div>
        </div>
      </InfoWindow>
    );
  };

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height }}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={setMap}
          onUnmount={() => setMap(null)}
        >
          {/* Marcadores dos veículos */}
          {Array.from(vehicleData.values()).map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={{
                lat: vehicle.position.latitude,
                lng: vehicle.position.longitude
              }}
              icon={getVehicleIcon(vehicle.status, vehicle.color)}
              onClick={() => handleMarkerClick(vehicle.id)}
              title={vehicle.name}
            />
          ))}

          {/* Trilhas dos veículos */}
          {showTrails && Array.from(vehicleData.values()).map((vehicle) => (
            vehicle.trail.length > 1 && (
              <Polyline
                key={`trail-${vehicle.id}`}
                path={vehicle.trail.map(pos => ({
                  lat: pos.latitude,
                  lng: pos.longitude
                }))}
                options={{
                  strokeColor: vehicle.color,
                  strokeOpacity: 0.6,
                  strokeWeight: 3,
                  geodesic: true
                }}
              />
            )
          ))}

          {/* Janela de informações */}
          {renderInfoWindow()}
        </GoogleMap>
      </LoadScript>

      {/* Controles */}
      {renderControls()}

      {/* Indicador de status de rastreamento */}
      {isTracking && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Rastreamento ativo
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de mapa simplificado para um único veículo
 */
export function SingleVehicleMap({
  vehicleId,
  className,
  height = '400px',
  showControls = false
}: {
  vehicleId: number;
  className?: string;
  height?: string;
  showControls?: boolean;
}) {
  return (
    <RealtimeMap
      vehicleIds={[vehicleId]}
      className={className}
      height={height}
      showControls={showControls}
      showTrails={true}
      autoCenter={true}
    />
  );
}

export default RealtimeMap;