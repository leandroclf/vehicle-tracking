'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { LazyLoading } from '@/lib/lazy';
import DashboardLoading from '@/components/ui/DashboardLoading';
import PrefetchLinks from '@/components/dashboard/PrefetchLinks';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { VehicleProvider } from '@/lib/vehicles';
import PanelLayout from '@/components/dashboard/PanelLayout';

const Sidebar = React.lazy(() => import('@/components/layout/Sidebar'));
const Header = React.lazy(() => import('@/components/layout/Header'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Detectar tamanho da tela
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Manipulador para alternar a barra lateral
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <VehicleProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <SkipToContent />
        <PrefetchLinks />
        
        {!isMobile ? (
          // Layout desktop com painéis redimensionáveis
          <PanelLayout 
            sidebar={
              <LazyLoading fallback={<div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />}>
                <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
              </LazyLoading>
            }
            content={
              <div className="flex flex-col h-full">
                <LazyLoading fallback={<div className="h-16 bg-white dark:bg-gray-800 shadow animate-pulse" />}>
                  <Header onToggleSidebar={toggleSidebar} />
                </LazyLoading>
                <main id="main-content" className="flex-1 overflow-auto p-4" tabIndex={-1}>
                  <Suspense fallback={<DashboardLoading />}>
                    {children}
                  </Suspense>
                </main>
              </div>
            }
            sidebarCollapsed={sidebarCollapsed}
            sidebarWidth={20}
            contentWidth={80}
          />
        ) : (
          // Layout para dispositivos móveis
          <div className="flex flex-col flex-1 h-full">
            <LazyLoading fallback={<div className="h-16 bg-white dark:bg-gray-800 shadow animate-pulse" />}>
              <Header onToggleSidebar={toggleSidebar} />
            </LazyLoading>
            <main id="main-content" className="flex-1 overflow-auto p-4" tabIndex={-1}>
              <Suspense fallback={<DashboardLoading />}>
                {children}
              </Suspense>
            </main>
            
            {/* Sidebar móvel em modo offscreen/oculto */}
            <div className="sr-only">
              <Sidebar collapsed={true} onToggle={toggleSidebar} />
            </div>
          </div>
        )}
      </div>
    </VehicleProvider>
  );
}