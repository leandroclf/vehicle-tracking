'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { RealTimeUpdater } from '@/components/dashboard/RealTimeUpdater';

// Importar componentes diretamente para evitar problemas de webpack chunks
import VehicleSummaryWidget from '@/components/dashboard/widgets/VehicleSummaryWidget';
import AlertsWidget from '@/components/dashboard/widgets/AlertsWidget';
import MapPreviewWidget from '@/components/dashboard/widgets/MapPreviewWidget';
import ActivityWidget from '@/components/dashboard/widgets/ActivityWidget';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Container className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="h-full flex flex-col">
      <RealTimeUpdater />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <Breadcrumb />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
          <div className="space-y-6">
            <div className="h-64">
              <VehicleSummaryWidget />
            </div>
            <div className="h-64">
              <AlertsWidget />
            </div>
          </div>

          <div className="h-full">
            <MapPreviewWidget />
          </div>

          <div className="h-full">
            <ActivityWidget />
          </div>
        </div>
      </div>
    </Container>
  );
}