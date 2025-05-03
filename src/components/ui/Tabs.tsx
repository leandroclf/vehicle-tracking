import React, { useState, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'enclosed';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  size = 'md',
  className = '',
  tabsClassName = '',
  contentClassName = '',
  orientation = 'horizontal',
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || (items.length > 0 ? items[0].id : ''));

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Define estilos para o container de abas com base na orientação
  const containerClasses = orientation === 'vertical'
    ? 'flex flex-row'
    : 'flex flex-col';

  // Define estilos para a área de abas com base na orientação e variante
  const tabsContainerClasses = {
    default: orientation === 'vertical'
      ? 'flex flex-col border-r border-gray-200 dark:border-gray-700'
      : 'flex flex-row border-b border-gray-200 dark:border-gray-700',
    pills: orientation === 'vertical'
      ? 'flex flex-col space-y-1'
      : 'flex flex-row space-x-1',
    underline: orientation === 'vertical'
      ? 'flex flex-col border-r border-gray-200 dark:border-gray-700'
      : 'flex flex-row border-b border-gray-200 dark:border-gray-700',
    enclosed: orientation === 'vertical'
      ? 'flex flex-col border-r border-gray-200 dark:border-gray-700'
      : 'flex flex-row',
  };

  // Define estilos para os botões de aba com base no tamanho
  const tabSizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-sm py-2 px-4',
    lg: 'text-base py-2.5 px-5',
  };

  // Define estilos para as abas ativas/inativas com base na variante
  const getTabClasses = (item: TabItem) => {
    const isActive = activeTab === item.id;
    const isDisabled = item.disabled;
    const base = `${tabSizeClasses[size]} inline-flex items-center font-medium ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
    
    if (isDisabled) {
      return `${base} text-gray-400 dark:text-gray-500`;
    }

    switch (variant) {
      case 'pills':
        return `${base} rounded-md ${isActive 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'}`;
      
      case 'underline':
        return `${base} ${isActive 
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 hover:border-gray-300 dark:hover:text-gray-200 dark:hover:border-gray-600'}`;
      
      case 'enclosed':
        return `${base} ${isActive 
          ? 'bg-white dark:bg-gray-800 border-l border-t border-r border-gray-200 dark:border-gray-700 rounded-t-md' 
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200'}`;
      
      case 'default':
      default:
        return `${base} ${isActive 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200'}`;
    }
  };

  // Maneja mudança de aba
  const handleTabChange = (tabId: string) => {
    const selectedTab = items.find(item => item.id === tabId);
    if (selectedTab && !selectedTab.disabled) {
      setActiveTab(tabId);
      if (onChange) {
        onChange(tabId);
      }
    }
  };

  // Encontra o conteúdo da aba ativa
  const activeContent = items.find(item => item.id === activeTab)?.content;

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`${tabsContainerClasses[variant]} ${tabsClassName} ${fullWidth && orientation !== 'vertical' ? 'w-full' : ''}`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            disabled={item.disabled}
            className={`${getTabClasses(item)} ${fullWidth && orientation !== 'vertical' ? 'flex-1 justify-center' : ''}`}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`tab-content-${item.id}`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>
      
      <div 
        className={`mt-4 ${orientation === 'vertical' ? 'flex-1 ml-4' : ''} ${contentClassName}`}
        role="tabpanel"
        id={`tab-content-${activeTab}`}
      >
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs; 