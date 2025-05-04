'use client';

import { useEffect, useState } from 'react';
import { Command, Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcut } from './ContextualNavigation';

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

interface KeyboardShortcutsProps {
  className?: string;
}

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  const [isHelpVisible, setIsHelpVisible] = useState(false);

  // Configurar atalho para mostrar/ocultar ajuda de atalhos
  useKeyboardShortcut('?', () => setIsHelpVisible(prev => !prev), { shift: true });

  // Fechar com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpVisible) {
        e.preventDefault();
        setIsHelpVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpVisible]);

  // Definição dos grupos de atalhos
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navegação Global',
      shortcuts: [
        { keys: ['Shift', '?'], description: 'Mostrar/ocultar ajuda de atalhos' },
        { keys: ['Alt', '/'], description: 'Abrir pesquisa global' },
        { keys: ['Alt', 'Home'], description: 'Ir para o dashboard' },
      ]
    },
    {
      title: 'Navegação de Seções',
      shortcuts: [
        { keys: ['Alt', 'v'], description: 'Ir para Veículos' },
        { keys: ['Alt', 'g'], description: 'Ir para Geocercas' },
        { keys: ['Alt', 'a'], description: 'Ir para Alertas' },
        { keys: ['Alt', 'r'], description: 'Ir para Relatórios' },
      ]
    },
    {
      title: 'Ações Comuns',
      shortcuts: [
        { keys: ['Alt', 'n'], description: 'Novo item' },
        { keys: ['Alt', 's'], description: 'Salvar' },
        { keys: ['Alt', 'e'], description: 'Editar' },
        { keys: ['Alt', 'd'], description: 'Excluir' },
      ]
    },
    {
      title: 'Acessibilidade',
      shortcuts: [
        { keys: ['Tab'], description: 'Navegar entre elementos' },
        { keys: ['Shift', 'Tab'], description: 'Navegar para trás' },
        { keys: ['Enter'], description: 'Ativar elemento selecionado' },
        { keys: ['Space'], description: 'Alternar estado (checkbox, botão)' },
        { keys: ['Esc'], description: 'Fechar diálogo ou menu' },
      ]
    },
  ];

  return (
    <>
      {/* Botão para mostrar ajuda de atalhos */}
      <button
        type="button"
        className={`flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-1.5 text-sm ${className}`}
        onClick={() => setIsHelpVisible(true)}
        aria-label="Mostrar atalhos de teclado"
      >
        <Keyboard className="h-4 w-4 mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">Atalhos</span>
        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
          Shift+?
        </span>
      </button>

      {/* Modal de ajuda de atalhos */}
      <AnimatePresence>
        {isHelpVisible && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              aria-hidden="true"
              onClick={() => setIsHelpVisible(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 top-20 mx-auto max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
            >
              {/* Cabeçalho */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 id="keyboard-shortcuts-title" className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Keyboard className="h-5 w-5 mr-2" aria-hidden="true" />
                  Atalhos de Teclado
                </h2>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  onClick={() => setIsHelpVisible(false)}
                  aria-label="Fechar ajuda de atalhos"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Corpo */}
              <div className="max-h-[70vh] overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcutGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{group.title}</h3>
                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut, shortcutIndex) => (
                          <div key={shortcutIndex} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                            <div className="flex items-center space-x-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <span key={keyIndex} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-800 dark:text-gray-200">
                                  {key}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pressione <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded mx-1">Esc</span> para fechar esta janela
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}