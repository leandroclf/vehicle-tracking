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
      const supabase = createClient();
      
      // Buscar dados do Supabase
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          name,
          plate:license_plate,
          type,
          brand,
          model,
          year,
          color,
          active,
          trackers(
            imei,
            protocol,
            active
          )
        `);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setVehicles([]);
        setIsLoading(false);
        return;
      }
      
      // Após obter os veículos, buscar a última posição de cada um
      const vehiclesWithPositions = await Promise.all(
        data.map(async (vehicle) => {
          // Buscar a posição mais recente para este veículo
          const { data: positionData, error: positionError } = await supabase
            .from('positions')
            .select('*')
            .eq('vehicle_id', vehicle.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
            
          if (positionError && !positionError.message.includes('No rows found')) {
            console.error(`Erro ao buscar posição para veículo ${vehicle.id}:`, positionError);
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
    const supabase = createClient();
    
    const positionsSubscription = supabase
      .channel('position-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'positions' 
        }, 
        (payload) => {
          // Atualizar veículo específico com novos dados de posição
          setVehicles(currentVehicles => {
            return currentVehicles.map(vehicle => {
              if (vehicle.id === payload.new.vehicle_id) {
                return {
                  ...vehicle,
                  lat: payload.new.latitude,
                  lng: payload.new.longitude,
                  location: {
                    lat: payload.new.latitude,
                    lng: payload.new.longitude
                  },
                  speed: payload.new.speed || 0,
                  heading: payload.new.direction,
                  direction: getDirectionFromHeading(payload.new.direction),
                  status: payload.new.ignition ? 'online' : 'offline',
                  ignition: payload.new.ignition,
                  isMoving: payload.new.speed > 0,
                  is_moving: payload.new.speed > 0,
                  lastUpdate: new Date(payload.new.timestamp).toLocaleString('pt-BR'),
                  last_update: payload.new.timestamp,
                  battery: payload.new.battery_level,
                  satellites: payload.new.satellites
                };
              }
              return vehicle;
            });
          });
          
          // Atualizar veículo selecionado se for o mesmo
          setSelectedVehicle(current => {
            if (current && current.id === payload.new.vehicle_id) {
              return {
                ...current,
                lat: payload.new.latitude,
                lng: payload.new.longitude,
                location: {
                  lat: payload.new.latitude,
                  lng: payload.new.longitude
                },
                speed: payload.new.speed || 0,
                heading: payload.new.direction,
                direction: getDirectionFromHeading(payload.new.direction),
                status: payload.new.ignition ? 'online' : 'offline',
                ignition: payload.new.ignition,
                isMoving: payload.new.speed > 0,
                is_moving: payload.new.speed > 0,
                lastUpdate: new Date(payload.new.timestamp).toLocaleString('pt-BR'),
                last_update: payload.new.timestamp,
                battery: payload.new.battery_level,
                satellites: payload.new.satellites
              };
            }
            return current;
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.channel('position-updates').unsubscribe();
    };
  }, []);

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
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        vehicle_id,
        type,
        description,
        timestamp,
        positions(latitude, longitude)
      `)
      .eq('vehicle_id', vehicleId)
      .order('timestamp', { ascending: false })
      .limit(50);
      
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
        lat: event.positions?.[0]?.latitude || 0,
        lng: event.positions?.[0]?.longitude || 0,
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
    const supabase = createClient();
    
    // Buscar as viagens do veículo
    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        vehicle_id,
        vehicles(name, license_plate),
        start_time,
        end_time,
        distance,
        max_speed,
        avg_speed,
        start_position_id,
        end_position_id
      `)
      .eq('vehicle_id', vehicleId)
      .order('start_time', { ascending: false })
      .limit(20);
      
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
        vehicleName: trip.vehicles?.[0]?.name || 'Veículo sem nome',
        vehiclePlate: trip.vehicles?.[0]?.license_plate || 'Sem placa',
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
