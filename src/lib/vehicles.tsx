'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Definição do tipo de veículo
export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'boat' | 'jetski';

// Definição do tipo de veículo
export interface Vehicle {
  id: number;
  name: string;
  type: VehicleType;
  plate: string;
  model?: string;
  year?: string;
  color?: string;
  status: 'online' | 'offline';
  isMoving: boolean;
  lastUpdate: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number;
  direction?: string;
  ignition: boolean;
  battery: number;
  satellites: number;
  device?: {
    imei: string;
    model: string;
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

// Definição do contexto de veículos
interface VehicleContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  events: VehicleEvent[];
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
  selectVehicle: (id: number) => void;
  refreshVehicleData: () => Promise<void>;
  sendCommand: (vehicleId: number, command: string) => Promise<boolean>;
  getVehicleTrips: (vehicleId: number) => Trip[];
  getVehicleEvents: (vehicleId: number) => VehicleEvent[];
}

// Dados simulados de veículos
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    name: 'Honda Civic',
    type: 'car',
    plate: 'ABC1234',
    model: 'Civic LX',
    year: '2023',
    color: 'Prata',
    status: 'online',
    isMoving: true,
    lastUpdate: '2 min atrás',
    location: {
      lat: -23.550520,
      lng: -46.633308,
      address: 'Av. Paulista, 1000, São Paulo - SP'
    },
    speed: 60,
    direction: 'Nordeste (45°)',
    ignition: true,
    battery: 95,
    satellites: 8,
    device: {
      imei: '123456789012345',
      model: 'Yukz Tracker Pro',
      simCard: '11987654321',
      lastMaintenance: '15/01/2025'
    }
  },
  {
    id: 2,
    name: 'Toyota Corolla',
    type: 'car',
    plate: 'DEF5678',
    model: 'Corolla XEi',
    year: '2022',
    color: 'Branco',
    status: 'online',
    isMoving: false,
    lastUpdate: '5 min atrás',
    location: {
      lat: -23.551520,
      lng: -46.634308,
      address: 'Rua Augusta, 500, São Paulo - SP'
    },
    speed: 0,
    direction: 'Parado',
    ignition: false,
    battery: 87,
    satellites: 9,
    device: {
      imei: '987654321098765',
      model: 'Yukz Tracker Lite',
      simCard: '11912345678',
      lastMaintenance: '20/03/2025'
    }
  },
  {
    id: 3,
    name: 'Yamaha Factor',
    type: 'motorcycle',
    plate: 'GHI9012',
    model: 'Factor 150',
    year: '2024',
    color: 'Vermelho',
    status: 'offline',
    isMoving: false,
    lastUpdate: '1 hora atrás',
    location: {
      lat: -23.552520,
      lng: -46.635308,
      address: 'Av. Rebouças, 200, São Paulo - SP'
    },
    speed: 0,
    direction: 'Parado',
    ignition: false,
    battery: 45,
    satellites: 0,
    device: {
      imei: '456789012345678',
      model: 'Yukz Tracker Mini',
      simCard: '11978901234',
      lastMaintenance: '05/04/2025'
    }
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

// Criação do contexto
const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles deve ser usado dentro de um VehicleProvider');
  }
  return context;
};

// Provedor de veículos
export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useState(() => {
    const loadInitialData = async () => {
      try {
        // Simulação de carregamento de dados
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setVehicles(mockVehicles);
        setEvents(mockEvents);
        setTrips(mockTrips);
        
        if (mockVehicles.length > 0) {
          setSelectedVehicle(mockVehicles[0]);
        }
      } catch (error) {
        setError('Erro ao carregar dados dos veículos');
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  });

  // Selecionar veículo
  const selectVehicle = (id: number) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  };

  // Atualizar dados do veículo
  const refreshVehicleData = async () => {
    setIsLoading(true);
    try {
      // Simulação de atualização de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar veículos com pequenas alterações para simular dados em tempo real
      const updatedVehicles = vehicles.map(vehicle => {
        if (vehicle.status === 'online') {
          // Simular mudanças aleatórias na velocidade e posição
          const speedChange = Math.random() > 0.5 ? 1 : -1;
          const newSpeed = Math.max(0, vehicle.speed + speedChange * Math.floor(Math.random() * 5));
          
          return {
            ...vehicle,
            speed: newSpeed,
            isMoving: newSpeed > 0,
            lastUpdate: 'Agora mesmo'
          };
        }
        return vehicle;
      });
      
      setVehicles(updatedVehicles);
      
      // Atualizar veículo selecionado se existir
      if (selectedVehicle) {
        const updatedSelected = updatedVehicles.find(v => v.id === selectedVehicle.id);
        if (updatedSelected) {
          setSelectedVehicle(updatedSelected);
        }
      }
    } catch (error) {
      setError('Erro ao atualizar dados dos veículos');
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar comando para veículo
  const sendCommand = async (vehicleId: number, command: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulação de envio de comando
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar estado do veículo com base no comando
      if (command === 'block') {
        const updatedVehicles = vehicles.map(vehicle => {
          if (vehicle.id === vehicleId) {
            return {
              ...vehicle,
              ignition: false,
              isMoving: false,
              speed: 0
            };
          }
          return vehicle;
        });
        
        setVehicles(updatedVehicles);
        
        // Atualizar veículo selecionado se for o mesmo
        if (selectedVehicle && selectedVehicle.id === vehicleId) {
          const updatedSelected = updatedVehicles.find(v => v.id === vehicleId);
          if (updatedSelected) {
            setSelectedVehicle(updatedSelected);
          }
        }
      }
      
      return true;
    } catch (error) {
      setError('Erro ao enviar comando para o veículo');
      console.error('Erro ao enviar comando:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Obter viagens de um veículo
  const getVehicleTrips = (vehicleId: number): Trip[] => {
    return trips.filter(trip => trip.vehicleId === vehicleId);
  };

  // Obter eventos de um veículo
  const getVehicleEvents = (vehicleId: number): VehicleEvent[] => {
    return events.filter(event => event.vehicleId === vehicleId);
  };

  const value = {
    vehicles,
    selectedVehicle,
    events,
    trips,
    isLoading,
    error,
    selectVehicle,
    refreshVehicleData,
    sendCommand,
    getVehicleTrips,
    getVehicleEvents
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};
