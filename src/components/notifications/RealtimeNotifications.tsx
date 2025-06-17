'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabaseRealtime } from '@/lib/supabase';
import { Toast } from '@/components/ui/toast';
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
  const router = useRouter();
  const { user } = useAuth();
  const notificationsTableExistsRef = useRef(false);
  
  // Verificar se a tabela de notificações existe
  useEffect(() => {
    const checkNotificationsTable = async () => {
      try {
        const exists = await checkTableExists('notifications');
        notificationsTableExistsRef.current = exists;
        console.log('Tabela de notificações existe:', exists);
      } catch (error) {
        console.error('Erro ao verificar tabela de notificações:', error);
      }
    };
    
    checkNotificationsTable();
  }, []);
  
  // Configurar subscription para notificações em tempo real
  useEffect(() => {
    if (!user || !notificationsTableExistsRef.current) return;
    
    console.log('Configurando subscription para notificações do usuário:', user.id);
    
    // Inscrever-se em atualizações da tabela de notificações
    const subscription = supabaseRealtime
      .channel('notifications-channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Nova notificação recebida:', payload);
          const newNotification = payload.new as Notification;
          
          // Adicionar à lista de notificações
          setNotifications(prev => [newNotification, ...prev]);
          
          // Mostrar toast para a notificação
          setCurrentNotification(newNotification);
          setShowToast(true);
        }
      )
      .subscribe();
    
    // Limpar subscription ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  
  // Carregar notificações iniciais
  useEffect(() => {
    if (!user || !notificationsTableExistsRef.current) return;
    
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabaseRealtime
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('timestamp', { ascending: false })
          .limit(5);
        
        if (error) {
          console.error('Erro ao carregar notificações:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setNotifications(data as Notification[]);
        }
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    };
    
    loadNotifications();
  }, [user]);
  
  // Função para marcar notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    if (!notificationsTableExistsRef.current) return;
    
    try {
      const { error } = await supabaseRealtime
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return;
      }
      
      // Atualizar lista local
      setNotifications(prev => prev.filter(n => n.id !== id));
      
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);
  
  // Função para navegar para a página relacionada à notificação
  const handleNotificationClick = useCallback((notification: Notification) => {
    setShowToast(false);
    markAsRead(notification.id);
    
    // Verificar se há dados de navegação
    if (notification.data?.navigationPath) {
      router.push(notification.data.navigationPath);
    }
  }, [router, markAsRead]);
  
  // Renderizar toast de notificação
  return (
    <>
      {showToast && currentNotification && (
        <Toast
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type === 'alert' ? 'error' : 
                currentNotification.type === 'system' ? 'info' : 'info'}
          onClose={() => setShowToast(false)}
          onClick={() => handleNotificationClick(currentNotification)}
          duration={5000}
        />
      )}
    </>
  );
};

export default RealtimeNotifications;