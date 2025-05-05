import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Polyline, Marker, InfoWindow, Circle } from '@react-google-maps/api';

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
  enableReplay?: boolean;
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
  enableReplay = false,
}) => {
  // Estado para o ponto selecionado
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  
  // Estado para o nível de zoom atual
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  
  // Estado para simplificação adaptativa com base no zoom
  const [simplificationTolerance, setSimplificationTolerance] = useState<number>(0.0001);
  
  // Estados para o replay de trajetos
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1); // Velocidade de reprodução (1x, 2x, 4x)
  const [currentReplayIndex, setCurrentReplayIndex] = useState<number>(0);
  const [replayProgress, setReplayProgress] = useState<number>(0); // Progresso de 0 a 100
  
  // Referência para o intervalo de replay
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Funções para controle do replay
  const startReplay = useCallback(() => {
    if (sortedRoutePoints.length === 0) return;
    
    setIsReplaying(true);
    setCurrentReplayIndex(0);
    setReplayProgress(0);
    
    // Limpar intervalo anterior se existir
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }
    
    // Iniciar novo intervalo para replay
    const intervalTime = 1000 / replaySpeed; // Ajustar velocidade
    replayIntervalRef.current = setInterval(() => {
      setCurrentReplayIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        if (newIndex >= sortedRoutePoints.length) {
          // Parar o replay quando chegar ao final
          if (replayIntervalRef.current) {
            clearInterval(replayIntervalRef.current);
            replayIntervalRef.current = null;
          }
          setIsReplaying(false);
          return prevIndex;
        }
        
        // Atualizar progresso
        const progress = (newIndex / (sortedRoutePoints.length - 1)) * 100;
        setReplayProgress(progress);
        
        return newIndex;
      });
    }, intervalTime);
  }, [sortedRoutePoints, replaySpeed]);
  
  const pauseReplay = useCallback(() => {
    setIsReplaying(false);
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
  }, []);
  
  const resumeReplay = useCallback(() => {
    if (currentReplayIndex >= sortedRoutePoints.length - 1) {
      // Se estiver no final, reiniciar
      startReplay();
    } else {
      setIsReplaying(true);
      const intervalTime = 1000 / replaySpeed;
      replayIntervalRef.current = setInterval(() => {
        setCurrentReplayIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          if (newIndex >= sortedRoutePoints.length) {
            if (replayIntervalRef.current) {
              clearInterval(replayIntervalRef.current);
              replayIntervalRef.current = null;
            }
            setIsReplaying(false);
            return prevIndex;
          }
          
          const progress = (newIndex / (sortedRoutePoints.length - 1)) * 100;
          setReplayProgress(progress);
          
          return newIndex;
        });
      }, intervalTime);
    }
  }, [sortedRoutePoints, currentReplayIndex, replaySpeed, startReplay]);
  
  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    setCurrentReplayIndex(0);
    setReplayProgress(0);
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
  }, []);
  
  const changeReplaySpeed = useCallback(() => {
    // Alternar entre 1x, 2x e 4x
    const newSpeed = replaySpeed === 1 ? 2 : replaySpeed === 2 ? 4 : 1;
    setReplaySpeed(newSpeed);
    
    // Se estiver reproduzindo, atualizar o intervalo
    if (isReplaying && replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      const intervalTime = 1000 / newSpeed;
      replayIntervalRef.current = setInterval(() => {
        setCurrentReplayIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          if (newIndex >= sortedRoutePoints.length) {
            if (replayIntervalRef.current) {
              clearInterval(replayIntervalRef.current);
              replayIntervalRef.current = null;
            }
            setIsReplaying(false);
            return prevIndex;
          }
          
          const progress = (newIndex / (sortedRoutePoints.length - 1)) * 100;
          setReplayProgress(progress);
          
          return newIndex;
        });
      }, intervalTime);
    }
  }, [sortedRoutePoints, isReplaying, replaySpeed]);
  
  // Limpar intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    };
  }, []);
  
  // Obter o ponto atual do replay
  const currentReplayPoint = useMemo(() => {
    if (currentReplayIndex < sortedRoutePoints.length) {
      return sortedRoutePoints[currentReplayIndex];
    }
    return null;
  }, [sortedRoutePoints, currentReplayIndex]);
  
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
      
      {/* Marcador de replay */}
      {enableReplay && isReplaying && currentReplayPoint && (
        <>
          <Marker
            position={{ lat: currentReplayPoint.lat, lng: currentReplayPoint.lng }}
            icon={{
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#FF5722',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              rotation: currentReplayPoint.heading || 0,
            }}
            zIndex={10}
          />
          <Circle
            center={{ lat: currentReplayPoint.lat, lng: currentReplayPoint.lng }}
            radius={50}
            options={{
              fillColor: '#FF5722',
              fillOpacity: 0.1,
              strokeColor: '#FF5722',
              strokeOpacity: 0.5,
              strokeWeight: 1,
              zIndex: 9,
            }}
          />
        </>
      )}

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
      
      {/* Controles de replay */}
      {enableReplay && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg z-10 w-80">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Replay de Trajeto
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentReplayPoint ? formatDate(currentReplayPoint.timestamp) : ''}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-3">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${replayProgress}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={stopReplay}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Parar replay"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
            </button>
            
            {isReplaying ? (
              <button
                onClick={pauseReplay}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Pausar replay"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                onClick={resumeReplay}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                aria-label="Iniciar replay"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            <button
              onClick={changeReplaySpeed}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none text-xs font-medium text-gray-700 dark:text-gray-300"
              aria-label="Alterar velocidade de reprodução"
            >
              {replaySpeed}x
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(RouteHistory);