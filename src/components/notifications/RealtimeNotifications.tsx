'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
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

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

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
        const channel = supabase
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
        
        // Verificar se o cliente Supabase foi inicializado corretamente
        if (!supabase) {
          console.error('Cliente Supabase não inicializado corretamente');
          return;
        }
        
        // Array para armazenar todas as notificações
        let allNotifications: Notification[] = [];
        
        // Buscar notificações da tabela 'notifications' se ela existir
        if (tableExists.notifications || Object.keys(tableExists).length === 0) {
          try {
            const { data, error } = await supabase
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
            const { data: alertsData, error: alertsError } = await supabase
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
                message: alert.message || 'Novo alerta recebido',
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
        
        // Ordenar todas as notificações por timestamp
        allNotifications.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Atualizar estado
        setNotifications(allNotifications);
      } catch (error) {
        // Melhorar o log de erro com mais informações para depuração
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Erro ao buscar notificações:', errorMessage, errorStack, {
          userId: user?.id,
          supabaseInitialized: !!supabase,
          tablesExist: tableExists
        });
      }
    };

    fetchNotifications();

    // Limpar inscrições ao desmontar o componente
    return () => {
      channelsRef.current.forEach(channel => {
        if (channel && channel.unsubscribe) {
          channel.unsubscribe();
        }
      });
      channelsRef.current = [];
    };
  }, [user, handleNewNotification, handleNewAlert, handleVehicleUpdate, handleNotification, tableExists]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      if (!userIdRef.current) return;
      
      // Verificar se é uma notificação do tipo alerta (que está na tabela alerts)
      const isAlert = notifications.find(n => n.id === notificationId && n.type === 'alert');
      
      if (isAlert && tableExists.alerts) {
        await supabase
          .from('alerts')
          .update({ read: true })
          .eq('id', notificationId);
      } else if (tableExists.notifications) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }

      // Atualizar estado local independentemente do status do banco
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      // Melhorar o log de erro com mais informações
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao marcar notificação como lida:', errorMessage, {
        notificationId,
        userId: userIdRef.current,
        tablesExist: tableExists
      });
    }
  }, [notifications, tableExists]);

  // Navegar para a página relacionada à notificação
  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    setShowToast(false);

    // Navegar para a página apropriada com base no tipo de notificação
    switch (notification.type) {
      case 'alert':
        router.push('/dashboard/alerts');
        break;
      case 'vehicle':
        if (notification.data?.id) {
          router.push(`/dashboard/vehicles/${notification.data.id}`);
        } else {
          router.push('/dashboard/vehicles');
        }
        break;
      case 'geofence':
        router.push('/dashboard/geofences');
        break;
      default:
        // Para notificações do sistema ou outros tipos
        router.push('/dashboard');
    }
  }, [markAsRead, router]);

  const handleCloseToast = useCallback(() => {
    setShowToast(false);
  }, []);

  return (
    <>
      {showToast && currentNotification && (
        <Toast
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type === 'alert' ? 'error' : 'info'}
          onClose={handleCloseToast}
          onClick={() => handleNotificationClick(currentNotification)}
          duration={5000}
        />
      )}
    </>
  );
};

export default RealtimeNotifications;