'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

// Rotas mais comuns que devem ser pré-carregadas
const commonRoutes = [
  '/dashboard/dashboard',
  '/dashboard/vehicles',
  '/dashboard/map',
  '/dashboard/alerts',
  '/dashboard/geofences',
  '/dashboard/reports',
  '/dashboard/settings',
  '/dashboard/profile',
];

export default function PrefetchLinks() {
  const pathname = usePathname();

  useEffect(() => {
    // Pré-carrega as rotas mais comuns
    commonRoutes.forEach((route) => {
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
      {commonRoutes.map((route) => 
        route !== pathname ? (
          <Link key={route} href={route} prefetch={true} style={{ display: 'none' }} />
        ) : null
      )}
    </>
  );
} 