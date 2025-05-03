import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  label?: string;
  helperText?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'py-1 text-xs',
  md: 'py-2 text-sm',
  lg: 'py-3 text-base',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>((
  {
    options,
    label,
    helperText,
    error,
    size = 'md',
    fullWidth = false,
    className,
    id,
    ...props
  },
  ref
) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;
  
  const baseSelectStyles = 'block appearance-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 text-gray-900';
  const errorSelectStyles = 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={twMerge(
            baseSelectStyles,
            sizeClasses[size],
            hasError ? errorSelectStyles : '',
            fullWidth ? 'w-full' : '',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-description` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDown size={16} />
        </div>
      </div>
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500" id={`${selectId}-description`}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600" id={`${selectId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select; 