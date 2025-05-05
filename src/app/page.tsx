'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-center">
        <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
          Redirecionando...
        </p>
      </div>
    </div>
  );
}

