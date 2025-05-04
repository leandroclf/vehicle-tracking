'use client';

import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useSidebar } from '@/lib/sidebar-context';

interface PanelLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarCollapsed?: boolean;
  className?: string;
  hideSidebar?: boolean;
}

/**
 * Componente que encapsula a funcionalidade de painéis redimensionáveis
 * com configurações padrão para evitar avisos de mudança de layout
 */
export function PanelLayout({
  sidebar,
  content,
  sidebarCollapsed,
  className = '',
  hideSidebar = false
}: PanelLayoutProps) {
  const { isSidebarCollapsed, sidebarLayout, updateSidebarLayout } = useSidebar();
  
  // Use o valor do contexto, mas permita sobrescrever com a prop se fornecida
  const isCollapsed = sidebarCollapsed !== undefined ? sidebarCollapsed : isSidebarCollapsed;

  if (hideSidebar) {
    return (
      <div className={`h-full w-full ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <PanelGroup 
      direction="horizontal" 
      className={`h-full w-full ${className}`}
      onLayout={updateSidebarLayout}
    >
      {/* Painel lateral */}
      <Panel 
        defaultSize={sidebarLayout[0]} 
        minSize={isCollapsed ? 5 : 15} 
        maxSize={25}
        collapsible={true}
        className={`h-full transition-all duration-300 ${isCollapsed ? 'max-w-[70px]' : ''}`}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          {sidebar}
        </div>
      </Panel>
      
      {/* Separador redimensionável */}
      {!isCollapsed && (
        <PanelResizeHandle 
          className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:bg-blue-500" 
          tabIndex={0}
          aria-label="Redimensionar painel lateral"
        />
      )}
      
      {/* Conteúdo principal */}
      <Panel 
        defaultSize={sidebarLayout[1]}
        className="h-full"
      >
        {content}
      </Panel>
    </PanelGroup>
  );
}

export default PanelLayout; 