"use client";

import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Card from '@/components/ui/Card';
import { Maximize2, Minimize2, MoreVertical } from 'lucide-react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

interface DashboardWidgetProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  size?: WidgetSize;
  onSizeChange?: (size: WidgetSize) => void;
  className?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onConfigure?: () => void;
  refreshInterval?: number;
}

const sizeToGridClass = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-full',
};

export default function DashboardWidget({
  title,
  children,
  icon,
  size = 'medium',
  onSizeChange,
  className,
  isLoading = false,
  onRefresh,
  onRemove,
  onConfigure,
  refreshInterval,
}: DashboardWidgetProps) {
  const [expanded, setExpanded] = React.useState(false);
  
  const handleToggleSize = () => {
    if (onSizeChange) {
      if (size === 'full') {
        onSizeChange('medium');
      } else {
        onSizeChange('full');
      }
    }
    setExpanded(!expanded);
  };

  // Se refreshInterval for fornecido, atualiza automaticamente
  React.useEffect(() => {
    if (refreshInterval && onRefresh) {
      const interval = setInterval(() => {
        onRefresh();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  const headerActions = (
    <div className="flex items-center space-x-2">
      {onSizeChange && (
        <button 
          onClick={handleToggleSize}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={expanded ? "Minimizar widget" : "Expandir widget"}
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}
      
      {(onConfigure || onRemove) && (
        <div className="relative group">
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Mais opções"
          >
            <MoreVertical size={16} />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg hidden group-hover:block z-10 border border-gray-200 dark:border-gray-700">
            {onConfigure && (
              <button 
                onClick={onConfigure}
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                Configurar widget
              </button>
            )}
            {onRemove && (
              <button 
                onClick={onRemove}
                className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
              >
                Remover widget
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const widgetTitle = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <span>{title}</span>
      </div>
      {headerActions}
    </div>
  );

  return (
    <div className={twMerge(sizeToGridClass[size], className)}>
      <Card 
        title={widgetTitle}
        elevated
        className="h-full transition-all duration-300 transform"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          children
        )}
      </Card>
    </div>
  );
} 