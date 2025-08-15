"use client";

import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { ScrollArea } from '@/components/ui/ScrollArea';

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
  },
  {
    id: '5',
    type: 'critical',
    message: 'Veículo com movimento suspeito detectado',
    timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    read: false,
    vehicleId: 'v5',
    vehicleName: 'Caminhão 456'
  },
  {
    id: '6',
    type: 'info',
    message: 'Veículo entrou em área designada',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    read: true,
    vehicleId: 'v6',
    vehicleName: 'Van 501'
  }
];

export default function AlertsWidget() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  
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

  const handleAlertClick = (alertId: string) => {
    setSelectedAlert(selectedAlert === alertId ? null : alertId);
    
    // Marcar como lido
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };
  
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const alertCounts = {
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
    all: alerts.length
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
      className="flex flex-col"
    >
      {/* Filtros de Alertas */}
      <div className="flex mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setFilter('all')}
          className={`mr-2 px-3 py-1 text-xs rounded-full ${
            filter === 'all'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todos ({alertCounts.all})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`mr-2 px-3 py-1 text-xs rounded-full ${
            filter === 'critical'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          Críticos ({alertCounts.critical})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`mr-2 px-3 py-1 text-xs rounded-full ${
            filter === 'warning'
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
        >
          Avisos ({alertCounts.warning})
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`mr-2 px-3 py-1 text-xs rounded-full ${
            filter === 'info'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          Informações ({alertCounts.info})
        </button>
      </div>

      {/* Lista de Alertas */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {filteredAlerts.length === 0 ? (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400">
              Nenhum alerta {filter !== 'all' ? `do tipo ${filter}` : ''} encontrado
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`
                  rounded-lg transition-all duration-200 cursor-pointer
                  ${!alert.read 
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-' + 
                      (alert.type === 'critical' ? 'red' : alert.type === 'warning' ? 'amber' : 'blue') + 
                      '-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }
                  ${selectedAlert === alert.id ? 'ring-2 ring-offset-1 ring-blue-400 dark:ring-blue-600' : ''}
                `}
                onClick={() => handleAlertClick(alert.id)}
              >
                <div className="flex items-start p-3">
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
                  <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${selectedAlert === alert.id ? 'rotate-90' : ''}`} />
                </div>
                
                {/* Detalhes expandidos */}
                {selectedAlert === alert.id && (
                  <div className="px-3 pb-3 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
                    <div className="pt-2">
                      <p className="mb-1"><strong>ID do Veículo:</strong> {alert.vehicleId || 'N/A'}</p>
                      <p className="mb-1"><strong>Horário:</strong> {new Date(alert.timestamp).toLocaleString()}</p>
                      <p><strong>Status:</strong> {alert.read ? 'Lido' : 'Não lido'}</p>
                      {alert.type === 'critical' && (
                        <div className="mt-2 flex justify-end">
                          <button className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                            Ação Imediata
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {filteredAlerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <a href="/dashboard/alerts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Ver todos os alertas
          </a>
        </div>
      )}
    </DashboardWidget>
  );
}