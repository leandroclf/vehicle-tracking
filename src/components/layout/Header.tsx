'use client';

import React from 'react';
import { Menu, Bell, User, Moon, Sun, LogOut, Truck, MapPin, AlertTriangle, FileText, Settings, Search } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/lib/sidebar-context';
import { GlobalSearch } from '@/components/navigation/GlobalSearch';
import { ContextualNavigation, NavigationProvider } from '@/components/navigation/ContextualNavigation';
import { KeyboardShortcuts } from '@/components/navigation/KeyboardShortcuts';

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
}

// Definição das seções de navegação
const navigationSections = [
  {
    id: 'vehicles',
    title: 'Veículos',
    path: '/dashboard/vehicles',
    shortcut: 'v',
    icon: <Truck className="h-4 w-4" />,
    children: [
      {
        id: 'vehicles-list',
        title: 'Lista de Veículos',
        path: '/dashboard/vehicles',
        shortcut: 'l',
        icon: <Truck className="h-4 w-4" />
      },
      {
        id: 'vehicles-map',
        title: 'Mapa de Veículos',
        path: '/dashboard/map',
        shortcut: 'm',
        icon: <MapPin className="h-4 w-4" />
      },
      {
        id: 'vehicles-maintenance',
        title: 'Manutenção',
        path: '/dashboard/vehicles/maintenance',
        shortcut: 'n',
        icon: <Settings className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'geofences',
    title: 'Geocercas',
    path: '/dashboard/geofences',
    shortcut: 'g',
    icon: <MapPin className="h-4 w-4" />,
    children: [
      {
        id: 'geofences-list',
        title: 'Lista de Geocercas',
        path: '/dashboard/geofences',
        shortcut: 'g',
        icon: <MapPin className="h-4 w-4" />
      },
      {
        id: 'geofences-create',
        title: 'Criar Geocerca',
        path: '/dashboard/geofences/create',
        shortcut: 'c',
        icon: <MapPin className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'alerts',
    title: 'Alertas',
    path: '/dashboard/alerts',
    shortcut: 'a',
    icon: <AlertTriangle className="h-4 w-4" />,
    children: [
      {
        id: 'alerts-active',
        title: 'Alertas Ativos',
        path: '/dashboard/alerts',
        shortcut: 'a',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      {
        id: 'alerts-history',
        title: 'Histórico de Alertas',
        path: '/dashboard/alerts/history',
        shortcut: 'h',
        icon: <AlertTriangle className="h-4 w-4" />
      }
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios',
    path: '/dashboard/reports',
    shortcut: 'r',
    icon: <FileText className="h-4 w-4" />,
    children: [
      {
        id: 'reports-list',
        title: 'Lista de Relatórios',
        path: '/dashboard/reports',
        shortcut: 'l',
        icon: <FileText className="h-4 w-4" />
      },
      {
        id: 'reports-create',
        title: 'Criar Relatório',
        path: '/dashboard/reports/create',
        shortcut: 'c',
        icon: <FileText className="h-4 w-4" />
      }
    ]
  }
];

export default function Header({ className = '' }: HeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  
  const isDark = theme === 'dark';

  return (
    <NavigationProvider sections={navigationSections}>
      <header className={cn(
        "flex flex-col h-auto bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-30",
        className
      )}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Alternar barra lateral"
              aria-expanded={!isMobile}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <Link href="/dashboard/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
              YUKZ Track<span className="text-gray-800 dark:text-gray-300">er</span>
            </Link>
            
            {/* Componente de Pesquisa Global */}
            <GlobalSearch className="ml-4 flex" />
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botão de pesquisa para dispositivos móveis */}
            <button
              onClick={() => {
                // Disparar evento para abrir a pesquisa global
                const event = new CustomEvent('open-global-search');
                window.dispatchEvent(event);
              }}
              className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Abrir pesquisa global"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {/* Componente de Atalhos de Teclado */}
            <KeyboardShortcuts className="hidden md:flex mr-2" />
            
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <Link 
              href="/dashboard/alerts"
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 relative"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" aria-hidden="true"></span>
              <span className="sr-only">1 notificação não lida</span>
            </Link>
            
            <Link
              href="/dashboard/profile"
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Perfil"
            >
              <User className="w-5 h-5" />
            </Link>
            
            <Link
              href="/login"
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* Navegação Contextual */}
        <ContextualNavigation />
      </header>
    </NavigationProvider>
  );
}

