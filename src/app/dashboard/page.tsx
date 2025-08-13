'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import dynamic from 'next/dynamic';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable-panels';
import { getFromStorage, saveToStorage } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Settings, Sliders, PlusCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardConfigurator, WidgetConfig, UserProfile } from '@/components/dashboard/DashboardConfigurator';
import { RealTimeUpdater } from '@/components/dashboard/RealTimeUpdater';
import { TrackingDashboard } from '@/components/tracking/tracking-dashboard';
import { RealtimeMap } from '@/components/tracking/realtime-map';

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

// Componentes adicionais do dashboard customizado
const TelemetryWidget = dynamic(() => import('@/components/dashboard/widgets/TelemetryWidget').catch(() => () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <Settings className="text-gray-400 mb-2" size={24} />
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Widget de Telemetria</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Este widget será implementado em breve.</p>
  </div>
)), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const WeatherWidget = dynamic(() => import('@/components/dashboard/widgets/WeatherWidget').catch(() => () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <Settings className="text-gray-400 mb-2" size={24} />
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Widget de Clima</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Este widget será implementado em breve.</p>
  </div>
)), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const MaintenanceWidget = dynamic(() => import('@/components/dashboard/widgets/MaintenanceWidget').catch(() => () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <Settings className="text-gray-400 mb-2" size={24} />
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Widget de Manutenção</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Este widget será implementado em breve.</p>
  </div>
)), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

const FuelConsumptionWidget = dynamic(() => import('@/components/dashboard/widgets/FuelConsumptionWidget').catch(() => () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
    <Settings className="text-gray-400 mb-2" size={24} />
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Widget de Consumo de Combustível</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Este widget será implementado em breve.</p>
  </div>
)), {
  loading: () => <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
});

// Mapeamento de tipos de widgets para componentes
const widgetComponents: Record<string, React.ComponentType<any>> = {
  'vehicle-summary': VehicleSummaryWidget,
  'alerts': AlertsWidget,
  'map-preview': MapPreviewWidget,
  'activity': ActivityWidget,
  'telemetry': TelemetryWidget,
  'weather': WeatherWidget,
  'maintenance': MaintenanceWidget,
  'fuel-consumption': FuelConsumptionWidget,
  'tracking-dashboard': TrackingDashboard,
  'realtime-map': RealtimeMap
};

export default function DashboardPage() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'custom'>('standard');
  
  // Estados para o Dashboard Customizado
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>('admin');
  const [isLoading, setIsLoading] = useState(true);

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

  // Carregar widgets customizados quando necessário
  useEffect(() => {
    if (viewMode === 'custom') {
      setIsLoading(true);
      const savedWidgets = getFromStorage<WidgetConfig[]>(`dashboard-widgets-${userProfile}`, []);
      
      if (savedWidgets && savedWidgets.length > 0) {
        setWidgets(savedWidgets);
      } else {
        // Configuração padrão será fornecida pelo DashboardConfigurator quando necessário
        setWidgets([]);
      }
      
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [viewMode, userProfile]);

  // Manipular salvamento de configuração
  const handleSaveConfiguration = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    setIsConfiguring(false);
    saveToStorage(`dashboard-widgets-${userProfile}`, newWidgets);
    
    // Feedback visual
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in';
    notification.innerHTML = 'Dashboard personalizado salvo com sucesso!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('animate-fade-out');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  };

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

  // Renderizar widget customizado
  const renderWidget = (widget: WidgetConfig) => {
    if (!widget.visible) return null;
    
    const WidgetComponent = widgetComponents[widget.type];
    if (!WidgetComponent) return null;
    
    return (
      <div 
        key={widget.id} 
        className={`
          p-1 mb-4 
          ${widget.size === 'small' ? 'w-full sm:w-1/2 lg:w-1/4' : ''}
          ${widget.size === 'medium' ? 'w-full sm:w-1/2 lg:w-1/3' : ''}
          ${widget.size === 'large' ? 'w-full sm:w-full lg:w-1/2' : ''}
        `}
        data-widget-id={widget.id}
        data-widget-type={widget.type}
      >
        <div className="h-full transition-all hover:shadow-md rounded-lg overflow-hidden">
          <WidgetComponent />
        </div>
      </div>
    );
  };

  // Renderizar dashboard padrão ou customizado
  return (
    <Container className="h-full flex flex-col">
      {/* Componente invisível que atualiza dados em tempo real */}
      <RealTimeUpdater />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <Breadcrumb />
        </div>
        
        <div className="flex space-x-2">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-md">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'standard' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Padrão
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                viewMode === 'custom' 
                  ? 'bg-white dark:bg-gray-700 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Personalizado
            </button>
          </div>
          
          {viewMode === 'standard' ? (
            <Tooltip content="Editar layout">
              <button 
                onClick={toggleEditMode}
                className={`p-2 rounded-md transition-colors ${
                  editMode 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
                aria-label="Editar layout"
              >
                <Sliders size={20} />
              </button>
            </Tooltip>
          ) : (
            <Tooltip content="Personalizar widgets">
              <Button 
                onClick={() => setIsConfiguring(true)}
                variant="primary"
                className="flex items-center"
                aria-label="Personalizar widgets"
              >
                <Settings size={18} className="mr-2" />
                Personalizar
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {/* Dashboard Padrão */}
        {viewMode === 'standard' && (
          <>
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
          </>
        )}
        
        {/* Dashboard Customizado */}
        {viewMode === 'custom' && (
          <>
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Carregando seu dashboard personalizado...</p>
                </div>
              </div>
            ) : isConfiguring ? (
              <div className="flex-1 overflow-auto">
                <DashboardConfigurator 
                  userProfile={userProfile}
                  onSave={handleSaveConfiguration}
                  onCancel={() => setIsConfiguring(false)}
                />
              </div>
            ) : widgets.length > 0 ? (
              <div className="flex-1 overflow-auto">
                <div className="flex flex-wrap -mx-1">
                  {widgets
                    .filter(widget => widget.visible)
                    .sort((a, b) => a.position - b.position)
                    .map(renderWidget)}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <PlusCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Personalize seu Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Você ainda não configurou seu dashboard personalizado. Adicione widgets para monitorar o que é mais importante para você.
                  </p>
                  <Button 
                    onClick={() => setIsConfiguring(true)}
                    variant="primary"
                    className="w-full justify-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Configurar Dashboard
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Estilos para animações de feedback */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </Container>
    );
  }