'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    type = 'button',
    ...props
  }, ref) => {
    // Mapear variantes para classes
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent',
      link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive',
    };

    // Mapear tamanhos para classes
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 py-3 text-lg',
    };

    // Estado de carregamento
    const loadingState = loading && (
      <span className="absolute inset-0 flex items-center justify-center bg-inherit">
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="sr-only">Carregando...</span>
      </span>
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          // Base
          'relative inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // Variante
          variantClasses[variant],
          // Tamanho
          sizeClasses[size],
          // Largura
          fullWidth ? 'w-full' : '',
          // Estado desabilitado
          (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          // Classe personalizada
          className
        )}
        aria-busy={loading}
        {...props}
      >
        {/* Conteúdo com ícone */}
        <span className={cn('flex items-center', loading ? 'invisible' : '')}>
          {icon && iconPosition === 'left' && <span className="mr-2" aria-hidden="true">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2" aria-hidden="true">{icon}</span>}
        </span>
        
        {/* Indicador de carregamento */}
        {loadingState}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;