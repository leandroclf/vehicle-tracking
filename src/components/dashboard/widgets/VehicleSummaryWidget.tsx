"use client";

import React, { useState, useEffect } from 'react';
import { Truck, TrendingUp, TrendingDown } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useVehicles } from '@/lib/vehicles-client';

interface VehicleStats {
  total: number;
  active: number;
  moving: number;
  stopped: number;
  inactive: number;
}

export default function VehicleSummaryWidget() {
  const [stats, setStats] = useState<VehicleStats>({
    total: 0,
    active: 0,
    moving: 0,
    stopped: 0,
    inactive: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  
  const { vehicles, refreshVehicles } = useVehicles();
  
  useEffect(() => {
    if (vehicles) {
      const activeVehicles = vehicles.filter(v => v.status === 'online');
      const movingVehicles = vehicles.filter(v => v.status === 'online' && v.isMoving);
      const stoppedVehicles = vehicles.filter(v => v.status === 'online' && !v.isMoving);
      const inactiveVehicles = vehicles.filter(v => v.status === 'offline');
      
      setStats({
        total: vehicles.length,
        active: activeVehicles.length,
        moving: movingVehicles.length,
        stopped: stoppedVehicles.length,
        inactive: inactiveVehicles.length
      });
      
      setIsLoading(false);
    }
  }, [vehicles]);
  
  const handleRefresh = () => {
    setIsLoading(true);
    refreshVehicles().finally(() => {
      setIsLoading(false);
    });
  };
  
  return (
    <DashboardWidget
      title="Resumo de Veículos"
      icon={<Truck />}
      size={widgetSize}
      onSizeChange={setWidgetSize}
      isLoading={isLoading}
      onRefresh={handleRefresh}
      refreshInterval={30000} // Atualiza a cada 30 segundos
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total</div>
          <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-green-600 dark:text-green-400 text-sm font-medium">Ativos</div>
          <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.active}</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Em movimento</span>
          </div>
          <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.moving}</div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
            <TrendingDown className="w-3 h-3 mr-1" />
            <span>Parados</span>
          </div>
          <div className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{stats.stopped}</div>
        </div>
      </div>
      
      {widgetSize === 'medium' || widgetSize === 'large' || widgetSize === 'full' ? (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Taxa de atividade: <span className="font-medium text-gray-900 dark:text-white">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: <span className="font-medium text-gray-900 dark:text-white">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardWidget>
  );
}