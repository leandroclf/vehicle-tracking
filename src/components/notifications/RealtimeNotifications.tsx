import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Toast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const RealtimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Inscrever-se no canal de notificações específico do usuário
    const userChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications((prev) => [newNotification, ...prev]);
        setCurrentNotification(newNotification);
        setShowToast(true);
      })
      .subscribe();

    // Inscrever-se no canal de alertas
    const alertsChannel = supabase
      .channel(`user-alerts-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
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
        setNotifications((prev) => [notification, ...prev]);
        setCurrentNotification(notification);
        setShowToast(true);
      })
      .subscribe();

    // Inscrever-se no canal de atualizações de veículos
    const vehiclesChannel = supabase
      .channel(`user-vehicles-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'vehicles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
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
        setNotifications((prev) => [notification, ...prev]);
        setCurrentNotification(notification);
        setShowToast(true);
      })
      .subscribe();

    // Carregar notificações não lidas ao iniciar
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        if (data) setNotifications(data as Notification[]);
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
      }
    };

    fetchNotifications();

    // Limpar inscrições ao desmontar o componente
    return () => {
      supabase.channel(userChannel.subscribe().id).unsubscribe();
      supabase.channel(alertsChannel.subscribe().id).unsubscribe();
      supabase.channel(vehiclesChannel.subscribe().id).unsubscribe();
    };
  }, [user]);

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      // Verificar se é uma notificação do tipo alerta (que está na tabela alerts)
      const isAlert = notifications.find(n => n.id === notificationId && n.type === 'alert');
      
      if (isAlert) {
        await supabase
          .from('alerts')
          .update({ read: true })
          .eq('id', notificationId);
      } else {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Navegar para a página relacionada à notificação
  const handleNotificationClick = (notification: Notification) => {
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
  };

  return (
    <>
      {showToast && currentNotification && (
        <Toast
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type === 'alert' ? 'error' : 'info'}
          onClose={() => setShowToast(false)}
          onClick={() => handleNotificationClick(currentNotification)}
          autoClose={5000}
        />
      )}
    </>
  );
};

export default RealtimeNotifications;