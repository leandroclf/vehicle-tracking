'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SimpleTooltip } from '@/components/ui/Tooltip';
import { useSidebar } from '@/lib/sidebar-context';
import { useAuth } from '@/lib/auth';
import { 
  Home, 
  Map, 
  Truck, 
  MapPin, 
  Bell, 
  FileText, 
  Settings, 
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PanelTop
} from 'lucide-react'; // Using lucide-react icons

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  ariaLabel?: string;
  highlight?: boolean;
  badge?: number;
  emoji?: string;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSidebarCollapsed, toggleSidebar, isMobile } = useSidebar();
  const [alertCount, setAlertCount] = useState(0);
  const { user } = useAuth();
  
  // Simular alertas para exemplo
  useEffect(() => {
    setAlertCount(2);
  }, []);

  // Fechar menu móvel ao navegar para nova página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    // Grupo de Dashboards
    { 
      name: 'Painel', 
      href: '/dashboard', 
      icon: <Home className="w-6 h-6" />,
      ariaLabel: 'Acessar dashboard principal',
      emoji: '🏠'
    },
    
    // Grupo de Monitoramento
    { 
      name: 'Rastreamento', 
      href: '/tracking', 
      icon: <MapPin className="w-6 h-6" />,
      ariaLabel: 'Rastreamento em tempo real',
      emoji: '📡',
      highlight: true
    },
    { 
      name: 'Mapa', 
      href: '/dashboard/map', 
      icon: <Map className="w-6 h-6" />,
      ariaLabel: 'Visualizar mapa de rastreamento',
      emoji: '🗺️'
    },
    { 
      name: 'Veículos', 
      href: '/dashboard/vehicles', 
      icon: <Truck className="w-6 h-6" />,
      ariaLabel: 'Gerenciar veículos',
      emoji: '🚚'
    },
    { 
      name: 'Geocercas', 
      href: '/dashboard/geofences', 
      icon: <MapPin className="w-6 h-6" />,
      ariaLabel: 'Configurar geocercas',
      emoji: '📍'
    },
    { 
      name: 'Alertas', 
      href: '/dashboard/alerts', 
      icon: <Bell className="w-6 h-6" />,
      ariaLabel: 'Visualizar alertas',
      badge: alertCount,
      emoji: '🔔'
    },
    
    // Grupo de Relatórios e Configurações
    { 
      name: 'Relatórios', 
      href: '/dashboard/reports', 
      icon: <FileText className="w-6 h-6" />,
      ariaLabel: 'Acessar relatórios',
      emoji: '📊'
    },
    { 
      name: 'Configurações', 
      href: '/dashboard/settings', 
      icon: <Settings className="w-6 h-6" />,
      ariaLabel: 'Ajustar configurações do sistema',
      emoji: '⚙️'
    },
    { 
      name: 'Perfil', 
      href: '/dashboard/profile', 
      icon: <User className="w-6 h-6" />,
      ariaLabel: 'Gerenciar perfil de usuário',
      emoji: '👤'
    },
    // Adicionar item de administração de usuários apenas para administradores
    ...(user?.role === 'admin' ? [{
      name: 'Usuários',
      href: '/dashboard/users',
      icon: <PanelTop className="w-6 h-6" />,
      ariaLabel: 'Administração de usuários',
      emoji: '🧑‍💼'
    }] : []),
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };
  
  // Função para renderizar cada item de navegação
  const renderNavItem = (item: NavItem) => (
    <li key={item.name}>
      <Link
        href={item.href}
        className={cn(
          "flex items-center p-3 rounded-lg transition-all duration-200",
          isActive(item.href) 
            ? "bg-blue-600 text-white shadow-md" 
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
          isMobile ? "flex-col text-sm" : "space-x-3",
          item.highlight && !isActive(item.href) && !isMobile && "border-l-4 border-[#faa631]"
        )}
        aria-label={item.ariaLabel || item.name}
      >
        <div className="relative flex items-center">
          {isMobile ? 
            <span className="text-xl mb-1">{item.emoji}</span> : 
            item.icon
          }
          {item.badge && item.badge > 0 && (
            <span className={cn(
              "absolute bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse",
              isMobile ? "top-0 right-0" : "-top-1 -right-1"
            )}>
              {item.badge}
            </span>
          )}
        </div>
        <span className={cn(
          isMobile ? "mt-1" : "",
          item.highlight && !isActive(item.href) && "font-medium text-[#faa631] dark:text-[#faa631]"
        )}>
          {!isMobile && !isSidebarCollapsed && <span className="mr-2">{item.emoji}</span>}
          {item.name}
          {item.highlight && !isActive(item.href) && !isMobile && (
            <span className="ml-2 text-xs bg-[#faa631] text-white px-1.5 py-0.5 rounded-full">Novo</span>
          )}
        </span>
      </Link>
    </li>
  );

  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom */}
      {isMobile && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg w-16 h-16 flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      )}

      {/* Sidebar - Desktop (left side) or Mobile (bottom sheet) */}
      <aside 
        className={cn(
          "h-full transition-all duration-300",
          isMobile ? 
            "fixed bottom-0 left-0 right-0 z-40 transform bg-white dark:bg-gray-800 shadow-lg rounded-t-xl max-h-[85vh] overflow-y-auto" : 
            "bg-gray-100 dark:bg-gray-800 min-h-screen shadow-md h-full",
          isMobile && !isMobileMenuOpen ? "translate-y-full" : "translate-y-0",
          !isMobile && isSidebarCollapsed ? "w-20" : isMobile ? "w-full" : "w-64",
          className
        )}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute right-[-16px] top-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-2 w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 z-10"
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 dark:text-gray-400 p-2 w-12 h-12 flex items-center justify-center"
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        {!isSidebarCollapsed && !isMobile ? (
          <nav className="py-6 px-3">
            <div className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Dashboard
            </div>
            <ul className="space-y-1 mb-6">
              {navItems.slice(0, 1).map((item) => renderNavItem(item))}
            </ul>
            
            <div className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Monitoramento
            </div>
            <ul className="space-y-1 mb-6">
              {navItems.slice(1, 5).map((item) => renderNavItem(item))}
            </ul>
            
            <div className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Gestão
            </div>
            <ul className="space-y-1">
              {navItems.slice(5).map((item) => renderNavItem(item))}
            </ul>
          </nav>
        ) : (
          <nav className={cn("py-6", isMobile ? "px-4" : "px-2")}>
            <ul className={cn(
              "space-y-2", 
              isMobile && "grid grid-cols-2 sm:grid-cols-3 gap-4 space-y-0"
            )}>
              {navItems.map((item) => (
                <li key={item.name} className={isMobile ? 'text-center' : ''}>
                  {isSidebarCollapsed && !isMobile ? (
                    <SimpleTooltip content={item.name} side="right">
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center p-3 rounded-lg transition-all duration-200 w-14 h-14 mx-auto hover:scale-105 active:scale-95",
                          isActive(item.href) 
                            ? "bg-blue-600 text-white shadow-md" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                          item.highlight && !isActive(item.href) && "border-2 border-[#faa631]"
                        )}
                        aria-label={item.ariaLabel || item.name}
                      >
                        <div className="relative">
                          <span className="text-xl">{item.emoji}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SimpleTooltip>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center p-4 rounded-lg transition-all duration-200 min-h-[64px] hover:scale-105 active:scale-95",
                        isActive(item.href) 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                        isMobile ? "flex-col text-sm" : "space-x-4",
                        item.highlight && !isActive(item.href) && !isMobile && "border-l-4 border-[#faa631]"
                      )}
                      aria-label={item.ariaLabel || item.name}
                    >
                      <div className="relative">
                        {isMobile ? (
                          <span className="text-xl">{item.emoji}</span>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{item.emoji}</span>
                            {item.icon}
                          </div>
                        )}
                        {item.badge && item.badge > 0 && (
                          <span className={cn(
                            "absolute bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse",
                            isMobile ? "top-0 right-0" : "-top-1 -right-1"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        isMobile ? "mt-2" : "",
                        item.highlight && !isActive(item.href) && "font-medium text-[#faa631] dark:text-[#faa631]"
                      )}>
                        {item.name}
                        {item.highlight && !isActive(item.href) && !isMobile && (
                          <span className="ml-2 text-xs bg-[#faa631] text-white px-1.5 py-0.5 rounded-full">Novo</span>
                        )}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
