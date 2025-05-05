'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// Rotas mais comuns que devem ser pré-carregadas
const routes = [
  '/dashboard/vehicles',
  '/dashboard/map',
  '/dashboard/alerts',
  '/dashboard/reports',
  '/dashboard/geofences',
  '/dashboard/drivers',
  '/dashboard/settings',
  '/dashboard/profile',
  '/dashboard',
];

export default function PrefetchLinks() {
  const pathname = usePathname();

  useEffect(() => {
    // Pré-carrega as rotas mais comuns
    routes.forEach((route) => {
      // Não pré-carregar a rota atual
      if (route !== pathname) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'prefetch';
        linkElement.href = route;
        document.head.appendChild(linkElement);
      }
    });
  }, [pathname]);

  // Este componente não renderiza nada visualmente
  return (
    <>
      {routes.map((route) => 
        route !== pathname ? (
          <Link key={route} href={route} prefetch={true} style={{ display: 'none' }} />
        ) : null
      )}
    </>
  );
} 