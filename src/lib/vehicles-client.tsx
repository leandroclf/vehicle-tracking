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
  status: 'active' | 'inactive' | 'maintenance';
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
  metadata?: any;
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

interface VehicleContextType {
  vehicles: Vehicle[];
  loading: boolean;
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  refreshVehicles: () => Promise<void>;
  getVehicleEvents: (vehicleId: number) => Promise<VehicleEvent[]>;
  getVehicleTrips: (vehicleId: number) => Promise<VehicleTrip[]>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const refreshVehicles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (error: any) {
      console.error('Erro ao carregar veículos:', error);
      toast.error(error.message || 'Erro ao carregar veículos');
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

  const getVehicleEvents = async (vehicleId: number): Promise<VehicleEvent[]> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`/api/vehicles/${vehicleId}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar eventos do veículo');
      }

      const data = await response.json();
      return data.events || [];
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast.error(error.message || 'Erro ao carregar eventos');
      return [];
    }
  };

  const getVehicleTrips = async (vehicleId: number): Promise<VehicleTrip[]> => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`/api/vehicles/${vehicleId}/trips`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar viagens do veículo');
      }

      const data = await response.json();
      return data.trips || [];
    } catch (error: any) {
      console.error('Erro ao carregar viagens:', error);
      toast.error(error.message || 'Erro ao carregar viagens');
      return [];
    }
  };

  const value: VehicleContextType = {
    vehicles,
    loading,
    selectedVehicle,
    setSelectedVehicle,
    refreshVehicles,
    getVehicleEvents,
    getVehicleTrips,
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