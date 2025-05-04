'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  onTabChange?: (id: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveTab,
  onTabChange,
  variant = 'default',
  orientation = 'horizontal',
  className = '',
  tabListClassName = '',
  tabPanelClassName = '',
  size = 'md'
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ''));
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const tabsRef = React.useRef<HTMLDivElement>(null);

  // Efeito para verificar se os botões de scroll são necessários
  useEffect(() => {
    const checkScrollButtons = () => {
      if (tabsRef.current) {
        const { scrollWidth, clientWidth } = tabsRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };

    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    
    return () => {
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [tabs]);

  // Atualizar a tab ativa quando props mudar
  useEffect(() => {
    if (defaultActiveTab && defaultActiveTab !== activeTab) {
      setActiveTab(defaultActiveTab);
    }
  }, [defaultActiveTab]);

  const handleTabChange = (id: string) => {
    if (tabs.find(tab => tab.id === id)?.disabled) return;
    
    setActiveTab(id);
    if (onTabChange) {
      onTabChange(id);
    }

    // Scroll para a tab ativa em dispositivos móveis
    if (tabsRef.current) {
      const tabElement = tabsRef.current.querySelector(`[data-tab-id="${id}"]`) as HTMLElement;
      if (tabElement) {
        const { offsetLeft, offsetWidth } = tabElement;
        const { scrollLeft, clientWidth } = tabsRef.current;
        
        // Centralizar a tab ativa
        const newScrollPosition = offsetLeft - (clientWidth / 2) + (offsetWidth / 2);
        tabsRef.current.scrollTo({
          left: newScrollPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Funções para scroll horizontal
  const scrollLeft = () => {
    if (tabsRef.current) {
      const newPosition = Math.max(0, scrollPosition - 200);
      tabsRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  const scrollRight = () => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth } = tabsRef.current;
      const maxScrollPosition = scrollWidth - clientWidth;
      const newPosition = Math.min(maxScrollPosition, scrollPosition + 200);
      tabsRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      setScrollPosition(newPosition);
    }
  };

  // Manipular evento de scroll para atualizar posição
  const handleScroll = () => {
    if (tabsRef.current) {
      setScrollPosition(tabsRef.current.scrollLeft);
    }
  };

  // Classes para tamanhos
  const sizeClasses = {
    sm: 'text-xs py-1 px-2 sm:px-3',
    md: 'text-sm py-2 px-3 sm:px-4',
    lg: 'text-base py-3 px-4 sm:px-6'
  };

  // Classes para variantes
  const variantClasses = {
    default: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'bg-gray-100 dark:bg-gray-800 rounded-full p-1',
    underline: 'border-b border-gray-200 dark:border-gray-700',
    minimal: ''
  };

  const activeTabClasses = {
    default: 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-medium',
    pills: 'bg-white dark:bg-gray-700 shadow rounded-full text-blue-600 dark:text-blue-400 font-medium',
    underline: 'border-b-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-medium',
    minimal: 'text-blue-600 dark:text-blue-400 font-medium'
  };

  // Garantir altura adequada para área clicável em celulares
  const touchAreaClass = 'min-h-[44px] flex items-center justify-center';

  const getTabListClass = () => {
    if (orientation === 'vertical') {
      return 'flex flex-col border-r border-gray-200 dark:border-gray-700 w-1/3 pr-2';
    }
    
    return cn(
      'relative flex whitespace-nowrap overflow-x-auto scrollbar-hide',
      variantClasses[variant],
      tabListClassName
    );
  };

  return (
    <div 
      className={cn(
        'tabs',
        orientation === 'vertical' ? 'flex space-x-4' : 'w-full',
        className
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {/* Botão de scroll esquerdo */}
      {orientation === 'horizontal' && showScrollButtons && scrollPosition > 0 && (
        <button 
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-1 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      
      {/* Lista de abas */}
      <div 
        ref={tabsRef}
        className={getTabListClass()}
        onScroll={handleScroll}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            className={cn(
              'outline-none transition-all duration-200',
              sizeClasses[size],
              touchAreaClass,
              orientation === 'vertical' ? 'text-left justify-start' : 'text-center',
              tab.disabled ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'cursor-pointer',
              activeTab === tab.id 
                ? activeTabClasses[variant]
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200',
              variant === 'pills' && 'rounded-full'
            )}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      
      {/* Botão de scroll direito */}
      {orientation === 'horizontal' && showScrollButtons && tabsRef.current && 
        scrollPosition < (tabsRef.current.scrollWidth - tabsRef.current.clientWidth - 10) && (
        <button 
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full shadow-md p-1 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Rolar para a direita"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
      
      {/* Conteúdo das abas */}
      <div className={cn(
        'tab-content',
        orientation === 'vertical' ? 'w-2/3' : 'mt-4 w-full',
        tabPanelClassName
      )}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            className={cn(
              'transition-opacity',
              activeTab === tab.id ? 'opacity-100' : 'opacity-0 absolute -z-10'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}; 