"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  border?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

const CardComponent: React.FC<CardProps> = ({
  className = '',
  children,
  header,
  footer,
  padding = 'md',
  rounded = true,
  border = true,
  shadow = 'md',
  hoverable = false,
  onClick,
}) => {
  // Mapear tamanhos de padding
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  // Mapear tamanhos de sombra
  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800',
        rounded && 'rounded-lg',
        border && 'border border-gray-200 dark:border-gray-700',
        shadowClasses[shadow],
        hoverable && 'transition-transform duration-200 hover:scale-[1.01] cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {header && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export const Card = CardComponent;
export default CardComponent;

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
          try {
            return React.cloneElement(child as React.ReactElement<any>, {
              className: cn(
                'min-h-[44px] min-w-[44px] flex items-center justify-center',
                child.props.className || ''
              )
            });
          } catch (e) {
            // Fallback em caso de erro ao clonar
            return child;
          }
        }
        return child;
      })}
    </div>
  )
);

CardActions.displayName = "CardActions";

// Exportar componentes de forma individual para evitar duplicação
export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardActions
};