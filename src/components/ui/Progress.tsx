import React from 'react';
import { twMerge } from 'tailwind-merge';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

const colorClasses = {
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  danger: 'bg-red-600',
  info: 'bg-cyan-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'primary',
  className,
  valueClassName,
  labelClassName,
}: ProgressProps) {
  // Certifica-se de que o valor está entre 0 e max
  const normalizedValue = Math.max(0, Math.min(value, max));
  
  // Calcula a porcentagem do progresso
  const percentage = (normalizedValue / max) * 100;
  
  return (
    <div className={twMerge('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <div className={twMerge('text-sm font-medium text-gray-700', labelClassName)}>
              {label}
            </div>
          )}
          {showValue && (
            <div className={twMerge('text-sm font-medium text-gray-500', valueClassName)}>
              {normalizedValue}/{max}
            </div>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          role="progressbar"
          className={twMerge(`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-in-out`)}
          style={{ width: `${percentage}%` }}
          aria-valuenow={normalizedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
        />
      </div>
    </div>
  );
}

export default Progress; 