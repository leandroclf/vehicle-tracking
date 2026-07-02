'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definição do tipo de alerta
interface Alert {
  id: number;
  vehicleId: number;
  vehicleName?: string;
  vehiclePlate?: string;
  type: 'speed' | 'geofence' | 'battery' | 'engine' | 'other';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  acknowledged: boolean;
  details?: Record<string, any>;
}

// Definição do contexto de alertas
interface AlertContextType {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  acknowledgeAlert: (id: number) => Promise<boolean>;
  markAsRead: (id: number) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  getAlert: (id: number) => Alert | undefined;
  addAlert: (alert: Omit<Alert, 'id'>) => Promise<Alert | null>;
  deleteAlert: (id: number) => Promise<boolean>;
  clearAlerts: () => void;
}

// Valor padrão do contexto
const defaultContextValue: AlertContextType = {
  alerts: [],
  isLoading: false,
  error: null,
  fetchAlerts: async () => {},
  acknowledgeAlert: async () => false,
  markAsRead: async () => false,
  markAllAsRead: async () => false,
  getAlert: () => undefined,
  addAlert: async () => null,
  deleteAlert: async () => false,
  clearAlerts: () => {},
};

// Contexto de alertas
const AlertContext = createContext<AlertContextType>(defaultContextValue);

// Hook para usar o contexto de alertas
export const useAlerts = () => {
  const context = useContext(AlertContext);
  
  if (context === undefined) {
    throw new Error('useAlerts deve ser usado dentro de um AlertProvider');
  }
  
  return context;
};

// Provider de alertas
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar alertas do backend
  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/alerts?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'Falha ao carregar alertas');
      }

      const data = (await response.json()) as {
        alerts: Array<{
          id: number;
          vehicle_id: number;
          type: string;
          severity: string | null;
          title: string;
          message: string;
          read: boolean;
          timestamp: string | null;
          vehicleName: string;
          vehiclePlate: string;
        }>;
      };

      const validTypes = ['speed', 'geofence', 'battery', 'engine'];
      const mapped: Alert[] = (data.alerts || []).map(item => ({
        id: item.id,
        vehicleId: item.vehicle_id,
        vehicleName: item.vehicleName,
        vehiclePlate: item.vehiclePlate,
        type: (validTypes.includes(item.type) ? item.type : 'other') as Alert['type'],
        severity: item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'warning' : 'info',
        message: item.message || item.title,
        timestamp: item.timestamp ?? new Date().toISOString(),
        acknowledged: item.read,
      }));

      setAlerts(mapped);
    } catch (err) {
      console.error('Erro ao buscar alertas:', err);
      setError('Falha ao carregar alertas. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar alertas ao inicializar
  useEffect(() => {
    fetchAlerts();
  }, []);

  // Acknowledge um alerta (persistido no backend)
  const acknowledgeAlert = async (id: number): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ alertIds: [id] }),
      });

      if (!response.ok) return false;

      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === id ? { ...alert, acknowledged: true } : alert
        )
      );

      return true;
    } catch (err) {
      console.error('Erro ao reconhecer alerta:', err);
      return false;
    }
  };

  const markAsRead = acknowledgeAlert;

  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/alerts/read-all', {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) return false;

      setAlerts(prevAlerts => prevAlerts.map(alert => ({ ...alert, acknowledged: true })));
      return true;
    } catch (err) {
      console.error('Erro ao marcar todos os alertas como lidos:', err);
      return false;
    }
  };

  // Obter um alerta específico
  const getAlert = (id: number): Alert | undefined => {
    return alerts.find(alert => alert.id === id);
  };

  // Adicionar um novo alerta
  const addAlert = async (alertData: Omit<Alert, 'id'>): Promise<Alert | null> => {
    try {
      // Simulação de chamada ao backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newAlert: Alert = {
        ...alertData,
        id: Math.max(0, ...alerts.map(a => a.id)) + 1,
      };
      
      setAlerts(prev => [...prev, newAlert]);
      
      return newAlert;
    } catch (err) {
      console.error('Erro ao adicionar alerta:', err);
      return null;
    }
  };

  // Excluir um alerta
  const deleteAlert = async (id: number): Promise<boolean> => {
    try {
      // Simulação de chamada ao backend
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      
      return true;
    } catch (err) {
      console.error('Erro ao excluir alerta:', err);
      return false;
    }
  };

  // Limpar todos os alertas
  const clearAlerts = () => {
    setAlerts([]);
  };

  // Valor do contexto
  const value: AlertContextType = {
    alerts,
    isLoading,
    error,
    fetchAlerts,
    acknowledgeAlert,
    markAsRead,
    markAllAsRead,
    getAlert,
    addAlert,
    deleteAlert,
    clearAlerts
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
}

export default AlertProvider;
