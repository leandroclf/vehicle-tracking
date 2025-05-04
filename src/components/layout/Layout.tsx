'use client';

import React, { useState, useEffect } from 'react';
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
import BottomNav from '@/components/navigation/BottomNav';
import { X, ArrowUp } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, sidebarLayout, updateSidebarLayout, isMobile } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Efeito para detectar quando mostrar o botão de voltar ao topo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Configuração de handlers para gestos de swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMobile) return;
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    },
    onSwipedRight: () => {
      if (!isMobile) return;
      if (!mobileMenuOpen) {
        setMobileMenuOpen(true);
      }
    },
    onSwipedUp: () => {
      if (!isMobile) return;
      // Pode ser usado para disparar ações específicas em swipe para cima
    },
    onSwipedDown: () => {
      if (!isMobile) return;
      // Pode ser usado para disparar ações específicas em swipe para baixo
    },
    trackMouse: false,
    // Configura a sensibilidade do swipe
    delta: 10,
    trackTouch: true
  });

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
  
  // Para rotas de dashboard, retorna o conteúdo com navegação específica
  if (isDashboardRoute) {
    return (
      <div {...swipeHandlers} className="touch-manipulation">
        {children}
        
        {/* Navegação inferior mobile */}
        {isMobile && <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />}
        
        {/* Botão de voltar ao topo */}
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg"
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    );
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
      <div 
        {...swipeHandlers} 
        className={cn("layout-container touch-manipulation", isSidebarCollapsed && "sidebar-collapsed")}
      >
        <Header 
          onToggleSidebar={toggleSidebar} 
          className="layout-header" 
        />
        
        <ResizablePanelGroup 
          direction="horizontal"
          onLayout={updateSidebarLayout}
          className="min-h-screen pt-16"
        >
          {/* Sidebar panel - escondido em dispositivos móveis */}
          <ResizablePanel 
            defaultSize={sidebarLayout[0]} 
            minSize={isSidebarCollapsed ? 4 : 15}
            maxSize={25}
            className={cn(
              "bg-gray-100 dark:bg-gray-800 transition-all duration-200 hidden sm:block",
              isSidebarCollapsed && "max-w-[70px] min-w-[70px]"
            )}
          >
            <Sidebar />
          </ResizablePanel>
          
          {!isMobile && !isSidebarCollapsed && (
            <ResizableHandle withHandle className="hidden sm:block" />
          )}
          
          {/* Conteúdo principal */}
          <ResizablePanel 
            defaultSize={sidebarLayout[1]} 
            minSize={55}
            className="bg-gray-50 dark:bg-gray-900 overflow-auto"
          >
            <main 
              id="main-content" 
              className="min-h-[calc(100vh-4rem)] p-3 sm:p-6 md:p-8" 
              tabIndex={-1}
              role="main"
              aria-label="Conteúdo principal"
            >
              {children}
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
        
        {/* Menu mobile fullscreen com animação de slide */}
        {isMobile && mobileMenuOpen && (
          <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 animate-fade-in">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Menu</h2>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 rounded-full w-12 h-12 flex items-center justify-center"
                  aria-label="Fechar menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <Sidebar className="w-full" />
              </div>
            </div>
          </div>
        )}
        
        {/* Navegação inferior mobile e botão de voltar ao topo */}
        {isMobile && (
          <>
            <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
            
            {showScrollToTop && (
              <button
                onClick={scrollToTop}
                className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg"
                aria-label="Voltar ao topo"
              >
                <ArrowUp size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function Layout({ children }: LayoutProps) {
  // Detectar se o dispositivo é móvel baseado na largura da tela
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    
    // Verificar ao carregar
    checkMobile();
    
    // Verificar ao redimensionar
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <ThemeProvider>
      <HighContrastProvider>
        <AccessibleNotificationsProvider>
          <NotificationProvider>
            <KeyboardNavigationProvider>
              <SidebarProvider initialMobile={isMobileDevice}>
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