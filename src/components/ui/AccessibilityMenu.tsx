'use client';

import { useState, useEffect } from 'react';
import { Accessibility, ZapOff, Type, Eye, EyeOff, MousePointer2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useHighContrast } from './HighContrastProvider';

interface AccessibilityMenuProps {
  className?: string;
}

export default function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { highContrast, toggleHighContrast } = useHighContrast();
  const [fontSize, setFontSize] = useState(100); // Porcentagem do tamanho da fonte
  const [keyboardMode, setKeyboardMode] = useState(false);

  // Aplicar tamanho da fonte
  const applyFontSize = (size: number) => {
    setFontSize(size);
    document.documentElement.style.fontSize = `${size}%`;
    localStorage.setItem('yukz-font-size', size.toString());
  };

  // Ativar/desativar modo de navegação por teclado
  const toggleKeyboardMode = () => {
    const newMode = !keyboardMode;
    setKeyboardMode(newMode);
    
    if (newMode) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
    
    localStorage.setItem('yukz-keyboard-mode', newMode ? 'true' : 'false');
  };

  // Carregar preferências salvas
  useEffect(() => {
    // Carregar tamanho da fonte
    const savedFontSize = localStorage.getItem('yukz-font-size');
    if (savedFontSize) {
      applyFontSize(parseInt(savedFontSize));
    }
    
    // Carregar modo de navegação por teclado
    const savedKeyboardMode = localStorage.getItem('yukz-keyboard-mode');
    if (savedKeyboardMode === 'true') {
      setKeyboardMode(true);
      document.body.classList.add('keyboard-navigation');
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Menu de acessibilidade"
        aria-expanded={isOpen}
        aria-controls="accessibility-menu"
      >
        <Accessibility size={18} />
      </button>

      {isOpen && (
        <div
          id="accessibility-menu"
          className="absolute right-0 mt-2 w-64 bg-background rounded-lg shadow-lg p-4 z-50 border border-border"
          role="menu"
          aria-orientation="vertical"
        >
          <h3 className="text-sm font-medium text-foreground mb-3" id="accessibility-heading">
            Opções de Acessibilidade
          </h3>
          
          <ul className="space-y-2" role="group" aria-labelledby="accessibility-heading">
            {/* Alto contraste */}
            <li>
              <button
                onClick={toggleHighContrast}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                role="menuitem"
              >
                <span className="flex items-center">
                  {highContrast ? <ZapOff size={16} className="mr-2" /> : <ZapOff size={16} className="mr-2" />}
                  Alto Contraste
                </span>
                <span className={`px-2 py-1 text-xs rounded ${highContrast ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {highContrast ? 'Ativado' : 'Desativado'}
                </span>
              </button>
            </li>
            
            {/* Tema claro/escuro */}
            <li>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                role="menuitem"
              >
                <span className="flex items-center">
                  {theme === 'dark' ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
                  Tema {theme === 'dark' ? 'Escuro' : 'Claro'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}>
                  Ativado
                </span>
              </button>
            </li>
            
            {/* Tamanho da fonte */}
            <li className="p-2">
              <div className="flex items-center mb-1">
                <Type size={16} className="mr-2" />
                <span>Tamanho do Texto: {fontSize}%</span>
              </div>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => applyFontSize(Math.max(fontSize - 10, 80))}
                  className="px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                  aria-label="Diminuir tamanho do texto"
                  disabled={fontSize <= 80}
                >
                  A-
                </button>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="10"
                  value={fontSize}
                  onChange={(e) => applyFontSize(parseInt(e.target.value))}
                  className="mx-2 w-full accent-primary"
                  aria-label="Ajustar tamanho do texto"
                />
                <button 
                  onClick={() => applyFontSize(Math.min(fontSize + 10, 150))}
                  className="px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                  aria-label="Aumentar tamanho do texto"
                  disabled={fontSize >= 150}
                >
                  A+
                </button>
              </div>
            </li>
            
            {/* Navegação por teclado */}
            <li>
              <button
                onClick={toggleKeyboardMode}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                role="menuitem"
              >
                <span className="flex items-center">
                  <MousePointer2 size={16} className="mr-2" />
                  Navegação por Teclado
                </span>
                <span className={`px-2 py-1 text-xs rounded ${keyboardMode ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {keyboardMode ? 'Ativado' : 'Desativado'}
                </span>
              </button>
            </li>
          </ul>
          
          <div className="mt-4 pt-2 border-t border-border">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              role="menuitem"
            >
              Fechar menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}