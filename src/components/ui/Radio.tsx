import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  helperText?: string;
  error?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>((
  {
    options,
    name,
    value,
    onChange,
    label,
    helperText,
    error,
    orientation = 'vertical',
    className,
  },
  ref
) => {
  const groupId = `radio-group-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = !!error;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };
  
  return (
    <div ref={ref} className={twMerge('', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div 
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        className={orientation === 'horizontal' ? 'flex flex-row space-x-4' : 'flex flex-col space-y-2'}
      >
        {options.map((option) => {
          const optionId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center">
              <input
                id={optionId}
                name={name}
                type="radio"
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={handleChange}
                className={twMerge(
                  'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
                  hasError ? 'border-red-300 focus:ring-red-500' : ''
                )}
                aria-invalid={hasError}
              />
              <label
                htmlFor={optionId}
                className={twMerge(
                  'ml-3 block text-sm font-medium text-gray-700',
                  option.disabled ? 'text-gray-400' : ''
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      {helperText && !hasError && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup; 