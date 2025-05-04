import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((data: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (data: T) => void;
  isLoading?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  idKey?: keyof T;
  className?: string;
  emptyMessage?: string;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  isLoading = false,
  pagination = false,
  itemsPerPage = 10,
  idKey = 'id',
  className = '',
  emptyMessage = 'Nenhum dado encontrado',
}: TableProps<T>) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null,
  });
  
  const [currentPage, setCurrentPage] = useState(1);

  // Função para ordenar dados
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key && sortConfig.direction) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];
        
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortConfig.direction === 'asc' 
            ? (aValue > bValue ? 1 : -1)
            : (aValue < bValue ? 1 : -1);
        }
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, pagination, currentPage, itemsPerPage]);

  // Total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  // Função para alternar ordenação
  const requestSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    setSortConfig({ key, direction });
  };

  // Renderiza célula com accessor como função ou chave
  const renderCell = (column: TableColumn<T>, item: T) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    return item[column.accessor] as React.ReactNode;
  };

  // Navegação de páginas
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Esqueleto de carregamento
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className={`min-w-full divide-y divide-border ${className}`}>
          <thead className="bg-muted">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Tabela vazia
  if (data.length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <table className={`min-w-full divide-y divide-border ${className}`}>
          <thead className="bg-muted">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="text-center py-6 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-border ${className}`}>
          <thead className="bg-muted">
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider ${column.className || ''}`}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && (
                      <button
                        className="ml-2 focus:outline-none"
                        onClick={() => requestSort(column.accessor as keyof T)}
                      >
                        {sortConfig.key === column.accessor ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : sortConfig.direction === 'desc' ? (
                            <ChevronDown size={16} />
                          ) : null
                        ) : (
                          <div className="h-4 w-4 opacity-0"></div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {paginatedData.map((item, index) => (
              <tr 
                key={`${item[idKey]}-${index}`}
                className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex} 
                    className={`px-6 py-4 whitespace-nowrap text-foreground ${column.className || ''}`}
                  >
                    {renderCell(column, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {pagination && totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, data.length)}
                </span> de{' '}
                <span className="font-medium">{data.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <span className="sr-only">Primeira</span>
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft size={16} />
                </button>

                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-300'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Última</span>
                  <ChevronsRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table; 