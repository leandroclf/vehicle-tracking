'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useDashboard, DashboardStatistics } from '@/lib/dashboard';
import { Car, Activity, AlertTriangle, Droplet, MapPin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs-fixed';

interface StatisticsWidgetProps {
  type: 'vehicle_count' | 'active_vehicles' | 'total_distance' | 'alerts' | 'fuel';
  title: string;
  size?: 'small' | 'medium' | 'large';
}

export default function StatisticsWidget({ type, title, size = 'medium' }: StatisticsWidgetProps) {
  const { statistics, isLoading, error, fetchStatistics } = useDashboard();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchStatistics(period);
  }, [period]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value as 'today' | 'week' | 'month');
  };

  // Função para renderizar o valor baseado no tipo de estatística
  const renderValue = () => {
    if (isLoading) {
      return <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>;
    }

    if (error || !statistics) {
      return <div className="text-red-500">Erro ao carregar dados</div>;
    }

    switch (type) {
      case 'vehicle_count':
        return (
          <div className="flex items-center">
            <span className="text-3xl font-bold">{statistics.vehicle_count}</span>
            <span className="ml-2 text-sm text-gray-500">veículos</span>
          </div>
        );
      case 'active_vehicles':
        return (
          <div className="flex items-center">
            <span className="text-3xl font-bold">{statistics.active_vehicles}</span>
            <span className="ml-2 text-sm text-gray-500">ativos</span>
          </div>
        );
      case 'total_distance':
        return (
          <div className="flex items-center">
            <span className="text-3xl font-bold">{statistics.total_distance.toLocaleString('pt-BR')}</span>
            <span className="ml-2 text-sm text-gray-500">km</span>
          </div>
        );
      case 'alerts':
        return (
          <div className="flex items-center">
            <span className="text-3xl font-bold">{statistics.alerts_count}</span>
            <span className="ml-2 text-sm text-gray-500">alertas</span>
          </div>
        );
      case 'fuel':
        return (
          <div className="flex items-center">
            <span className="text-3xl font-bold">{statistics.fuel_consumption.toLocaleString('pt-BR')}</span>
            <span className="ml-2 text-sm text-gray-500">litros</span>
          </div>
        );
      default:
        return <div>Dados não disponíveis</div>;
    }
  };

  // Função para renderizar o ícone baseado no tipo de estatística
  const renderIcon = () => {
    switch (type) {
      case 'vehicle_count':
        return <Car className="h-8 w-8 text-blue-500" />;
      case 'active_vehicles':
        return <Car className="h-8 w-8 text-green-500" />;
      case 'total_distance':
        return <MapPin className="h-8 w-8 text-purple-500" />;
      case 'alerts':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'fuel':
        return <Droplet className="h-8 w-8 text-blue-400" />;
      default:
        return <Activity className="h-8 w-8 text-gray-500" />;
    }
  };

  // Classes baseadas no tamanho do widget
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
  }[size];

  return (
    <Card className={`${sizeClasses} p-4 h-full`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {renderIcon()}
        </div>
        
        <div className="flex-grow flex flex-col justify-center">
          {renderValue()}
        </div>
        
        <div className="mt-4">
          <Tabs defaultValue="today" value={period} onValueChange={handlePeriodChange}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="today">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </Card>
  );
}