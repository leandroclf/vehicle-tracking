'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
import { useSidebar } from '@/lib/sidebar-context';
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

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    // Grupo de Dashboards
    { 
      name: 'Dashboard', 
      href: '/dashboard/dashboard', 
      icon: <Home className="w-5 h-5" />,
      ariaLabel: 'Acessar dashboard principal'
    },
    // Grupo de Navegação Principal
    { 
      name: 'Mapa', 
      href: '/dashboard/map', 
      icon: <Map className="w-5 h-5" />,
      ariaLabel: 'Visualizar mapa de rastreamento'
    },
    { 
      name: 'Veículos', 
      href: '/dashboard/vehicles', 
      icon: <Truck className="w-5 h-5" />,
      ariaLabel: 'Gerenciar veículos'
    },
    { 
      name: 'Geocercas', 
      href: '/dashboard/geofences', 
      icon: <MapPin className="w-5 h-5" />,
      ariaLabel: 'Configurar geocercas'
    },
    { 
      name: 'Alertas', 
      href: '/dashboard/alerts', 
      icon: <Bell className="w-5 h-5" />,
      ariaLabel: 'Visualizar alertas'
    },
    { 
      name: 'Relatórios', 
      href: '/dashboard/reports', 
      icon: <FileText className="w-5 h-5" />,
      ariaLabel: 'Acessar relatórios'
    },
    // Grupo de Configurações
    { 
      name: 'Configurações', 
      href: '/dashboard/settings', 
      icon: <Settings className="w-5 h-5" />,
      ariaLabel: 'Ajustar configurações do sistema'
    },
    { 
      name: 'Perfil', 
      href: '/dashboard/profile', 
      icon: <User className="w-5 h-5" />,
      ariaLabel: 'Gerenciar perfil de usuário'
    },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <>
      {/* Mobile Toggle Button - Fixed at bottom */}
      {isMobile && (
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Sidebar - Desktop (left side) or Mobile (bottom sheet) */}
      <aside 
        className={cn(
          "h-full transition-all duration-300",
          isMobile ? 
            "fixed bottom-0 left-0 right-0 z-40 transform bg-white dark:bg-gray-800 shadow-lg rounded-t-xl" : 
            "bg-gray-100 dark:bg-gray-800 min-h-screen shadow-md h-full",
          isMobile && !isMobileMenuOpen ? "translate-y-full" : "translate-y-0",
          !isMobile && isSidebarCollapsed ? "w-16" : isMobile ? "w-full" : "w-64",
          className
        )}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="absolute right-[-12px] top-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 z-10"
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Mobile Header */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Menu</h2>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 dark:text-gray-400"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={cn("p-6", isMobile && "p-4")}>
          <ul className={cn("space-y-2", isMobile && "grid grid-cols-4 gap-4")}>
            {navItems.map((item) => (
              <li key={item.name} className={isMobile ? 'text-center' : ''}>
                {isSidebarCollapsed && !isMobile ? (
                  <Tooltip content={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-all duration-200",
                        isActive(item.href) 
                          ? "bg-blue-600 text-white" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                        item.highlight && !isActive(item.href) && "border-2 border-[#faa631]"
                      )}
                      aria-label={item.ariaLabel || item.name}
                    >
                      {item.icon}
                      {item.highlight && !isActive(item.href) && (
                        <span className="absolute top-0 right-0 h-2 w-2 bg-[#faa631] rounded-full"></span>
                      )}
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center p-2 rounded-lg transition-all duration-200",
                      isActive(item.href) 
                        ? "bg-blue-600 text-white" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
                      isMobile ? "flex-col text-xs" : "space-x-3",
                      item.highlight && !isActive(item.href) && "border-l-4 border-[#faa631]"
                    )}
                    aria-label={item.ariaLabel || item.name}
                  >
                    {item.icon}
                    <span className={cn(
                      isMobile ? "mt-1" : "",
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
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
