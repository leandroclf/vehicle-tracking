import '@/styles/globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { HighContrastProvider } from '@/components/ui/HighContrastProvider'
import { AuthProvider } from '@/lib/auth'
import NotificationProvider from '@/components/ui/NotificationProvider'
import { AccessibleNotificationsProvider } from '@/components/ui/AccessibleNotifications'
import { KeyboardNavigationProvider } from '@/components/ui/KeyboardNavigationProvider'
import NotificationsProvider from '@/components/notifications/NotificationsProvider'
import React from 'react'
import { RadixPatchProvider } from '@/components/ui/RadixPatchProvider'
import { TooltipProvider } from '@/components/ui/Tooltip'
import Script from 'next/script'
import { Toaster } from 'sonner'

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
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <HighContrastProvider>
              <AccessibleNotificationsProvider>
                <TooltipProvider>
                  <AuthProvider>
                    <NotificationsProvider>
                      <NotificationProvider>
                        <KeyboardNavigationProvider>
                          {children}
                          <Toaster richColors closeButton position="top-right" />
                        </KeyboardNavigationProvider>
                      </NotificationProvider>
                    </NotificationsProvider>
                  </AuthProvider>
                </TooltipProvider>
              </AccessibleNotificationsProvider>
            </HighContrastProvider>
          </ThemeProvider>
        </RadixPatchProvider>
      </body>
    </html>
  )
}
