import React, { useMemo, memo, Suspense, lazy } from 'react';
import { useLoadScript, GoogleMap, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Vehicle } from '@/lib/vehicles-client';
import { calculateCenter } from '@/lib/google-maps';
import { libraries } from './GoogleMapsProvider';

// Importando os tipos diretamente para uso interno
import type { Geofence } from './GeofenceManager';
import type { RoutePoint } from './RouteHistory';

// Lazy loading dos componentes pesados
const GeofenceManager = lazy(() => import('./GeofenceManager'));
const RouteHistory = lazy(() => import('./RouteHistory'));

// Exportando os tipos para manter compatibilidade
export type { Geofence } from './GeofenceManager';
export type { RoutePoint } from './RouteHistory';

/**
 * Veículo com dados de telemetria em tempo real (campos opcionais fornecidos
 * pelo tracking/realtime em cima do contrato base de `Vehicle`).
 */
export type TrackedVehicle = Omit<Vehicle, 'status'> & {
  status?: Vehicle['status'] | 'online' | 'offline';
  type?: string;
  lat?: number;
  lng?: number;
  speed?: number;
  heading?: number;
  ignition?: boolean;
  is_moving?: boolean;
  last_update?: string;
};

// Estilos para o mapa
const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
};

// Centro inicial do mapa (Brasil)
const center = {
  lat: -15.7801,
  lng: -47.9292,
};

// Tipos para os veículos
interface VehiclePosition {
  id: number;
  name: string;
  plate: string;
  type: 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski';
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  ignition: boolean;
  is_moving: boolean;
  status: 'online' | 'offline';
  last_update: string;
}

// Interface para as propriedades do componente
interface GoogleMapsComponentProps {
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  showTraffic?: boolean;
  showGeofences?: boolean;
  editableGeofences?: boolean;
  showRouteHistory?: boolean;
  routeHistoryVehicleId?: number | null;
  routeHistoryStartDate?: Date | null;
  routeHistoryEndDate?: Date | null;
  selectedVehicleId?: number | null;
  vehicles?: TrackedVehicle[];
  geofences?: Geofence[];
  center?: google.maps.LatLngLiteral | null;
  zoom?: number;
  onVehicleSelect?: (vehicle: TrackedVehicle | null) => void;
  onGeofenceSelect?: (geofence: Geofence | null) => void;
  onGeofenceCreate?: (geofence: Partial<Geofence>) => void;
  onGeofenceUpdate?: (geofence: Geofence) => void;
  onGeofenceDelete?: (geofenceId: string) => void;
  onRoutePointClick?: (point: RoutePoint) => void;
  showVehicleIndicators?: boolean;
  showGroupedVehicles?: boolean;
}

// Componente de loading
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// Componente principal do mapa
function GoogleMapsComponent({
  mapType = 'roadmap',
  showTraffic = false,
  showGeofences = true,
  editableGeofences = false,
  showRouteHistory = false,
  routeHistoryVehicleId = null,
  routeHistoryStartDate = null,
  routeHistoryEndDate = null,
  selectedVehicleId = null,
  vehicles = [],
  geofences = [],
  center = { lat: -15.7801, lng: -47.9292 },
  zoom = 5,
  onVehicleSelect,
  onGeofenceSelect,
  onGeofenceCreate,
  onGeofenceUpdate,
  onGeofenceDelete,
  onRoutePointClick,
  showVehicleIndicators = false,
  showGroupedVehicles = false
}: GoogleMapsComponentProps) {
  // Carregar o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Estado para os veículos
  const [vehiclesState, setVehiclesState] = useState<VehiclePosition[]>([]);
  
  // Estado para o veículo selecionado
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  
  // Estado para as geocercas
  const [geofencesState, setGeofencesState] = useState<Geofence[]>([]);
  
  // Estado para a geocerca selecionada
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  
  // Estado para os pontos de rota
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  
  // Referência para o mapa
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Callback para quando o mapa é carregado
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Função para centralizar o mapa em um veículo
  const panTo = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(15);
    }
  }, []);

  // Atualizar estado de veículos quando as props mudarem
  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      // Converter TrackedVehicle para VehiclePosition (apenas veículos com posição conhecida)
      const vehiclePositions: VehiclePosition[] = vehicles.flatMap((v): VehiclePosition[] => {
        const lat = v.lat ?? v.last_position?.lat;
        const lng = v.lng ?? v.last_position?.lng;

        if (lat === undefined || lng === undefined) {
          return [];
        }

        return [{
          id: v.id,
          name: v.name,
          plate: v.plate,
          type: (v.type as 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski') || 'car',
          lat,
          lng,
          speed: v.speed || 0,
          heading: v.heading,
          ignition: v.ignition || false,
          is_moving: v.is_moving || false,
          status: v.status === 'online' ? 'online' : 'offline',
          last_update: v.last_update || v.last_position?.timestamp || new Date().toISOString()
        }];
      });
      setVehiclesState(vehiclePositions);
    }
  }, [vehicles]);

  // Atualizar estado de geocercas quando as props mudarem
  useEffect(() => {
    if (geofences && geofences.length > 0) {
      setGeofencesState(geofences);
    }
  }, [geofences]);

  // Efeito para selecionar veículo com base no ID
  useEffect(() => {
    if (selectedVehicleId !== null) {
      const vehicle = vehiclesState.find(v => v.id === selectedVehicleId) || null;
      setSelectedVehicle(vehicle);
      
      if (vehicle && mapRef.current) {
        panTo({ lat: vehicle.lat, lng: vehicle.lng });
      }
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehiclesState, panTo]);

  // Efeito para selecionar geocerca com base no ID
  useEffect(() => {
    if (selectedGeofenceId) {
      const geofence = geofencesState.find(g => g.id === selectedGeofenceId);
      if (geofence) {
        // Centralizar no mapa
        if (geofence.type === 'circle' && geofence.center) {
          panTo(geofence.center);
        } else if (geofence.type === 'polygon' && geofence.paths && geofence.paths.length > 0) {
          const center = calculateCenter(geofence.paths);
          panTo(center);
        }
      }
    }
  }, [selectedGeofenceId, geofencesState, panTo]);

  // Efeito para carregar o histórico de rotas (simulado por enquanto)
  useEffect(() => {
    if (routeHistoryVehicleId && showRouteHistory) {
      // Só carregamos os pontos se a rota estiver visível
      // Gerar pontos de rota simulados para o veículo selecionado
      const now = new Date();
      const mockRoutePoints: RoutePoint[] = [];
      
      // Criar uma rota simulada com 100 pontos
      for (let i = 0; i < 100; i++) {
        const timeOffset = i * 60 * 1000; // 1 minuto entre cada ponto
        const timestamp = new Date(now.getTime() - timeOffset).toISOString();
        
        // Determinar posição simulada
        const latOffset = (Math.sin(i / 10) * 0.01);
        const lngOffset = (Math.cos(i / 10) * 0.01);
        
        // Aplicar offset ao veículo selecionado
        const vehicle = vehiclesState.find(v => v.id === routeHistoryVehicleId);
        if (!vehicle) continue;
        
        // Adicionar eventos em pontos específicos
        let event: string | undefined = undefined;
        if (i === 20) event = 'ignition_off';
        if (i === 40) event = 'ignition_on';
        if (i === 60) event = 'speeding';
        if (i === 80) event = 'harsh_braking';
        
        mockRoutePoints.push({
          id: `point-${i}`,
          vehicleId: routeHistoryVehicleId,
          lat: vehicle.lat + latOffset * i,
          lng: vehicle.lng + lngOffset * i,
          speed: Math.floor(Math.random() * 80),
          heading: Math.floor(Math.random() * 360),
          timestamp,
          ignition: i < 20 || i > 40,
          event,
        });
      }
      
      setRoutePoints(mockRoutePoints);
    } else {
      setRoutePoints([]);
    }
  }, [routeHistoryVehicleId, vehiclesState, showRouteHistory]);

  // Função para lidar com o clique em um marcador de veículo
  const handleMarkerClick = useCallback((vehicle: VehiclePosition) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect && vehicles) {
      const matchingVehicle = vehicles.find(v => v.id === vehicle.id);
      if (matchingVehicle) {
        onVehicleSelect(matchingVehicle);
      }
    }
  }, [onVehicleSelect, vehicles]);

  // Função para lidar com o fechamento da janela de informações
  const handleInfoWindowClose = useCallback(() => {
    setSelectedVehicle(null);
    if (onVehicleSelect) {
      onVehicleSelect(null);
    }
  }, [onVehicleSelect]);

  // Manipulador para seleção de geocerca
  const handleGeofenceSelect = useCallback((geofence: Geofence | null) => {
    setSelectedGeofenceId(geofence?.id || null);
    if (onGeofenceSelect) {
      onGeofenceSelect(geofence);
    }
  }, [onGeofenceSelect]);

  // Manipulador para criação de geocerca
  const handleGeofenceCreate = useCallback((geofence: Partial<Geofence>) => {
    if (onGeofenceCreate) {
      onGeofenceCreate(geofence);
    }
  }, [onGeofenceCreate]);

  // Manipulador para atualização de geocerca
  const handleGeofenceUpdate = useCallback((geofence: Geofence) => {
    if (onGeofenceUpdate) {
      onGeofenceUpdate(geofence);
    }
  }, [onGeofenceUpdate]);

  // Manipulador para exclusão de geocerca
  const handleGeofenceDelete = useCallback((geofenceId: string) => {
    if (onGeofenceDelete) {
      onGeofenceDelete(geofenceId);
    }
  }, [onGeofenceDelete]);

  // Memorizando opções do mapa para evitar re-renderizações
  const mapOptions = useMemo(() => ({
    mapTypeId: mapType,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: true,
    disableDefaultUI: false,
  }), [mapType]);

  // Virtualização dos marcadores para melhorar o desempenho
  // Só renderizamos marcadores dentro da área visível do mapa
  const visibleMarkers = useMemo(() => {
    if (!mapRef.current) return vehiclesState;
    
    // Implementação simplificada - na versão completa, verificaria
    // se o marcador está dentro dos limites da área visível
    return vehiclesState;
  }, [vehiclesState]);

  // Memorizando posição dos marcadores
  const markerPositions = useMemo(() => {
    return visibleMarkers.map(vehicle => ({
      position: { lat: vehicle.lat, lng: vehicle.lng },
      vehicle,
    }));
  }, [visibleMarkers]);

  // Renderizar mensagem de erro se o carregamento falhar
  if (loadError) return <div className="p-4 text-red-500">Erro ao carregar o mapa</div>;
  
  // Renderizar mensagem de carregamento enquanto o mapa carrega
  if (!isLoaded) return <div className="p-4">Carregando mapa...</div>;

  // Função para obter o ícone do veículo com base no tipo e status
  const getVehicleIcon = (vehicle: VehiclePosition) => {
    const iconBase = '/icons/';
    
    // Determinar o ícone com base no tipo e status
    let iconFile = '';
    
    if (vehicle.status === 'offline') {
      iconFile = 'vehicle-offline.png';
    } else if (!vehicle.ignition) {
      iconFile = 'vehicle-parked.png';
    } else if (vehicle.is_moving) {
      switch (vehicle.type) {
        case 'car':
          iconFile = 'car-moving.png';
          break;
        case 'truck':
          iconFile = 'truck-moving.png';
          break;
        case 'motorcycle':
          iconFile = 'motorcycle-moving.png';
          break;
        case 'boat':
          iconFile = 'boat-moving.png';
          break;
        case 'jetski':
          iconFile = 'jetski-moving.png';
          break;
        default:
          iconFile = 'vehicle-moving.png';
      }
    } else {
      switch (vehicle.type) {
        case 'car':
          iconFile = 'car-idle.png';
          break;
        case 'truck':
          iconFile = 'truck-idle.png';
          break;
        case 'motorcycle':
          iconFile = 'motorcycle-idle.png';
          break;
        case 'boat':
          iconFile = 'boat-idle.png';
          break;
        case 'jetski':
          iconFile = 'jetski-idle.png';
          break;
        default:
          iconFile = 'vehicle-idle.png';
      }
    }
    
    // Retornar objeto de configuração do ícone
    return {
      url: iconBase + iconFile,
      scaledSize: new google.maps.Size(32, 32),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(16, 16),
      rotation: vehicle.heading || 0,
    };
  };

  // Renderizar o mapa
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={zoom}
        center={center || undefined}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Renderizar camada de tráfego se habilitada */}
        {showTraffic && <TrafficLayer />}

        {/* Renderizar componente de geocercas se habilitado */}
        {showGeofences && (
          <Suspense fallback={<LoadingComponent />}>
            <GeofenceManager
              map={mapRef.current}
              geofences={geofencesState}
              editable={editableGeofences}
              selectedGeofenceId={selectedGeofenceId}
              onGeofenceSelect={handleGeofenceSelect}
              onGeofenceCreate={handleGeofenceCreate}
              onGeofenceUpdate={handleGeofenceUpdate}
              onGeofenceDelete={handleGeofenceDelete}
            />
          </Suspense>
        )}

        {/* Renderizar componente de histórico de rotas se habilitado */}
        {showRouteHistory && routeHistoryVehicleId && (
          <Suspense fallback={<LoadingComponent />}>
            <RouteHistory
              routePoints={routePoints}
              vehicleId={routeHistoryVehicleId}
              startDate={routeHistoryStartDate || undefined}
              endDate={routeHistoryEndDate || undefined}
              onPointClick={onRoutePointClick}
            />
          </Suspense>
        )}

        {/* Marcadores de veículos */}
        {markerPositions.map(({ position, vehicle }) => (
          <Marker
            key={`vehicle-${vehicle.id}`}
            position={position}
            onClick={() => handleMarkerClick(vehicle)}
            icon={getVehicleIcon(vehicle)}
          />
        ))}

        {/* Janela de informações para o veículo selecionado */}
        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2">
              <h3 className="font-medium text-gray-900 dark:text-white">{selectedVehicle.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Placa: {selectedVehicle.plate}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Status: {selectedVehicle.status === 'online' ? 'Online' : 'Offline'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Ignição: {selectedVehicle.ignition ? 'Ligada' : 'Desligada'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Velocidade: {selectedVehicle.speed} km/h
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Atualizado: {new Date(selectedVehicle.last_update).toLocaleString('pt-BR')}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Controles adicionais */}
      {vehiclesState.length > 0 && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              // Calcular os limites para incluir todos os veículos
              const bounds = new google.maps.LatLngBounds();
              vehiclesState.forEach((vehicle) => {
                bounds.extend({ lat: vehicle.lat, lng: vehicle.lng });
              });
              mapRef.current?.fitBounds(bounds, 50); // 50px de padding
            }}
          >
            Ver todos os veículos
          </button>
        </div>
      )}
    </div>
  );
}

// Exportar o componente com memoização para evitar renderizações desnecessárias
export default memo(GoogleMapsComponent);
