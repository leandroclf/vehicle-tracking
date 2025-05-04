'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from './ContextualNavigation';

interface Tab {
  id: string;
  label: string;
  content?: ReactNode;
  path?: string;
  icon?: ReactNode;
  shortcut?: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  preserveState?: boolean;
  ariaLabel?: string;
}

export function TabNavigation({
  tabs,
  defaultTabId,
  onChange,
  className,
  preserveState = false,
  ariaLabel = 'Navegação por abas'
}: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTabId, setActiveTabId] = useState<string>(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));

  // Encontrar a aba ativa com base no pathname atual
  useEffect(() => {
    if (!preserveState) {
      const matchingTab = tabs.find(tab => tab.path && pathname.startsWith(tab.path));
      if (matchingTab) {
        setActiveTabId(matchingTab.id);
      }
    }
  }, [pathname, tabs, preserveState]);

  // Configurar atalhos de teclado para as abas
  tabs.forEach(tab => {
    if (tab.shortcut) {
      useKeyboardShortcut(tab.shortcut, () => handleTabChange(tab.id), { alt: true });
    }
  });

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    
    // Notificar o componente pai sobre a mudança
    if (onChange) {
      onChange(tabId);
    }
    
    // Navegar para o caminho da aba, se disponível
    const selectedTab = tabs.find(tab => tab.id === tabId);
    if (selectedTab?.path) {
      router.push(selectedTab.path);
    }
  };

  return (
    <div className={cn('w-full', className)} role="tablist" aria-label={ariaLabel}>
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
              onClick={() => handleTabChange(tab.id)}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.shortcut && (
                  <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                    Alt+{tab.shortcut.toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Indicador de aba ativa */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 dark:bg-blue-400"
                  layoutId="tabIndicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Conteúdo das abas */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTabId !== tab.id}
            tabIndex={0}
            className={cn(
              'focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1',
              activeTabId === tab.id ? 'block' : 'hidden'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para exibir um painel de abas com conteúdo dinâmico
export function DynamicTabPanel({
  tabs,
  defaultTabId,
  className,
}: {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}) {
  const [activeTabId, setActiveTabId] = useState<string>(defaultTabId || (tabs.length > 0 ? tabs[0].id : ''));

  return (
    <div className={cn('w-full', className)}>
      <TabNavigation
        tabs={tabs}
        defaultTabId={activeTabId}
        onChange={setActiveTabId}
        preserveState={true}
      />
    </div>
  );
}