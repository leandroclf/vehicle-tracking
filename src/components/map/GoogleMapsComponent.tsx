import React from 'react';
import { useLoadScript, GoogleMap, Marker, InfoWindow, TrafficLayer } from '@react-google-maps/api';
import { useState, useCallback, useRef, useEffect } from 'react';

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
  selectedVehicleId?: number | null;
  onVehicleSelect?: (vehicle: VehiclePosition | null) => void;
}

// Componente principal do mapa
export default function GoogleMapsComponent({
  mapType = 'roadmap',
  showTraffic = false,
  showGeofences = true,
  selectedVehicleId = null,
  onVehicleSelect
}: GoogleMapsComponentProps) {
  // Carregar o script do Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Estado para os veículos
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  
  // Estado para o veículo selecionado
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  
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
        ignition: true,
        is_moving: true,
        status: 'online',
        last_update: new Date().toISOString(),
      },
    ];

    setVehicles(mockVehicles);
  }, []);

  // Efeito para selecionar o veículo com base no ID recebido via props
  useEffect(() => {
    if (selectedVehicleId !== null) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
      setSelectedVehicle(vehicle);
      
      // Se encontrou o veículo, centralizar o mapa nele
      if (vehicle) {
        panTo({ lat: vehicle.lat, lng: vehicle.lng });
      }
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles, panTo]);

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
        zoom={5}
        center={center}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {/* Renderizar camada de tráfego se habilitada */}
        {showTraffic && <TrafficLayer />}

        {/* Renderizar marcadores para cada veículo */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            onClick={() => handleMarkerClick(vehicle)}
            icon={getVehicleIcon(vehicle)}
            title={vehicle.name}
          />
        ))}

        {/* Renderizar janela de informações para o veículo selecionado */}
        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2">
              <h3 className="font-bold">{selectedVehicle.name}</h3>
              <p>Placa: {selectedVehicle.plate}</p>
              <p>Velocidade: {selectedVehicle.speed} km/h</p>
              <p>Status: {selectedVehicle.status === 'online' ? 'Online' : 'Offline'}</p>
              <p>Ignição: {selectedVehicle.ignition ? 'Ligada' : 'Desligada'}</p>
              <p>Movimento: {selectedVehicle.is_moving ? 'Em movimento' : 'Parado'}</p>
              <p>Última atualização: {new Date(selectedVehicle.last_update).toLocaleString()}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Controles adicionais */}
      <div className="absolute top-4 right-4 bg-white p-2 rounded shadow-md">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            if (vehicles.length > 0) {
              // Calcular os limites para incluir todos os veículos
              const bounds = new google.maps.LatLngBounds();
              vehicles.forEach((vehicle) => {
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
