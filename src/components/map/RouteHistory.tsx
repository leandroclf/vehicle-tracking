import React, { useState, useEffect, useMemo } from 'react';
import { Polyline, Marker, InfoWindow } from '@react-google-maps/api';

export interface RoutePoint {
  id: string;
  vehicleId: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  ignition: boolean;
  event?: string;
}

interface RouteHistoryProps {
  routePoints: RoutePoint[];
  vehicleId: number;
  showMarkers?: boolean;
  showEvents?: boolean;
  lineColor?: string;
  lineWidth?: number;
  startDate?: Date;
  endDate?: Date;
  onPointClick?: (point: RoutePoint) => void;
}

const RouteHistory: React.FC<RouteHistoryProps> = ({
  routePoints,
  vehicleId,
  showMarkers = true,
  showEvents = true,
  lineColor = '#2196F3',
  lineWidth = 3,
  startDate,
  endDate,
  onPointClick,
}) => {
  // Estado para o ponto selecionado
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);

  // Filtrar pontos da rota com base nas datas e no veículo
  const filteredRoutePoints = useMemo(() => {
    return routePoints.filter(point => {
      const pointDate = new Date(point.timestamp);
      const isAfterStart = startDate ? pointDate >= startDate : true;
      const isBeforeEnd = endDate ? pointDate <= endDate : true;
      return point.vehicleId === vehicleId && isAfterStart && isBeforeEnd;
    });
  }, [routePoints, vehicleId, startDate, endDate]);

  // Ordenar os pontos por timestamp para garantir a ordem correta
  const sortedRoutePoints = useMemo(() => {
    return [...filteredRoutePoints].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [filteredRoutePoints]);

  // Extrair coordenadas para a polyline
  const routePath = useMemo(() => {
    return sortedRoutePoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
    }));
  }, [sortedRoutePoints]);

  // Extrair pontos de eventos para mostrar marcadores especiais
  const eventPoints = useMemo(() => {
    if (!showEvents) return [];
    return sortedRoutePoints.filter(point => point.event);
  }, [sortedRoutePoints, showEvents]);

  // Calcular pontos de início e fim da rota
  const startPoint = useMemo(() => {
    return sortedRoutePoints.length > 0 ? sortedRoutePoints[0] : null;
  }, [sortedRoutePoints]);

  const endPoint = useMemo(() => {
    return sortedRoutePoints.length > 0 ? sortedRoutePoints[sortedRoutePoints.length - 1] : null;
  }, [sortedRoutePoints]);

  // Fechar a janela de informações quando mudar o veículo ou as datas
  useEffect(() => {
    setSelectedPoint(null);
  }, [vehicleId, startDate, endDate]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Função para obter ícone com base no tipo de evento
  const getEventIcon = (event?: string) => {
    const iconBase = '/icons/';
    
    switch (event) {
      case 'ignition_on':
        return `${iconBase}event-ignition-on.png`;
      case 'ignition_off':
        return `${iconBase}event-ignition-off.png`;
      case 'speeding':
        return `${iconBase}event-speeding.png`;
      case 'harsh_braking':
        return `${iconBase}event-harsh-braking.png`;
      case 'harsh_acceleration':
        return `${iconBase}event-harsh-acceleration.png`;
      case 'idle':
        return `${iconBase}event-idle.png`;
      case 'geofence_enter':
        return `${iconBase}event-geofence-enter.png`;
      case 'geofence_exit':
        return `${iconBase}event-geofence-exit.png`;
      default:
        return `${iconBase}event-default.png`;
    }
  };

  // Função para obter uma cor mais escura para os marcadores de início e fim
  const getDarkerColor = (color: string) => {
    // Se for uma cor hex, convertemos para RGB, escurecemos e convertemos de volta
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      const darkerR = Math.max(0, r - 40);
      const darkerG = Math.max(0, g - 40);
      const darkerB = Math.max(0, b - 40);
      
      return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
    }
    
    return color;
  };

  // Se não houver pontos, não renderizar nada
  if (sortedRoutePoints.length === 0) {
    return null;
  }

  return (
    <>
      {/* Linha da rota */}
      <Polyline
        path={routePath}
        options={{
          strokeColor: lineColor,
          strokeOpacity: 0.8,
          strokeWeight: lineWidth,
          clickable: false,
          geodesic: true,
        }}
      />

      {/* Marcador do ponto inicial */}
      {startPoint && (
        <Marker
          position={{ lat: startPoint.lat, lng: startPoint.lng }}
          icon={{
            url: '/icons/route-start.png',
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title="Início da rota"
          onClick={() => {
            setSelectedPoint(startPoint);
            if (onPointClick) {
              onPointClick(startPoint);
            }
          }}
        />
      )}

      {/* Marcador do ponto final */}
      {endPoint && endPoint !== startPoint && (
        <Marker
          position={{ lat: endPoint.lat, lng: endPoint.lng }}
          icon={{
            url: '/icons/route-end.png',
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title="Fim da rota"
          onClick={() => {
            setSelectedPoint(endPoint);
            if (onPointClick) {
              onPointClick(endPoint);
            }
          }}
        />
      )}

      {/* Marcadores de eventos */}
      {eventPoints.map((point) => (
        <Marker
          key={point.id}
          position={{ lat: point.lat, lng: point.lng }}
          icon={{
            url: getEventIcon(point.event),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title={`Evento: ${point.event}`}
          onClick={() => {
            setSelectedPoint(point);
            if (onPointClick) {
              onPointClick(point);
            }
          }}
        />
      ))}

      {/* Marcadores intermediários (opcional) */}
      {showMarkers && sortedRoutePoints.length > 2 && sortedRoutePoints.slice(1, -1).map((point, index) => {
        // Pular pontos com eventos, pois já têm marcadores próprios
        if (point.event && showEvents) {
          return null;
        }
        
        // Mostrar apenas alguns pontos intermediários para não sobrecarregar o mapa
        // A lógica depende da densidade de pontos que você quer mostrar
        if (sortedRoutePoints.length > 100 && index % 10 !== 0) {
          return null;
        } else if (sortedRoutePoints.length > 50 && index % 5 !== 0) {
          return null;
        }
        
        return (
          <Marker
            key={point.id}
            position={{ lat: point.lat, lng: point.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 4,
              fillColor: lineColor,
              fillOpacity: 0.8,
              strokeColor: getDarkerColor(lineColor),
              strokeWeight: 1,
            }}
            title={`Ponto de rota: ${formatDate(point.timestamp)}`}
            onClick={() => {
              setSelectedPoint(point);
              if (onPointClick) {
                onPointClick(point);
              }
            }}
          />
        );
      })}

      {/* Janela de informações para o ponto selecionado */}
      {selectedPoint && (
        <InfoWindow
          position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
          onCloseClick={() => setSelectedPoint(null)}
        >
          <div className="p-2">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {selectedPoint.event 
                ? `Evento: ${selectedPoint.event}` 
                : selectedPoint === startPoint 
                  ? 'Início da rota' 
                  : selectedPoint === endPoint
                    ? 'Fim da rota'
                    : 'Ponto da rota'
              }
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>Data:</strong> {formatDate(selectedPoint.timestamp)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>Velocidade:</strong> {selectedPoint.speed} km/h
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
              <strong>Ignição:</strong> {selectedPoint.ignition ? 'Ligada' : 'Desligada'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Coordenadas:</strong> {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default RouteHistory; 