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

// Tipo para veículos
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: string;
  last_location?: { lat: number; lng: number };
  updated_at: string;
}

// Componente para exibir veículos com sincronização após reconexão
function VehiclesWithSync() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const { connectionState, isConnected } = useRealtimeContext();
  
  // Configurar assinatura em tempo real
  const { isConnected: isRealtimeConnected } = useRealtimeSubscription<Vehicle>(
    supabase,
    {
      entity: 'vehicles',
      event: '*',
      schema: 'public'
    },
    (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      switch (eventType) {
        case 'INSERT':
          setVehicles(prev => [...prev, newRecord as Vehicle]);
          break;
          
        case 'UPDATE':
          setVehicles(prev => 
            prev.map(vehicle => 
              vehicle.id === newRecord.id ? newRecord as Vehicle : vehicle
            )
          );
          break;
          
        case 'DELETE':
          setVehicles(prev => 
            prev.filter(vehicle => vehicle.id !== oldRecord.id)
          );
          break;
      }
    }
  );
  
  // Configurar sincronização após reconexão
  const { 
    isSyncing, 
    lastSyncTimestamp, 
    syncError, 
    forceSyncData 
  } = useTableSyncAfterReconnection<Vehicle>(
    supabase,
    'vehicles',
    'updated_at',
    (syncedData) => {
      // Mesclar dados sincronizados com o estado atual
      setVehicles(prevVehicles => {
        // Criar um mapa dos veículos atuais por ID
        const vehiclesMap = new Map(prevVehicles.map(v => [v.id, v]));
        
        // Atualizar o mapa com os dados sincronizados
        syncedData.forEach(vehicle => {
          vehiclesMap.set(vehicle.id, vehicle);
        });
        
        // Converter o mapa de volta para array
        return Array.from(vehiclesMap.values());
      });
      
      console.log(`Sincronizados ${syncedData.length} veículos após reconexão`);
    }
  );
  
  // Carregar dados iniciais
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*');
          
        if (error) throw error;
        if (data) setVehicles(data as Vehicle[]);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
      }
    };
    
    fetchVehicles();
  }, []);
  
  return (
    <div className="vehicles-with-sync">
      <h2 className="text-xl font-bold mb-4">Veículos com Sincronização ({vehicles.length})</h2>
      
      {/* Status da conexão e sincronização */}
      <div className="mb-4 p-4 border rounded-lg">
        <p>Estado da conexão: <strong>{connectionState}</strong></p>
        <p>Última sincronização: {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleString() : 'Nunca'}</p>
        {isSyncing && <p className="text-yellow-500">Sincronizando dados...</p>}
        {syncError && <p className="text-red-500">Erro de sincronização: {syncError.message}</p>}
        
        <button 
          onClick={() => forceSyncData()}
          disabled={!isConnected || isSyncing}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Forçar Sincronização
        </button>
      </div>
      
      {/* Lista de veículos */}
      <div className="grid gap-4">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="border p-4 rounded-lg">
            <h3 className="font-bold">{vehicle.plate}</h3>
            <p>Modelo: {vehicle.model}</p>
            <p>Status: {vehicle.status}</p>
            <p className="text-xs text-gray-500">
              Atualizado em: {new Date(vehicle.updated_at).toLocaleString()}
            </p>
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
      <p className="mb-2">Use estes controles para simular problemas de conexão e testar o sistema de sincronização após reconexão.</p>
      
      <button 
        onClick={toggleConnection}
        className={`px-4 py-2 rounded-md ${isOnline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
      >
        {isOnline ? 'Simular Desconexão' : 'Simular Reconexão'}
      </button>
    </div>
  );
}

// Componente para simular atualizações durante desconexão
function SimulateUpdates() {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Simular atualizações no banco de dados
  const simulateUpdate = async () => {
    try {
      setIsUpdating(true);
      
      // Buscar um veículo aleatório para atualizar
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')
        .limit(10);
      
      if (!vehicles || vehicles.length === 0) {
        alert('Nenhum veículo encontrado para atualizar');
        return;
      }
      
      // Selecionar um veículo aleatório
      const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      
      // Atualizar o veículo com um novo status
      const statuses = ['ATIVO', 'INATIVO', 'EM_MANUTENÇÃO', 'EM_ROTA'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: randomStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', randomVehicle.id);
      
      if (error) throw error;
      
      alert(`Veículo ${randomVehicle.id} atualizado para status ${randomStatus}`);
    } catch (error) {
      console.error('Erro ao simular atualização:', error);
      alert(`Erro ao simular atualização: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="simulate-updates mb-8">
      <h2 className="text-lg font-bold mb-2">Simular Atualizações Durante Desconexão</h2>
      <p className="mb-2">Use este botão para simular atualizações no banco de dados enquanto o cliente está desconectado.</p>
      
      <button 
        onClick={simulateUpdate}
        disabled={isUpdating}
        className="px-4 py-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white disabled:bg-gray-400"
      >
        {isUpdating ? 'Atualizando...' : 'Simular Atualização de Veículo'}
      </button>
    </div>
  );
}

// Página de exemplo
export default function SyncAfterReconnectionExample() {
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
        <h1 className="text-2xl font-bold mb-6">Exemplo de Sincronização Após Reconexão</h1>
        
        {/* Status da conexão */}
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-lg font-bold mb-2">Status da Conexão</h2>
          <RealtimeConnectionStatus />
        </div>
        
        {/* Controles de conexão */}
        <ConnectionControls />
        
        {/* Simulação de atualizações */}
        <SimulateUpdates />
        
        {/* Lista de veículos com sincronização */}
        <VehiclesWithSync />
      </div>
    </RealtimeProvider>
  );
}