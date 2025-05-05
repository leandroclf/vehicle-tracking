'use client';

import { Home, Map, Truck, Bell, Menu, Settings, FileText, MapPin, X, Layers, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}

const NavItem = ({ href, icon, label, isActive, onClick, badge }: NavItemProps) => (
  <div 
    className="w-full h-full"
    onClick={onClick}
  >
    <Link
      href={onClick ? '#' : href}
      className={`flex flex-col items-center justify-center w-full h-full p-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
        isActive 
          ? 'text-blue-600 dark:text-blue-400 font-semibold border-t-2 border-blue-600 dark:border-blue-400' 
          : 'text-gray-600 dark:text-gray-400'
      }`}
      aria-label={label}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="w-12 h-12 flex items-center justify-center relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  </div>
);

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
}

interface BottomNavProps {
  onOpenMenu?: () => void;
}

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [pageSection, setPageSection] = useState<'main' | 'monitoring' | 'reports'>('main');
  
  // Simulação de alertas para demonstração
  useEffect(() => {
    // Simular recebimento de alertas
    setAlertCount(3);
  }, []);

  // Determinar qual seção está ativa com base no pathname
  useEffect(() => {
    if (pathname.includes('/map') || pathname.includes('/vehicles') || pathname.includes('/dashboard')) {
      setPageSection('main');
    } else if (pathname.includes('/alerts') || pathname.includes('/geofences')) {
      setPageSection('monitoring');
    } else if (pathname.includes('/reports') || pathname.includes('/settings')) {
      setPageSection('reports');
    }
  }, [pathname]);

  // Navegação principal - 5 itens principais (dentro do limite recomendado de 5-6 itens)
  const mainNavItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: <Home size={24} />,
      label: 'Início'
    },
    {
      href: '/dashboard/map',
      icon: <Map size={24} />,
      label: 'Mapa'
    },
    {
      href: '/dashboard/vehicles',
      icon: <Truck size={24} />,
      label: 'Veículos'
    },
    {
      href: '/dashboard/alerts',
      icon: <Bell size={24} />,
      label: 'Alertas',
      badge: alertCount
    },
    {
      href: '#',
      icon: <Menu size={24} />,
      label: 'Menu',
      onClick: () => {
        if (onOpenMenu) {
          onOpenMenu();
        } else {
          setExpanded(!expanded);
        }
      }
    }
  ];

  // Itens de monitoramento
  const monitoringNavItems: NavItem[] = [
    {
      href: '/dashboard/map',
      icon: <Map size={24} />,
      label: 'Mapa'
    },
    {
      href: '/dashboard/vehicles',
      icon: <Truck size={24} />,
      label: 'Veículos'
    },
    {
      href: '/dashboard/geofences',
      icon: <MapPin size={24} />,
      label: 'Geocercas'
    },
    {
      href: '/dashboard/alerts',
      icon: <Bell size={24} />,
      label: 'Alertas',
      badge: alertCount
    },
    {
      href: '#',
      icon: <Layers size={24} />,
      label: 'Seções',
      onClick: () => setExpanded(!expanded)
    }
  ];

  // Itens de relatórios e configurações
  const reportsNavItems: NavItem[] = [
    {
      href: '/dashboard/reports',
      icon: <FileText size={24} />,
      label: 'Relatórios'
    },
    {
      href: '/dashboard/settings',
      icon: <Settings size={24} />,
      label: 'Config'
    },
    {
      href: '/dashboard',
      icon: <Activity size={24} />,
      label: 'Estatísticas'
    },
    {
      href: '#',
      icon: <Menu size={24} />,
      label: 'Mais',
      onClick: () => setExpanded(!expanded)
    },
    {
      href: '#',
      icon: <Layers size={24} />,
      label: 'Seções',
      onClick: () => setExpanded(!expanded)
    }
  ];

  // Selecionar os itens de navegação com base na seção atual
  const currentNavItems = 
    pageSection === 'monitoring' ? monitoringNavItems : 
    pageSection === 'reports' ? reportsNavItems : 
    mainNavItems;

  // Função para trocar entre seções
  const switchSection = (section: 'main' | 'monitoring' | 'reports') => {
    setPageSection(section);
    setExpanded(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Navegação inferior principal */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 z-40 shadow-lg">
        <div className="grid grid-cols-5 h-full">
          {currentNavItems.map((item) => (
            <NavItem
              key={item.label}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
              onClick={item.onClick}
              badge={item.badge}
            />
          ))}
        </div>
      </nav>

      {/* Menu expandido - aparece quando o usuário clica em "Menu" ou "Seções" */}
      {expanded && (
        <>
          {/* Overlay para fechar o menu expandido */}
          <div 
            className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setExpanded(false)}
          />
          
          {/* Menu expandido de seções */}
          <div className="sm:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40 animate-slide-up rounded-t-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Navegação</h3>
              <button 
                onClick={() => setExpanded(false)}
                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Fechar menu expandido"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => switchSection('main')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  pageSection === 'main' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Home size={24} />
                <span className="text-xs mt-1 font-medium">Principal</span>
              </button>
              
              <button 
                onClick={() => switchSection('monitoring')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  pageSection === 'monitoring' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Activity size={24} />
                <span className="text-xs mt-1 font-medium">Monitoramento</span>
              </button>
              
              <button 
                onClick={() => switchSection('reports')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  pageSection === 'reports' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FileText size={24} />
                <span className="text-xs mt-1 font-medium">Relatórios</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* Espaçador para compensar a navegação inferior em dispositivos móveis */}
      <div className="sm:hidden h-20" />
    </>
  );
} 