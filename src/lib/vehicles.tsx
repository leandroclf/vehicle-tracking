'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
// Removido import do database - frontend deve usar APIs REST

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
  sendCommand: (vehicleId: number | string, commandType: string) => Promise<boolean>;
  fetchCommandHistory: (vehicleId: number | string, limit?: number, offset?: number) => Promise<any>;
}

// Criação do contexto
const VehicleContext = createContext<VehicleContextProps | undefined>(undefined);

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
      // Buscar veículos via API REST
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error('Falha ao buscar veículos');
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }
      
      // Após obter os veículos, buscar a última posição de cada um
      const vehiclesWithPositions = await Promise.all(
        data.map(async (vehicle) => {
          // Buscar a posição mais recente para este veículo
          // Buscar posição mais recente via API
          let positionData = null;
          try {
            const posResponse = await fetch(`/api/vehicles/${vehicle.id}/position`);
            if (posResponse.ok) {
              positionData = await posResponse.json();
            }
          } catch (error) {
            console.error(`Erro ao buscar posição para veículo ${vehicle.id}:`, error);
          }
          
          // Transformar para o formato esperado pela UI
          return {
            id: vehicle.id,
            name: vehicle.name,
            plate: vehicle.plate || '',
            type: vehicle.type || 'car',
            status: (positionData ? (positionData.ignition ? 'online' : 'offline') : 'offline') as 'online' | 'offline',
            speed: positionData?.speed || 0,
            ignition: positionData?.ignition || false,
            isMoving: positionData?.speed > 0,
            lastUpdate: positionData ? new Date(positionData.timestamp).toLocaleString('pt-BR') : 'Sem dados',
            location: {
              lat: positionData?.latitude || 0,
              lng: positionData?.longitude || 0
            },
            lat: positionData?.latitude || 0,
            lng: positionData?.longitude || 0,
            heading: positionData?.direction,
            last_update: positionData?.timestamp || new Date().toISOString(),
            is_moving: positionData?.speed > 0,
            battery: positionData?.battery_level,
            satellites: positionData?.satellites,
            direction: getDirectionFromHeading(positionData?.direction),
            details: {
              year: vehicle.year || 0,
              model: vehicle.model || '',
              manufacturer: vehicle.brand || '',
              color: vehicle.color || '',
              vin: vehicle.trackers?.[0]?.imei || '',
              simCard: '',
              lastMaintenance: ''
            }
          } as Vehicle;
        })
      );
      
      setVehicles(vehiclesWithPositions);
    } catch (err: any) {
      console.error('Erro ao buscar veículos:', err);
      setError('Falha ao carregar veículos. Tente novamente mais tarde.');
      setVehicles([]);
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

  // Configurar canal de tempo real para atualizações
  useEffect(() => {
    // TODO: Implementar WebSocket para atualizações em tempo real
    // const wsManager = new WebSocketManager(process.env.NEXT_PUBLIC_WS_URL!);
    // wsManager.subscribe('positions', (event) => {
    //   if (event.type === 'INSERT') {
    //     // Atualizar veículo específico com novos dados de posição
    //     // ... lógica de atualização
    //   }
    // });
    
    // Por enquanto, usar polling como fallback
    const intervalId = setInterval(() => {
      // Recarregar dados periodicamente
      fetchVehicles();
    }, 30000); // A cada 30 segundos
      
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchVehicles]);

  function getDirectionFromHeading(heading?: number): string {
    if (heading === undefined) return 'N/A';
    const directions = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
    const index = Math.round(((heading % 360) / 45)) % 8;
    return directions[index];
  }

  const handleSelectVehicle = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
  };

  // Função para enviar um comando para um veículo
  const sendCommand = useCallback(async (vehicleId: number | string, commandType: string): Promise<boolean> => {
    try {
      // Mapear tipos de comando da UI para os tipos do backend
      const commandTypeMap: Record<string, string> = {
        'block': 'block_engine',
        'unblock': 'unblock_engine',
        'siren': 'siren',
        'lights': 'lights'
      };
      
      const mappedType = commandTypeMap[commandType] || commandType;
      
      const response = await fetch('/api/vehicles/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: String(vehicleId),
          type: mappedType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao enviar comando:', errorData);
        return false;
      }
      
      const result = await response.json();
      console.log('Comando enviado com sucesso:', result);
      
      // Atualizar a lista de veículos após enviar o comando
      // Isso é útil para comandos que alteram o estado do veículo
      if (commandType === 'block' || commandType === 'unblock') {
        await fetchVehicles();
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar comando:', error);
      return false;
    }
  }, [fetchVehicles]);

  // Função para buscar histórico de comandos
  const fetchCommandHistory = useCallback(async (vehicleId: number | string, limit = 10, offset = 0) => {
    try {
      const response = await fetch(
        `/api/vehicles/commands?vehicleId=${vehicleId}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro ao buscar histórico de comandos:', errorData);
        return { commands: [], pagination: { total: 0, limit, offset } };
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao buscar histórico de comandos:', error);
      return { commands: [], pagination: { total: 0, limit, offset } };
    }
  }, []);

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        selectedVehicle,
        isLoading,
        error,
        setSelectedVehicle: handleSelectVehicle,
        refreshVehicles: fetchVehicles,
        sendCommand,
        fetchCommandHistory
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

// Hook para acessar o contexto
export function useVehicles() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles deve ser usado dentro de um VehicleProvider');
  }
  return context;
}

// Função para obter eventos de um veículo
export async function getVehicleEvents(vehicleId: number): Promise<VehicleEvent[]> {
  try {
    const pool = getDbPool();
    
    // TODO: Implementar query SQL direta
    const eventsQuery = `
      SELECT e.id, e.vehicle_id, e.type, e.description, e.timestamp,
             p.latitude, p.longitude
      FROM events e
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.vehicle_id = $1
      ORDER BY e.timestamp DESC
      LIMIT 50
    `;
    const eventsResult = await pool.query(eventsQuery, [vehicleId]);
    const data = eventsResult.rows;
    const error = null;
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transformar para o formato esperado pela UI
    return data.map(event => ({
      id: event.id,
      vehicleId: event.vehicle_id,
      type: event.type as 'ignition_on' | 'ignition_off' | 'speed_alert' | 'movement' | 'panic' | 'battery_low',
      timestamp: event.timestamp,
      location: {
        lat: event.latitude || 0,
        lng: event.longitude || 0,
        address: 'Obtendo endereço...' // Pode ser implementado com serviço de geocodificação reversa
      },
      details: event.description
    }));
  } catch (err) {
    console.error('Erro ao buscar eventos do veículo:', err);
    return [];
  }
}

// Função para obter viagens de um veículo
export async function getVehicleTrips(vehicleId: number): Promise<Trip[]> {
  try {
    const pool = getDbPool();
    
    // Buscar as viagens do veículo
    // TODO: Implementar query SQL direta
    const tripsQuery = `
      SELECT t.id, t.vehicle_id, t.start_time, t.end_time, t.distance,
             t.max_speed, t.avg_speed, t.start_position_id, t.end_position_id,
             v.name, v.license_plate
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.vehicle_id = $1
      ORDER BY t.start_time DESC
      LIMIT 20
    `;
    const tripsResult = await pool.query(tripsQuery, [vehicleId]);
    const data = tripsResult.rows;
    const error = null;
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transformar para o formato esperado pela UI
    return data.map(trip => {
      const startTime = new Date(trip.start_time);
      const endTime = trip.end_time ? new Date(trip.end_time) : new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        id: trip.id,
        vehicleId: trip.vehicle_id,
        vehicleName: trip.name || 'Veículo sem nome',
        vehiclePlate: trip.license_plate || 'Sem placa',
        date: startTime.toLocaleDateString('pt-BR'),
        startTime: startTime.toLocaleTimeString('pt-BR'),
        endTime: trip.end_time ? endTime.toLocaleTimeString('pt-BR') : 'Em andamento',
        duration: trip.end_time ? `${hours}h ${minutes}min` : 'Em andamento',
        distance: `${Number(trip.distance || 0).toFixed(2)} km`,
        startLocation: 'Obtendo endereço...', // Pode ser implementado com geocodificação reversa
        endLocation: trip.end_time ? 'Obtendo endereço...' : 'Em andamento',
        maxSpeed: `${Number(trip.max_speed || 0).toFixed(2)} km/h`,
        avgSpeed: `${Number(trip.avg_speed || 0).toFixed(2)} km/h`,
        events: [] // Os eventos seriam buscados em uma chamada separada
      };
    });
  } catch (err) {
    console.error('Erro ao buscar viagens do veículo:', err);
    return [];
  }
}
