'use client';

import { AuthProvider } from '@/lib/auth';
import { AlertProvider } from '@/lib/alerts';
import { ReportProvider } from '@/lib/reports';
import { SettingsProvider } from '@/lib/settings';
import { ThemeProvider } from '@/components/ui/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <AlertProvider>
            <ReportProvider>
              {children}
            </ReportProvider>
          </AlertProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
