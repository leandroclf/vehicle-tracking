'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/ResizablePanels';
import Header from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { ThemeProvider } from '../ui/ThemeProvider';
import { NotificationProvider } from '../ui/NotificationProvider';
import { AccessibilityPanel } from '../ui/AccessibilityPanel';
import { KeyboardNavigationProvider } from '../ui/KeyboardNavigationProvider';
import { HighContrastProvider } from '../ui/HighContrastProvider';
import { AccessibleNotificationsProvider } from '../ui/AccessibleNotifications';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, sidebarLayout, updateSidebarLayout, isMobile } = useSidebar();

  // Verifica se está em uma rota de autenticação
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  
  // Verifica se está em uma rota do dashboard
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Layout para rotas de autenticação
  if (isAuthRoute) {
    return (
      <main 
        id="main-content" 
        className="min-h-screen bg-gray-50 dark:bg-gray-900"
        tabIndex={-1}
        role="main"
        aria-label="Conteúdo principal"
      >
        {children}
      </main>
    );
  }
  
  // Para rotas de dashboard, simplesmente retorna o children, sem nenhum layout adicional
  // O layout específico do dashboard será fornecido pelo dashboard/layout.tsx
  if (isDashboardRoute) {
    return <>{children}</>;
  }

  // Layout principal para outras páginas
  return (
    <>
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        id="layout-announcer"
      >
        {isSidebarCollapsed ? 'Barra lateral minimizada' : 'Barra lateral expandida'}
      </div>
      
      <SkipToContent />
      <div className={cn("layout-container", isSidebarCollapsed && "sidebar-collapsed")}>
        <Header 
          onToggleSidebar={toggleSidebar} 
          className="layout-header" 
        />
        
        <ResizablePanelGroup 
          direction="horizontal"
          onLayout={updateSidebarLayout}
          className="h-screen pt-16"
        >
          {/* Sidebar panel */}
          <ResizablePanel 
            defaultSize={sidebarLayout[0]} 
            minSize={isSidebarCollapsed ? 4 : 15}
            maxSize={25}
            className={cn(
              "bg-gray-100 dark:bg-gray-800 transition-all duration-200",
              isSidebarCollapsed && "max-w-[70px] min-w-[70px]"
            )}
          >
            <Sidebar />
          </ResizablePanel>
          
          {!isMobile && !isSidebarCollapsed && (
            <ResizableHandle withHandle />
          )}
          
          {/* Conteúdo principal */}
          <ResizablePanel 
            defaultSize={sidebarLayout[1]} 
            minSize={55}
            className="bg-gray-50 dark:bg-gray-900 overflow-auto"
          >
            <main 
              id="main-content" 
              className="h-full p-6 md:p-8" 
              tabIndex={-1}
              role="main"
              aria-label="Conteúdo principal"
            >
              {children}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider>
      <HighContrastProvider>
        <AccessibleNotificationsProvider>
          <NotificationProvider>
            <KeyboardNavigationProvider>
              <SidebarProvider>
                <LayoutContent children={children} />
                <AccessibilityPanel />
              </SidebarProvider>
            </KeyboardNavigationProvider>
          </NotificationProvider>
        </AccessibleNotificationsProvider>
      </HighContrastProvider>
    </ThemeProvider>
  );
}