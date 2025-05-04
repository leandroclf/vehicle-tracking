'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Maximize2, Minimize2, X, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurableWidgetProps {
  id: string;
  title: string;
  description?: string;
  isEditing?: boolean;
  onRemove?: (id: string) => void;
  onResize?: (id: string, size: string) => void;
  onMove?: (id: string, direction: 'up' | 'down' | 'left' | 'right') => void;
  onSettings?: (id: string) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children: React.ReactNode;
}

export function ConfigurableWidget({
  id,
  title,
  description,
  isEditing = false,
  onRemove,
  onResize,
  onMove,
  onSettings,
  size = 'medium',
  className,
  children
}: ConfigurableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Efeito para lidar com teclas de atalho quando o widget está em foco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!widgetRef.current?.contains(document.activeElement)) return;

      // Atalhos de teclado para acessibilidade
      if (isEditing) {
        switch (e.key) {
          case 'Delete':
            onRemove?.(id);
            break;
          case 'ArrowUp':
            if (e.ctrlKey) onMove?.(id, 'up');
            break;
          case 'ArrowDown':
            if (e.ctrlKey) onMove?.(id, 'down');
            break;
          case 'ArrowLeft':
            if (e.ctrlKey) onMove?.(id, 'left');
            break;
          case 'ArrowRight':
            if (e.ctrlKey) onMove?.(id, 'right');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, isEditing, onMove, onRemove]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      ref={widgetRef}
      className={cn(
        'relative transition-all duration-300 overflow-hidden',
        isExpanded ? 'fixed inset-4 z-50' : '',
        isEditing ? 'border-2 border-dashed border-blue-400 hover:border-blue-600' : '',
        className
      )}
      tabIndex={0}
      aria-label={`Widget ${title}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cabeçalho do Widget */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800">
        <div>
          <h3 className="font-medium text-gray-800 dark:text-gray-200">{title}</h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>

        {/* Controles do Widget */}
        <div className={cn(
          'flex items-center space-x-1 transition-opacity',
          (!isHovered && !isEditing) ? 'opacity-0' : 'opacity-100'
        )}>
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => onSettings?.(id)}
                aria-label="Configurações do widget"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7"
                onClick={() => onResize?.(id, size === 'small' ? 'medium' : size === 'medium' ? 'large' : 'small')}
                aria-label="Alterar tamanho do widget"
              >
                {size === 'large' ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                onClick={() => onRemove?.(id)}
                aria-label="Remover widget"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-7 w-7"
            onClick={toggleExpand}
            aria-label={isExpanded ? "Minimizar widget" : "Expandir widget"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Conteúdo do Widget */}
      <div className="p-4">
        {children}
      </div>

      {/* Overlay de edição */}
      {isEditing && (
        <div 
          className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          {isHovered && (
            <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg pointer-events-auto">
              <Move className="h-6 w-6 text-blue-500" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}