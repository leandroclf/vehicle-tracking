'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

interface KeyboardNavigationContextProps {
  isKeyboardMode: boolean;
  setKeyboardMode: (mode: boolean) => void;
  registerShortcut: (key: string, action: () => void, description: string) => void;
  unregisterShortcut: (key: string) => void;
  shortcuts: Record<string, { action: () => void, description: string }>;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextProps>({
  isKeyboardMode: false,
  setKeyboardMode: () => {},
  registerShortcut: () => {},
  unregisterShortcut: () => {},
  shortcuts: {},
});

export const useKeyboardNavigation = () => useContext(KeyboardNavigationContext);

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  const [isKeyboardMode, setKeyboardMode] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, { action: () => void, description: string }>>({});

  // Aplicar CSS quando o modo teclado estiver ativo
  useEffect(() => {
    if (isKeyboardMode) {
      document.body.classList.add('keyboard-navigation');
      
      // Aplicar estilos de foco mais evidentes
      const styleElement = document.createElement('style');
      styleElement.id = 'keyboard-navigation-styles';
      styleElement.innerHTML = `
        .keyboard-navigation *:focus {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
        }
        
        .keyboard-navigation button:focus,
        .keyboard-navigation a:focus,
        .keyboard-navigation [role="button"]:focus,
        .keyboard-navigation input:focus,
        .keyboard-navigation select:focus,
        .keyboard-navigation textarea:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          transition: all 0.2s ease-in-out !important;
        }
      `;
      document.head.appendChild(styleElement);
    } else {
      document.body.classList.remove('keyboard-navigation');
      const styleElement = document.getElementById('keyboard-navigation-styles');
      if (styleElement) {
        styleElement.remove();
      }
    }
    
    // Carregar preferência do localStorage
    const savedKeyboardMode = localStorage.getItem('yukz-keyboard-mode');
    if (savedKeyboardMode === 'true') {
      setKeyboardMode(true);
    }
    
    // Detectar quando o usuário começa a usar o teclado
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardMode(true);
        localStorage.setItem('yukz-keyboard-mode', 'true');
        window.removeEventListener('keydown', handleFirstTab);
      }
    };
    
    window.addEventListener('keydown', handleFirstTab);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      const styleElement = document.getElementById('keyboard-navigation-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [isKeyboardMode]);
  
  // Gerenciar os atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar atalhos quando estiver em campos de entrada
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        return;
      }
      
      // Verificar Ctrl/Cmd + key
      if ((e.ctrlKey || e.metaKey) && shortcuts[e.key.toLowerCase()]) {
        e.preventDefault();
        shortcuts[e.key.toLowerCase()].action();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
  
  // Registrar um novo atalho
  const registerShortcut = (key: string, action: () => void, description: string) => {
    setShortcuts(prev => ({
      ...prev,
      [key.toLowerCase()]: { action, description }
    }));
  };
  
  // Remover um atalho
  const unregisterShortcut = (key: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[key.toLowerCase()];
      return newShortcuts;
    });
  };
  
  return (
    <KeyboardNavigationContext.Provider value={{
      isKeyboardMode,
      setKeyboardMode,
      registerShortcut,
      unregisterShortcut,
      shortcuts
    }}>
      {children}
      {isKeyboardMode && (
        <div
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          Modo de navegação por teclado ativado
        </div>
      )}
    </KeyboardNavigationContext.Provider>
  );
} 