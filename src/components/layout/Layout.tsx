'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/ResizablePanels';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { getFromStorage, saveToStorage } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [defaultLayout, setDefaultLayout] = useState([15, 85]);
  const [isMobile, setIsMobile] = useState(false);

  // Verificar o tamanho da tela e ajustar layout
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Em dispositivos móveis, o sidebar começa colapsado
      if (isMobileView) {
        setIsSidebarCollapsed(true);
      }
    };
    
    // Verificar no carregamento e quando a janela for redimensionada
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Carregar layout salvo
  useEffect(() => {
    const savedLayout = getFromStorage<number[]>('layout-sizing', [15, 85]);
    if (savedLayout) {
      setDefaultLayout(savedLayout);
    }
  }, []);

  // Alternar o estado do sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Salvar o layout quando alterado
  const handleLayoutChange = (sizes: number[]) => {
    if (sizes[0] < 10) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
      saveToStorage('layout-sizing', sizes);
    }
  };

  // Verifica se está em uma rota de autenticação
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  // Layout para rotas de autenticação
  if (isAuthRoute) {
    return (
      <>
        <SkipToContent />
        <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </>
    );
  }

  // Layout principal para dashboard
  return (
    <>
      <SkipToContent />
      <div className={cn("layout-container", isSidebarCollapsed && "sidebar-collapsed")}>
        <Header onToggleSidebar={toggleSidebar} className="layout-header" />
        
        <ResizablePanelGroup 
          direction="horizontal"
          onLayout={handleLayoutChange}
          className="h-screen pt-16"
        >
          {/* Sidebar panel */}
          <ResizablePanel 
            defaultSize={defaultLayout[0]} 
            minSize={isSidebarCollapsed ? 4 : 15}
            maxSize={25}
            className={cn(
              "bg-gray-100 dark:bg-gray-800 transition-all duration-200",
              isSidebarCollapsed && "max-w-[70px] min-w-[70px]"
            )}
          >
            <Sidebar 
              collapsed={isSidebarCollapsed} 
              onToggle={toggleSidebar} 
            />
          </ResizablePanel>
          
          {!isMobile && !isSidebarCollapsed && (
            <ResizableHandle withHandle />
          )}
          
          {/* Conteúdo principal */}
          <ResizablePanel 
            defaultSize={defaultLayout[1]} 
            minSize={55}
            className="bg-gray-50 dark:bg-gray-900 overflow-auto"
          >
            <main id="main-content" className="h-full p-6 md:p-8">
              {children}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
} 