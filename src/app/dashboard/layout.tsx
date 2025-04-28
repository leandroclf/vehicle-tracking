'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Verificar se estamos no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Verificar autenticação
  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      console.log('Usuário não autenticado, redirecionando para login');
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, isClient]);

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (isLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#007db8]"></div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Renderizar layout do dashboard para usuários autenticados
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}