"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Truck, Clock3, Shield, Settings } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';

interface ActivityItem {
  id: string;
  type: 'login' | 'vehicle' | 'system' | 'command' | 'setting';
  message: string;
  timestamp: string;
  user?: string;
  vehicleId?: string;
  vehicleName?: string;
}

// Mock de dados para exemplo
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'login',
    message: 'Login realizado com sucesso',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user: 'admin@exemplo.com'
  },
  {
    id: '2',
    type: 'vehicle',
    message: 'Veículo ligado',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    vehicleId: 'v1',
    vehicleName: 'Caminhão 137',
    user: 'operador@exemplo.com'
  },
  {
    id: '3',
    type: 'command',
    message: 'Comando de bloqueio enviado',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    vehicleId: 'v2',
    vehicleName: 'Van 203',
    user: 'supervisor@exemplo.com'
  },
  {
    id: '4',
    type: 'setting',
    message: 'Configurações de alerta atualizadas',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: 'admin@exemplo.com'
  },
  {
    id: '5',
    type: 'system',
    message: 'Manutenção do sistema agendada',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    user: 'system'
  }
];

export default function ActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  
  // Em uma implementação real, aqui usaríamos uma API para buscar as atividades
  useEffect(() => {
    // Simulando carregamento de dados
    setTimeout(() => {
      setActivities(mockActivities);
      setIsLoading(false);
    }, 800);
  }, []);
  
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'vehicle':
        return <Truck className="w-4 h-4 text-green-500" />;
      case 'system':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'command':
        return <Activity className="w-4 h-4 text-amber-500" />;
      case 'setting':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock3 className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Em uma implementação real, recarregaríamos os dados da API
    setTimeout(() => {
      setActivities(mockActivities);
      setIsLoading(false);
    }, 800);
  };
  
  // Agrupar atividades por data
  const groupedActivities = activities.reduce<Record<string, ActivityItem[]>>((groups, activity) => {
    const date = new Date(activity.timestamp).toLocaleDateString('pt-BR');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});
  
  return (
    <DashboardWidget
      title="Atividades Recentes"
      icon={<Activity />}
      size={widgetSize}
      onSizeChange={setWidgetSize}
      isLoading={isLoading}
      onRefresh={handleRefresh}
    >
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            Nenhuma atividade recente encontrada
          </div>
        ) : (
          Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
                </h3>
              </div>
              <div className="border-l border-gray-200 dark:border-gray-700 pl-3 ml-2 space-y-3">
                {items.map(activity => (
                  <div key={activity.id} className="flex text-sm">
                    <div className="flex-shrink-0 mt-0.5 mr-3">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {activity.message}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400">
                        {activity.vehicleName && (
                          <span className="mr-2">{activity.vehicleName}</span>
                        )}
                        {activity.user && activity.user !== 'system' && (
                          <span className="mr-2">por {activity.user.split('@')[0]}</span>
                        )}
                        <span>{formatTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <a href="#" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Ver histórico completo
          </a>
        </div>
      )}
    </DashboardWidget>
  );
} 