'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

interface HighContrastContextProps {
  highContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
}

const HighContrastContext = createContext<HighContrastContextProps>({
  highContrast: false,
  toggleHighContrast: () => {},
  setHighContrast: () => {},
});

export const useHighContrast = () => useContext(HighContrastContext);

interface HighContrastProviderProps {
  children: React.ReactNode;
}

export function HighContrastProvider({ children }: HighContrastProviderProps) {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Carregar preferência do usuário
    const savedHighContrast = localStorage.getItem('yukz-high-contrast');
    if (savedHighContrast === 'true') {
      setHighContrast(true);
    }
  }, []);

  // Atualizar quando a preferência mudar
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
      applyHighContrastStyles();
    } else {
      document.documentElement.classList.remove('high-contrast');
      removeHighContrastStyles();
    }
    
    // Salvar preferência
    localStorage.setItem('yukz-high-contrast', highContrast.toString());
    
    // Anunciar para leitores de tela
    const announce = document.getElementById('contrast-announcer');
    if (announce) {
      announce.textContent = highContrast 
        ? 'Modo de alto contraste ativado' 
        : 'Modo de alto contraste desativado';
    }
  }, [highContrast]);

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const applyHighContrastStyles = () => {
    // Criar um elemento de estilo para o alto contraste
    const styleElement = document.createElement('style');
    styleElement.id = 'high-contrast-styles';
    
    // Estilos de alto contraste
    styleElement.innerHTML = `
      /* Padrões de cores de alto contraste */
      .high-contrast {
        --background: #000000;
        --foreground: #ffffff;
        --card: #0a0a0a;
        --card-foreground: #ffffff;
        --popover: #0a0a0a;
        --popover-foreground: #ffffff;
        --primary: #ffff00;
        --primary-foreground: #000000;
        --secondary: #00ffff;
        --secondary-foreground: #000000;
        --muted: #1a1a1a;
        --muted-foreground: #ffffff;
        --accent: #ffffff;
        --accent-foreground: #000000;
        --destructive: #ff0000;
        --destructive-foreground: #ffffff;
        --border: #ffffff;
        --input: #1a1a1a;
        --ring: #ffff00;
      }

      /* Botões com bordas mais definidas */
      .high-contrast button, 
      .high-contrast [role="button"],
      .high-contrast a {
        border: 2px solid white !important;
        outline: 1px solid black !important;
      }

      /* Foco mais visível */
      .high-contrast *:focus {
        outline: 3px solid #ffff00 !important;
        outline-offset: 3px !important;
      }

      /* Contrastes de texto */
      .high-contrast p, 
      .high-contrast h1, 
      .high-contrast h2, 
      .high-contrast h3, 
      .high-contrast h4, 
      .high-contrast h5, 
      .high-contrast h6,
      .high-contrast span,
      .high-contrast label,
      .high-contrast div {
        color: #ffffff !important;
      }

      /* Formulários com bordas visíveis */
      .high-contrast input,
      .high-contrast select,
      .high-contrast textarea {
        border: 2px solid white !important;
        background-color: black !important;
        color: white !important;
      }

      /* Remover gradientes e efeitos sutis */
      .high-contrast * {
        text-shadow: none !important;
        box-shadow: none !important;
      }
      
      /* Melhorar a visibilidade de links */
      .high-contrast a:not([role="button"]) {
        color: #ffff00 !important;
        text-decoration: underline !important;
      }
      
      /* Ícones mais visíveis */
      .high-contrast svg {
        fill: currentColor !important;
        stroke: currentColor !important;
        stroke-width: 2px !important;
      }
    `;
    
    document.head.appendChild(styleElement);
  };

  const removeHighContrastStyles = () => {
    const styleElement = document.getElementById('high-contrast-styles');
    if (styleElement) {
      styleElement.remove();
    }
  };

  return (
    <HighContrastContext.Provider value={{ highContrast, toggleHighContrast, setHighContrast }}>
      {children}
      <div 
        id="contrast-announcer" 
        role="status" 
        aria-live="polite" 
        className="sr-only"
      />
    </HighContrastContext.Provider>
  );
} 