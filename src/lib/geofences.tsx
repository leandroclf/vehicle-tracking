'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { getGeofenceColor } from '@/lib/google-maps';
import { v4 as uuidv4 } from 'uuid';

// Definição do tipo de geocerca
export interface Geofence {
  id: string;
  name: string;
  description?: string;
  type: 'polygon' | 'circle';
  radius?: number;
  center?: google.maps.LatLngLiteral;
  paths?: google.maps.LatLngLiteral[];
  color: string;
  fillColor: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export function useGeofences() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar geocercas do Supabase
  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Tentar buscar do Supabase
      const { data, error } = await supabase
        .from('geofences')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Transformar dados do Supabase para o formato esperado
        const formattedGeofences = data.map(geofence => {
          // Definir cores com base no ID
          const color = getGeofenceColor(geofence.id);
          const fillColor = color + '66'; // Adicionar transparência
          
          return {
            id: geofence.id,
            name: geofence.name,
            description: geofence.description,
            type: geofence.type as 'polygon' | 'circle',
            radius: geofence.radius,
            center: geofence.center,
            paths: geofence.paths,
            color,
            fillColor,
            clientId: geofence.client_id,
            createdAt: geofence.created_at,
            updatedAt: geofence.updated_at
          };
        });
        
        setGeofences(formattedGeofences);
      } else {
        // Dados de exemplo para desenvolvimento
        const mockGeofences: Geofence[] = [
          {
            id: '1',
            name: 'Base Principal',
            type: 'polygon',
            paths: [
              { lat: -15.7801, lng: -47.9292 },
              { lat: -15.7851, lng: -47.9292 },
              { lat: -15.7851, lng: -47.9342 },
              { lat: -15.7801, lng: -47.9342 },
            ],
            color: '#4285F4',
            fillColor: '#4285F466',
            clientId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Área de Entrega',
            type: 'circle',
            center: { lat: -15.7901, lng: -47.9392 },
            radius: 500,
            color: '#0F9D58',
            fillColor: '#0F9D5866',
            clientId: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        setGeofences(mockGeofences);
      }
    } catch (err) {
      console.error('Erro ao buscar geocercas:', err);
      setError('Falha ao carregar geocercas. Tente novamente mais tarde.');
      
      // Usar dados mock mesmo em caso de erro
      const mockGeofences: Geofence[] = [
        {
          id: '1',
          name: 'Base Principal',
          type: 'polygon',
          paths: [
            { lat: -15.7801, lng: -47.9292 },
            { lat: -15.7851, lng: -47.9292 },
            { lat: -15.7851, lng: -47.9342 },
            { lat: -15.7801, lng: -47.9342 },
          ],
          color: '#4285F4',
          fillColor: '#4285F466',
          clientId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Área de Entrega',
          type: 'circle',
          center: { lat: -15.7901, lng: -47.9392 },
          radius: 500,
          color: '#0F9D58',
          fillColor: '#0F9D5866',
          clientId: '1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      setGeofences(mockGeofences);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para criar uma nova geocerca
  const createGeofence = useCallback(async (geofence: Partial<Geofence>): Promise<boolean> => {
    if (!geofence.type) {
      console.error('Tipo de geocerca não especificado');
      setError('O tipo de geocerca é obrigatório');
      return false;
    }
    
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Gerar um ID único
      const id = uuidv4();
      
      // Gerar cores
      const color = getGeofenceColor(id);
      const fillColor = color + '66'; // Adicionar transparência
      
      // Preparar dados para inserção
      const newGeofence = {
        id,
        name: geofence.name || `Nova Área ${geofences.length + 1}`,
        description: geofence.description || '',
        type: geofence.type,
        radius: geofence.radius,
        center: geofence.center,
        paths: geofence.paths,
        color,
        fillColor,
        client_id: '1', // ID do cliente atual
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Inserir no Supabase
      const { error } = await supabase
        .from('geofences')
        .insert(newGeofence);
      
      if (error) throw error;
      
      // Atualizar estado local
      const formattedGeofence: Geofence = {
        id,
        name: newGeofence.name,
        description: newGeofence.description,
        type: newGeofence.type,
        radius: newGeofence.radius,
        center: newGeofence.center,
        paths: newGeofence.paths,
        color: newGeofence.color,
        fillColor: newGeofence.fillColor,
        clientId: newGeofence.client_id,
        createdAt: newGeofence.created_at,
        updatedAt: newGeofence.updated_at
      };
      
      setGeofences([...geofences, formattedGeofence]);
      
      return true;
    } catch (err) {
      console.error('Erro ao criar geocerca:', err);
      setError('Falha ao criar geocerca. Tente novamente mais tarde.');
      
      // Adicionar à lista local mesmo em caso de erro (modo offline)
      const id = uuidv4();
      const color = getGeofenceColor(id);
      const fillColor = color + '66';
      
      const newGeofence: Geofence = {
        id,
        name: geofence.name || `Nova Área ${geofences.length + 1}`,
        description: geofence.description || '',
        type: geofence.type,
        radius: geofence.radius,
        center: geofence.center,
        paths: geofence.paths,
        color,
        fillColor,
        clientId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setGeofences([...geofences, newGeofence]);
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences]);

  // Função para atualizar uma geocerca existente
  const updateGeofence = useCallback(async (geofence: Geofence): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Preparar dados para atualização
      const updatedGeofence = {
        name: geofence.name,
        description: geofence.description,
        type: geofence.type,
        radius: geofence.radius,
        center: geofence.center,
        paths: geofence.paths,
        color: geofence.color,
        fill_color: geofence.fillColor,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('geofences')
        .update(updatedGeofence)
        .eq('id', geofence.id);
      
      if (error) throw error;
      
      // Atualizar estado local
      setGeofences(
        geofences.map(g => 
          g.id === geofence.id 
            ? { ...geofence, updatedAt: new Date().toISOString() } 
            : g
        )
      );
      
      return true;
    } catch (err) {
      console.error('Erro ao atualizar geocerca:', err);
      setError('Falha ao atualizar geocerca. Tente novamente mais tarde.');
      
      // Atualizar na lista local mesmo em caso de erro (modo offline)
      setGeofences(
        geofences.map(g => 
          g.id === geofence.id 
            ? { ...geofence, updatedAt: new Date().toISOString() } 
            : g
        )
      );
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences]);

  // Função para excluir uma geocerca
  const deleteGeofence = useCallback(async (geofenceId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Excluir do Supabase
      const { error } = await supabase
        .from('geofences')
        .delete()
        .eq('id', geofenceId);
      
      if (error) throw error;
      
      // Atualizar estado local
      setGeofences(geofences.filter(g => g.id !== geofenceId));
      
      return true;
    } catch (err) {
      console.error('Erro ao excluir geocerca:', err);
      setError('Falha ao excluir geocerca. Tente novamente mais tarde.');
      
      // Excluir da lista local mesmo em caso de erro (modo offline)
      setGeofences(geofences.filter(g => g.id !== geofenceId));
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences]);

  // Buscar geocercas ao montar o componente
  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  return {
    geofences,
    loading,
    error,
    refreshGeofences: fetchGeofences,
    createGeofence,
    updateGeofence,
    deleteGeofence
  };
} 