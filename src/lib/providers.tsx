'use client';

import { AuthProvider } from '@/lib/auth';
import { VehicleProvider } from '@/lib/vehicles';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';
import { SettingsProvider } from '@/lib/settings';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <VehicleProvider>
          <AlertProvider>
            <ReportProvider>
              {children}
            </ReportProvider>
          </AlertProvider>
        </VehicleProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
