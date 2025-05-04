'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// Tipos de notificação
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

// Interface para uma notificação
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  icon?: React.ReactNode;
  hasCloseButton?: boolean;
}

// Interface para o contexto de notificações
interface NotificationContextProps {
  notify: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  position: NotificationPosition;
  setPosition: (position: NotificationPosition) => void;
  duration: number;
  setDuration: (duration: number) => void;
}

// Contexto para gerenciar notificações
const NotificationContext = createContext<NotificationContextProps>({
  notify: () => '',
  dismissNotification: () => {},
  clearAllNotifications: () => {},
  position: 'top-right',
  setPosition: () => {},
  duration: 5000,
  setDuration: () => {},
});

// Hook para usar o contexto de notificações
export const useNotification = () => useContext(NotificationContext);

// Classes CSS para cada tipo de notificação
const notificationVariants: Record<NotificationType, string> = {
  info: 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:border-blue-500 dark:text-blue-100',
  success: 'bg-green-100 border-green-500 text-green-900 dark:bg-green-900 dark:border-green-500 dark:text-green-100',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-500 dark:text-yellow-100',
  error: 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900 dark:border-red-500 dark:text-red-100',
};

// Ícones padrão para cada tipo de notificação
const defaultIcons: Record<NotificationType, React.ReactNode> = {
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// Posicionamento das notificações
const positionClasses: Record<NotificationPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

// Componente provedor
export function AccessibleNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [position, setPosition] = useState<NotificationPosition>('top-right');
  const [duration, setDuration] = useState(5000); // Duração padrão em ms
  const notificationCounter = useRef(0);
  
  // Adicionar uma nova notificação
  const notify = (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${notificationCounter.current++}`;
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration || duration,
      hasCloseButton: notification.hasCloseButton !== undefined ? notification.hasCloseButton : true,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  };
  
  // Remover uma notificação
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notify,
      dismissNotification,
      clearAllNotifications,
      position,
      setPosition,
      duration,
      setDuration,
    }}>
      {children}
      <NotificationContainer
        notifications={notifications}
        dismissNotification={dismissNotification}
        position={position}
      />
    </NotificationContext.Provider>
  );
}

// Componente para exibir as notificações
function NotificationContainer({
  notifications,
  dismissNotification,
  position,
}: {
  notifications: Notification[];
  dismissNotification: (id: string) => void;
  position: NotificationPosition;
}) {
  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 max-w-md ${positionClasses[position]}`}
      role="log"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
          position={position}
        />
      ))}
    </div>
  );
}

// Componente de um item de notificação
function NotificationItem({
  notification,
  onDismiss,
  position,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  position: NotificationPosition;
}) {
  const { id, type, title, message, duration, icon, hasCloseButton } = notification;
  const [isExiting, setIsExiting] = useState(false);
  
  // Temporizador para fechar automaticamente
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300); // Tempo para a animação ocorrer
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);
  
  // Posição de entrada de acordo com a posição configurada
  const getEntranceAnimation = () => {
    if (position.startsWith('top')) {
      return 'translate-y-[-100%]';
    }
    return 'translate-y-[100%]';
  };
  
  return (
    <div
      className={twMerge(
        `border-l-4 rounded-md shadow-md p-4 transition-all duration-300 transform`,
        notificationVariants[type],
        isExiting ? 'opacity-0 ' + getEntranceAnimation() : 'opacity-100',
      )}
      role="alertdialog"
      aria-labelledby={`notification-title-${id}`}
      aria-describedby={`notification-message-${id}`}
    >
      <div className="flex items-start">
        {/* Ícone */}
        <div className="flex-shrink-0">
          {icon || defaultIcons[type]}
        </div>
        
        {/* Conteúdo */}
        <div className="ml-3 flex-1">
          <h3 
            id={`notification-title-${id}`}
            className="text-sm font-medium"
          >
            {title}
          </h3>
          <div 
            id={`notification-message-${id}`}
            className="mt-1 text-sm"
          >
            {message}
          </div>
        </div>
        
        {/* Botão de fechar */}
        {hasCloseButton && (
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(id), 300);
              }}
              aria-label="Fechar notificação"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 