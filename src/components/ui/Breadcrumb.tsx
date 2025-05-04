'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === '/dashboard/dashboard') return null;
  
  const parts = pathname.split('/').filter(Boolean);
  
  // Mapeamento amigável de rotas
  const routeMap: Record<string, string> = {
    dashboard: 'Dashboard',
    vehicles: 'Veículos',
    alerts: 'Alertas',
    map: 'Mapa',
    settings: 'Configurações',
    reports: 'Relatórios',
    geofences: 'Geocercas',
    profile: 'Perfil'
  };
  
  const breadcrumbs = parts.map((part, index) => {
    const path = `/${parts.slice(0, index + 1).join('/')}`;
    const label = routeMap[part] || part;
    
    return { path, label };
  });
  
  return (
    <nav aria-label="Navegação estrutural" className="mb-4 text-sm">
      <ol className="flex items-center">
        <li>
          <Link 
            href="/dashboard/dashboard" 
            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center"
            aria-label="Página inicial"
          >
            <Home size={14} />
          </Link>
        </li>
        
        {breadcrumbs.map((crumb, i) => (
          <li key={i} className="flex items-center">
            <ChevronRight size={14} className="mx-2 text-gray-400" />
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-800 dark:text-gray-200" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.path}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 