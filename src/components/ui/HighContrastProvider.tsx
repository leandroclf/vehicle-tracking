'use client';

import * as React from 'react';

// Interface do contexto de alto contraste
interface HighContrastContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
}

// Criar o contexto
const HighContrastContext = React.createContext<HighContrastContextType | undefined>(undefined);

// Hook personalizado para acessar o contexto
export function useHighContrast() {
  const context = React.useContext(HighContrastContext);
  if (!context) {
    throw new Error('useHighContrast deve ser usado dentro de um HighContrastProvider');
  }
  return context;
}

interface HighContrastProviderProps {
  children: React.ReactNode;
}

export function HighContrastProvider({ children }: HighContrastProviderProps) {
  // Estado para controlar o alto contraste
  const [highContrast, setHighContrast] = React.useState(false);

  // Recuperar configuração de alto contraste no carregamento (client-side only)
  React.useEffect(() => {
    const storedValue = localStorage.getItem('high-contrast');
    if (storedValue) {
      setHighContrast(storedValue === 'true');
    }
  }, []);

  // Aplicar classe ao body quando highContrast mudar
  React.useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('high-contrast', highContrast.toString());
  }, [highContrast]);

  // Função para alternar o modo de alto contraste
  const toggleHighContrast = React.useCallback(() => {
    setHighContrast(prev => !prev);
  }, []);

  // Valor do contexto
  const contextValue = React.useMemo(() => ({
    highContrast,
    toggleHighContrast
  }), [highContrast, toggleHighContrast]);

  return (
    <HighContrastContext.Provider value={contextValue}>
      {children}
    </HighContrastContext.Provider>
  );
} 