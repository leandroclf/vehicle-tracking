import React from 'react';
import { useLoadScript, GoogleMap, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import { useState, useCallback, useRef, useEffect } from 'react';
import GeofenceManager, { Geofence } from './GeofenceManager';
import RouteHistory, { RoutePoint } from './RouteHistory';
import { Vehicle } from '@/lib/vehicles';

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
  vehicles?: Vehicle[];
  geofences?: Geofence[];
  center?: google.maps.LatLngLiteral | null;
  zoom?: number;
  onVehicleSelect?: (vehicle: Vehicle | null) => void;
  onGeofenceSelect?: (geofence: Geofence | null) => void;
  onGeofenceCreate?: (geofence: Partial<Geofence>) => void;
  onGeofenceUpdate?: (geofence: Geofence) => void;
  onGeofenceDelete?: (geofenceId: string) => void;
  onRoutePointClick?: (point: RoutePoint) => void;
}

// Componente principal do mapa
export default function GoogleMapsComponent({
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
  onRoutePointClick
}: GoogleMapsComponentProps) {
  // Carregar o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'drawing', 'geometry'],
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

  // Efeito para carregar os veículos (simulados por enquanto)
  useEffect(() => {
    // Dados simulados - serão substituídos por dados reais do Supabase
    const mockVehicles: VehiclePosition[] = [
      {
        id: 1,
        name: 'Caminhão 01',
        plate: 'ABC1234',
        type: 'truck',
        lat: -15.7801,
        lng: -47.9292,
        speed: 0,
        heading: 90,
        ignition: false,
        is_moving: false,
        status: 'online',
        last_update: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Carro 02',
        plate: 'DEF5678',
        type: 'car',
        lat: -15.7901,
        lng: -47.9392,
        speed: 60,
        heading: 180,
        ignition: true,
        is_moving: true,
        status: 'online',
        last_update: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Moto 03',
        plate: 'GHI9012',
        type: 'motorcycle',
        lat: -15.7701,
        lng: -47.9192,
        speed: 40,
        heading: 270,
        ignition: true,
        is_moving: true,
        status: 'online',
        last_update: new Date().toISOString(),
      },
    ];

    setVehiclesState(mockVehicles);
  }, []);

  // Efeito para carregar as geocercas (simuladas por enquanto)
  useEffect(() => {
    // Dados simulados - serão substituídos por dados reais do Supabase
    const mockGeofences: Geofence[] = [
      {
        id: '1',
        name: 'Base Principal',
        type: 'polygon',
        paths: [
          { lat: -15.7801, lng: -47.9292 },
          { lat: -15.7851, lng: -47.9292 },
          { lat: -15.7851, lng: -47.9342 },
          { lat: -15.7801, lng: -47.9342 },
        ],
        color: '#4285F4',
        fillColor: '#4285F466',
        clientId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Área de Entrega',
        type: 'circle',
        center: { lat: -15.7901, lng: -47.9392 },
        radius: 500,
        color: '#0F9D58',
        fillColor: '#0F9D5866',
        clientId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setGeofencesState(mockGeofences);
  }, []);

  // Efeito para carregar o histórico de rotas (simulado por enquanto)
  useEffect(() => {
    if (routeHistoryVehicleId) {
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
  }, [routeHistoryVehicleId, vehiclesState]);

  // Efeito para selecionar o veículo com base no ID recebido via props
  useEffect(() => {
    if (selectedVehicleId !== null) {
      const vehicle = vehiclesState.find(v => v.id === selectedVehicleId) || null;
      setSelectedVehicle(vehicle);
      
      // Se encontrou o veículo, centralizar o mapa nele
      if (vehicle) {
        panTo({ lat: vehicle.lat, lng: vehicle.lng });
      }
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehiclesState, panTo]);

  // Função para lidar com o clique em um marcador
  const handleMarkerClick = (vehicle: VehiclePosition) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  // Função para lidar com o fechamento da janela de informações
  const handleInfoWindowClose = () => {
    setSelectedVehicle(null);
    if (onVehicleSelect) {
      onVehicleSelect(null);
    }
  };

  // Função para lidar com a seleção de uma geocerca
  const handleGeofenceSelect = (geofence: Geofence | null) => {
    setSelectedGeofenceId(geofence ? geofence.id : null);
    if (onGeofenceSelect) {
      onGeofenceSelect(geofence);
    }
  };

  // Função para lidar com a criação de uma geocerca
  const handleGeofenceCreate = (geofence: Partial<Geofence>) => {
    // Na implementação real, esta função enviaria os dados para o backend
    // e receberia o ID e outros dados gerados
    const newId = `geofence-${Date.now()}`;
    const newGeofence: Geofence = {
      id: newId,
      name: geofence.name || `Nova Geocerca ${geofencesState.length + 1}`,
      type: geofence.type || 'polygon',
      paths: geofence.paths,
      center: geofence.center,
      radius: geofence.radius,
      color: geofence.color || '#4285F4',
      fillColor: geofence.fillColor || '#4285F466',
      clientId: '1', // ID do cliente atual
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setGeofencesState(prev => [...prev, newGeofence]);
    setSelectedGeofenceId(newId);
    
    if (onGeofenceCreate) {
      onGeofenceCreate(geofence);
    }
  };

  // Função para lidar com a atualização de uma geocerca
  const handleGeofenceUpdate = (geofence: Geofence) => {
    setGeofencesState(prev => 
      prev.map(g => g.id === geofence.id ? { ...g, ...geofence } : g)
    );
    
    if (onGeofenceUpdate) {
      onGeofenceUpdate(geofence);
    }
  };

  // Função para lidar com a exclusão de uma geocerca
  const handleGeofenceDelete = (geofenceId: string) => {
    setGeofencesState(prev => prev.filter(g => g.id !== geofenceId));
    if (selectedGeofenceId === geofenceId) {
      setSelectedGeofenceId(null);
    }
    
    if (onGeofenceDelete) {
      onGeofenceDelete(geofenceId);
    }
  };

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

  // Opções do mapa com base nas props
  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false, // Desabilitar controle nativo, usamos nosso próprio
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeId: mapType,
  };

  // Renderizar o mapa
  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={zoom}
        center={center}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Renderizar camada de tráfego se habilitada */}
        {showTraffic && <TrafficLayer />}

        {/* Renderizar componente de geocercas se habilitado */}
        {showGeofences && (
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
        )}

        {/* Renderizar componente de histórico de rotas se habilitado */}
        {showRouteHistory && routeHistoryVehicleId && (
          <RouteHistory
            routePoints={routePoints}
            vehicleId={routeHistoryVehicleId}
            startDate={routeHistoryStartDate || undefined}
            endDate={routeHistoryEndDate || undefined}
            onPointClick={onRoutePointClick}
          />
        )}

        {/* Renderizar marcadores para cada veículo */}
        {vehiclesState.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            icon={getVehicleIcon(vehicle)}
            title={`${vehicle.name} (${vehicle.plate})`}
            onClick={() => handleMarkerClick(vehicle)}
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
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            if (vehiclesState.length > 0) {
              // Calcular os limites para incluir todos os veículos
              const bounds = new google.maps.LatLngBounds();
              vehiclesState.forEach((vehicle) => {
                bounds.extend({ lat: vehicle.lat, lng: vehicle.lng });
              });
              mapRef.current?.fitBounds(bounds, 50); // 50px de padding
            }
          }}
        >
          Ver todos os veículos
        </button>
      </div>
    </div>
  );
}
