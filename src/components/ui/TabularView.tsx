'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from './Tooltip';
import { ActionMenu, ActionMenuContent, ActionMenuItem, ActionMenuButton } from './ActionMenu';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string);
  cell?: (row: T) => React.ReactNode;
}

export interface TabularViewProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
  actions?: {
    exportData?: boolean;
    customActions?: React.ReactNode;
  };
  pagination?: {
    pageSize: number;
    pageIndex: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
  emptyState?: React.ReactNode;
  className?: string;
}

export function TabularView<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  onRowClick,
  rowClassName,
  actions,
  pagination,
  emptyState,
  className
}: TabularViewProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | ((row: T) => any) | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    setSortConfig((prev) => {
      if (prev.key === column.accessorKey) {
        return {
          key: column.accessorKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        key: column.accessorKey,
        direction: 'asc',
      };
    });
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortConfig.key === column.accessorKey) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      );
    }
    return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
  };

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.cell) {
      return column.cell(row);
    }

    if (typeof column.accessorKey === 'function') {
      return column.accessorKey(row);
    }

    return row[column.accessorKey as keyof T];
  };

  const getCellClassName = (row: T, column: Column<T>) => {
    if (typeof column.cellClassName === 'function') {
      return column.cellClassName(row);
    }
    return column.cellClassName || '';
  };

  const getRowClassName = (row: T) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row);
    }
    return rowClassName || '';
  };

  // Renderização dos dados em tabela com acessibilidade
  return (
    <div className={cn("relative w-full overflow-auto", className)}>
      {actions && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Tooltip content="Filtrar dados">
              <button className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>
          
          <div className="flex items-center space-x-2">
            {actions.customActions}
            
            {actions.exportData && (
              <Tooltip content="Exportar dados">
                <button className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Download className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}
      
      <div className="relative border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
            <StatusBadge variant="info" pulse>Carregando...</StatusBadge>
          </div>
        )}
        
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    "p-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700",
                    column.sortable && "cursor-pointer select-none",
                    column.headerClassName
                  )}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && getSortIcon(column)}
                  </div>
                </th>
              ))}
              <th className="w-10 p-3 border-b border-gray-200 dark:border-gray-700"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyState || "Nenhum dado encontrado"}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={cn(
                    "group",
                    onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    getRowClassName(row)
                  )}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "p-3 align-middle",
                        getCellClassName(row, column)
                      )}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                  <td className="p-3 text-right">
                    <ActionMenuButton>
                      <ActionMenuContent align="end">
                        <ActionMenuItem onSelect={() => console.log("Visualizar", row)}>
                          Visualizar
                        </ActionMenuItem>
                        <ActionMenuItem onSelect={() => console.log("Editar", row)}>
                          Editar
                        </ActionMenuItem>
                        <ActionMenuItem 
                          destructive 
                          onSelect={() => console.log("Excluir", row)}
                        >
                          Excluir
                        </ActionMenuItem>
                      </ActionMenuContent>
                    </ActionMenuButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Página {pagination.pageIndex + 1} de {pagination.pageCount}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              Anterior
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex === pagination.pageCount - 1}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 