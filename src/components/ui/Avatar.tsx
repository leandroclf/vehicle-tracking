import React from 'react';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  border?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name,
  size = 'md',
  shape = 'circle',
  status,
  border = false,
  className,
}) => {
  const getInitials = (name: string) => {
    if (!name) return '';
    
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };
  
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-md';
  const sizeClass = sizeClasses[size];
  const borderClass = border ? 'border-2 border-white' : '';
  
  return (
    <div className="relative inline-flex flex-shrink-0">
      {src ? (
        <img
          src={src}
          alt={alt}
          className={twMerge(`${sizeClass} ${shapeClass} ${borderClass} object-cover`, className)}
        />
      ) : (
        <div 
          className={twMerge(
            `${sizeClass} ${shapeClass} ${borderClass} bg-blue-500 text-white flex items-center justify-center font-medium`, 
            className
          )}
          aria-label={name || alt}
        >
          {name ? getInitials(name) : ''}
        </div>
      )}
      
      {status && (
        <span 
          className={twMerge(
            `absolute block rounded-full ${statusColors[status]}`,
            size === 'xs' ? 'w-1.5 h-1.5 right-0 bottom-0' : 'w-2.5 h-2.5 -right-0.5 -bottom-0.5 ring-2 ring-white'
          )}
        />
      )}
    </div>
  );
};

export default Avatar; 