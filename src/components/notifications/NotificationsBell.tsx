import React, { useState } from 'react';
import { useNotifications } from './NotificationsProvider';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface NotificationsBellProps {
  className?: string;
}

const NotificationsBell: React.FC<NotificationsBellProps> = ({ className }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Função para formatar a data relativa (ex: "há 5 minutos")
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
    } catch (error) {
      return 'Data desconhecida';
    }
  };

  // Função para lidar com o clique em uma notificação
  const handleNotificationClick = (id: string, type: string, data?: Record<string, any>) => {
    markAsRead(id);
    setIsOpen(false);

    // Navegar para a página apropriada com base no tipo de notificação
    switch (type) {
      case 'alert':
        router.push('/dashboard/alerts');
        break;
      case 'vehicle':
        if (data?.id) {
          router.push(`/dashboard/vehicles/${data.id}`);
        } else {
          router.push('/dashboard/vehicles');
        }
        break;
      case 'geofence':
        router.push('/dashboard/geofences');
        break;
      default:
        router.push('/dashboard');
    }
  };

  // Obter ícone com base no tipo de notificação
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'vehicle':
        return '🚗';
      case 'geofence':
        return '🌍';
      case 'system':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  return (
    <div className={`relative ${className || ''}`}>
      <button
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <Badge
            content={unreadCount > 99 ? '99+' : unreadCount.toString()}
            color="danger"
            className="absolute -top-1 -right-1"
          />
        )}
      </button>

      {isOpen && (
        <Dropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          className="w-80 max-h-96 overflow-y-auto"
          position="right"
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              Notificações ({unreadCount} não lidas)
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  onClick={() => handleNotificationClick(notification.id, notification.type, notification.data)}
                >
                  <div className="flex items-start">
                    <div className="mr-3 text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatRelativeTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dropdown>
      )}
    </div>
  );
};

export default NotificationsBell;