import React, { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = true,
  className = '',
}) => {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'xs':
        return 'max-w-xs';
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-lg';
    }
  };

  return (
    <div
      className={`mx-auto w-full ${getMaxWidthClass()} ${
        padding ? 'px-4 sm:px-6' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Container; 