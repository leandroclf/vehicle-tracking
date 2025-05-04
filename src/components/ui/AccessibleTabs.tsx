'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface TabProps {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface AccessibleTabsProps {
  tabs: TabProps[];
  defaultTab?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  tabClassName?: string;
  panelClassName?: string;
  onChange?: (tabId: string) => void;
  ariaLabel?: string;
}

export function AccessibleTabs({
  tabs,
  defaultTab,
  orientation = 'horizontal',
  className,
  tabClassName,
  panelClassName,
  onChange,
  ariaLabel = 'Navegação por abas'
}: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || (tabs.length > 0 ? tabs[0].id : ''));
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  // Atualizar o estado quando as props mudam
  useEffect(() => {
    if (defaultTab && tabs.some(tab => tab.id === defaultTab)) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, tabs]);

  // Manipular mudança de aba
  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      if (onChange) onChange(tabId);
      
      // Adicionar ao histórico de navegação para permitir uso do botão voltar
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.pushState({ tab: tabId }, '', url);
      
      // Anunciar para leitores de tela
      const activeTabData = tabs.find(tab => tab.id === tabId);
      if (activeTabData) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('class', 'sr-only');
        announcement.textContent = `Aba ${activeTabData.label} ativada`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
      }
    }
  };

  // Manipular navegação por teclado
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    const tabsArray = tabs.filter(tab => !tab.disabled);
    const currentIndex = tabsArray.findIndex(tab => tab.id === tabId);
    let nextIndex: number;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabsArray.length;
        handleTabChange(tabsArray[nextIndex].id);
        tabRefs.current.get(tabsArray[nextIndex].id)?.focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
        handleTabChange(tabsArray[nextIndex].id);
        tabRefs.current.get(tabsArray[nextIndex].id)?.focus();
        break;
      case 'Home':
        e.preventDefault();
        handleTabChange(tabsArray[0].id);
        tabRefs.current.get(tabsArray[0].id)?.focus();
        break;
      case 'End':
        e.preventDefault();
        handleTabChange(tabsArray[tabsArray.length - 1].id);
        tabRefs.current.get(tabsArray[tabsArray.length - 1].id)?.focus();
        break;
    }
  };

  // Verificar se há abas disponíveis
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        'tabs-container',
        orientation === 'vertical' ? 'flex flex-row' : 'flex flex-col',
        className
      )}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={cn(
          'flex gap-1 border-b border-gray-200 dark:border-gray-700',
          orientation === 'vertical' 
            ? 'flex-col border-r border-b-0 pr-1' 
            : 'flex-row pb-1'
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            onKeyDown={(e) => !tab.disabled && handleKeyDown(e, tab.id)}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            className={cn(
              'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              tabClassName
            )}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cn('tab-panels flex-1', orientation === 'vertical' ? 'pl-4' : 'pt-4')}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            tabIndex={0}
            className={cn(
              'focus:outline-none',
              activeTab === tab.id ? 'animate-fadeIn' : 'hidden',
              panelClassName
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>

      {/* Estilos para animação de fade */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}