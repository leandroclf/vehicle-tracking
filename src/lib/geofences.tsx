'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGeofenceColor } from '@/lib/google-maps';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/lib/auth';

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
  clientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useGeofences() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // Buscar geocercas da API
  const fetchGeofences = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/geofences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar geocercas');
      }
      
      const data = await response.json();
      
      if (data.geofences && data.geofences.length > 0) {
        // Transformar dados da API para o formato esperado
        const formattedGeofences = data.geofences.map((geofence: any) => {
          // Definir cores com base no ID
          const color = getGeofenceColor(geofence.id);
          const fillColor = color + '66'; // Adicionar transparência
          
          return {
            id: geofence.id,
            name: geofence.name,
            description: geofence.description,
            type: geofence.type,
            radius: geofence.radius,
            center: geofence.type === 'circle' ? JSON.parse(geofence.coordinates)?.center : undefined,
            paths: geofence.type === 'polygon' ? JSON.parse(geofence.coordinates)?.paths : undefined,
            color: geofence.color || color,
            fillColor: geofence.color ? geofence.color + '66' : fillColor,
            clientId: geofence.user_id,
            createdAt: geofence.created_at,
            updatedAt: geofence.updated_at
          };
        });
        
        setGeofences(formattedGeofences);
      } else {
        setGeofences([]);
      }
    } catch (err) {
      console.error('Erro ao buscar geocercas:', err);
      setError('Falha ao carregar geocercas. Tente novamente mais tarde.');
      setGeofences([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Função para criar uma nova geocerca
  const createGeofence = useCallback(async (geofence: Partial<Geofence>): Promise<boolean> => {
    if (!token) return false;
    if (!geofence.type) {
      console.error('Tipo de geocerca não especificado');
      setError('O tipo de geocerca é obrigatório');
      return false;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Gerar cores
      const color = geofence.color || getGeofenceColor(uuidv4());
      
      // Preparar dados para a API
      const coordinates = geofence.type === 'circle' 
        ? JSON.stringify({ center: geofence.center, radius: geofence.radius })
        : JSON.stringify({ paths: geofence.paths });
      
      const apiGeofence = {
        name: geofence.name || `Nova Área ${geofences.length + 1}`,
        description: geofence.description || '',
        type: geofence.type,
        coordinates,
        radius: geofence.radius,
        color,
        status: 'active',
        vehicle_ids: []
      };
      
      const response = await fetch('/api/geofences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiGeofence)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar geocerca');
      }
      
      // Atualizar a lista completa de geocercas
      await fetchGeofences();
      
      return true;
    } catch (err) {
      console.error('Erro ao criar geocerca:', err);
      setError('Falha ao criar geocerca. Tente novamente mais tarde.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences, token, fetchGeofences]);

  // Função para atualizar uma geocerca existente
  const updateGeofence = useCallback(async (geofence: Geofence): Promise<boolean> => {
    if (!token) return false;
    
    setLoading(true);
    setError(null);

    try {
      // Preparar dados para a API
      const coordinates = geofence.type === 'circle' 
        ? JSON.stringify({ center: geofence.center, radius: geofence.radius })
        : JSON.stringify({ paths: geofence.paths });
      
      const apiGeofence = {
        id: geofence.id,
        name: geofence.name,
        description: geofence.description || '',
        type: geofence.type,
        coordinates,
        radius: geofence.radius,
        color: geofence.color,
        status: 'active'
      };
      
      const response = await fetch('/api/geofences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiGeofence)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar geocerca');
      }
      
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
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences, token]);

  // Função para excluir uma geocerca
  const deleteGeofence = useCallback(async (geofenceId: string): Promise<boolean> => {
    if (!token) return false;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/geofences?id=${geofenceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao excluir geocerca');
      }
      
      // Atualizar estado local
      setGeofences(geofences.filter(g => g.id !== geofenceId));
      
      return true;
    } catch (err) {
      console.error('Erro ao excluir geocerca:', err);
      setError('Falha ao excluir geocerca. Tente novamente mais tarde.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [geofences, token]);

  // Verificar se um veículo está dentro de uma geocerca
  const checkGeofence = useCallback(async (vehicleId: string, lat: number, lng: number): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await fetch(`/api/geofences/check?vehicle_id=${vehicleId}&lat=${lat}&lng=${lng}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao verificar geocerca');
      }
      
      const data = await response.json();
      return data.inside === true;
    } catch (err) {
      console.error('Erro ao verificar geocerca:', err);
      return false;
    }
  }, [token]);

  // Buscar geocercas ao montar o componente ou quando o token mudar
  useEffect(() => {
    if (token) {
      fetchGeofences();
    }
  }, [token, fetchGeofences]);

  return {
    geofences,
    loading,
    error,
    refreshGeofences: fetchGeofences,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    checkGeofence
  };
} 