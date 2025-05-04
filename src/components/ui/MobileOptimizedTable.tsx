'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@/components/ui/Dropdown';

interface TableColumn<T> {
  key: string;
  header: string;
  cell?: (item: T, index: number) => React.ReactNode;
  isSortable?: boolean;
  priority?: 'high' | 'medium' | 'low'; // Prioridade para exibição em mobile
  mobileRenderer?: (item: T, index: number) => React.ReactNode; // Renderizador especial para mobile
}

interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  isVisible?: (item: T) => boolean;
}

interface MobileOptimizedTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
}

export default function MobileOptimizedTable<T>({
  columns,
  data,
  actions,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Nenhum dado encontrado',
  isLoading = false,
  loadingRows = 3
}: MobileOptimizedTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Função para alternar a expansão de uma linha
  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Função para ordenar os dados
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a: any, b: any) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  // Função para alternar a ordenação
  const toggleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Colunas prioritárias para exibição em dispositivos móveis
  const highPriorityColumns = columns.filter(col => col.priority === 'high' || col.priority === undefined);
  
  // Renderização para carregamento
  if (isLoading) {
    return (
      <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Cabeçalho da tabela */}
        <div className="hidden sm:flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {columns.map(column => (
            <div 
              key={column.key} 
              className="p-3 flex-1 font-medium text-sm text-gray-500 dark:text-gray-400 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
          {actions && <div className="w-10"></div>}
        </div>
        
        {/* Linhas de carregamento */}
        {Array.from({ length: loadingRows }).map((_, rowIndex) => (
          <React.Fragment key={`loading-${rowIndex}`}>
            {/* Versão desktop */}
            <div className="hidden sm:flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              {columns.map((column, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className="p-3 flex-1 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
              {actions && <div className="w-10"></div>}
            </div>
            
            {/* Versão mobile */}
            <div className="sm:hidden p-3 border-b border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
              <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Mensagem quando não há dados
  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Cabeçalho da tabela - apenas desktop */}
      <div className="hidden sm:flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {columns.map(column => (
          <div 
            key={column.key} 
            className={`p-3 flex-1 font-medium text-sm text-gray-600 dark:text-gray-300 ${column.isSortable ? 'cursor-pointer' : ''}`}
            onClick={column.isSortable ? () => toggleSort(column.key) : undefined}
          >
            <div className="flex items-center">
              {column.header}
              {column.isSortable && sortColumn === column.key && (
                <span className="ml-1">
                  {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </div>
          </div>
        ))}
        {actions && actions.length > 0 && <div className="w-10"></div>}
      </div>
      
      {/* Linhas da tabela */}
      {sortedData.map((item, index) => {
        const rowKey = keyExtractor(item);
        const isExpanded = expandedRows[rowKey] || false;
        
        return (
          <React.Fragment key={rowKey}>
            {/* Versão desktop da linha */}
            <div 
              className={`hidden sm:flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map(column => (
                <div key={`${rowKey}-${column.key}`} className="p-3 flex-1 text-sm">
                  {column.cell ? column.cell(item, index) : (item as any)[column.key]}
                </div>
              ))}
              
              {actions && actions.length > 0 && (
                <div className="w-10 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                  <Dropdown>
                    <DropdownTrigger>
                      <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      {actions.map((action, actionIndex) => (
                        (!action.isVisible || action.isVisible(item)) && (
                          <DropdownItem 
                            key={actionIndex} 
                            onClick={() => action.onClick(item)}
                          >
                            <div className="flex items-center">
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </div>
                          </DropdownItem>
                        )
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              )}
            </div>
            
            {/* Versão mobile da linha - Card expansível */}
            <div 
              className="sm:hidden border-b border-gray-200 dark:border-gray-700"
              onClick={() => toggleRowExpand(rowKey)}
            >
              <div className="p-3">
                {/* Cabeçalho do card mobile */}
                <div className="flex justify-between items-center mb-1">
                  {/* Campo 1 - Título principal */}
                  <div className="font-medium">
                    {highPriorityColumns[0]?.mobileRenderer 
                      ? highPriorityColumns[0].mobileRenderer(item, index)
                      : highPriorityColumns[0]?.cell 
                        ? highPriorityColumns[0].cell(item, index) 
                        : (item as any)[highPriorityColumns[0]?.key || '']}
                  </div>
                  
                  {/* Campo 2 - Valor secundário importante */}
                  {highPriorityColumns[1] && (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {highPriorityColumns[1]?.mobileRenderer 
                        ? highPriorityColumns[1].mobileRenderer(item, index)
                        : highPriorityColumns[1]?.cell 
                          ? highPriorityColumns[1].cell(item, index) 
                          : (item as any)[highPriorityColumns[1]?.key || '']}
                    </div>
                  )}
                  
                  {/* Ícone de expansão */}
                  <div className="ml-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                
                {/* Campo 3 - Informação adicional visível mesmo sem expandir */}
                {highPriorityColumns[2] && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {highPriorityColumns[2]?.mobileRenderer 
                      ? highPriorityColumns[2].mobileRenderer(item, index)
                      : highPriorityColumns[2]?.cell 
                        ? highPriorityColumns[2].cell(item, index) 
                        : (item as any)[highPriorityColumns[2]?.key || '']}
                  </div>
                )}
                
                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {/* Outros campos */}
                    {columns
                      .filter(col => !highPriorityColumns.slice(0, 3).includes(col))
                      .map(column => (
                        <div key={`mobile-${rowKey}-${column.key}`} className="mb-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{column.header}</div>
                          <div className="text-sm">
                            {column.mobileRenderer 
                              ? column.mobileRenderer(item, index)
                              : column.cell 
                                ? column.cell(item, index) 
                                : (item as any)[column.key]}
                          </div>
                        </div>
                      ))}
                    
                    {/* Ações */}
                    {actions && actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                        {actions.map((action, actionIndex) => (
                          (!action.isVisible || action.isVisible(item)) && (
                            <button
                              key={actionIndex}
                              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick(item);
                              }}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
} 