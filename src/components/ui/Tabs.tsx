'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Contexto para os Tabs
interface TabsContextType {
  selectedTab: string;
  setSelectedTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

// Componente principal Tabs
export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const TabsComponent: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
  orientation = 'horizontal',
}) => {
  const [selectedTabInternal, setSelectedTabInternal] = useState(defaultValue);
  
  // Determinar se é controlado ou não
  const isControlled = value !== undefined;
  const selectedTab = isControlled ? value : selectedTabInternal;
  
  const setSelectedTab = (newValue: string) => {
    if (!isControlled) {
      setSelectedTabInternal(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={cn(
        'w-full',
        orientation === 'vertical' && 'flex',
        className
      )}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// Lista de abas
export interface TabsListProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const TabsListComponent: React.FC<TabsListProps> = ({
  children,
  className = '',
  ariaLabel = 'Tabs',
}) => {
  return (
    <div 
      className={cn(
        'flex bg-muted/20 rounded-lg p-1 text-muted-foreground',
        className
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};

// Gatilho de aba individual
export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

const TabsTriggerComponent: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = '',
  disabled = false,
}) => {
  const { selectedTab, setSelectedTab } = useTabs();
  const isSelected = selectedTab === value;
  
  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
        isSelected 
          ? 'bg-white dark:bg-gray-800 text-foreground shadow-sm' 
          : 'hover:bg-muted/50 hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => !disabled && setSelectedTab(value)}
    >
      {children}
    </button>
  );
};

// Conteúdo da aba
export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  forceMount?: boolean;
}

const TabsContentComponent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = '',
  forceMount = false,
}) => {
  const { selectedTab } = useTabs();
  const isSelected = selectedTab === value;
  
  if (!isSelected && !forceMount) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isSelected}
      className={cn(
        'mt-2 focus:outline-none',
        isSelected && 'animate-in fade-in-0 zoom-in-95',
        className
      )}
      tabIndex={isSelected ? 0 : -1}
    >
      {children}
    </div>
  );
};

// Exportações
export const Tabs = TabsComponent;
export const TabsList = TabsListComponent;
export const TabsTrigger = TabsTriggerComponent;
export const TabsContent = TabsContentComponent;

export default TabsComponent; 