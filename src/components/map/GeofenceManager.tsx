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

interface GeofenceManagerProps {
  map: google.maps.Map | null;
  geofences: Geofence[];
  editable?: boolean;
  selectedGeofenceId?: string | null;
  onGeofenceSelect?: (geofence: Geofence | null) => void;
  onGeofenceCreate?: (geofence: Partial<Geofence>) => void;
  onGeofenceUpdate?: (geofence: Geofence) => void;
  onGeofenceDelete?: (geofenceId: string) => void;
}

const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  map,
  geofences,
  editable = false,
  selectedGeofenceId = null,
  onGeofenceSelect,
  onGeofenceCreate,
  onGeofenceUpdate,
  onGeofenceDelete,
}) => {
  // Estado para controlar o modo de desenho
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  
  // Estado para armazenar a geocerca selecionada
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  
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

  // Reset do modo de desenho quando o modo de edição é desativado
  useEffect(() => {
    if (!editable) {
      setDrawingMode(null);
    }
  }, [editable]);

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