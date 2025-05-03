import React from 'react';
import { twMerge } from 'tailwind-merge';

interface SkipLinkProps {
  targetId: string;
  className?: string;
  children?: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  className,
  children = 'Pular para o conteúdo principal',
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={twMerge(
        'sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-blue-700 focus:shadow-lg focus:border focus:border-blue-500 focus:rounded-md',
        className
      )}
    >
      {children}
    </a>
  );
};

export default SkipLink; 