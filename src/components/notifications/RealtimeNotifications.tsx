'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
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

export const RealtimeNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const notificationsTableExistsRef = useRef(false);
  
  // Verificar se a tabela de notificações existe
  useEffect(() => {
    // Assumir que a tabela existe para evitar erros de conexão
    notificationsTableExistsRef.current = true;
    console.log('Componente de notificações inicializado');
  }, []);
  
  // Configurar WebSocket para notificações em tempo real
  useEffect(() => {
    if (!user || !notificationsTableExistsRef.current) return;
    
    console.log('Configurando WebSocket para notificações do usuário:', user.id);
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/notifications?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket conectado para notificações');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          console.log('Nova notificação recebida:', data.payload);
          const newNotification = data.payload as Notification;
          
          // Adicionar à lista de notificações
          setNotifications(prev => [newNotification, ...prev]);
          
          // Mostrar toast para a notificação
          setCurrentNotification(newNotification);
          setShowToast(true);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado');
    };
    
    // Limpar WebSocket ao desmontar
    return () => {
      ws.close();
    };
  }, [user]);
  
  // Carregar notificações iniciais
  useEffect(() => {
    if (!user || !notificationsTableExistsRef.current) return;
    
    const loadNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}&read=false&limit=5`);
        
        if (!response.ok) {
          console.error('Erro ao carregar notificações:', response.statusText);
          return;
        }
        
        const data = (await response.json()) as Notification[];
        
        if (Array.isArray(data) && data.length > 0) {
          setNotifications(data);
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
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, read: true }),
      });
      
      if (!response.ok) {
        console.error('Erro ao marcar notificação como lida:', response.statusText);
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
  
  // Exibir toast quando uma nova notificação chega
  useEffect(() => {
    if (!showToast || !currentNotification) return;

    const notification = currentNotification;
    const show = notification.type === 'alert' ? toast.error : toast.info;

    show(notification.title, {
      description: notification.message,
      duration: 5000,
      onDismiss: () => setShowToast(false),
      action: {
        label: 'Ver',
        onClick: () => handleNotificationClick(notification),
      },
    });
    setShowToast(false);
  }, [showToast, currentNotification, handleNotificationClick]);

  // As notificações carregadas ficam disponíveis para o sino de notificações
  void notifications;

  return null;
};

export default RealtimeNotifications;