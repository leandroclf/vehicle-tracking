'use client';

import React from 'react';
import { SettingsProvider } from '@/lib/settings';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <ProtectedRoute>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </ProtectedRoute>
  );
}