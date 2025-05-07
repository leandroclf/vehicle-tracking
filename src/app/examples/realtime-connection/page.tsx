'use client';

import React, { useState, useEffect } from 'react';
import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { RealtimeProvider, GlobalSubscriptions, RealtimeConnectionStatus, useRealtimeContext } from '@/lib/providers/RealtimeProvider';
import { SubscriptionConfig } from '@/lib/hooks/useRealtimeConnection';

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

// Componente para exibir veículos em tempo real
function VehiclesList() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const { subscribe, unsubscribe, connectionState, isConnected } = useRealtimeContext();
  
  // Carregar dados iniciais
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*');
          
        if (error) throw error;
        if (data) setVehicles(data);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
      }
    };
    
    fetchVehicles();
  }, []);
  
  // Configurar assinatura em tempo real
  useEffect(() => {
    let channelName: string | null = null;
    
    const setupSubscription = async () => {
      if (!isConnected) return;
      
      try {
        // Configuração da assinatura
        const config: SubscriptionConfig = {
          entity: 'vehicles',
          event: '*',
          schema: 'public'
        };
        
        // Callback para eventos em tempo real
        const handleRealtimeEvent = (payload: RealtimePostgresChangesPayload<any>) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          switch (eventType) {
            case 'INSERT':
              setVehicles(prev => [...prev, newRecord]);
              break;
              
            case 'UPDATE':
              setVehicles(prev => 
                prev.map(vehicle => 
                  vehicle.id === newRecord.id ? newRecord : vehicle
                )
              );
              break;
              
            case 'DELETE':
              setVehicles(prev => 
                prev.filter(vehicle => vehicle.id !== oldRecord.id)
              );
              break;
          }
        };
        
        // Assinar canal
        channelName = await subscribe(config, handleRealtimeEvent);
        console.log('Assinatura configurada com sucesso:', channelName);
      } catch (error) {
        console.error('Erro ao configurar assinatura:', error);
      }
    };
    
    setupSubscription();
    
    // Limpar assinatura ao desmontar
    return () => {
      if (channelName) {
        unsubscribe(channelName).catch(error => {
          console.error('Erro ao cancelar assinatura:', error);
        });
      }
    };
  }, [subscribe, unsubscribe, isConnected]);
  
  return (
    <div className="vehicles-list">
      <h2 className="text-xl font-bold mb-4">Veículos ({vehicles.length})</h2>
      
      {/* Status da conexão */}
      <div className="mb-4">
        <p>Estado da conexão: <strong>{connectionState}</strong></p>
      </div>
      
      {/* Lista de veículos */}
      <div className="grid gap-4">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{vehicle.plate}</h3>
            <p>Modelo: {vehicle.model}</p>
            <p>Status: {vehicle.status}</p>
          </div>
        ))}
        
        {vehicles.length === 0 && (
          <p className="text-gray-500">Nenhum veículo encontrado</p>
        )}
      </div>
    </div>
  );
}

// Componente para simular problemas de conexão
function ConnectionControls() {
  const [isOnline, setIsOnline] = useState(true);
  
  // Simular desconexão/reconexão
  const toggleConnection = () => {
    if (isOnline) {
      // Simular desconexão
      window.dispatchEvent(new Event('offline'));
    } else {
      // Simular reconexão
      window.dispatchEvent(new Event('online'));
    }
    
    setIsOnline(!isOnline);
  };
  
  return (
    <div className="connection-controls mb-8">
      <h2 className="text-lg font-bold mb-2">Controles de Conexão</h2>
      <p className="mb-2">Use estes controles para simular problemas de conexão e testar o sistema de reconexão automática.</p>
      
      <button 
        onClick={toggleConnection}
        className={`px-4 py-2 rounded-md ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
      >
        {isOnline ? 'Simular Desconexão' : 'Simular Reconexão'}
      </button>
    </div>
  );
}

// Configurações globais de assinatura
const globalSubscriptions = [
  {
    config: {
      entity: 'notifications',
      event: '*',
      schema: 'public'
    },
    callback: (payload: RealtimePostgresChangesPayload<any>) => {
      // Disparar notificação na interface
      console.log('Nova notificação:', payload);
      
      // Exemplo: disparar evento personalizado
      const event = new CustomEvent('realtime-notification', { detail: payload });
      window.dispatchEvent(event);
    }
  }
];

// Página de exemplo
export default function RealtimeConnectionExample() {
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
        <h1 className="text-2xl font-bold mb-6">Exemplo de Conexão Realtime Robusta</h1>
        
        {/* Status da conexão */}
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-bold mb-2">Status da Conexão</h2>
          <RealtimeConnectionStatus />
        </div>
        
        {/* Controles de conexão */}
        <ConnectionControls />
        
        {/* Lista de veículos */}
        <VehiclesList />
        
        {/* Assinaturas globais */}
        <GlobalSubscriptions subscriptions={globalSubscriptions} />
      </div>
    </RealtimeProvider>
  );
}