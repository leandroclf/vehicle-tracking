'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RealtimeProvider, RealtimeConnectionStatus, useRealtimeContext } from '@/lib/providers/RealtimeProvider';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeConnection';
import { useTableSyncAfterReconnection } from '@/lib/hooks/useSyncAfterReconnection';

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Componente para testar a integração do sistema de reconexão
function RealtimeIntegrationTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const { connectionState, connectionStats } = useRealtimeContext();
  
  // Adicionar log
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };
  
  // Configurar assinatura em tempo real para veículos
  const { isConnected: vehiclesConnected } = useRealtimeSubscription(
    supabase,
    {
      entity: 'vehicles',
      event: '*',
      schema: 'public'
    },
    (payload) => {
      addLog(`Evento recebido: ${payload.eventType} em veículo ${payload.new?.id || payload.old?.id}`);
    }
  );
  
  // Configurar assinatura em tempo real para motoristas
  const { isConnected: driversConnected } = useRealtimeSubscription(
    supabase,
    {
      entity: 'drivers',
      event: '*',
      schema: 'public'
    },
    (payload) => {
      addLog(`Evento recebido: ${payload.eventType} em motorista ${payload.new?.id || payload.old?.id}`);
    }
  );
  
  // Configurar sincronização após reconexão para veículos
  const { 
    isSyncing: isSyncingVehicles, 
    lastSyncTimestamp: lastVehicleSync,
    forceSyncData: forceSyncVehicles
  } = useTableSyncAfterReconnection(
    supabase,
    'vehicles',
    'updated_at',
    (syncedData) => {
      addLog(`Sincronizados ${syncedData.length} veículos após reconexão`);
    }
  );
  
  // Configurar sincronização após reconexão para motoristas
  const { 
    isSyncing: isSyncingDrivers, 
    lastSyncTimestamp: lastDriverSync,
    forceSyncData: forceSyncDrivers
  } = useTableSyncAfterReconnection(
    supabase,
    'drivers',
    'updated_at',
    (syncedData) => {
      addLog(`Sincronizados ${syncedData.length} motoristas após reconexão`);
    }
  );
  
  // Monitorar mudanças no estado da conexão
  useEffect(() => {
    addLog(`Estado da conexão alterado para: ${connectionState}`);
  }, [connectionState]);
  
  // Simular desconexão
  const simulateDisconnection = () => {
    window.dispatchEvent(new Event('offline'));
    addLog('Simulando desconexão de rede');
  };
  
  // Simular reconexão
  const simulateReconnection = () => {
    window.dispatchEvent(new Event('online'));
    addLog('Simulando reconexão de rede');
  };
  
  // Forçar sincronização de todas as entidades
  const forceSyncAll = async () => {
    addLog('Iniciando sincronização manual de todas as entidades');
    
    try {
      const vehiclesPromise = forceSyncVehicles();
      const driversPromise = forceSyncDrivers();
      
      await Promise.all([vehiclesPromise, driversPromise]);
      
      addLog('Sincronização manual concluída com sucesso');
    } catch (error) {
      addLog(`Erro durante sincronização manual: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="realtime-integration-test">
      <h2 className="text-xl font-bold mb-4">Teste de Integração Realtime</h2>
      
      {/* Status da conexão */}
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Status da Conexão</h3>
        <RealtimeConnectionStatus />
        
        <div className="mt-2 text-sm">
          <p>Canais ativos: {connectionStats.channelsCount || 0}</p>
          <p>Tentativas de reconexão: {connectionStats.reconnectAttempts || 0}</p>
        </div>
      </div>
      
      {/* Status das assinaturas */}
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Status das Assinaturas</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p>Veículos: <span className={vehiclesConnected ? 'text-green-500' : 'text-red-500'}>
              {vehiclesConnected ? 'Conectado' : 'Desconectado'}
            </span></p>
            <p className="text-sm">Última sincronização: {lastVehicleSync ? new Date(lastVehicleSync).toLocaleString() : 'Nunca'}</p>
            {isSyncingVehicles && <p className="text-xs text-yellow-500">Sincronizando...</p>}
          </div>
          
          <div>
            <p>Motoristas: <span className={driversConnected ? 'text-green-500' : 'text-red-500'}>
              {driversConnected ? 'Conectado' : 'Desconectado'}
            </span></p>
            <p className="text-sm">Última sincronização: {lastDriverSync ? new Date(lastDriverSync).toLocaleString() : 'Nunca'}</p>
            {isSyncingDrivers && <p className="text-xs text-yellow-500">Sincronizando...</p>}
          </div>
        </div>
      </div>
      
      {/* Controles de teste */}
      <div className="mb-4 p-4 border rounded-lg">
        <h3 className="font-bold mb-2">Controles de Teste</h3>
        
        <div className="flex space-x-2">
          <button 
            onClick={simulateDisconnection}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Simular Desconexão
          </button>
          
          <button 
            onClick={simulateReconnection}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Simular Reconexão
          </button>
          
          <button 
            onClick={forceSyncAll}
            disabled={connectionState !== 'CONNECTED'}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Forçar Sincronização
          </button>
        </div>
      </div>
      
      {/* Logs */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-bold mb-2">Logs ({logs.length})</h3>
        
        <div className="h-64 overflow-y-auto text-xs font-mono bg-gray-900 text-gray-100 p-2 rounded">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-gray-500">Nenhum log registrado</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Página de teste
export default function RealtimeIntegrationTestPage() {
  return (
    <RealtimeProvider 
      supabaseClient={supabase}
      options={{
        initialReconnectDelay: 1000,
        reconnectBackoffFactor: 1.5,
        maxReconnectAttempts: 10,
        healthCheckInterval: 15000,
      }}
    >
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Integração do Sistema de Reconexão</h1>
        <p className="mb-6 text-gray-600">
          Esta página demonstra a integração completa do sistema de reconexão e sincronização
          para o Supabase Realtime, com recursos de reconexão automática, backoff exponencial,
          verificação de saúde das inscrições e sincronização de dados após reconexão.
        </p>
        
        <RealtimeIntegrationTest />
      </div>
    </RealtimeProvider>
  );
}