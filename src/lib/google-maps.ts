// Tipos de ícones para veículos no mapa
export const VehicleIcons = {
  car: '/icons/car.svg',
  truck: '/icons/truck.svg',
  motorcycle: '/icons/motorcycle.svg',
  boat: '/icons/boat.svg',
  jetski: '/icons/jetski.svg',
  van: '/icons/van.svg',
  default: '/icons/default-vehicle.svg'
};

// Cores para geocercas
export const GeofenceColors = [
  '#4285F4', // Google Blue
  '#DB4437', // Google Red
  '#F4B400', // Google Yellow
  '#0F9D58', // Google Green
  '#673AB7', // Purple
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

// Configurações padrão para o mapa
export const defaultMapSettings = {
  center: { lat: -15.7801, lng: -47.9292 }, // Centro do Brasil (Brasília)
  zoom: 5,
  options: {
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true
  }
};

// Função para calcular o centro de uma coleção de coordenadas
export function calculateCenter(coordinates: { lat: number, lng: number }[]): { lat: number, lng: number } {
  if (!coordinates || coordinates.length === 0) {
    return defaultMapSettings.center;
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  const totalCoordinates = coordinates.length;
  const sum = coordinates.reduce(
    (acc, coord) => ({ lat: acc.lat + coord.lat, lng: acc.lng + coord.lng }),
    { lat: 0, lng: 0 }
  );
  
  return {
    lat: sum.lat / totalCoordinates,
    lng: sum.lng / totalCoordinates
  };
}

// Função para calcular limites para um conjunto de coordenadas
export function calculateBounds(coordinates: { lat: number, lng: number }[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  if (!coordinates || coordinates.length === 0) {
    return {
      north: defaultMapSettings.center.lat + 1,
      south: defaultMapSettings.center.lat - 1,
      east: defaultMapSettings.center.lng + 1,
      west: defaultMapSettings.center.lng - 1
    };
  }
  
  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;
  
  coordinates.forEach(coord => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });
  
  // Adicionar um pequeno buffer
  const latBuffer = (north - south) * 0.1;
  const lngBuffer = (east - west) * 0.1;
  
  return {
    north: north + latBuffer,
    south: south - latBuffer,
    east: east + lngBuffer,
    west: west - lngBuffer
  };
}

// Função para gerar um ícone para um veículo com base no tipo, direção e status
export function getVehicleIcon(
  type: string,
  heading: number = 0,
  status: 'online' | 'offline' = 'online',
  isMoving: boolean = false
): google.maps.Icon {
  // Definir o ícone com base no tipo
  const iconPath = VehicleIcons[type as keyof typeof VehicleIcons] || VehicleIcons.default;
  
  // Definir tamanho com base no tipo de veículo
  const size = type === 'truck' ? 40 : type === 'motorcycle' ? 32 : 36;
  
  // Retornar configuração do ícone
  return {
    url: iconPath,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
    // Aplicar filtro CSS para veículos offline
    ...(status === 'offline' ? {
      fillColor: '#ccc',
      fillOpacity: 0.7,
      strokeWeight: 0
    } : {})
  };
}

// Função para gerar uma cor aleatória mas consistente para geocercas
export function getGeofenceColor(id: string): string {
  // Usar ID para selecionar uma cor consistente
  const colorIndex = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % GeofenceColors.length;
  return GeofenceColors[colorIndex];
}

// Função para calcular a distância entre dois pontos (em quilômetros)
export function calculateDistance(
  point1: { lat: number, lng: number },
  point2: { lat: number, lng: number }
): number {
  const R = 6371; // Raio da Terra em quilômetros
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
} 