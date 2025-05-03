import Container from '@/components/ui/Container';
import React from 'react';
import RealTimeUpdater from '@/components/dashboard/RealTimeUpdater';
import dynamic from 'next/dynamic';

// Importar widgets de forma dinâmica para melhorar performance
const VehicleSummaryWidget = dynamic(() => import('@/components/dashboard/widgets/VehicleSummaryWidget'), {
  loading: () => <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const AlertsWidget = dynamic(() => import('@/components/dashboard/widgets/AlertsWidget'), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const MapPreviewWidget = dynamic(() => import('@/components/dashboard/widgets/MapPreviewWidget'), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const ActivityWidget = dynamic(() => import('@/components/dashboard/widgets/ActivityWidget'), {
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

export default function DashboardPage() {
  return (
    <Container>
      {/* Componente invisível que atualiza dados em tempo real */}
      <RealTimeUpdater />
      
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Dashboard</h1>
      
      {/* Grid de widgets responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <VehicleSummaryWidget />
        <AlertsWidget />
        <MapPreviewWidget />
        <ActivityWidget />
      </div>
    </Container>
  );
} 