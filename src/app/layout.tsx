import '@/styles/globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { HighContrastProvider } from '@/components/ui/HighContrastProvider'
import Layout from '@/components/layout/Layout'
import NotificationProvider from '@/components/ui/NotificationProvider'
import { AuthProvider } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Yukz - Rastreamento Veicular',
  description: 'Plataforma de rastreamento veicular com monitoramento em tempo real',
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
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <HighContrastProvider>
            <AuthProvider>
              <NotificationProvider>
                <Layout>
                  {children}
                </Layout>
              </NotificationProvider>
            </AuthProvider>
          </HighContrastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
