'use client';

import { Moon, Sun, ZapOff, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useHighContrast } from './HighContrastProvider';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Usar try/catch para evitar erros no cliente se o contexto não estiver disponível
  let highContrast = false;
  let toggleHighContrast = () => {};
  
  try {
    const highContrastContext = useHighContrast();
    highContrast = highContrastContext.highContrast;
    toggleHighContrast = highContrastContext.toggleHighContrast;
  } catch (error) {
    console.error('Erro ao acessar o contexto de alto contraste:', error);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      
      <button
        onClick={toggleHighContrast}
        className={`w-9 h-9 flex items-center justify-center rounded-full ${
          highContrast
            ? 'bg-yellow-500 text-black'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
        } hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        aria-label={highContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'}
      >
        {highContrast ? <ZapOff size={18} /> : <Zap size={18} />}
      </button>
    </div>
  );
} 