'use client';

import { useState } from 'react';

interface SkipToContentProps {
  contentId?: string;
}

export function SkipToContent({ contentId = 'main-content' }: SkipToContentProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Encontrar o elemento de conteúdo principal
    const mainContent = document.getElementById(contentId);
    
    // Se encontrado, definir foco nele
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      
      // Remover o tabindex após o foco para não afetar a navegação normal
      setTimeout(() => {
        mainContent.removeAttribute('tabindex');
      }, 100);
    }
  };

  return (
    <a
      href={`#${contentId}`}
      onClick={handleClick}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={`
        sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50
        bg-primary text-primary-foreground px-4 py-2 rounded-md
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${isFocused ? 'shadow-lg' : ''}
      `}
    >
      Pular para o conteúdo principal
    </a>
  );
}