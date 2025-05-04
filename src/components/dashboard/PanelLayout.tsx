'use client';

import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

interface PanelLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarCollapsed?: boolean;
  sidebarWidth?: number;
  contentWidth?: number;
  className?: string;
}

/**
 * Componente que encapsula a funcionalidade de painéis redimensionáveis
 * com configurações padrão para evitar avisos de mudança de layout
 */
export function PanelLayout({
  sidebar,
  content,
  sidebarCollapsed = false,
  sidebarWidth = 20,
  contentWidth = 80,
  className = ''
}: PanelLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className={`h-full w-full ${className}`}>
      {/* Painel lateral */}
      <Panel 
        defaultSize={sidebarWidth} 
        minSize={sidebarCollapsed ? 5 : 15} 
        maxSize={25}
        collapsible={true}
        className="h-full"
      >
        {sidebar}
      </Panel>
      
      {/* Separador redimensionável */}
      <PanelResizeHandle 
        className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:bg-blue-500" 
        tabIndex={0}
        aria-label="Redimensionar painel lateral"
      />
      
      {/* Conteúdo principal */}
      <Panel 
        defaultSize={contentWidth}
        className="h-full"
      >
        {content}
      </Panel>
    </PanelGroup>
  );
}

export default PanelLayout; 