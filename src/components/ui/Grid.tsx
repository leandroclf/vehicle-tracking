import React, { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className = '',
}) => {
  const getColsClass = () => {
    switch (cols) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      case 6:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    }
  };

  const getGapClass = () => {
    switch (gap) {
      case 'none':
        return 'gap-0';
      case 'sm':
        return 'gap-2';
      case 'md':
        return 'gap-4';
      case 'lg':
        return 'gap-6';
      default:
        return 'gap-4';
    }
  };

  return (
    <div className={`grid ${getColsClass()} ${getGapClass()} ${className}`}>
      {children}
    </div>
  );
};

export default Grid; 