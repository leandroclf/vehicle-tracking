"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'bordered' | 'elevated';
  padding?: 'none' | 'small' | 'normal' | 'large';
  highlight?: boolean;
  interactive?: boolean;
  fullWidth?: boolean;
  mobileStack?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'normal', 
    highlight = false, 
    interactive = false,
    fullWidth = false,
    mobileStack = false,
    children, 
    ...props 
  }, ref) => {
    // Base classes para todos os cards
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    // Classes específicas para cada variante
    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 shadow-sm',
      flat: 'bg-gray-50 dark:bg-gray-900',
      bordered: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-md'
    };
    
    // Adicionar highlight
    const highlightClasses = highlight 
      ? 'border-l-4 border-blue-500 dark:border-blue-400' 
      : '';
    
    // Adicionar interatividade
    const interactiveClasses = interactive 
      ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:shadow-sm' 
      : '';
    
    // Espaçamento interno responsivo
    const paddingClasses = {
      none: 'p-0',
      small: 'p-2 sm:p-3',
      normal: 'p-3 sm:p-4 md:p-5',
      large: 'p-4 sm:p-6 md:p-8'
    };
    
    // Largura responsiva
    const widthClasses = fullWidth ? 'w-full' : '';
    
    // Adaptações para mobile
    const mobileClasses = mobileStack ? 'flex flex-col sm:flex-row' : '';
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          highlightClasses,
          interactiveClasses,
          widthClasses,
          mobileClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
  withBackground?: boolean;
  compact?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withBorder = false, withBackground = false, compact = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6',
          withBorder && 'border-b border-gray-200 dark:border-gray-700',
          withBackground && 'bg-gray-50 dark:bg-gray-900 rounded-t-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: 'sm' | 'md' | 'lg';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-base sm:text-lg font-medium',
      md: 'text-lg sm:text-xl font-semibold',
      lg: 'text-xl sm:text-2xl font-bold'
    };
    
    return (
      <h3
        ref={ref}
        className={cn(
          sizeClasses[size],
          'text-gray-900 dark:text-white tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  noPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, compact = false, noPadding = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        noPadding ? 'p-0' : (compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6'),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
  withBackground?: boolean;
  alignRight?: boolean;
  compact?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ 
    className, 
    withBorder = true, 
    withBackground = false, 
    alignRight = false,
    compact = false,
    children, 
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap gap-3",
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6',
        withBorder && 'border-t border-gray-200 dark:border-gray-700',
        withBackground && 'bg-gray-50 dark:bg-gray-900 rounded-b-lg',
        alignRight ? 'justify-end' : 'justify-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

// Componente responsivo para ações em cards
interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  stackOnMobile?: boolean;
}

const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  ({ className, stackOnMobile = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        stackOnMobile 
          ? "flex flex-col sm:flex-row gap-2 sm:gap-4" 
          : "flex flex-row gap-4",
        "items-center",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          // Adicionar classe para botões e links a fim de garantir área de toque adequada
          return React.cloneElement(child, {
            className: cn(
              'min-h-[44px] min-w-[44px] flex items-center justify-center',
              child.props.className
            )
          });
        }
        return child;
      })}
    </div>
  )
);

CardActions.displayName = "CardActions";

// Exportar todos os componentes
export { 
  Card as default,
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter,
  CardActions
};