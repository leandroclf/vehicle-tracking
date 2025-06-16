'use client';

import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Grid, GridItem } from '@/components/ui/Grid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AccessibleTabs } from '@/components/ui/AccessibleTabs';
import { WeatherWidget } from '@/components/dashboard/widgets/WeatherWidget';
import { MaintenanceWidget } from '@/components/dashboard/widgets/MaintenanceWidget';
import { FuelConsumptionWidget } from '@/components/dashboard/widgets/FuelConsumptionWidget';
import { Plus, Save, RotateCcw, Settings, Layout, Eye } from 'lucide-react';

// Definição de tipos para os widgets
interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; w: number; h: number };
  settings?: Record<string, any>;
}

// Configurações padrão para o dashboard
const defaultWidgets: WidgetConfig[] = [
  {
    id: 'weather-widget',
    type: 'weather',
    title: 'Clima',
    description: 'Exibe informações meteorológicas para rotas',
    size: 'medium',
    position: { x: 0, y: 0, w: 6, h: 4 }
  },
  {
    id: 'maintenance-widget',
    type: 'maintenance',
    title: 'Manutenção',
    description: 'Status de manutenção dos veículos',
    size: 'large',
    position: { x: 6, y: 0, w: 6, h: 4 }
  },
  {
    id: 'fuel-widget',
    type: 'fuel',
    title: 'Consumo de Combustível',
    description: 'Análise de consumo de combustível',
    size: 'large',
    position: { x: 0, y: 4, w: 12, h: 4 }
  }
];

// Componente principal do dashboard personalizado
export default function CustomDashboard() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedLayouts, setSavedLayouts] = useState<{ name: string; widgets: WidgetConfig[] }[]>([]);
  
  // Carregar configurações salvas ou usar padrão
  useEffect(() => {
    const loadDashboard = () => {
      try {
        const savedWidgets = localStorage.getItem('custom-dashboard-widgets');
        if (savedWidgets) {
          setWidgets(JSON.parse(savedWidgets));
        } else {
          setWidgets(defaultWidgets);
        }
        
        const savedLayoutsData = localStorage.getItem('saved-dashboard-layouts');
        if (savedLayoutsData) {
          setSavedLayouts(JSON.parse(savedLayoutsData));
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        setWidgets(defaultWidgets);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simular carregamento para demonstração
    setTimeout(loadDashboard, 1000);
  }, []);
  
  // Salvar alterações no localStorage
  const saveDashboard = () => {
    try {
      localStorage.setItem('custom-dashboard-widgets', JSON.stringify(widgets));
      setIsEditing(false);
      
      // Feedback visual de sucesso
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      notification.textContent = 'Dashboard salvo com sucesso!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Erro ao salvar dashboard:', error);
    }
  };
  
  // Restaurar configuração padrão
  const resetDashboard = () => {
    if (confirm('Tem certeza que deseja restaurar o dashboard para a configuração padrão? Todas as personalizações serão perdidas.')) {
      setWidgets(defaultWidgets);
      localStorage.setItem('custom-dashboard-widgets', JSON.stringify(defaultWidgets));
      setIsEditing(false);
    }
  };
  
  // Salvar layout atual como um novo modelo
  const saveAsNewLayout = () => {
    const layoutName = prompt('Digite um nome para este layout:');
    if (layoutName) {
      const newLayout = {
        name: layoutName,
        widgets: [...widgets]
      };
      
      const updatedLayouts = [...savedLayouts, newLayout];
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('saved-dashboard-layouts', JSON.stringify(updatedLayouts));
    }
  };
  
  // Carregar um layout salvo
  const loadSavedLayout = (index: number) => {
    if (savedLayouts[index]) {
      setWidgets(savedLayouts[index].widgets);
      localStorage.setItem('custom-dashboard-widgets', JSON.stringify(savedLayouts[index].widgets));
    }
  };
  
  // Atualizar posição de um widget
  const updateWidgetPosition = (id: string, position: { x: number; y: number; w: number; h: number }) => {
    setWidgets(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id ? { ...widget, position } : widget
      )
    );
  };
  
  // Renderizar widget com base no tipo
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'weather':
        return <WeatherWidget />;
      case 'maintenance':
        return <MaintenanceWidget />;
      case 'fuel':
        return <FuelConsumptionWidget />;
      default:
        return (
          <Card className="h-full flex items-center justify-center p-4">
            <p className="text-gray-500">Widget não encontrado</p>
          </Card>
        );
    }
  };
  
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-200 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando dashboard personalizado...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Personalizado</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Visualize e organize seus widgets de acordo com suas preferências
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <Button onClick={saveDashboard} variant="primary" className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Editar Dashboard
                </Button>
                <Button onClick={resetDashboard} variant="outline" className="flex items-center">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar Padrão
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <AccessibleTabs
        tabs={[
          {
            id: 'dashboard',
            label: 'Dashboard',
            content: (
              <DndProvider backend={HTML5Backend}>
                <div className={`grid-container ${isEditing ? 'editing-mode' : ''}`}>
                  <Grid
                    className="w-full gap-4"
                    cols={12}
                    isResizable={isEditing}
                    isDraggable={isEditing}
                  >
                    {widgets.map((widget) => (
                      <GridItem
                        key={widget.id}
                        id={widget.id}
                        x={widget.position.x}
                        y={widget.position.y}
                        w={widget.position.w}
                        h={widget.position.h}
                        onPositionChange={(x, y, w, h) => updateWidgetPosition(widget.id, { x, y, w, h })}
                        className={`transition-all duration-200 ${isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                      >
                        {renderWidget(widget)}
                      </GridItem>
                    ))}
                  </Grid>
                </div>
              </DndProvider>
            ),
            icon: <Layout className="h-4 w-4" />
          },
          {
            id: 'layouts',
            label: 'Layouts Salvos',
            content: (
              <div className="p-4">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Layouts Salvos</h2>
                  <Button onClick={saveAsNewLayout} variant="outline" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Salvar Layout Atual
                  </Button>
                </div>
                
                {savedLayouts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedLayouts.map((layout, index) => (
                      <Card key={index} className="p-4">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{layout.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {layout.widgets.length} widgets configurados
                        </p>
                        <Button 
                          onClick={() => loadSavedLayout(index)} 
                          variant="outline" 
                          className="w-full"
                        >
                          Carregar Layout
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Você ainda não salvou nenhum layout personalizado.
                    </p>
                    <Button onClick={saveAsNewLayout} variant="outline">
                      Salvar Layout Atual
                    </Button>
                  </div>
                )}
              </div>
            ),
            icon: <Save className="h-4 w-4" />
          }
        ]}
        defaultTab="dashboard"
        onChange={setActiveTab}
        className="flex-1 overflow-hidden"
        panelClassName="h-full overflow-auto"
      />
      
      {/* Estilos para o modo de edição */}
      <style jsx global>{`
        .editing-mode .grid-item {
          cursor: move;
        }
        
        .grid-container {
          height: 100%;
          overflow: auto;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}