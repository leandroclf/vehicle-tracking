'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { LazyLoading } from '@/lib/lazy';
import DashboardLoading from '@/components/ui/DashboardLoading';
import PrefetchLinks from '@/components/dashboard/PrefetchLinks';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { VehicleProvider } from '@/lib/vehicles';
import PanelLayout from '@/components/dashboard/PanelLayout';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';

const Sidebar = React.lazy(() => import('@/components/layout/Sidebar'));
const Header = React.lazy(() => import('@/components/layout/Header'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Provedor global para registro do layout principal
const MainLayoutContext = React.createContext<{ mainSidebarRendered: boolean }>({
  mainSidebarRendered: false
});

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const mainLayoutRef = useRef<HTMLDivElement>(null);

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

  // Remover sidebars duplicadas
  useEffect(() => {
    // Função para processar a DOM após renderização
    const cleanupDuplicates = () => {
      if (!mainLayoutRef.current) return;
      
      // Encontrar todos os containers de sidebar
      const sidebarContainers = document.querySelectorAll('aside');
      
      // Se houver mais de um, manter apenas o primeiro e remover os outros
      if (sidebarContainers.length > 1) {
        // O primeiro é o sidebar principal
        const mainSidebar = sidebarContainers[0];
        
        // Adicionar classe para identificação
        mainSidebar.classList.add('main-sidebar');
        
        // Todos os outros sidebars devem ser escondidos
        for (let i = 1; i < sidebarContainers.length; i++) {
          sidebarContainers[i].style.display = 'none';
        }
      }
      
      // Solução para menu superior duplicado
      const headers = document.querySelectorAll('header');
      if (headers.length > 1) {
        const mainHeader = headers[0];
        mainHeader.classList.add('main-header');
        
        for (let i = 1; i < headers.length; i++) {
          headers[i].style.display = 'none';
        }
      }
    };

    // Executar limpeza após renderização inicial
    const timer = setTimeout(cleanupDuplicates, 100);
    
    // Observar mudanças na DOM para aplicar a limpeza quando necessário
    const observer = new MutationObserver(cleanupDuplicates);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <VehicleProvider>
      <AlertProvider>
        <ReportProvider>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden" ref={mainLayoutRef}>
            <SkipToContent />
            <PrefetchLinks />
            
            {!isMobile ? (
              // Layout desktop com painéis redimensionáveis
              <PanelLayout 
                sidebar={
                  <LazyLoading fallback={<div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />}>
                    <Sidebar className="main-sidebar" collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
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
                  <Sidebar className="mobile-sidebar" collapsed={true} onToggle={toggleSidebar} />
                </div>
              </div>
            )}
          </div>
        </ReportProvider>
      </AlertProvider>
    </VehicleProvider>
  );
}