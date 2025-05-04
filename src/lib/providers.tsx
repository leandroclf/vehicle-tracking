'use client';

import { AuthProvider } from '@/lib/auth';
import { VehicleProvider } from '@/lib/vehicles';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';
import { SettingsProvider } from '@/lib/settings';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
