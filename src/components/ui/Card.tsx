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
        'rounded-lg border border-border bg-card text-card-foreground overflow-hidden h-full flex flex-col',
        elevated && 'shadow-md',
        className
      )}
    >
      {title && (
        <div className="p-4 border-b border-border bg-muted/40">
          {typeof title === 'string' ? (
            <h3 className="text-base font-medium">{title}</h3>
          ) : (
            title
          )}
        </div>
      )}
      
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
      
      {footer && (
        <div className="p-4 border-t border-border bg-muted/40">
          {footer}
        </div>
      )}
    </div>
  );
}

// Exportação padrão para compatibilidade com importações existentes
export default Card;