import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'Administrador')) {
      // Redireciona para dashboard ou exibe mensagem
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" role="status"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'Administrador') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-700 text-white p-4 rounded shadow">
          Acesso restrito a administradores.
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 