'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseRealtime } from '@/lib/supabase';
import { Toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { checkTableExists } from '@/lib/db-setup';

// Tipos para as notificações
type NotificationType = 'alert' | 'vehicle' | 'geofence' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

export const RealtimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [tableExists, setTableExists] = useState<{[key: string]: boolean}>({});
  const { user } = useAuth();
  const router = useRouter();
  
  // Usar refs para guardar canais ativos e user.id
  const channelsRef = useRef<any[]>([]);
  const userIdRef = useRef<string | null>(null);
  
  // Atualizar userIdRef quando user mudar
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  // Verificar tabelas necessárias
  useEffect(() => {
    if (!user) return;
    
    const checkTables = async () => {
      try {
        // Verificar se as tabelas necessárias existem
        const notificationsExists = await checkTableExists('notifications');
        const alertsExists = await checkTableExists('alerts');
        
        setTableExists({
          notifications: notificationsExists,
          alerts: alertsExists
        });
        
        if (!notificationsExists) {
          console.warn('Tabela de notificações não encontrada. Algumas funcionalidades podem não funcionar corretamente.');
        }
        
        if (!alertsExists) {
          console.warn('Tabela de alertas não encontrada. Algumas funcionalidades podem não funcionar corretamente.');
        }
      } catch (error) {
        console.error('Erro ao verificar tabelas:', error);
      }
    };
    
    checkTables();
  }, [user]);

  // Handler para notificações estáveis com useCallback
  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setCurrentNotification(notification);
    setShowToast(true);
  }, []);

  // Handler para novos alertas
  const handleNewAlert = useCallback((payload: any) => {
    const newAlert = payload.new;
    const notification: Notification = {
      id: newAlert.id,
      type: 'alert',
      title: 'Novo Alerta',
      message: newAlert.message || 'Você recebeu um novo alerta',
      timestamp: newAlert.timestamp || new Date().toISOString(),
      read: false,
      data: newAlert
    };
    handleNewNotification(notification);
  }, [handleNewNotification]);

  // Handler para atualização de veículos
  const handleVehicleUpdate = useCallback((payload: any) => {
    const updatedVehicle = payload.new;
    const notification: Notification = {
      id: `vehicle-${updatedVehicle.id}-${Date.now()}`,
      type: 'vehicle',
      title: 'Atualização de Veículo',
      message: `O veículo ${updatedVehicle.name || updatedVehicle.id} foi atualizado`,
      timestamp: new Date().toISOString(),
      read: false,
      data: updatedVehicle
    };
    handleNewNotification(notification);
  }, [handleNewNotification]);

  // Handler para notificações gerais
  const handleNotification = useCallback((payload: any) => {
    const newNotification = payload.new as Notification;
    handleNewNotification(newNotification);
  }, [handleNewNotification]);

  useEffect(() => {
    if (!user) return;
    
    // Limpar canais anteriores
    channelsRef.current.forEach(channel => {
      if (channel && channel.unsubscribe) {
        channel.unsubscribe();
      }
    });
    channelsRef.current = [];

    // Função para criar um canal de forma segura
    const createChannel = (channelName: string, table: string, event: 'INSERT' | 'UPDATE', handler: (payload: any) => void) => {
      // Verificar se a tabela existe antes de criar o canal
      if (!tableExists[table] && Object.keys(tableExists).length > 0) {
        console.log(`Tabela ${table} não existe, canal não será criado.`);
        return null;
      }
      
      try {
        const channel = supabaseRealtime
          .channel(channelName)
          .on(
            'postgres_changes' as any,
            {
              event,
              schema: 'public',
              table,
              filter: `user_id=eq.${user.id}`,
            }, 
            handler
          )
          .subscribe();
        
        channelsRef.current.push(channel);
        return channel;
      } catch (error) {
        console.error(`Erro ao criar canal ${channelName}:`, error);
        return null;
      }
    };

    // Criar canais apenas para tabelas que existem
    if (tableExists.notifications || Object.keys(tableExists).length === 0) {
      createChannel(`user-notifications-${user.id}`, 'notifications', 'INSERT', handleNotification);
    }
    
    if (tableExists.alerts || Object.keys(tableExists).length === 0) {
      createChannel(`user-alerts-${user.id}`, 'alerts', 'INSERT', handleNewAlert);
    }
    
    createChannel(`user-vehicles-${user.id}`, 'vehicles', 'UPDATE', handleVehicleUpdate);

    // Carregar notificações não lidas ao iniciar
    const fetchNotifications = async () => {
      try {
        // Verificar se o usuário está autenticado e tem ID válido
        if (!user || !user.id) {
          console.log('Usuário não autenticado ou sem ID válido');
          return;
        }
        
        // Array para armazenar todas as notificações
        let allNotifications: Notification[] = [];
        
        // Buscar notificações da tabela 'notifications' se ela existir
        if (tableExists.notifications || Object.keys(tableExists).length === 0) {
          try {
            const { data, error } = await supabaseRealtime
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .eq('read', false)
              .order('timestamp', { ascending: false });

            if (error) {
              console.error('Erro na consulta à tabela notifications:', error.message);
              
              // Verificar se o erro é devido à tabela não existir
              if (error.message.includes('does not exist')) {
                setTableExists(prev => ({ ...prev, notifications: false }));
              }
            } else if (data) {
              // Converter notificações para o formato padrão
              const typedNotifications = data.map(item => ({
                id: item.id,
                type: item.type || 'system' as NotificationType,
                title: item.title || 'Notificação',
                message: item.message || '',
                timestamp: item.timestamp || new Date().toISOString(),
                read: Boolean(item.read),
                data: item.data || {}
              }));
              
              // Adicionar ao array geral
              allNotifications = [...allNotifications, ...typedNotifications];
            }
          } catch (notifError) {
            console.error('Erro ao processar notificações:', notifError);
          }
        }
        
        // Buscar alertas da tabela 'alerts' se ela existir
        if (tableExists.alerts || Object.keys(tableExists).length === 0) {
          try {
            const { data: alertsData, error: alertsError } = await supabaseRealtime
              .from('alerts')
              .select('*')
              .eq('user_id', user.id)
              .eq('read', false)
              .order('timestamp', { ascending: false });

            if (alertsError) {
              console.error('Erro na consulta à tabela alerts:', alertsError.message);
              
              // Verificar se o erro é devido à tabela não existir
              if (alertsError.message.includes('does not exist')) {
                setTableExists(prev => ({ ...prev, alerts: false }));
              }
            } else if (alertsData) {
              // Converter alertas para o formato de notificação
              const alertNotifications = alertsData.map(alert => ({
                id: alert.id,
                type: 'alert' as NotificationType,
                title: 'Alerta',
                message: alert.message || 'Novo alerta',
                timestamp: alert.timestamp || new Date().toISOString(),
                read: Boolean(alert.read),
                data: alert
              }));
              
              // Adicionar ao array geral
              allNotifications = [...allNotifications, ...alertNotifications];
            }
          } catch (alertError) {
            console.error('Erro ao processar alertas:', alertError);
          }
        }
        
        // Ordenar por timestamp (mais recente primeiro)
        allNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Atualizar o estado
        setNotifications(allNotifications);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    };
    
    fetchNotifications();
    
    // Limpar canais ao desmontar
    return () => {
      channelsRef.current.forEach(channel => {
        if (channel && channel.unsubscribe) {
          channel.unsubscribe();
        }
      });
    };
  }, [user, handleNewAlert, handleNotification, handleVehicleUpdate, tableExists]);

  // Handler para marcar notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      // Atualizar localmente primeiro para UI responsiva
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      // Determinar a tabela com base no tipo de notificação
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;
      
      const table = notification.type === 'alert' ? 'alerts' : 'notifications';
      
      // Atualizar no banco de dados
      await supabaseRealtime
        .from(table)
        .update({ read: true })
        .eq('id', id);
        
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [notifications, user]);

  // Renderizar notificação atual como Toast
  useEffect(() => {
    if (showToast && currentNotification) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showToast, currentNotification]);

  // Navegação para detalhes de notificação
  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    markAsRead(notification.id);
    
    // Navegar com base no tipo
    if (notification.type === 'vehicle' && notification.data?.id) {
      router.push(`/dashboard/vehicles/${notification.data.id}`);
    } else if (notification.type === 'alert') {
      router.push('/dashboard/alerts');
    } else if (notification.type === 'geofence' && notification.data?.id) {
      router.push(`/dashboard/geofences?highlight=${notification.data.id}`);
    }
    
    setShowToast(false);
  };

  return (
    <>
      {/* Toast para notificação mais recente */}
      {showToast && currentNotification && (
        <Toast
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type}
          onClose={() => setShowToast(false)}
          onClick={() => handleNotificationClick(currentNotification)}
        />
      )}
    </>
  );
};

export default RealtimeNotifications;