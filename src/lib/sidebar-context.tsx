'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFromStorage, saveToStorage } from './utils';

// Definição da interface do contexto
interface SidebarContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  sidebarLayout: number[];
  updateSidebarLayout: (sizes: number[]) => void;
  isMobile: boolean;
}

// Criação do contexto com valores padrão
const SidebarContext = createContext<SidebarContextType>({
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: () => {},
  sidebarLayout: [15, 85],
  updateSidebarLayout: () => {},
  isMobile: false
});

// Hook para acessar o contexto
export const useSidebar = () => useContext(SidebarContext);

// Provedor do contexto
interface SidebarProviderProps {
  children: ReactNode;
}

export const SIDEBAR_LAYOUT_KEY = 'sidebar-layout-sizing';
export const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarLayout, setSidebarLayout] = useState<number[]>([15, 85]);
  const [isMobile, setIsMobile] = useState(false);

  // Verificar o tamanho da tela
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Em dispositivos móveis, o sidebar começa colapsado
      if (isMobileView) {
        setIsSidebarCollapsed(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Carregar estado do sidebar do localStorage
  useEffect(() => {
    const savedLayout = getFromStorage<number[]>(SIDEBAR_LAYOUT_KEY, [15, 85]);
    if (savedLayout) {
      setSidebarLayout(savedLayout);
    }
    
    const savedCollapsedState = getFromStorage<boolean>(SIDEBAR_COLLAPSED_KEY, false);
    if (!isMobile) {
      setIsSidebarCollapsed(savedCollapsedState);
    }
  }, [isMobile]);

  // Alternar o estado do sidebar
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    saveToStorage(SIDEBAR_COLLAPSED_KEY, newState);
  };

  // Atualizar layout do sidebar
  const updateSidebarLayout = (sizes: number[]) => {
    if (sizes[0] < 10) {
      setIsSidebarCollapsed(true);
      saveToStorage(SIDEBAR_COLLAPSED_KEY, true);
    } else {
      setIsSidebarCollapsed(false);
      saveToStorage(SIDEBAR_COLLAPSED_KEY, false);
      setSidebarLayout(sizes);
      saveToStorage(SIDEBAR_LAYOUT_KEY, sizes);
    }
  };

  return (
    <SidebarContext.Provider value={{
      isSidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed: (collapsed) => {
        setIsSidebarCollapsed(collapsed);
        saveToStorage(SIDEBAR_COLLAPSED_KEY, collapsed);
      },
      sidebarLayout,
      updateSidebarLayout,
      isMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
} 