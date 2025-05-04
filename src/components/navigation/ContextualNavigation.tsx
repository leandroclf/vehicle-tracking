'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, ChevronRight, Command, Search } from 'lucide-react';

// Definição dos tipos para navegação contextual
interface NavigationSection {
  id: string;
  title: string;
  path: string;
  shortcut?: string;
  icon?: ReactNode;
  children?: NavigationSection[];
}

interface NavigationContextType {
  currentSection: string;
  sections: NavigationSection[];
  navigateTo: (path: string) => void;
  openContextMenu: (sectionId: string) => void;
  closeContextMenu: () => void;
  isContextMenuOpen: boolean;
  activeContextMenu: string | null;
}

// Contexto para navegação contextual
const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de um NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
  sections: NavigationSection[];
}

export function NavigationProvider({ children, sections }: NavigationProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentSection, setCurrentSection] = useState<string>('');
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);

  // Atualizar seção atual com base no pathname
  useEffect(() => {
    const findSection = (path: string, sectionList: NavigationSection[]): string => {
      for (const section of sectionList) {
        if (path.startsWith(section.path)) {
          return section.id;
        }
        if (section.children) {
          const childResult = findSection(path, section.children);
          if (childResult) return childResult;
        }
      }
      return '';
    };

    setCurrentSection(findSection(pathname, sections));
  }, [pathname, sections]);

  // Configurar atalhos de teclado globais
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar eventos em campos de entrada
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Atalho Alt+/ para abrir pesquisa global
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        // Disparar evento personalizado para abrir pesquisa global
        window.dispatchEvent(new CustomEvent('open-global-search'));
        return;
      }

      // Verificar atalhos de seção
      if (e.altKey) {
        const findSectionByShortcut = (shortcutKey: string, sectionList: NavigationSection[]): NavigationSection | null => {
          for (const section of sectionList) {
            if (section.shortcut === shortcutKey) {
              return section;
            }
            if (section.children) {
              const childResult = findSectionByShortcut(shortcutKey, section.children);
              if (childResult) return childResult;
            }
          }
          return null;
        };

        const section = findSectionByShortcut(e.key.toLowerCase(), sections);
        if (section) {
          e.preventDefault();
          router.push(section.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, sections]);

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const openContextMenu = (sectionId: string) => {
    setActiveContextMenu(sectionId);
    setIsContextMenuOpen(true);
  };

  const closeContextMenu = () => {
    setIsContextMenuOpen(false);
    setActiveContextMenu(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentSection,
        sections,
        navigateTo,
        openContextMenu,
        closeContextMenu,
        isContextMenuOpen,
        activeContextMenu,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

interface ContextualNavigationProps {
  className?: string;
}

export function ContextualNavigation({ className }: ContextualNavigationProps) {
  const { sections, currentSection, navigateTo, openContextMenu, isContextMenuOpen, activeContextMenu, closeContextMenu } = useNavigation();

  // Encontrar a seção atual
  const findCurrentSectionData = (sectionId: string, sectionList: NavigationSection[]): NavigationSection | null => {
    for (const section of sectionList) {
      if (section.id === sectionId) {
        return section;
      }
      if (section.children) {
        const childResult = findCurrentSectionData(sectionId, section.children);
        if (childResult) return childResult;
      }
    }
    return null;
  };

  const currentSectionData = findCurrentSectionData(currentSection, sections);

  // Encontrar subseções da seção atual
  const getSubsections = (sectionId: string, sectionList: NavigationSection[]): NavigationSection[] => {
    for (const section of sectionList) {
      if (section.id === sectionId) {
        return section.children || [];
      }
      if (section.children) {
        const childResult = getSubsections(sectionId, section.children);
        if (childResult.length > 0) return childResult;
      }
    }
    return [];
  };

  const subsections = getSubsections(currentSection, sections);

  return (
    <nav
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}
      aria-label="Navegação contextual"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Caminho de navegação */}
          <div className="flex items-center space-x-2">
            {currentSectionData && (
              <>
                <button
                  type="button"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  onClick={() => openContextMenu(currentSection)}
                  aria-label={`Menu contextual para ${currentSectionData.title}`}
                  aria-expanded={isContextMenuOpen && activeContextMenu === currentSection}
                  aria-haspopup="true"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {currentSectionData.title}
                </span>
              </>
            )}
          </div>

          {/* Atalhos de teclado */}
          <div className="hidden md:flex items-center space-x-4">
            {subsections.map((subsection) => (
              <button
                key={subsection.id}
                type="button"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-1.5 text-sm flex items-center"
                onClick={() => navigateTo(subsection.path)}
                aria-label={subsection.title}
              >
                {subsection.icon && <span className="mr-2">{subsection.icon}</span>}
                {subsection.title}
                {subsection.shortcut && (
                  <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 flex items-center">
                    <Command className="h-3 w-3 mr-0.5" aria-hidden="true" />
                    {subsection.shortcut.toUpperCase()}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Menu de contexto */}
          {isContextMenuOpen && activeContextMenu && (
            <div
              className="absolute top-16 left-4 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 w-64"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="contextual-menu-button"
            >
              <div className="p-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                  Navegação rápida
                </div>
                {getSubsections(activeContextMenu, sections).map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center justify-between"
                    onClick={() => {
                      navigateTo(item.path);
                      closeContextMenu();
                    }}
                    role="menuitem"
                  >
                    <span className="flex items-center">
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.title}
                    </span>
                    {item.shortcut && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                        Alt+{item.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Componente para exibir abas contextuais
export function ContextualTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex border-b border-gray-200 dark:border-gray-700 ${className}`}
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
          className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${activeTab === tab.id
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Hook para usar atalhos de teclado
export function useKeyboardShortcut(key: string, callback: () => void, modifiers: { alt?: boolean; ctrl?: boolean; shift?: boolean } = {}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar eventos em campos de entrada
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isAltPressed = modifiers.alt ? e.altKey : true;
      const isCtrlPressed = modifiers.ctrl ? e.ctrlKey : true;
      const isShiftPressed = modifiers.shift ? e.shiftKey : true;

      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        isAltPressed &&
        isCtrlPressed &&
        isShiftPressed
      ) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, modifiers]);
}