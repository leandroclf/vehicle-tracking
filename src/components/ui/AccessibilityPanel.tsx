'use client';

import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { Switch } from './Switch';
import { Slider } from './Slider';
import { Eye, EyeOff, Type, ZoomIn, Contrast, Moon, Sun, PanelLeftClose, PanelLeftOpen, HelpCircle, Accessibility } from 'lucide-react';
import { useKeyboardNavigation } from './KeyboardNavigationProvider';

interface AccessibilityPanelProps {
  onClose?: () => void;
}

export function AccessibilityPanel({ onClose }: AccessibilityPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textSpacing, setTextSpacing] = useState(false);
  const [focusIndicators, setFocusIndicators] = useState(true);
  const [fontScale, setFontScale] = useState(100);
  const [showTutorial, setShowTutorial] = useState(false);
  const { registerShortcut, unregisterShortcut } = useKeyboardNavigation();
  const tutorialRef = useRef<HTMLDivElement>(null);
  
  // Adicionar estilos CSS para animação e feedback visual
  useEffect(() => {
    // Adicionar estilos para animação de pulso lenta
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-slow {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      .animate-pulse-slow {
        animation: pulse-slow 3s ease-in-out infinite;
      }
      .accessibility-shortcut-activated {
        transform: scale(1.2);
        transition: transform 0.3s ease;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Aplicar configurações de acessibilidade
  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setHighContrast(settings.highContrast || false);
      setLargeText(settings.largeText || false);
      setReducedMotion(settings.reducedMotion || false);
      setTextSpacing(settings.textSpacing || false);
      setFocusIndicators(settings.focusIndicators !== undefined ? settings.focusIndicators : true);
      setFontScale(settings.fontScale || 100);
    }
    
    // Verificar se o tutorial já foi exibido antes
    const tutorialShown = localStorage.getItem('accessibility-tutorial-shown');
    if (!tutorialShown) {
      setShowTutorial(true);
      localStorage.setItem('accessibility-tutorial-shown', 'true');
    }
    
    // Registrar atalho de teclado Alt+A com feedback visual
    const handleAltA = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        
        // Feedback visual quando o atalho é acionado
        const accessButton = document.querySelector('.accessibility-button');
        if (accessButton) {
          accessButton.classList.add('accessibility-shortcut-activated');
          setTimeout(() => {
            accessButton.classList.remove('accessibility-shortcut-activated');
          }, 300);
        }
      }
    };
    
    window.addEventListener('keydown', handleAltA);
    registerShortcut('a', () => setIsOpen(prev => !prev), 'Abrir painel de acessibilidade');
    
    // Aplicar configurações ao carregar
    applyAccessibilitySettings();
    
    return () => {
      window.removeEventListener('keydown', handleAltA);
      unregisterShortcut('a');
    };
  }, [registerShortcut, unregisterShortcut]);
  
  // Aplicar configurações quando alteradas
  useEffect(() => {
    applyAccessibilitySettings();
    saveSettings();
  }, [highContrast, largeText, reducedMotion, textSpacing, focusIndicators, fontScale]);
  
  // Fechar tutorial ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tutorialRef.current && !tutorialRef.current.contains(event.target as Node)) {
        setShowTutorial(false);
      }
    };

    if (showTutorial) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTutorial]);
  
  // Salvar configurações no localStorage
  const saveSettings = () => {
    const settings = {
      highContrast,
      largeText,
      reducedMotion,
      textSpacing,
      focusIndicators,
      fontScale
    };
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  };
  
  // Aplicar configurações de acessibilidade ao DOM
  const applyAccessibilitySettings = () => {
    const htmlElement = document.documentElement;
    
    // Alto contraste
    if (highContrast) {
      htmlElement.classList.add('high-contrast-mode');
    } else {
      htmlElement.classList.remove('high-contrast-mode');
    }
    
    // Texto grande
    if (largeText) {
      htmlElement.classList.add('large-text-mode');
    } else {
      htmlElement.classList.remove('large-text-mode');
    }
    
    // Movimento reduzido
    if (reducedMotion) {
      htmlElement.classList.add('reduced-motion');
    } else {
      htmlElement.classList.remove('reduced-motion');
    }
    
    // Espaçamento de texto
    if (textSpacing) {
      htmlElement.classList.add('increased-spacing');
    } else {
      htmlElement.classList.remove('increased-spacing');
    }
    
    // Indicadores de foco
    if (focusIndicators) {
      htmlElement.classList.add('focus-visible');
    } else {
      htmlElement.classList.remove('focus-visible');
    }
    
    // Escala de fonte
    htmlElement.style.setProperty('--font-scale', `${fontScale}%`);
  };
  
  // Resetar configurações para o padrão
  const resetSettings = () => {
    setHighContrast(false);
    setLargeText(false);
    setReducedMotion(false);
    setTextSpacing(false);
    setFocusIndicators(true);
    setFontScale(100);
  };
  
  // Alternar painel
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };
  
  // Fechar painel
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Botão flutuante de acessibilidade - redesenhado para maior visibilidade */}
      <Tooltip content="Acessibilidade (Alt+A)">
        <button
          onClick={togglePanel}
          className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 transition-all animate-pulse-slow accessibility-button"
          aria-label="Abrir configurações de acessibilidade (Alt+A)"
          style={{ boxShadow: '0 0 15px rgba(37, 99, 235, 0.7)' }}
        >
          <Accessibility className="h-6 w-6" />
          <span className="sr-only">Pressione Alt+A para abrir</span>
        </button>
      </Tooltip>
      
      {/* Tutorial de primeira utilização - aprimorado */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[51] flex items-center justify-center p-4">
          <div 
            ref={tutorialRef}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in border-2 border-blue-500"
            role="dialog"
            aria-labelledby="tutorial-title"
          >
            <div className="flex items-center mb-4">
              <HelpCircle className="h-8 w-8 text-blue-500 mr-2" />
              <h2 id="tutorial-title" className="text-xl font-semibold">Recursos de Acessibilidade</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-base">Bem-vindo aos recursos de acessibilidade do sistema! Aqui você pode:</p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Alto Contraste:</strong> Aumenta o contraste de cores para melhor legibilidade</li>
                <li><strong>Texto Grande:</strong> Aumenta o tamanho do texto em toda a interface</li>
                <li><strong>Escala de Fonte:</strong> Ajuste o tamanho da fonte conforme sua preferência</li>
                <li><strong>Movimento Reduzido:</strong> Reduz ou elimina animações e transições</li>
                <li><strong>Espaçamento de Texto:</strong> Ajusta o espaçamento entre linhas e parágrafos</li>
                <li><strong>Indicadores de Foco:</strong> Destaca elementos selecionados para navegação por teclado</li>
              </ul>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 mt-2">
                <p className="font-semibold flex items-center"><HelpCircle className="h-4 w-4 mr-2" /> Dicas rápidas:</p>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  <li>Use o atalho <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Alt+A</kbd> para abrir o painel a qualquer momento</li>
                  <li>O botão de acessibilidade estará sempre visível no canto inferior direito</li>
                  <li>Suas configurações serão salvas automaticamente para futuras visitas</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="secondary" 
                onClick={() => setShowTutorial(false)}
                className="w-full"
              >
                Fechar
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  setShowTutorial(false);
                  setIsOpen(true);
                }}
                className="w-full ml-2"
              >
                Abrir Painel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Painel de acessibilidade */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-labelledby="accessibility-title"
      >
        <Card className="h-full flex flex-col overflow-hidden border-l border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 id="accessibility-title" className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <Accessibility className="mr-2 h-5 w-5 text-blue-500" />
              Acessibilidade
            </h2>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleClose}
              aria-label="Fechar painel de acessibilidade"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* Alto Contraste */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Contrast className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                  <label htmlFor="high-contrast" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alto Contraste
                  </label>
                </div>
                <Switch 
                  id="high-contrast" 
                  checked={highContrast} 
                  onCheckedChange={setHighContrast}
                  aria-label="Ativar alto contraste"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aumenta o contraste de cores para melhor legibilidade.
              </p>
            </div>
            
            {/* Texto Grande */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Type className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                  <label htmlFor="large-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Texto Grande
                  </label>
                </div>
                <Switch 
                  id="large-text" 
                  checked={largeText} 
                  onCheckedChange={setLargeText}
                  aria-label="Ativar texto grande"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aumenta o tamanho do texto em toda a interface.
              </p>
            </div>
            
            {/* Escala de Fonte */}
            <div className="space-y-2">
              <div className="flex items-center">
                <ZoomIn className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                <label htmlFor="font-scale" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Escala de Fonte: {fontScale}%
                </label>
              </div>
              <Slider
                id="font-scale"
                min={80}
                max={150}
                step={5}
                value={[fontScale]}
                onValueChange={(value: number[]) => setFontScale(value[0])}
                aria-label="Ajustar escala de fonte"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ajuste o tamanho da fonte conforme sua preferência.
              </p>
            </div>
            
            {/* Movimento Reduzido */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                  <label htmlFor="reduced-motion" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Movimento Reduzido
                  </label>
                </div>
                <Switch 
                  id="reduced-motion" 
                  checked={reducedMotion} 
                  onCheckedChange={setReducedMotion}
                  aria-label="Ativar movimento reduzido"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reduz ou elimina animações e transições.
              </p>
            </div>
            
            {/* Espaçamento de Texto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Type className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                  <label htmlFor="text-spacing" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Espaçamento de Texto
                  </label>
                </div>
                <Switch 
                  id="text-spacing" 
                  checked={textSpacing} 
                  onCheckedChange={setTextSpacing}
                  aria-label="Ativar espaçamento de texto aumentado"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aumenta o espaçamento entre linhas e parágrafos.
              </p>
            </div>
            
            {/* Indicadores de Foco */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Eye className="h-5 w-5 text-gray-700 dark:text-gray-300 mr-2" />
                  <label htmlFor="focus-indicators" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Indicadores de Foco
                  </label>
                </div>
                <Switch 
                  id="focus-indicators" 
                  checked={focusIndicators} 
                  onCheckedChange={setFocusIndicators}
                  aria-label="Ativar indicadores de foco visíveis"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Destaca visualmente o elemento em foco ao navegar pelo teclado.
              </p>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-semibold">Dica:</span> Pressione Alt+A para abrir ou fechar este painel a qualquer momento.
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="info" 
              className="w-full justify-center"
              onClick={resetSettings}
              aria-label="Restaurar configurações padrão"
            >
              Restaurar Padrões
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Estilos globais para acessibilidade */}
      <style jsx global>{`
        /* Alto contraste */
        .high-contrast-mode {
          --background: white;
          --foreground: black;
          --primary: #0000FF;
          --primary-foreground: white;
          --muted: #f0f0f0;
          --muted-foreground: black;
          --border: black;
        }
        
        .dark .high-contrast-mode {
          --background: black;
          --foreground: white;
          --primary: #FFFF00;
          --primary-foreground: black;
          --muted: #333333;
          --muted-foreground: white;
          --border: white;
        }
        
        /* Texto grande */
        .large-text-mode {
          font-size: 120%;
        }
        
        /* Escala de fonte */
        :root {
          --font-scale: 100%;
        }
        
        html {
          font-size: var(--font-scale);
        }
        
        /* Movimento reduzido */
        .reduced-motion * {
          animation-duration: 0.001ms !important;
          transition-duration: 0.001ms !important;
        }
        
        /* Espaçamento de texto */
        .increased-spacing {
          --line-height-multiplier: 1.5;
          --letter-spacing: 0.05em;
        }
        
        .increased-spacing p, 
        .increased-spacing li,
        .increased-spacing h1,
        .increased-spacing h2,
        .increased-spacing h3,
        .increased-spacing h4,
        .increased-spacing h5,
        .increased-spacing h6 {
          line-height: calc(1.5 * var(--line-height-multiplier));
          letter-spacing: var(--letter-spacing);
        }
        
        /* Indicadores de foco */
        .focus-visible :focus-visible {
          outline: 3px solid var(--primary) !important;
          outline-offset: 2px !important;
        }
        
        /* Animação de fade-in para o tutorial */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}