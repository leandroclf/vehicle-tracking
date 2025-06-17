import '@/styles/globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { HighContrastProvider } from '@/components/ui/HighContrastProvider'
import { AuthProvider } from '@/lib/auth'
import NotificationProvider from '@/components/ui/NotificationProvider'
import { SidebarProvider } from '@/lib/sidebar-context'
import { AccessibleNotificationsProvider } from '@/components/ui/AccessibleNotifications'
import { KeyboardNavigationProvider } from '@/components/ui/KeyboardNavigationProvider'
import NotificationsProvider from '@/components/notifications/NotificationsProvider'
import React from 'react'
import RealtimeIntegration from '@/components/realtime/RealtimeIntegration';
import { RealtimeProvider } from '@/lib/providers/RealtimeProvider';
import { RadixPatchProvider } from '@/components/ui/RadixPatchProvider'
import { UpdateLoopDetector } from '@/components/ui/UpdateLoopDetector'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'YUKZ Tracker',
  description: 'Sistema de rastreamento de veículos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script id="radix-patch-preload" strategy="beforeInteractive">{`
          window.__RADIX_PATCH_PRELOAD__ = true;
          console.log('[Radix Patch Preload] Inicializado');
        `}</Script>
      </head>
      <body>
        <RadixPatchProvider>
          <UpdateLoopDetector maxUpdatesPerSecond={40}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <HighContrastProvider>
                <AccessibleNotificationsProvider>
                  <AuthProvider>
                    <NotificationsProvider>
                      <NotificationProvider>
                        <KeyboardNavigationProvider>
                          <SidebarProvider>
                            <RealtimeProvider>
                              <RealtimeIntegration>
                                {children}
                              </RealtimeIntegration>
                            </RealtimeProvider>
                          </SidebarProvider>
                        </KeyboardNavigationProvider>
                      </NotificationProvider>
                    </NotificationsProvider>
                  </AuthProvider>
                </AccessibleNotificationsProvider>
              </HighContrastProvider>
            </ThemeProvider>
          </UpdateLoopDetector>
        </RadixPatchProvider>
      </body>
    </html>
  )
}
