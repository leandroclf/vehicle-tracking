import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((
  {
    label,
    helperText,
    error,
    className,
    id,
    indeterminate = false,
    ...props
  },
  ref
) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;

  const handleRef = (element: HTMLInputElement) => {
    if (element) {
      element.indeterminate = indeterminate;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    }
  };
  
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          ref={handleRef}
          id={checkboxId}
          type="checkbox"
          className={twMerge(
            'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
            hasError ? 'border-red-300 focus:ring-red-500' : '',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${checkboxId}-error` : helperText ? `${checkboxId}-description` : undefined}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        {label && (
          <label htmlFor={checkboxId} className="font-medium text-gray-700">
            {label}
          </label>
        )}
        {helperText && !hasError && (
          <p className="text-gray-500" id={`${checkboxId}-description`}>
            {helperText}
          </p>
        )}
        {hasError && (
          <p className="text-red-600" id={`${checkboxId}-error`}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox; 