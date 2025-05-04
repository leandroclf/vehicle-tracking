'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  outline?: boolean;
  dot?: boolean;
  className?: string;
  onClick?: () => void;
  content?: string;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const BadgeComponent: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  outline = false,
  dot = false,
  className = '',
  onClick,
  content,
  color,
}) => {
  // Se color estiver definido, use-o como variant (para compatibilidade)
  const effectiveVariant = color || variant;
  
  // Mapeia as variantes para as cores do Tailwind com variáveis CSS
  const variantClasses = {
    default: outline
      ? 'bg-transparent text-foreground border-border'
      : 'bg-muted text-muted-foreground',
    primary: outline
      ? 'bg-transparent text-primary border-primary'
      : 'bg-primary/10 text-primary',
    success: outline
      ? 'bg-transparent text-green-600 border-green-600'
      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    warning: outline
      ? 'bg-transparent text-yellow-600 border-yellow-600'
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    danger: outline
      ? 'bg-transparent text-destructive border-destructive'
      : 'bg-destructive/10 text-destructive',
    info: outline
      ? 'bg-transparent text-blue-600 border-blue-600'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  };

  // Cores para o indicador de ponto
  const dotColors = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-destructive',
    info: 'bg-blue-500',
  };

  // Dimensões com base no tamanho
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Se content for fornecido, usá-lo como children
  const displayContent = content || children;

  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium',
        outline && 'border',
        rounded ? 'rounded-full' : 'rounded',
        sizeClasses[size],
        variantClasses[effectiveVariant],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {dot && (
        <span 
          className={cn('mr-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full', dotColors[effectiveVariant])}
          aria-hidden="true"
        />
      )}
      {displayContent}
    </span>
  );
};

export const Badge = BadgeComponent;
export default BadgeComponent; 