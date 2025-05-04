'use client';

import React, { Suspense, useRef } from 'react';
import { LazyLoading } from '@/lib/lazy';
import DashboardLoading from '@/components/ui/DashboardLoading';
import PrefetchLinks from '@/components/dashboard/PrefetchLinks';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { VehicleProvider } from '@/lib/vehicles';
import PanelLayout from '@/components/dashboard/PanelLayout';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';
import { useSidebar } from '@/lib/sidebar-context';

const Sidebar = React.lazy(() => import('@/components/layout/Sidebar'));
const Header = React.lazy(() => import('@/components/layout/Header'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isSidebarCollapsed, toggleSidebar } = useSidebar();
  const mainLayoutRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden" ref={mainLayoutRef}>
      <SkipToContent />
      <PrefetchLinks />
      
      {/* Header único */}
      <LazyLoading fallback={<div className="h-16 bg-white dark:bg-gray-800 shadow animate-pulse" />}>
        <Header onToggleSidebar={toggleSidebar} />
      </LazyLoading>
      
      {/* Conteúdo principal com sidebar */}
      <div className="flex flex-1 pt-16 h-[calc(100vh-4rem)]">
        <PanelLayout 
          sidebar={
            <LazyLoading fallback={<div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />}>
              <Sidebar className="main-sidebar" />
            </LazyLoading>
          }
          content={
            <main id="main-content" className="flex-1 overflow-auto p-4" tabIndex={-1}>
              <Suspense fallback={<DashboardLoading />}>
                {children}
              </Suspense>
            </main>
          }
          sidebarCollapsed={isSidebarCollapsed}
        />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <VehicleProvider>
      <AlertProvider>
        <ReportProvider>
          <DashboardLayoutContent children={children} />
        </ReportProvider>
      </AlertProvider>
    </VehicleProvider>
  );
}