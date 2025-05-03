import React, { ReactNode } from 'react';

type Direction = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type Justify = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
type Align = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
type Wrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type Gap = 'none' | 'sm' | 'md' | 'lg';

interface FlexProps {
  children: ReactNode;
  direction?: Direction;
  justify?: Justify;
  align?: Align;
  wrap?: Wrap;
  gap?: Gap;
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = 'nowrap',
  gap = 'none',
  className = '',
}) => {
  const getDirectionClass = () => {
    switch (direction) {
      case 'row':
        return 'flex-row';
      case 'column':
        return 'flex-col';
      case 'row-reverse':
        return 'flex-row-reverse';
      case 'column-reverse':
        return 'flex-col-reverse';
      default:
        return 'flex-row';
    }
  };

  const getJustifyClass = () => {
    switch (justify) {
      case 'start':
        return 'justify-start';
      case 'end':
        return 'justify-end';
      case 'center':
        return 'justify-center';
      case 'between':
        return 'justify-between';
      case 'around':
        return 'justify-around';
      case 'evenly':
        return 'justify-evenly';
      default:
        return 'justify-start';
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case 'start':
        return 'items-start';
      case 'end':
        return 'items-end';
      case 'center':
        return 'items-center';
      case 'baseline':
        return 'items-baseline';
      case 'stretch':
        return 'items-stretch';
      default:
        return 'items-start';
    }
  };

  const getWrapClass = () => {
    switch (wrap) {
      case 'nowrap':
        return 'flex-nowrap';
      case 'wrap':
        return 'flex-wrap';
      case 'wrap-reverse':
        return 'flex-wrap-reverse';
      default:
        return 'flex-nowrap';
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
        return 'gap-0';
    }
  };

  return (
    <div 
      className={`flex ${getDirectionClass()} ${getJustifyClass()} ${getAlignClass()} ${getWrapClass()} ${getGapClass()} ${className}`}
    >
      {children}
    </div>
  );
};

export default Flex; 