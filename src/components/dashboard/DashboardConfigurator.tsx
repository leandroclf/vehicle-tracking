'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Settings, Plus, X, Save, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { StatusBadge } from '../ui/status-badge';
import { saveToStorage, getFromStorage } from '@/lib/storage';

// Tipos de widgets disponíveis
export type WidgetType = 
  | 'vehicle-summary' 
  | 'alerts' 
  | 'map-preview' 
  | 'activity' 
  | 'telemetry' 
  | 'weather' 
  | 'maintenance' 
  | 'fuel-consumption';

// Perfis de usuário
export type UserProfile = 'admin' | 'manager' | 'driver' | 'maintenance' | 'custom';

// Configuração de um widget
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  visible: boolean;
  permissions: UserProfile[];
  icon: string;
}

// Configurações padrão para cada tipo de widget
const defaultWidgets: Record<WidgetType, Omit<WidgetConfig, 'id' | 'position'>> = {
  'vehicle-summary': {
    type: 'vehicle-summary',
    title: 'Resumo de Veículos',
    description: 'Visão geral da frota com status dos veículos',
    size: 'medium',
    visible: true,
    permissions: ['admin', 'manager', 'driver', 'maintenance', 'custom'],
    icon: 'car'
  },
  'alerts': {
    type: 'alerts',
    title: 'Alertas',
    description: 'Notificações e alertas recentes',
    size: 'medium',
    visible: true,
    permissions: ['admin', 'manager', 'driver', 'custom'],
    icon: 'bell'
  },
  'map-preview': {
    type: 'map-preview',
    title: 'Mapa',
    description: 'Visualização da localização dos veículos',
    size: 'large',
    visible: true,
    permissions: ['admin', 'manager', 'driver', 'custom'],
    icon: 'map'
  },
  'activity': {
    type: 'activity',
    title: 'Atividade Recente',
    description: 'Histórico de atividades e eventos',
    size: 'medium',
    visible: true,
    permissions: ['admin', 'manager', 'custom'],
    icon: 'activity'
  },
  'telemetry': {
    type: 'telemetry',
    title: 'Telemetria',
    description: 'Dados de telemetria em tempo real',
    size: 'medium',
    visible: false,
    permissions: ['admin', 'manager', 'maintenance', 'custom'],
    icon: 'bar-chart'
  },
  'weather': {
    type: 'weather',
    title: 'Clima',
    description: 'Condições climáticas nas rotas',
    size: 'small',
    visible: false,
    permissions: ['admin', 'manager', 'driver', 'custom'],
    icon: 'cloud'
  },
  'maintenance': {
    type: 'maintenance',
    title: 'Manutenção',
    description: 'Status de manutenção e alertas',
    size: 'medium',
    visible: false,
    permissions: ['admin', 'maintenance', 'custom'],
    icon: 'tool'
  },
  'fuel-consumption': {
    type: 'fuel-consumption',
    title: 'Consumo de Combustível',
    description: 'Análise de consumo e eficiência',
    size: 'medium',
    visible: false,
    permissions: ['admin', 'manager', 'custom'],
    icon: 'droplet'
  }
};

interface DashboardConfiguratorProps {
  userProfile: UserProfile;
  onSave: (widgets: WidgetConfig[]) => void;
  onCancel: () => void;
}

export function DashboardConfigurator({ userProfile, onSave, onCancel }: DashboardConfiguratorProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetConfig[]>([]);
  const [isModified, setIsModified] = useState(false);

  // Carregar configurações salvas ou usar padrão
  useEffect(() => {
    const savedWidgets = getFromStorage<WidgetConfig[]>(`dashboard-widgets-${userProfile}`, null);
    
    if (savedWidgets) {
      setWidgets(savedWidgets);
    } else {
      // Criar configuração padrão baseada no perfil do usuário
      const defaultConfig = Object.entries(defaultWidgets)
        .filter(([_, widget]) => widget.permissions.includes(userProfile))
        .map(([_, widget], index) => ({
          ...widget,
          id: `${widget.type}-${Date.now()}-${index}`,
          position: index,
          visible: index < 4 // Mostrar apenas os 4 primeiros widgets por padrão
        }));
      
      setWidgets(defaultConfig);
    }

    // Configurar widgets disponíveis para adicionar
    const available = Object.entries(defaultWidgets)
      .filter(([_, widget]) => widget.permissions.includes(userProfile))
      .map(([_, widget], index) => ({
        ...widget,
        id: `available-${widget.type}-${Date.now()}-${index}`,
        position: index,
        visible: true
      }));
    
    setAvailableWidgets(available);
  }, [userProfile]);

  // Manipular reordenação de widgets
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Atualizar posições
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setWidgets(updatedItems);
    setIsModified(true);
  };

  // Adicionar widget
  const addWidget = (type: WidgetType) => {
    const widgetToAdd = defaultWidgets[type];
    const newWidget: WidgetConfig = {
      ...widgetToAdd,
      id: `${type}-${Date.now()}`,
      position: widgets.length,
      visible: true
    };
    
    setWidgets([...widgets, newWidget]);
    setIsModified(true);
  };

  // Remover widget
  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
    setIsModified(true);
  };

  // Alternar visibilidade do widget
  const toggleWidgetVisibility = (id: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === id ? { ...widget, visible: !widget.visible } : widget
    ));
    setIsModified(true);
  };

  // Salvar configurações
  const saveConfiguration = () => {
    // Ordenar widgets por posição
    const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);
    
    // Salvar no armazenamento local
    saveToStorage(`dashboard-widgets-${userProfile}`, sortedWidgets);
    
    // Notificar componente pai
    onSave(sortedWidgets);
    setIsModified(false);
  };

  // Restaurar configurações padrão
  const restoreDefaults = () => {
    const defaultConfig = Object.entries(defaultWidgets)
      .filter(([_, widget]) => widget.permissions.includes(userProfile))
      .map(([_, widget], index) => ({
        ...widget,
        id: `${widget.type}-${Date.now()}-${index}`,
        position: index,
        visible: index < 4 // Mostrar apenas os 4 primeiros widgets por padrão
      }));
    
    setWidgets(defaultConfig);
    setIsModified(true);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Personalizar Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Arraste e solte os widgets para reorganizar</p>
        </div>
        
        <div className="flex space-x-2">
          <Tooltip content="Restaurar padrões">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={restoreDefaults}
              aria-label="Restaurar configurações padrão"
            >
              <RotateCcw size={16} className="mr-1" />
              Restaurar
            </Button>
          </Tooltip>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            aria-label="Cancelar alterações"
          >
            Cancelar
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            onClick={saveConfiguration}
            disabled={!isModified}
            aria-label="Salvar configurações"
          >
            <Save size={16} className="mr-1" />
            Salvar
          </Button>
        </div>
      </div>
      
      {/* Lista de widgets configurados */}
      <div className="mb-8">
        <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Widgets Ativos</h3>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {widgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center justify-between p-3 rounded-md border ${widget.visible ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'} border-gray-200 dark:border-gray-700`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${widget.visible ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                            <span className="text-lg">
                              <Settings size={20} />
                            </span>
                          </div>
                          <div className="ml-3">
                            <h4 className={`font-medium ${widget.visible ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{widget.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{widget.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <StatusBadge variant={widget.size === 'small' ? 'success' : widget.size === 'medium' ? 'warning' : 'info'}>
                            {widget.size === 'small' ? 'P' : widget.size === 'medium' ? 'M' : 'G'}
                          </StatusBadge>
                          
                          <Tooltip content={widget.visible ? 'Ocultar widget' : 'Mostrar widget'}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWidgetVisibility(widget.id)}
                              aria-label={widget.visible ? 'Ocultar widget' : 'Mostrar widget'}
                              className={widget.visible ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'}
                            >
                              {widget.visible ? 'Visível' : 'Oculto'}
                            </Button>
                          </Tooltip>
                          
                          <Tooltip content="Remover widget">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWidget(widget.id)}
                              aria-label="Remover widget"
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={16} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {widgets.length === 0 && (
          <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Nenhum widget configurado. Adicione widgets abaixo.</p>
          </Card>
        )}
      </div>
      
      {/* Widgets disponíveis para adicionar */}
      <div>
        <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Adicionar Widgets</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableWidgets.map((widget) => {
            // Verificar se o widget já está adicionado
            const isAdded = widgets.some(w => w.type === widget.type);
            
            return (
              <Card 
                key={widget.id} 
                className={`p-3 cursor-pointer transition-all ${isAdded ? 'opacity-50' : 'hover:shadow-md'}`}
                onClick={() => !isAdded && addWidget(widget.type)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center">
                    <Settings size={16} />
                  </div>
                  <div className="ml-2">
                    <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">{widget.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{widget.description}</p>
                  </div>
                </div>
                
                {!isAdded && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-2 justify-center text-blue-600 dark:text-blue-400"
                    aria-label={`Adicionar widget ${widget.title}`}
                  >
                    <Plus size={14} className="mr-1" />
                    Adicionar
                  </Button>
                )}
                
                {isAdded && (
                  <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                    Já adicionado
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      
      {/* Barra de status */}
      {isModified && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-50 dark:bg-blue-900/50 px-4 py-2 rounded-full shadow-lg z-50">
          <StatusBadge variant="warning">
            Alterações não salvas
          </StatusBadge>
        </div>
      )}
    </div>
  );
}