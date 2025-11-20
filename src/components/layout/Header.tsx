'use client';

import React, { useState } from 'react';
import { Menu, User, Moon, Sun, LogOut, Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import { GlobalSearch } from '@/components/navigation/GlobalSearch';
import NotificationsBell from '@/components/notifications/NotificationsBell';

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
}

export default function Header({ className = '' }: HeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  return (
    <header className={cn(
      "flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-30",
      className
    )}>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label="Alternar barra lateral"
          aria-expanded={!isMobile}
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
          YUKZ Track<span className="text-gray-800 dark:text-gray-300">er</span>
        </Link>

        {/* Componente de Pesquisa Global - mais visível */}
        <GlobalSearch className="ml-4 flex-1 max-w-md" />
      </div>

      <div className="flex items-center space-x-2">
        {/* Botão de pesquisa para dispositivos móveis */}
        <button
          onClick={() => {
            const event = new CustomEvent('open-global-search');
            window.dispatchEvent(event);
          }}
          className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label="Abrir pesquisa global"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Componente de Notificações em Tempo Real */}
        <NotificationsBell className="text-gray-700 dark:text-gray-300" />

        {/* Menu do Usuário (Dropdown) */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-1 p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Menu do usuário"
            aria-expanded={isUserMenuOpen}
          >
            <User className="w-5 h-5" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </Link>
                <Link
                  href="/login"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
