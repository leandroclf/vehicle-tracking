import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Polygon, Circle, DrawingManager } from '@react-google-maps/api';

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'polygon' | 'circle';
  radius?: number;
  center?: google.maps.LatLngLiteral;
  paths?: google.maps.LatLngLiteral[];
  color: string;
  fillColor: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para evento de entrada/saída de geocerca
export interface GeofenceEvent {
  id: string;
  vehicleId: number;
  geofenceId: string;
  eventType: 'enter' | 'exit';
  timestamp: string;
  position: google.maps.LatLngLiteral;
}

interface GeofenceManagerProps {
  map: google.maps.Map | null;
  geofences: Geofence[];
  vehicles?: Array<{
    id: number;
    lat: number;
    lng: number;
    name: string;
    plate: string;
  }>;
  editable?: boolean;
  selectedGeofenceId?: string | null;
  onGeofenceSelect?: (geofence: Geofence | null) => void;
  onGeofenceCreate?: (geofence: Partial<Geofence>) => void;
  onGeofenceUpdate?: (geofence: Geofence) => void;
  onGeofenceDelete?: (geofenceId: string) => void;
  onGeofenceEvent?: (event: GeofenceEvent) => void;
}

// Componente para exibir alertas de geocerca
const GeofenceAlertPanel: React.FC<{
  alerts: GeofenceEvent[];
  geofences: Geofence[];
  vehicles: Array<{ id: number; name: string; plate: string; }>;
  onClose: () => void;
}> = ({ alerts, geofences, vehicles, onClose }) => {
  if (alerts.length === 0) return null;
  
  // Função para obter o nome da geocerca
  const getGeofenceName = (geofenceId: string) => {
    const geofence = geofences.find(g => g.id === geofenceId);
    return geofence?.name || 'Geocerca desconhecida';
  };
  
  // Função para obter o nome do veículo
  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.name || `Veículo ${vehicleId}`;
  };
  
  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <div className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden z-10">
      <div className="p-3 bg-blue-500 dark:bg-blue-600 text-white flex justify-between items-center">
        <h3 className="font-medium">Alertas de Geocerca</h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
          aria-label="Fechar painel de alertas"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`p-3 border-b border-gray-200 dark:border-gray-700 ${alert.eventType === 'enter' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
          >
            <div className="flex items-center mb-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${alert.eventType === 'enter' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-medium">
                {alert.eventType === 'enter' ? 'Entrada' : 'Saída'} - {getVehicleName(alert.vehicleId)}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Geocerca: {getGeofenceName(alert.geofenceId)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(alert.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  map,
  geofences,
  vehicles = [],
  editable = false,
  selectedGeofenceId = null,
  onGeofenceSelect,
  onGeofenceCreate,
  onGeofenceUpdate,
  onGeofenceDelete,
  onGeofenceEvent,
}) => {
  // Estado para controlar o modo de desenho
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  
  // Estado para armazenar a geocerca selecionada
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  
  // Estado para rastrear veículos dentro de cada geocerca
  const [vehiclesInGeofences, setVehiclesInGeofences] = useState<Record<string, number[]>>({});
  
  // Estado para alertas de geocerca
  const [geofenceAlerts, setGeofenceAlerts] = useState<GeofenceEvent[]>([]);
  const [showAlerts, setShowAlerts] = useState<boolean>(true);
  
  // Cores padrão para as geocercas
  const defaultColors = useMemo(() => [
    '#4285F4', // Google Blue
    '#DB4437', // Google Red
    '#F4B400', // Google Yellow
    '#0F9D58', // Google Green
    '#673AB7', // Purple
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
  ], []);

  // Efeito para atualizar a geocerca selecionada com base no ID
  useEffect(() => {
    if (selectedGeofenceId) {
      const geofence = geofences.find(g => g.id === selectedGeofenceId) || null;
      setSelectedGeofence(geofence);
    } else {
      setSelectedGeofence(null);
    }
  }, [selectedGeofenceId, geofences]);
  
  // Efeito para verificar veículos dentro das geocercas e gerar alertas
  useEffect(() => {
    if (!vehicles || vehicles.length === 0 || !geofences || geofences.length === 0) return;
    
    const newVehiclesInGeofences: Record<string, number[]> = {};
    
    // Inicializar o objeto de rastreamento
    geofences.forEach(geofence => {
      newVehiclesInGeofences[geofence.id] = [];
    });
    
    // Verificar cada veículo em relação a cada geocerca
    vehicles.forEach(vehicle => {
      const vehiclePosition = { lat: vehicle.lat, lng: vehicle.lng };
      
      geofences.forEach(geofence => {
        let isInside = false;
        
        if (geofence.type === 'polygon' && geofence.paths) {
          isInside = isPointInPolygon(vehiclePosition, geofence.paths);
        } else if (geofence.type === 'circle' && geofence.center && geofence.radius) {
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(vehiclePosition.lat, vehiclePosition.lng),
            new google.maps.LatLng(geofence.center.lat, geofence.center.lng)
          );
          isInside = distance <= geofence.radius;
        }
        
        // Se o veículo está dentro da geocerca, adicionar ao array
        if (isInside) {
          newVehiclesInGeofences[geofence.id].push(vehicle.id);
          
          // Verificar se é uma nova entrada (não estava na lista anterior)
          const wasInside = vehiclesInGeofences[geofence.id]?.includes(vehicle.id);
          if (!wasInside) {
            // Gerar alerta de entrada
            generateGeofenceAlert(vehicle.id, geofence.id, 'enter', vehiclePosition);
          }
        } else {
          // Verificar se é uma saída (estava na lista anterior)
          const wasInside = vehiclesInGeofences[geofence.id]?.includes(vehicle.id);
          if (wasInside) {
            // Gerar alerta de saída
            generateGeofenceAlert(vehicle.id, geofence.id, 'exit', vehiclePosition);
          }
        }
      });
    });
    
    setVehiclesInGeofences(newVehiclesInGeofences);
  }, [vehicles, geofences, vehiclesInGeofences, isPointInPolygon, generateGeofenceAlert]);

  // Reset do modo de desenho quando o modo de edição é desativado
  useEffect(() => {
    if (!editable) {
      setDrawingMode(null);
    }
  }, [editable]);

  // Função para gerar alertas de geocerca
  const generateGeofenceAlert = useCallback((vehicleId: number, geofenceId: string, eventType: 'enter' | 'exit', position: google.maps.LatLngLiteral) => {
    const newAlert: GeofenceEvent = {
      id: `${vehicleId}-${geofenceId}-${Date.now()}`,
      vehicleId,
      geofenceId,
      eventType,
      timestamp: new Date().toISOString(),
      position
    };
    
    setGeofenceAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Manter apenas os 50 alertas mais recentes
    
    // Chamar o callback se fornecido
    if (onGeofenceEvent) {
      onGeofenceEvent(newAlert);
    }
    
    // Em uma aplicação real, aqui você enviaria o alerta para um sistema de notificações
    console.log(`Alerta de Geocerca: Veículo ${vehicleId} ${eventType === 'enter' ? 'entrou na' : 'saiu da'} geocerca ${geofenceId}`);
  }, [onGeofenceEvent]);
  
  // Função para verificar se um ponto está dentro de um polígono
  const isPointInPolygon = useCallback((point: google.maps.LatLngLiteral, polygon: google.maps.LatLngLiteral[]) => {
    if (!point || !polygon || polygon.length < 3) return false;
    
    const x = point.lat;
    const y = point.lng;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;
      
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }, []);

  // Função para verificar se um ponto está dentro de um círculo
  const isPointInCircle = useCallback((point: google.maps.LatLngLiteral, center: google.maps.LatLngLiteral, radius: number) => {
    if (!point || !center || !radius) return false;
    
    const R = 6371000; // raio da Terra em metros
    const rlat1 = center.lat * (Math.PI/180);
    const rlat2 = point.lat * (Math.PI/180);
    const rlon1 = center.lng * (Math.PI/180);
    const rlon2 = point.lng * (Math.PI/180);
    
    const dlat = rlat2 - rlat1;
    const dlon = rlon2 - rlon1;
    
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(rlat1) * Math.cos(rlat2) *
            Math.sin(dlon/2) * Math.sin(dlon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radius;
  }, []);

  // Efeito para verificar veículos dentro das geocercas e disparar eventos
  useEffect(() => {
    // Ignorar se não existirem veículos ou geocercas
    if (!vehicles.length || !geofences.length || !onGeofenceEvent) return;
    
    const newVehiclesInGeofences: Record<string, number[]> = {};
    
    // Para cada geocerca, verificar quais veículos estão dentro dela
    for (const geofence of geofences) {
      const insideVehicleIds: number[] = [];
      
      for (const vehicle of vehicles) {
        const vehiclePoint = { lat: vehicle.lat, lng: vehicle.lng };
        let isInside = false;
        
        if (geofence.type === 'polygon' && geofence.paths && geofence.paths.length > 2) {
          isInside = isPointInPolygon(vehiclePoint, geofence.paths);
        } else if (geofence.type === 'circle' && geofence.center && geofence.radius) {
          isInside = isPointInCircle(vehiclePoint, geofence.center, geofence.radius);
        }
        
        if (isInside) {
          insideVehicleIds.push(vehicle.id);
          
          // Se não estava dentro antes, disparar evento de entrada
          if (!vehiclesInGeofences[geofence.id] || !vehiclesInGeofences[geofence.id].includes(vehicle.id)) {
            const enterEvent: GeofenceEvent = {
              id: `${geofence.id}-${vehicle.id}-${Date.now()}`,
              vehicleId: vehicle.id,
              geofenceId: geofence.id,
              eventType: 'enter',
              timestamp: new Date().toISOString(),
              position: vehiclePoint
            };
            
            onGeofenceEvent(enterEvent);
          }
        } else {
          // Se estava dentro antes, disparar evento de saída
          if (vehiclesInGeofences[geofence.id] && vehiclesInGeofences[geofence.id].includes(vehicle.id)) {
            const exitEvent: GeofenceEvent = {
              id: `${geofence.id}-${vehicle.id}-${Date.now()}`,
              vehicleId: vehicle.id,
              geofenceId: geofence.id,
              eventType: 'exit',
              timestamp: new Date().toISOString(),
              position: vehiclePoint
            };
            
            onGeofenceEvent(exitEvent);
          }
        }
      }
      
      newVehiclesInGeofences[geofence.id] = insideVehicleIds;
    }
    
    setVehiclesInGeofences(newVehiclesInGeofences);
  }, [vehicles, geofences, onGeofenceEvent, isPointInPolygon, isPointInCircle, vehiclesInGeofences]);

  // Função para lidar com a criação de um polígono
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Resetar o modo de desenho
    setDrawingMode(null);
    
    if (onGeofenceCreate) {
      const paths: google.maps.LatLngLiteral[] = [];
      
      // Obter os pontos do polígono
      const pathArray = polygon.getPath().getArray();
      for (let i = 0; i < pathArray.length; i++) {
        paths.push({
          lat: pathArray[i].lat(),
          lng: pathArray[i].lng(),
        });
      }
      
      // Gerar uma cor aleatória do conjunto de cores padrão
      const colorIndex = Math.floor(Math.random() * defaultColors.length);
      const color = defaultColors[colorIndex];
      
      // Criar um objeto de geocerca parcial
      const newGeofence: Partial<Geofence> = {
        type: 'polygon',
        paths,
        color,
        fillColor: color + '66', // Adicionar alpha para transparência
        name: `Nova Área ${geofences.length + 1}`,
      };
      
      // Chamar o callback
      onGeofenceCreate(newGeofence);
      
      // Remover o polígono temporário
      polygon.setMap(null);
    }
  }, [onGeofenceCreate, geofences, defaultColors]);

  // Função para lidar com a criação de um círculo
  const handleCircleComplete = useCallback((circle: google.maps.Circle) => {
    // Resetar o modo de desenho
    setDrawingMode(null);
    
    if (onGeofenceCreate) {
      // Obter o centro e o raio do círculo
      const center = {
        lat: circle.getCenter()!.lat(),
        lng: circle.getCenter()!.lng(),
      };
      const radius = circle.getRadius();
      
      // Gerar uma cor aleatória do conjunto de cores padrão
      const colorIndex = Math.floor(Math.random() * defaultColors.length);
      const color = defaultColors[colorIndex];
      
      // Criar um objeto de geocerca parcial
      const newGeofence: Partial<Geofence> = {
        type: 'circle',
        center,
        radius,
        color,
        fillColor: color + '66', // Adicionar alpha para transparência
        name: `Novo Raio ${geofences.length + 1}`,
      };
      
      // Chamar o callback
      onGeofenceCreate(newGeofence);
      
      // Remover o círculo temporário
      circle.setMap(null);
    }
  }, [onGeofenceCreate, geofences, defaultColors]);

  // Função para lidar com o clique em uma geocerca
  const handleGeofenceClick = useCallback((geofence: Geofence) => {
    setSelectedGeofence(geofence);
    if (onGeofenceSelect) {
      onGeofenceSelect(geofence);
    }
  }, [onGeofenceSelect]);

  // Função para atualizar uma geocerca (polígono)
  const handlePolygonPath = useCallback((geofence: Geofence, polygon: google.maps.Polygon) => {
    if (onGeofenceUpdate) {
      const paths: google.maps.LatLngLiteral[] = [];
      
      // Obter os pontos atualizados do polígono
      const pathArray = polygon.getPath().getArray();
      for (let i = 0; i < pathArray.length; i++) {
        paths.push({
          lat: pathArray[i].lat(),
          lng: pathArray[i].lng(),
        });
      }
      
      // Atualizar a geocerca
      onGeofenceUpdate({
        ...geofence,
        paths,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [onGeofenceUpdate]);

  // Função para atualizar uma geocerca (círculo)
  const handleCircleChange = useCallback((geofence: Geofence, circle: google.maps.Circle) => {
    if (onGeofenceUpdate) {
      // Obter o centro e o raio atualizados
      const center = {
        lat: circle.getCenter()!.lat(),
        lng: circle.getCenter()!.lng(),
      };
      const radius = circle.getRadius();
      
      // Atualizar a geocerca
      onGeofenceUpdate({
        ...geofence,
        center,
        radius,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [onGeofenceUpdate]);

  // Opções para o gerenciador de desenho - memoizadas para evitar re-renders
  const drawingManagerOptions = useMemo(() => ({
    drawingMode: drawingMode,
    drawingControl: editable,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.CIRCLE,
      ],
    },
    polygonOptions: {
      fillColor: '#4285F4',
      fillOpacity: 0.4,
      strokeWeight: 2,
      strokeColor: '#4285F4',
      clickable: true,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
    circleOptions: {
      fillColor: '#4285F4',
      fillOpacity: 0.4,
      strokeWeight: 2,
      strokeColor: '#4285F4',
      clickable: true,
      editable: true,
      draggable: true,
      zIndex: 1,
    },
  }), [drawingMode, editable]);

  // Filtrar geocercas por tipo - memoizado para evitar reprocessamento
  const polygonGeofences = useMemo(() => 
    geofences.filter(geofence => 
      geofence.type === 'polygon' && geofence.paths && geofence.paths.length > 0
    ), 
    [geofences]
  );

  const circleGeofences = useMemo(() => 
    geofences.filter(geofence => 
      geofence.type === 'circle' && geofence.center && geofence.radius
    ), 
    [geofences]
  );

  // Componente para renderizar um polígono
  const GeofencePolygon = memo(({ geofence }: { geofence: Geofence }) => {
    const isSelected = selectedGeofence?.id === geofence.id;
    const isEditable = editable && isSelected;

    return (
      <Polygon
        key={geofence.id}
        paths={geofence.paths!}
        options={{
          fillColor: geofence.fillColor,
          fillOpacity: 0.4,
          strokeColor: geofence.color,
          strokeWeight: 2,
          clickable: true,
          editable: isEditable,
          draggable: isEditable,
          zIndex: isSelected ? 10 : 1,
        }}
        onClick={() => handleGeofenceClick(geofence)}
        onMouseUp={() => {
          if (isEditable) {
            // Obter a referência ao polígono para atualizar os caminhos
            const polygonRef = document.querySelector(`[title="${geofence.id}"]`);
            if (polygonRef && 'getPath' in (polygonRef as any)) {
              handlePolygonPath(geofence, polygonRef as unknown as google.maps.Polygon);
            }
          }
        }}
        onDragEnd={() => {
          if (isEditable) {
            // Obter a referência ao polígono para atualizar os caminhos
            const polygonRef = document.querySelector(`[title="${geofence.id}"]`);
            if (polygonRef && 'getPath' in (polygonRef as any)) {
              handlePolygonPath(geofence, polygonRef as unknown as google.maps.Polygon);
            }
          }
        }}
      />
    );
  });

  // Componente para renderizar um círculo
  const GeofenceCircle = memo(({ geofence }: { geofence: Geofence }) => {
    const isSelected = selectedGeofence?.id === geofence.id;
    const isEditable = editable && isSelected;

    return (
      <Circle
        key={geofence.id}
        center={geofence.center!}
        radius={geofence.radius!}
        options={{
          fillColor: geofence.fillColor,
          fillOpacity: 0.4,
          strokeColor: geofence.color,
          strokeWeight: 2,
          clickable: true,
          editable: isEditable,
          draggable: isEditable,
          zIndex: isSelected ? 10 : 1,
        }}
        onClick={() => handleGeofenceClick(geofence)}
        onCenterChanged={() => {
          if (isEditable) {
            // Obter a referência ao círculo para atualizar o centro e o raio
            const circleRef = document.querySelector(`[title="${geofence.id}"]`);
            if (circleRef && 'getCenter' in (circleRef as any)) {
              handleCircleChange(geofence, circleRef as unknown as google.maps.Circle);
            }
          }
        }}
        onRadiusChanged={() => {
          if (isEditable) {
            // Obter a referência ao círculo para atualizar o centro e o raio
            const circleRef = document.querySelector(`[title="${geofence.id}"]`);
            if (circleRef && 'getRadius' in (circleRef as any)) {
              handleCircleChange(geofence, circleRef as unknown as google.maps.Circle);
            }
          }
        }}
        onDragEnd={() => {
          if (isEditable) {
            // Obter a referência ao círculo para atualizar o centro e o raio
            const circleRef = document.querySelector(`[title="${geofence.id}"]`);
            if (circleRef && 'getCenter' in (circleRef as any)) {
              handleCircleChange(geofence, circleRef as unknown as google.maps.Circle);
            }
          }
        }}
      />
    );
  });

  return (
    <>
      {/* Renderizar o gerenciador de desenho se for editável */}
      {editable && map && (
        <DrawingManager
          drawingMode={drawingMode}
          options={drawingManagerOptions}
          onPolygonComplete={handlePolygonComplete}
          onCircleComplete={handleCircleComplete}
        />
      )}

      {/* Renderizar polígonos */}
      {polygonGeofences.map(geofence => (
        <GeofencePolygon key={geofence.id} geofence={geofence} />
      ))}

      {/* Renderizar círculos */}
      {circleGeofences.map(geofence => (
        <GeofenceCircle key={geofence.id} geofence={geofence} />
      ))}
    </>
  );
};

export default memo(GeofenceManager);