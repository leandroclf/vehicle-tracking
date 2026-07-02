'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth/auth-context';
import { toast } from 'sonner';

// Tipos para veículos no cliente
export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  model: string;
  year: number;
  color: string;
  /** Status cadastral do veículo (coluna vehicles.status) */
  status: 'active' | 'inactive' | 'maintenance';
  /** Tipo do veículo (coluna vehicles.type, ex.: 'car') */
  type?: string;
  device_imei?: string;
  device_last_maintenance?: string;
  /** Estado de conexão em tempo real (vehicle_status.status, ex.: 'online' | 'offline') */
  connection_status?: string;
  ignition?: boolean;
  is_moving?: boolean;
  speed?: number;
  heading?: number;
  satellites?: number;
  last_update?: string;
  fuel_level?: number;
  battery_level?: number;
  odometer?: number;
  last_position?: {
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
  };
  driver?: {
    id: number;
    name: string;
    phone?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VehicleEvent {
  id: number;
  vehicle_id: number;
  type: string;
  description: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  metadata?: unknown;
}

export interface VehicleTrip {
  id: number;
  vehicle_id: number;
  start_time: string;
  end_time?: string;
  start_location: {
    lat: number;
    lng: number;
    address?: string;
  };
  end_location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  distance?: number;
  duration?: number;
  max_speed?: number;
  avg_speed?: number;
}

// Tipos de comando aceitos por POST /api/vehicles/commands
export type VehicleCommandType = 'block_engine' | 'unblock_engine' | 'siren' | 'lights';

// Registro de comando como retornado por GET /api/vehicles/commands (tabela `commands`)
export interface VehicleCommandRecord {
  id: number;
  vehicleId: number;
  userId: string;
  type: string;
  status: string | null;
  parameters: unknown;
  sentAt: string | null;
  executedAt: string | null;
  response: unknown;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VehicleCommandHistoryResult {
  commands: VehicleCommandRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Payload real de GET /api/vehicles (linhas Drizzle + estado em tempo real)
interface ApiVehicleStatus {
  vehicleId: number;
  status: string | null;
  isMoving: boolean | null;
  lastUpdate: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  accuracy: number | null;
  satellites: number | null;
  odometer: number | null;
  engineHours: number | null;
  fuelLevel: number | null;
  batteryLevel: number | null;
  temperature: number | null;
  ignition: boolean | null;
  panic: boolean | null;
  armed: boolean | null;
}

interface ApiVehicle {
  id: number;
  name: string;
  type: string;
  plate: string;
  model: string | null;
  year: string | null;
  color: string | null;
  deviceImei: string | null;
  deviceModel: string | null;
  deviceSim: string | null;
  deviceLastMaintenance: string | null;
  status: string | null;
  createdAt: string | null;
  currentStatus: ApiVehicleStatus | null;
}

function normalizeRegistrationStatus(status: string | null): Vehicle['status'] {
  if (status === 'inactive' || status === 'maintenance') {
    return status;
  }
  return 'active';
}

function mapApiVehicle(apiVehicle: ApiVehicle): Vehicle {
  const live = apiVehicle.currentStatus;

  return {
    id: apiVehicle.id,
    name: apiVehicle.name,
    plate: apiVehicle.plate,
    model: apiVehicle.model ?? '',
    year: apiVehicle.year ? Number(apiVehicle.year) || 0 : 0,
    color: apiVehicle.color ?? '',
    status: normalizeRegistrationStatus(apiVehicle.status),
    type: apiVehicle.type,
    device_imei: apiVehicle.deviceImei ?? undefined,
    device_last_maintenance: apiVehicle.deviceLastMaintenance ?? undefined,
    connection_status: live?.status ?? undefined,
    ignition: live?.ignition ?? undefined,
    is_moving: live?.isMoving ?? undefined,
    speed: live?.speed ?? undefined,
    heading: live?.heading ?? undefined,
    satellites: live?.satellites ?? undefined,
    last_update: live?.lastUpdate ?? undefined,
    fuel_level: live?.fuelLevel ?? undefined,
    battery_level: live?.batteryLevel ?? undefined,
    odometer: live?.odometer ?? undefined,
    last_position: live && live.lat != null && live.lng != null
      ? {
          lat: live.lat,
          lng: live.lng,
          timestamp: live.lastUpdate ?? '',
          address: live.address ?? undefined,
        }
      : undefined,
    created_at: apiVehicle.createdAt ?? '',
    updated_at: live?.lastUpdate ?? apiVehicle.createdAt ?? '',
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  refreshVehicles: () => Promise<void>;
  getVehicleEvents: (vehicleId: number) => Promise<VehicleEvent[]>;
  getVehicleTrips: (vehicleId: number) => Promise<VehicleTrip[]>;
  sendCommand: (vehicleId: number, type: VehicleCommandType) => Promise<boolean>;
  fetchCommandHistory: (
    vehicleId: number | string,
    limit?: number,
    offset?: number
  ) => Promise<VehicleCommandHistoryResult>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

function getAuthToken(): string {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Token não encontrado');
  }
  return token;
}

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const refreshVehicles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json() as { vehicles?: ApiVehicle[] };
      setVehicles((data.vehicles ?? []).map(mapApiVehicle));
      setError(null);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      const message = getErrorMessage(error, 'Erro ao carregar veículos');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carregar veículos quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      refreshVehicles();
    } else {
      setVehicles([]);
      setSelectedVehicle(null);
      setLoading(false);
    }
  }, [user, refreshVehicles]);

  const getVehicleEvents = useCallback(async (vehicleId: number): Promise<VehicleEvent[]> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const token = getAuthToken();

      const response = await fetch(`/api/vehicles/${vehicleId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar eventos do veículo');
      }

      const data = await response.json() as { events?: VehicleEvent[] };
      return data.events ?? [];
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast.error(getErrorMessage(error, 'Erro ao carregar eventos'));
      return [];
    }
  }, [user]);

  const getVehicleTrips = useCallback(async (vehicleId: number): Promise<VehicleTrip[]> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const token = getAuthToken();

      const response = await fetch(`/api/vehicles/${vehicleId}/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar viagens do veículo');
      }

      const data = await response.json() as { trips?: VehicleTrip[] };
      return data.trips ?? [];
    } catch (error) {
      console.error('Erro ao carregar viagens:', error);
      toast.error(getErrorMessage(error, 'Erro ao carregar viagens'));
      return [];
    }
  }, [user]);

  const sendCommand = useCallback(async (
    vehicleId: number,
    type: VehicleCommandType
  ): Promise<boolean> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const token = getAuthToken();

      const response = await fetch('/api/vehicles/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vehicleId, type }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Erro ao enviar comando');
      }

      return true;
    } catch (error) {
      console.error('Erro ao enviar comando:', error);
      toast.error(getErrorMessage(error, 'Erro ao enviar comando'));
      return false;
    }
  }, [user]);

  const fetchCommandHistory = useCallback(async (
    vehicleId: number | string,
    limit = 10,
    offset = 0
  ): Promise<VehicleCommandHistoryResult> => {
    if (!user) throw new Error('Usuário não autenticado');

    const token = getAuthToken();
    const params = new URLSearchParams({
      vehicleId: String(vehicleId),
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`/api/vehicles/commands?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json() as { error?: string };
      throw new Error(data.error || 'Erro ao carregar histórico de comandos');
    }

    return await response.json() as VehicleCommandHistoryResult;
  }, [user]);

  const value: VehicleContextType = {
    vehicles,
    loading,
    isLoading: loading,
    error,
    selectedVehicle,
    setSelectedVehicle,
    refreshVehicles,
    getVehicleEvents,
    getVehicleTrips,
    sendCommand,
    fetchCommandHistory,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicles deve ser usado dentro de um VehicleProvider');
  }
  return context;
}

// Hook para obter um veículo específico
export function useVehicle(vehicleId: number) {
  const { vehicles } = useVehicles();
  return vehicles.find(v => v.id === vehicleId) || null;
}

// Hook para obter veículos filtrados por status
export function useVehiclesByStatus(status?: Vehicle['status']) {
  const { vehicles } = useVehicles();
  if (!status) return vehicles;
  return vehicles.filter(v => v.status === status);
}
