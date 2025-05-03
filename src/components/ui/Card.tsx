import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  bordered?: boolean;
  elevated?: boolean;
}

export const Card = ({
  title,
  subtitle,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  bordered = true,
  elevated = false,
}: CardProps) => {
  return (
    <div
      className={twMerge(
        'bg-white rounded-lg overflow-hidden',
        bordered ? 'border border-gray-200' : '',
        elevated ? 'shadow-md' : '',
        className
      )}
    >
      {(title || subtitle) && (
        <div className={twMerge('px-4 py-3 border-b border-gray-200', headerClassName)}>
          {title && (
            typeof title === 'string' 
              ? <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              : title
          )}
          {subtitle && (
            typeof subtitle === 'string'
              ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              : subtitle
          )}
        </div>
      )}
      <div className={twMerge('px-4 py-4', bodyClassName)}>
        {children}
      </div>
      {footer && (
        <div className={twMerge('px-4 py-3 bg-gray-50 border-t border-gray-200', footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;