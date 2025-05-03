"use client";

import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  read: boolean;
  vehicleId?: string;
  vehicleName?: string;
}

// Mock de dados para exemplo
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    message: 'Veículo ultrapassou limite de velocidade (120km/h)',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    vehicleId: 'v1',
    vehicleName: 'Caminhão 137'
  },
  {
    id: '2',
    type: 'warning',
    message: 'Veículo saiu da área permitida',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    vehicleId: 'v2',
    vehicleName: 'Van 203'
  },
  {
    id: '3',
    type: 'info',
    message: 'Manutenção programada agendada',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
    vehicleId: 'v3',
    vehicleName: 'Carro 456'
  },
  {
    id: '4',
    type: 'warning',
    message: 'Bateria do rastreador abaixo de 20%',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: false,
    vehicleId: 'v4',
    vehicleName: 'Moto 789'
  }
];

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  
  // Em uma implementação real, aqui usaríamos uma API para buscar os alertas
  useEffect(() => {
    // Simulando carregamento de dados
    setTimeout(() => {
      setAlerts(mockAlerts);
      setIsLoading(false);
    }, 800);
  }, []);
  
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 1000 / 60);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return `${Math.floor(diffMins / 1440)}d atrás`;
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Em uma implementação real, recarregaríamos os dados da API
    setTimeout(() => {
      setAlerts(mockAlerts);
      setIsLoading(false);
    }, 800);
  };
  
  return (
    <DashboardWidget
      title="Alertas Recentes"
      icon={<Bell />}
      size={widgetSize}
      onSizeChange={setWidgetSize}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      refreshInterval={60000} // Atualiza a cada minuto
    >
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            Nenhum alerta recente encontrado
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`flex items-start p-3 rounded-lg ${
                !alert.read 
                  ? 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-' + 
                    (alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'amber' : 'blue') + 
                    '-500'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {alert.message}
                </p>
                <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                  {alert.vehicleName && (
                    <span className="mr-2 font-medium">{alert.vehicleName}</span>
                  )}
                  <span>{formatTime(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {alerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <a href="/dashboard/alerts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Ver todos os alertas
          </a>
        </div>
      )}
    </DashboardWidget>
  );
} 