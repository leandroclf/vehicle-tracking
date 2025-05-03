'use client';

import React, { Suspense } from 'react';
import { LazyLoading } from '@/lib/lazy';
import DashboardLoading from '@/components/ui/DashboardLoading';
import PrefetchLinks from '@/components/dashboard/PrefetchLinks';

const Sidebar = React.lazy(() => import('@/components/layout/Sidebar'));
const Header = React.lazy(() => import('@/components/layout/Header'));

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <PrefetchLinks />
      <LazyLoading fallback={<div className="w-64 bg-gray-200 dark:bg-gray-800 animate-pulse" />}>
        <Sidebar />
      </LazyLoading>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <LazyLoading fallback={<div className="h-16 bg-white dark:bg-gray-800 shadow animate-pulse" />}>
          <Header />
        </LazyLoading>
        
        <main className="flex-1 overflow-y-auto p-4">
          <Suspense fallback={<DashboardLoading />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}