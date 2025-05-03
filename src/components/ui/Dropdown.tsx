import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  label?: string;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
  buttonClassName?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  divider?: boolean;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  trigger,
  label = 'Opções',
  align = 'left',
  width = 'w-48',
  className = '',
  buttonClassName = '',
  buttonVariant = 'outline',
  divider = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Variantes do botão
  const buttonVariants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fechar dropdown com ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {trigger ? (
        <div onClick={toggleDropdown} className={`cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          className={`inline-flex justify-center items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            buttonVariants[buttonVariant]
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
        >
          {label}
          <ChevronDown size={16} className="ml-2" />
        </button>
      )}

      {isOpen && (
        <div 
          className={`absolute z-10 mt-2 ${width} rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {items.map((item, index) => (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  className={`${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${
                    item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
                  } group flex items-center w-full px-4 py-2 text-sm`}
                  onClick={() => {
                    if (!item.disabled && item.onClick) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.label}
                </button>
                {divider && index < items.length - 1 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown; 