import { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Yukz - Rastreamento Veicular',
  description: 'Plataforma de rastreamento veicular',
};

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
