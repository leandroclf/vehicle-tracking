/**
 * Layout com integração Realtime para o sistema de rastreamento de veículos
 * 
 * Este componente envolve o layout principal da aplicação com o componente
 * RealtimeIntegration, garantindo que todas as páginas tenham acesso às
 * funcionalidades de tempo real e sincronização offline.
 */

import React from 'react';
import { RealtimeIntegration } from '../components/realtime/RealtimeIntegration';
import Layout from '../components/layout/Layout';

export default function LayoutWithRealtime({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeIntegration>
      <Layout>
        {children}
      </Layout>
    </RealtimeIntegration>
  );
}