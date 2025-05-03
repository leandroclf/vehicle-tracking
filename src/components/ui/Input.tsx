import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    id,
    ...props
  },
  ref
) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;
  
  const baseInputStyles = 'block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
  const errorInputStyles = 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(
            baseInputStyles,
            hasError ? errorInputStyles : '',
            leftIcon ? 'pl-10' : '',
            rightIcon ? 'pr-10' : '',
            fullWidth ? 'w-full' : '',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-description` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500" id={`${inputId}-description`}>
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600" id={`${inputId}-error`}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;