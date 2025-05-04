'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useAlertsSubscription, useVehiclesSubscription, useGeofencesSubscription } from '@/lib/hooks/useRealtimeSubscription';
import RealtimeNotifications from './RealtimeNotifications';

// Tipos para as notificações
export type NotificationType = 'alert' | 'vehicle' | 'geofence' | 'system' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

// Interfaces para os tipos de dados
interface Alert {
  id: string;
  message?: string;
  timestamp?: string;
  read?: boolean;
  [key: string]: any;
}

interface Vehicle {
  id: string;
  name?: string;
  [key: string]: any;
}

interface Geofence {
  id: string;
  name?: string;
  [key: string]: any;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);
  
  // Atualizar ref quando o user mudar
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  // Calcular o número de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handlers para diferentes tipos de notificações
  const handleNewAlert = useCallback((newAlert: Alert) => {
    const notification: Notification = {
      id: newAlert.id,
      type: 'alert',
      title: 'Novo Alerta',
      message: newAlert.message || 'Você recebeu um novo alerta',
      timestamp: newAlert.timestamp || new Date().toISOString(),
      read: false,
      data: newAlert
    };
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const handleVehicleUpdate = useCallback((updatedVehicle: Vehicle) => {
    const notification: Notification = {
      id: `vehicle-${updatedVehicle.id}-${Date.now()}`,
      type: 'vehicle',
      title: 'Atualização de Veículo',
      message: `O veículo ${updatedVehicle.name || updatedVehicle.id} foi atualizado`,
      timestamp: new Date().toISOString(),
      read: false,
      data: updatedVehicle
    };
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const handleGeofenceUpdate = useCallback((geofence: Geofence) => {
    const notification: Notification = {
      id: `geofence-${geofence.id}-${Date.now()}`,
      type: 'geofence',
      title: 'Atualização de Geocerca',
      message: `A geocerca ${geofence.name || geofence.id} foi atualizada`,
      timestamp: new Date().toISOString(),
      read: false,
      data: geofence
    };
    setNotifications(prev => [notification, ...prev]);
  }, []);

  // Usar os hooks de subscription com callbacks estáveis
  useAlertsSubscription(handleNewAlert, 'INSERT', !!user);
  useVehiclesSubscription(handleVehicleUpdate, 'UPDATE', !!user);
  useGeofencesSubscription(handleGeofenceUpdate, '*', !!user);

  // Carregar notificações existentes
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Buscar notificações da tabela notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (notificationsError) throw notificationsError;

        // Buscar alertas não lidos
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('timestamp', { ascending: false });

        if (alertsError) throw alertsError;

        // Converter alertas para o formato de notificação
        const alertNotifications = alertsData?.map(alert => ({
          id: alert.id,
          type: 'alert' as NotificationType,
          title: 'Alerta',
          message: alert.message || 'Novo alerta recebido',
          timestamp: alert.timestamp || new Date().toISOString(),
          read: Boolean(alert.read),
          data: alert
        })) || [];

        // Combinar notificações e alertas
        const allNotifications = [
          ...(notificationsData as Notification[] || []),
          ...alertNotifications
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setNotifications(allNotifications);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  // Marcar uma notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    try {
      if (!userIdRef.current) return;
      
      // Verificar se é uma notificação do tipo alerta (que está na tabela alerts)
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;

      if (notification.type === 'alert') {
        await supabase
          .from('alerts')
          .update({ read: true })
          .eq('id', id);
      } else {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id);
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [notifications]);

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      if (!userIdRef.current) return;

      // Marcar todos os alertas como lidos
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('user_id', userIdRef.current)
        .eq('read', false);

      // Marcar todas as notificações como lidas
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userIdRef.current)
        .eq('read', false);

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  }, []);

  // Adicionar uma nova notificação manualmente
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification
      }}
    >
      {children}
      <RealtimeNotifications />
    </NotificationsContext.Provider>
  );
};

export default NotificationsProvider;