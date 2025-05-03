import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// Função para simplificar uma rota (algoritmo Douglas-Peucker simplificado)
const simplifyRoute = (points: RoutePoint[], tolerance: number): RoutePoint[] => {
  if (points.length <= 2) return points;
  
  // Versão simplificada do algoritmo para demonstração
  const simplified: RoutePoint[] = [points[0]];
  let prevLat = points[0].lat;
  let prevLng = points[0].lng;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = Math.sqrt(
      Math.pow(points[i].lat - prevLat, 2) + 
      Math.pow(points[i].lng - prevLng, 2)
    );
    
    if (dist > tolerance || points[i].event) {
      simplified.push(points[i]);
      prevLat = points[i].lat;
      prevLng = points[i].lng;
    }
  }
  
  // Sempre incluir o último ponto
  simplified.push(points[points.length - 1]);
  
  return simplified;
};

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
  
  // Estado para o nível de zoom atual
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  
  // Estado para simplificação adaptativa com base no zoom
  const [simplificationTolerance, setSimplificationTolerance] = useState<number>(0.0001);
  
  // Detectar mudanças no zoom para ajustar a simplificação
  useEffect(() => {
    // Ajuste de tolerância baseado no zoom
    // Valores menores (ex: 0.00001) para zooms altos, valores maiores (ex: 0.001) para zooms baixos
    if (zoomLevel > 15) {
      setSimplificationTolerance(0.00001);
    } else if (zoomLevel > 10) {
      setSimplificationTolerance(0.0001);
    } else {
      setSimplificationTolerance(0.001);
    }
  }, [zoomLevel]);

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
  
  // Aplicar simplificação à rota para melhorar performance
  const simplifiedRoutePoints = useMemo(() => {
    return simplifyRoute(sortedRoutePoints, simplificationTolerance);
  }, [sortedRoutePoints, simplificationTolerance]);

  // Extrair coordenadas para a polyline
  const routePath = useMemo(() => {
    return simplifiedRoutePoints.map(point => ({
      lat: point.lat,
      lng: point.lng,
    }));
  }, [simplifiedRoutePoints]);

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
  
  // Callback para lidar com cliques em pontos
  const handlePointClick = useCallback((point: RoutePoint) => {
    setSelectedPoint(point);
    if (onPointClick) {
      onPointClick(point);
    }
  }, [onPointClick]);

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
  
  // Seleção dinâmica de pontos intermediários com base no tamanho da rota
  const getVisibleIntermediatePoints = () => {
    if (!showMarkers || simplifiedRoutePoints.length <= 2) return [];
    
    const points = simplifiedRoutePoints.slice(1, -1);
    if (points.length === 0) return [];
    
    // Filtrar pontos que já são marcados como eventos
    const nonEventPoints = points.filter(point => !point.event || !showEvents);
    
    // Adaptar a amostragem com base no número de pontos
    let samplingRate = 1;
    if (nonEventPoints.length > 200) {
      samplingRate = Math.floor(nonEventPoints.length / 50); // Mostrar cerca de 50 pontos
    } else if (nonEventPoints.length > 100) {
      samplingRate = Math.floor(nonEventPoints.length / 30); // Mostrar cerca de 30 pontos
    } else if (nonEventPoints.length > 50) {
      samplingRate = Math.floor(nonEventPoints.length / 20); // Mostrar cerca de 20 pontos
    }
    
    return nonEventPoints.filter((_, index) => index % samplingRate === 0);
  };

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
        onMouseOver={() => {
          // Pode-se adicionar um efeito de hover aqui se necessário
        }}
        onLoad={(polyline) => {
          // Podemos acessar o mapa e detectar mudanças de zoom
          const map = polyline.getMap();
          if (map) {
            map.addListener('zoom_changed', () => {
              setZoomLevel(map.getZoom() || 12);
            });
          }
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
          onClick={() => handlePointClick(startPoint)}
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
          onClick={() => handlePointClick(endPoint)}
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
          onClick={() => handlePointClick(point)}
        />
      ))}

      {/* Marcadores intermediários selecionados dinamicamente */}
      {getVisibleIntermediatePoints().map((point) => (
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
          onClick={() => handlePointClick(point)}
        />
      ))}

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

export default React.memo(RouteHistory); 