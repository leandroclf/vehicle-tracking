'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';

// Definição do tipo de veículo
export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'inactive' | 'online' | 'offline';
  speed: number;
  ignition: boolean;
  isMoving: boolean;
  lastUpdate: string;
  location: {
    lat: number;
    lng: number;
  };
  lat: number;
  lng: number;
  heading?: number;
  last_update: string;
  is_moving: boolean;
  // Informações adicionais opcionais
  battery?: number;
  satellites?: number;
  direction?: string;
  details?: {
    year: number;
    model: string;
    manufacturer: string;
    color: string;
    vin: string;
    simCard: string;
    lastMaintenance: string;
  };
}

// Definição do tipo de evento
export interface VehicleEvent {
  id: number;
  vehicleId: number;
  type: 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement' | 'panic' | 'battery_low';
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  details?: string;
}

// Definição do tipo de viagem
export interface Trip {
  id: number;
  vehicleId: number;
  vehicleName: string;
  vehiclePlate: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  distance: string;
  startLocation: string;
  endLocation: string;
  maxSpeed: string;
  avgSpeed: string;
  events: {
    type: string;
    time: string;
    location: string;
    details?: string;
  }[];
}

// Definição do contexto
interface VehicleContextProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  refreshVehicles: () => Promise<void>;
}

// Criação do contexto
const VehicleContext = createContext<VehicleContextProps | undefined>(undefined);

// Mock de dados para desenvolvimento
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    name: 'Caminhão 01',
    plate: 'ABC-1234',
    type: 'truck',
    status: 'online',
    speed: 0,
    ignition: false,
    isMoving: false,
    lastUpdate: '10/05/2023 08:45',
    location: {
      lat: -23.550520,
      lng: -46.633308
    },
    details: {
      year: 2020,
      model: 'Actros 2546',
      manufacturer: 'Mercedes-Benz',
      color: 'Branco',
      vin: '1HGCM82633A123456',
      simCard: '11987654321',
      lastMaintenance: '15/01/2025'
    },
    lat: -23.550520,
    lng: -46.633308,
    last_update: new Date().toISOString(),
    is_moving: false
  },
  {
    id: 2,
    name: 'Van 01',
    plate: 'DEF-5678',
    type: 'van',
    status: 'online',
    speed: 60,
    ignition: true,
    isMoving: true,
    lastUpdate: '10/05/2023 09:30',
    location: {
      lat: -23.551520,
      lng: -46.634308
    },
    details: {
      year: 2021,
      model: 'Sprinter',
      manufacturer: 'Mercedes-Benz',
      color: 'Prata',
      vin: '1HGCM82633A789012',
      simCard: '11912345678',
      lastMaintenance: '20/03/2025'
    },
    lat: -23.551520,
    lng: -46.634308,
    last_update: new Date().toISOString(),
    is_moving: true
  },
  {
    id: 3,
    name: 'Carro 01',
    plate: 'GHI-9012',
    type: 'car',
    status: 'offline',
    speed: 0,
    ignition: false,
    isMoving: false,
    lastUpdate: '10/05/2023 07:15',
    location: {
      lat: -23.552520,
      lng: -46.635308
    },
    details: {
      year: 2022,
      model: 'Onix',
      manufacturer: 'Chevrolet',
      color: 'Preto',
      vin: '1HGCM82633A345678',
      simCard: '11978901234',
      lastMaintenance: '05/04/2025'
    },
    lat: -23.552520,
    lng: -46.635308,
    last_update: new Date().toISOString(),
    is_moving: false
  }
];

// Dados simulados de eventos
const mockEvents: VehicleEvent[] = [
  {
    id: 1,
    vehicleId: 1,
    type: 'ignition_on',
    timestamp: '2025-04-27T08:15:00',
    location: {
      lat: -23.550520,
      lng: -46.633308,
      address: 'Av. Paulista, 1000, São Paulo - SP'
    }
  },
  {
    id: 2,
    vehicleId: 1,
    type: 'speed_alert',
    timestamp: '2025-04-27T08:45:00',
    location: {
      lat: -23.551520,
      lng: -46.634308,
      address: 'Av. Rebouças, 1200, São Paulo - SP'
    },
    details: '85 km/h'
  },
  {
    id: 3,
    vehicleId: 1,
    type: 'ignition_off',
    timestamp: '2025-04-27T09:30:00',
    location: {
      lat: -23.552520,
      lng: -46.635308,
      address: 'Av. Brigadeiro Faria Lima, 3900, São Paulo - SP'
    }
  },
  {
    id: 4,
    vehicleId: 2,
    type: 'ignition_on',
    timestamp: '2025-04-27T09:00:00',
    location: {
      lat: -23.553520,
      lng: -46.636308,
      address: 'Rua Augusta, 500, São Paulo - SP'
    }
  },
  {
    id: 5,
    vehicleId: 2,
    type: 'speed_alert',
    timestamp: '2025-04-27T09:30:00',
    location: {
      lat: -23.554520,
      lng: -46.637308,
      address: 'Av. Paulista, 2000, São Paulo - SP'
    },
    details: '95 km/h'
  }
];

// Dados simulados de viagens
const mockTrips: Trip[] = [
  {
    id: 1,
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    vehiclePlate: 'ABC1234',
    date: '27/04/2025',
    startTime: '08:15',
    endTime: '09:30',
    duration: '1h 15min',
    distance: '32.5 km',
    startLocation: 'Av. Paulista, 1000, São Paulo - SP',
    endLocation: 'Av. Brigadeiro Faria Lima, 3900, São Paulo - SP',
    maxSpeed: '85 km/h',
    avgSpeed: '42 km/h',
    events: [
      { type: 'ignition_on', time: '08:15', location: 'Av. Paulista, 1000' },
      { type: 'speed_alert', time: '08:45', location: 'Av. Rebouças, 1200', details: '85 km/h' },
      { type: 'ignition_off', time: '09:30', location: 'Av. Brigadeiro Faria Lima, 3900' }
    ]
  },
  {
    id: 2,
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    vehiclePlate: 'ABC1234',
    date: '27/04/2025',
    startTime: '12:30',
    endTime: '13:15',
    duration: '45min',
    distance: '15.8 km',
    startLocation: 'Av. Brigadeiro Faria Lima, 3900, São Paulo - SP',
    endLocation: 'Rua Augusta, 500, São Paulo - SP',
    maxSpeed: '65 km/h',
    avgSpeed: '38 km/h',
    events: [
      { type: 'ignition_on', time: '12:30', location: 'Av. Brigadeiro Faria Lima, 3900' },
      { type: 'ignition_off', time: '13:15', location: 'Rua Augusta, 500' }
    ]
  },
  {
    id: 3,
    vehicleId: 2,
    vehicleName: 'Toyota Corolla',
    vehiclePlate: 'DEF5678',
    date: '27/04/2025',
    startTime: '09:00',
    endTime: '10:45',
    duration: '1h 45min',
    distance: '45.2 km',
    startLocation: 'Rua Augusta, 500, São Paulo - SP',
    endLocation: 'Av. das Nações Unidas, 12000, São Paulo - SP',
    maxSpeed: '95 km/h',
    avgSpeed: '48 km/h',
    events: [
      { type: 'ignition_on', time: '09:00', location: 'Rua Augusta, 500' },
      { type: 'speed_alert', time: '09:30', location: 'Av. Paulista, 2000', details: '95 km/h' },
      { type: 'ignition_off', time: '10:45', location: 'Av. das Nações Unidas, 12000' }
    ]
  }
];

// Provider do contexto
export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Tentar buscar do Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transformar dados do Supabase para o formato esperado
        const formattedVehicles = data.map(vehicle => ({
          id: vehicle.id,
          name: vehicle.name,
          plate: vehicle.plate,
          type: vehicle.type,
          lat: vehicle.latitude,
          lng: vehicle.longitude,
          speed: vehicle.speed || 0,
          heading: vehicle.heading,
          ignition: vehicle.ignition,
          is_moving: vehicle.is_moving,
          status: vehicle.status,
          last_update: vehicle.last_update,
          battery: vehicle.battery || 100,
          satellites: vehicle.satellites || 8,
          direction: getDirectionFromHeading(vehicle.heading),
          location: {
            lat: vehicle.latitude,
            lng: vehicle.longitude
          },
          lastUpdate: new Date(vehicle.last_update).toLocaleString('pt-BR'),
          isMoving: vehicle.is_moving
        }));
        
        setVehicles(formattedVehicles);
      } else {
        // Dados de exemplo para desenvolvimento
        const mockVehicles: Vehicle[] = [
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
            battery: 78,
            satellites: 9,
            direction: 'Leste',
            location: { lat: -15.7801, lng: -47.9292 },
            lastUpdate: new Date().toLocaleString('pt-BR'),
            isMoving: false
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
            battery: 92,
            satellites: 10,
            direction: 'Sul',
            location: { lat: -15.7901, lng: -47.9392 },
            lastUpdate: new Date().toLocaleString('pt-BR'),
            isMoving: true
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
            battery: 65,
            satellites: 8,
            direction: 'Oeste',
            location: { lat: -15.7701, lng: -47.9192 },
            lastUpdate: new Date().toLocaleString('pt-BR'),
            isMoving: true
          },
        ];
        
        setVehicles(mockVehicles);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
      setError('Falha ao carregar veículos. Tente novamente mais tarde.');
      
      // Usar dados mock mesmo em caso de erro
      const mockVehicles: Vehicle[] = [
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
          battery: 78,
          satellites: 9,
          direction: 'Leste',
          location: { lat: -15.7801, lng: -47.9292 },
          lastUpdate: new Date().toLocaleString('pt-BR'),
          isMoving: false
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
          battery: 92,
          satellites: 10,
          direction: 'Sul',
          location: { lat: -15.7901, lng: -47.9392 },
          lastUpdate: new Date().toLocaleString('pt-BR'),
          isMoving: true
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
          battery: 65,
          satellites: 8,
          direction: 'Oeste',
          location: { lat: -15.7701, lng: -47.9192 },
          lastUpdate: new Date().toLocaleString('pt-BR'),
          isMoving: true
        },
      ];
      
      setVehicles(mockVehicles);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar veículos ao montar o componente
  useEffect(() => {
    fetchVehicles();
    
    // Configurar atualização periódica a cada 10 segundos
    const intervalId = setInterval(fetchVehicles, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchVehicles]);

  // Função para converter heading em direção textual
  function getDirectionFromHeading(heading?: number): string {
    if (heading === undefined) return 'N/A';
    
    const directions = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  // Selecionar veículo
  const handleSelectVehicle = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
  };

  // Valor do contexto
  const contextValue: VehicleContextProps = {
    vehicles,
    selectedVehicle,
    isLoading,
    error,
    setSelectedVehicle: handleSelectVehicle,
    refreshVehicles: fetchVehicles
  };

  return (
    <VehicleContext.Provider value={contextValue}>
      {children}
    </VehicleContext.Provider>
  );
}

// Hook para usar o contexto
export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles deve ser usado dentro de um VehicleProvider');
  }
  return context;
}
