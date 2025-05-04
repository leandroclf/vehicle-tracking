'use client';

import React, { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import RealTimeUpdater from '@/components/dashboard/RealTimeUpdater';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import dynamic from 'next/dynamic';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/ResizablePanels';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { Settings } from 'lucide-react';

// Importar widgets de forma dinâmica para melhorar performance inicial
const VehicleSummaryWidget = dynamic(() => import('@/components/dashboard/widgets/VehicleSummaryWidget'), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const AlertsWidget = dynamic(() => import('@/components/dashboard/widgets/AlertsWidget'), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const MapPreviewWidget = dynamic(() => import('@/components/dashboard/widgets/MapPreviewWidget'), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const ActivityWidget = dynamic(() => import('@/components/dashboard/widgets/ActivityWidget'), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

export default function DashboardPage() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Verificar o tamanho da tela para ajustar o layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      setIsMediumScreen(window.innerWidth >= 768 && window.innerWidth < 1280);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Detectar e remover qualquer sidebar duplicado
  useEffect(() => {
    // Função para remover menu lateral duplicado
    const removeDuplicatedSidebar = () => {
      // Aguardar um pequeno período para garantir que o DOM esteja carregado
      setTimeout(() => {
        // Encontrar todos os elementos da barra lateral secundária dentro desta página
        const secondarySidebars = document.querySelectorAll('.fake-sidebar');
        if (secondarySidebars.length > 0) {
          secondarySidebars.forEach(sidebar => {
            // Esconder a barra lateral secundária mas manter o elemento para layout
            sidebar.classList.add('opacity-0', 'w-0', 'overflow-hidden', 'pointer-events-none');
          });
        }
      }, 100);
    };

    // Executar a função ao carregar a página
    removeDuplicatedSidebar();

    // Criar um observador de mutação para detectar mudanças no DOM
    const observer = new MutationObserver(removeDuplicatedSidebar);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Salvar layout quando alterado
  const handleLayoutSave = (layout: number[]) => {
    if (isSmallScreen) {
      saveToStorage('dashboard-layout-mobile', layout);
    } else if (isMediumScreen) {
      saveToStorage('dashboard-layout-tablet', layout);
    } else {
      saveToStorage('dashboard-layout-desktop', layout);
    }
  };

  // Recuperar layout salvo com base no tamanho da tela
  const getSavedLayout = (): number[] | undefined => {
    if (typeof window === 'undefined') return undefined;
    
    if (isSmallScreen) {
      return getFromStorage<number[]>('dashboard-layout-mobile', [100]);
    } else if (isMediumScreen) {
      return getFromStorage<number[]>('dashboard-layout-tablet', [50, 50]);
    } else {
      return getFromStorage<number[]>('dashboard-layout-desktop', [30, 40, 30]);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Renderizar layout adaptativo
  return (
    <Container className="h-full flex flex-col">
      {/* Componente invisível que atualiza dados em tempo real */}
      <RealTimeUpdater />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <Breadcrumb />
        </div>
        
        <Tooltip content="Personalizar dashboard">
          <button 
            onClick={toggleEditMode}
            className={`p-2 rounded-md transition-colors ${
              editMode 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
            aria-label="Personalizar dashboard"
          >
            <Settings size={20} />
          </button>
        </Tooltip>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {isSmallScreen ? (
          // Layout para telas pequenas - empilhado verticalmente
          <ResizablePanelGroup 
            direction="vertical" 
            onLayout={handleLayoutSave}
            className="h-full"
          >
            <ResizablePanel defaultSize={25} minSize={15}>
              <div className="h-full p-1">
                <VehicleSummaryWidget />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full p-1">
                <AlertsWidget />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full p-1">
                <MapPreviewWidget />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="h-full p-1">
                <ActivityWidget />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : isMediumScreen ? (
          // Layout para tablets - duas colunas
          <ResizablePanelGroup 
            direction="horizontal"
            onLayout={handleLayoutSave}
            className="h-full"
          >
            {/* Primeira coluna - Sumário e Alertas */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full p-1">
                    <VehicleSummaryWidget />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle={editMode} />
                
                <ResizablePanel defaultSize={50} minSize={30}>
                  <div className="h-full p-1">
                    <AlertsWidget />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            {/* Segunda coluna - Mapa e Atividades */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60} minSize={40}>
                  <div className="h-full p-1">
                    <MapPreviewWidget />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle={editMode} />
                
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full p-1">
                    <ActivityWidget />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Layout para desktop - três colunas
          <ResizablePanelGroup 
            direction="horizontal"
            onLayout={handleLayoutSave}
            className="h-full"
          >
            {/* Primeira coluna - Sumário e Alertas */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={40} minSize={30}>
                  <div className="h-full p-1">
                    <VehicleSummaryWidget />
                  </div>
                </ResizablePanel>
                
                <ResizableHandle withHandle={editMode} />
                
                <ResizablePanel defaultSize={60} minSize={40}>
                  <div className="h-full p-1">
                    <AlertsWidget />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            {/* Segunda coluna - Mapa */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full p-1">
                <MapPreviewWidget />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle={editMode} />
            
            {/* Terceira coluna - Atividades */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full p-1">
                <ActivityWidget />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      
      {editMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg z-50">
          <StatusBadge variant="info">
            Modo de edição ativado - Redimensione os painéis como desejar
          </StatusBadge>
        </div>
      )}
    </Container>
  );
} 