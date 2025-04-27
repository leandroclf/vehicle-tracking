'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Definição do tipo de alerta
export interface Alert {
  id: number;
  vehicleId: number;
  vehicleName: string;
  type: 'ignition' | 'movement' | 'speed' | 'panic' | 'battery' | 'offline';
  message: string;
  timestamp: string;
  read: boolean;
}

// Definição do contexto de alertas
interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  getVehicleAlerts: (vehicleId: number) => Alert[];
}

// Dados simulados de alertas
const mockAlerts: Alert[] = [
  {
    id: 1,
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    type: 'movement',
    message: 'Seu veículo Honda Civic começou a se mover.',
    timestamp: '2025-04-27T14:28:00',
    read: false
  },
  {
    id: 2,
    vehicleId: 2,
    vehicleName: 'Toyota Corolla',
    type: 'speed',
    message: 'Seu veículo Toyota Corolla excedeu o limite de velocidade.',
    timestamp: '2025-04-27T14:15:00',
    read: false
  },
  {
    id: 3,
    vehicleId: 1,
    vehicleName: 'Honda Civic',
    type: 'ignition',
    message: 'Seu veículo Honda Civic foi desligado.',
    timestamp: '2025-04-27T13:30:00',
    read: true
  },
  {
    id: 4,
    vehicleId: 3,
    vehicleName: 'Yamaha Factor',
    type: 'battery',
    message: 'Bateria do rastreador do veículo Yamaha Factor está baixa.',
    timestamp: '2025-04-27T12:45:00',
    read: true
  },
  {
    id: 5,
    vehicleId: 3,
    vehicleName: 'Yamaha Factor',
    type: 'offline',
    message: 'Seu veículo Yamaha Factor está offline há mais de 1 hora.',
    timestamp: '2025-04-27T12:30:00',
    read: true
  }
];

// Criação do contexto
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts deve ser usado dentro de um AlertProvider');
  }
  return context;
};

// Provedor de alertas
export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular contagem de alertas não lidos
  const unreadCount = alerts.filter(alert => !alert.read).length;

  // Marcar alerta como lido
  const markAsRead = (id: number) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
  };

  // Marcar todos os alertas como lidos
  const markAllAsRead = () => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert => ({ ...alert, read: true }))
    );
  };

  // Obter alertas de um veículo específico
  const getVehicleAlerts = (vehicleId: number): Alert[] => {
    return alerts.filter(alert => alert.vehicleId === vehicleId);
  };

  const value = {
    alerts,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    getVehicleAlerts
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
};
