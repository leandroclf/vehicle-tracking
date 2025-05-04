"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ title, children, footer, className, elevated = false }: CardProps) {
  return (
    <div 
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 overflow-hidden h-full flex flex-col',
        elevated && 'shadow-md dark:shadow-gray-900/30',
        className
      )}
    >
      {title && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          {typeof title === 'string' ? (
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          {footer}
        </div>
      )}
    </div>
  );
}

// Exportação padrão para compatibilidade com importações existentes
export default Card;