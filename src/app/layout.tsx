import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { HighContrastProvider } from '@/components/ui/HighContrastProvider'
import { AuthProvider } from '@/lib/auth'
import NotificationProvider from '@/components/ui/NotificationProvider'
import { SidebarProvider } from '@/lib/sidebar-context'
import { AccessibleNotificationsProvider } from '@/components/ui/AccessibleNotifications'
import { KeyboardNavigationProvider } from '@/components/ui/KeyboardNavigationProvider'
import NotificationsProvider from '@/components/notifications/NotificationsProvider'
import React from 'react'
import { RealtimeIntegration } from '@/components/realtime/RealtimeIntegration'
import { RadixPatchProvider } from '@/components/ui/RadixPatchProvider'

const inter = Inter({ subsets: ['latin'] })

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
      </head>
      <body className={inter.className}>
        <RadixPatchProvider>
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
                          <RealtimeIntegration>
                            {children}
                          </RealtimeIntegration>
                        </SidebarProvider>
                      </KeyboardNavigationProvider>
                    </NotificationProvider>
                  </NotificationsProvider>
                </AuthProvider>
              </AccessibleNotificationsProvider>
            </HighContrastProvider>
          </ThemeProvider>
        </RadixPatchProvider>
      </body>
    </html>
  )
}
