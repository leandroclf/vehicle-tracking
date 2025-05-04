'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-t-2 border-b-2'
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div 
      className={twMerge(
        'animate-spin rounded-full border-primary', 
        sizeStyles[size],
        className
      )}
      aria-label="Carregando"
    />
  );
}

export default Spinner; 