import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Context para compartilhar o estado entre os componentes
type TabsContextValue = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  onChange?: (tabId: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items?: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({
  items,
  defaultValue,
  value,
  onChange,
  variant = 'default',
  fullWidth = false,
  size = 'md',
  className = '',
  children,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState<string>(
    value || defaultValue || (items && items.length > 0 ? items[0].id : '')
  );

  useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabChange = (tabId: string) => {
    if (value === undefined) {
      setActiveTab(tabId);
    }
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, onChange }}>
      <div className={cn('flex flex-col', className)}>
        {children || (
          <>
            <TabsList variant={variant} fullWidth={fullWidth} size={size}>
              {items?.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  disabled={item.disabled}
                  variant={variant}
                  size={size}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="mt-4">
              {items?.map((item) => (
                <TabsContent key={item.id} value={item.id}>
                  {item.content}
                </TabsContent>
              ))}
            </div>
          </>
        )}
      </div>
    </TabsContext.Provider>
  );
}

// Hook para usar o contexto das tabs
function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

// TabsList component
interface TabsListProps {
  children: React.ReactNode;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TabsList({
  children,
  variant = 'default',
  fullWidth = false,
  size = 'md',
  className = '',
}: TabsListProps) {
  // Define estilos para a área de abas com base na variante
  const variantClasses = {
    default: 'flex flex-row border-b border-gray-200 dark:border-gray-700',
    pills: 'flex flex-row space-x-1',
    underline: 'flex flex-row border-b border-gray-200 dark:border-gray-700',
    enclosed: 'flex flex-row',
  };

  return (
    <div
      role="tablist"
      className={cn(variantClasses[variant], fullWidth ? 'w-full' : '', className)}
    >
      {children}
    </div>
  );
}

// TabsTrigger component
interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TabsTrigger({
  children,
  value,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  // Define estilos para os botões de aba com base no tamanho
  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };

  // Base class
  const baseClass = `${sizeClasses[size]} inline-flex items-center font-medium ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  }`;

  // Variant classes
  let variantClass = '';

  if (disabled) {
    variantClass = 'text-gray-400 dark:text-gray-500';
  } else {
    switch (variant) {
      case 'pills':
        variantClass = isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200';
        break;
      case 'underline':
        variantClass = isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600';
        break;
      case 'enclosed':
        variantClass = isActive
          ? 'bg-white dark:bg-gray-800 border-l border-t border-r border-gray-200 dark:border-gray-700 rounded-t-md'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200';
        break;
      case 'default':
      default:
        variantClass = isActive
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200';
        break;
    }
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(baseClass, variantClass, className)}
    >
      {children}
    </button>
  );
}

// TabsContent component
interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      className={cn('animate-in fade-in-0', className)}
    >
      {children}
    </div>
  );
}

export default Tabs; 