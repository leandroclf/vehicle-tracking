import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  outline?: boolean;
  dot?: boolean;
  className?: string;
  onClick?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  outline = false,
  dot = false,
  className = '',
  onClick,
}) => {
  // Mapeia as variantes para as cores do Tailwind
  const variantClasses = {
    default: outline
      ? 'bg-transparent text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    primary: outline
      ? 'bg-transparent text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    success: outline
      ? 'bg-transparent text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    warning: outline
      ? 'bg-transparent text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400'
      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    danger: outline
      ? 'bg-transparent text-red-600 dark:text-red-400 border-red-600 dark:border-red-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    info: outline
      ? 'bg-transparent text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
  };

  // Cores para o indicador de ponto
  const dotColors = {
    default: 'bg-gray-500 dark:bg-gray-400',
    primary: 'bg-blue-500 dark:bg-blue-400',
    success: 'bg-green-500 dark:bg-green-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    danger: 'bg-red-500 dark:bg-red-400',
    info: 'bg-indigo-500 dark:bg-indigo-400',
  };

  // Dimensões com base no tamanho
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Concatena as classes para o badge
  const badgeClasses = `
    inline-flex items-center font-medium
    ${outline ? 'border ' : ''}
    ${rounded ? 'rounded-full' : 'rounded'}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
    ${className}
  `;

  return (
    <span 
      className={badgeClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {dot && (
        <span 
          className={`mr-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export default Badge; 