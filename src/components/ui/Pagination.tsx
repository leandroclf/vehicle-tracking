import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showSiblings?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showSiblings = 1,
}) => {
  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Adiciona o botão de página anterior
    pages.push(
      <li key="prev">
        <button
          className={twMerge(
            'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
            currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
          )}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <span className="sr-only">Anterior</span>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </li>
    );

    // Determina quais páginas mostrar
    let startPage = Math.max(1, currentPage - showSiblings);
    let endPage = Math.min(totalPages, currentPage + showSiblings);

    // Ajustes para garantir que sempre mostramos 2*showSiblings+1 páginas quando possível
    if (endPage - startPage + 1 < 2 * showSiblings + 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 2 * showSiblings);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 2 * showSiblings);
      }
    }

    // Primeira página
    if (startPage > 1) {
      pages.push(
        <li key={1}>
          <button
            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            onClick={() => goToPage(1)}
            aria-label={`Ir para página 1`}
          >
            1
          </button>
        </li>
      );
      
      // Adiciona elipses se necessário
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis-start" className="px-4 py-2 text-sm text-gray-700">
            ...
          </li>
        );
      }
    }

    // Páginas do meio
    for (let page = startPage; page <= endPage; page++) {
      pages.push(
        <li key={page}>
          <button
            className={twMerge(
              'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0',
              page === currentPage
                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                : 'text-gray-900 hover:bg-gray-50'
            )}
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Página ${page}`}
          >
            {page}
          </button>
        </li>
      );
    }

    // Última página
    if (endPage < totalPages) {
      // Adiciona elipses se necessário
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis-end" className="px-4 py-2 text-sm text-gray-700">
            ...
          </li>
        );
      }
      
      pages.push(
        <li key={totalPages}>
          <button
            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            onClick={() => goToPage(totalPages)}
            aria-label={`Ir para página ${totalPages}`}
          >
            {totalPages}
          </button>
        </li>
      );
    }

    // Adiciona o botão de próxima página
    pages.push(
      <li key="next">
        <button
          className={twMerge(
            'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0',
            currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
          )}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <span className="sr-only">Próxima</span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </li>
    );

    return pages;
  };

  return (
    <nav
      className={twMerge('flex items-center justify-center', className)}
      aria-label="Paginação"
    >
      <ul className="flex -space-x-px">
        {renderPageNumbers()}
      </ul>
    </nav>
  );
};

export default Pagination; 