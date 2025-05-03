'use client';

import React, { useState, useEffect } from 'react';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import GoogleMapsComponent from '@/components/map/GoogleMapsComponent';
import { Geofence } from '@/lib/geofences';
import { RoutePoint } from '@/components/map/RouteHistory';
import { MapIcon, AlertTriangle, Clock, Settings, Layers } from 'lucide-react';
import { useVehicles } from '@/lib/vehicles';
import { useGeofences } from '@/lib/geofences';
import { calculateCenter } from '@/lib/google-maps';
import { Vehicle } from '@/lib/vehicles';

export default function MapPage() {
  // Estados para controlar o mapa
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [editableGeofences, setEditableGeofences] = useState(false);
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [routeHistoryVehicleId, setRouteHistoryVehicleId] = useState<number | null>(null);
  const [routeHistoryStartDate, setRouteHistoryStartDate] = useState<Date | null>(null);
  const [routeHistoryEndDate, setRouteHistoryEndDate] = useState<Date | null>(null);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  
  // Estados para centro e zoom do mapa
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(10);
  
  // Hooks para veículos e geocercas
  const { vehicles, refreshVehicles } = useVehicles();
  const { 
    geofences, 
    createGeofence, 
    updateGeofence, 
    deleteGeofence 
  } = useGeofences();

  // Função para lidar com a seleção de veículo
  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicleId(vehicle?.id || null);
    
    // Centralizar o mapa no veículo selecionado
    if (vehicle) {
      setMapCenter({ lat: vehicle.lat, lng: vehicle.lng });
      setMapZoom(15);
    }
  };

  // Função para lidar com a seleção de geocerca
  const handleGeofenceSelect = (geofence: Geofence | null) => {
    setSelectedGeofence(geofence);
    
    // Centralizar o mapa na geocerca selecionada
    if (geofence) {
      if (geofence.type === 'circle' && geofence.center) {
        setMapCenter(geofence.center);
        setMapZoom(15);
      } else if (geofence.type === 'polygon' && geofence.paths && geofence.paths.length > 0) {
        setMapCenter(calculateCenter(geofence.paths));
        setMapZoom(14);
      }
    }
  };

  // Função para lidar com a criação de geocerca
  const handleGeofenceCreate = async (geofence: Partial<Geofence>) => {
    const success = await createGeofence(geofence);
    if (success) {
      console.log('Geocerca criada com sucesso');
    } else {
      console.error('Erro ao criar geocerca');
    }
  };

  // Função para lidar com a atualização de geocerca
  const handleGeofenceUpdate = async (geofence: Geofence) => {
    const success = await updateGeofence(geofence);
    if (success) {
      console.log('Geocerca atualizada com sucesso');
    } else {
      console.error('Erro ao atualizar geocerca');
    }
  };

  // Função para lidar com a exclusão de geocerca
  const handleGeofenceDelete = async (geofenceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta geocerca?')) {
      const success = await deleteGeofence(geofenceId);
      if (success) {
        console.log('Geocerca excluída com sucesso');
        setSelectedGeofence(null);
      } else {
        console.error('Erro ao excluir geocerca');
      }
    }
  };

  // Função para lidar com o clique em um ponto de rota
  const handleRoutePointClick = (point: RoutePoint) => {
    console.log('Ponto de rota clicado:', point);
  };

  // Função para alternar o modo de edição de geocercas
  const toggleGeofenceEditing = () => {
    setEditableGeofences(!editableGeofences);
  };

  // Função para mostrar o histórico de rotas
  const showVehicleHistory = (vehicleId: number) => {
    setRouteHistoryVehicleId(vehicleId);
    setShowRouteHistory(true);
  };
  
  // Centralizar o mapa em todos os veículos na primeira renderização
  useEffect(() => {
    if (vehicles.length > 0 && !mapCenter) {
      const vehicleCoordinates = vehicles.map(vehicle => ({
        lat: vehicle.lat,
        lng: vehicle.lng
      }));
      
      setMapCenter(calculateCenter(vehicleCoordinates));
      
      // Ajustar zoom com base no número de veículos
      if (vehicles.length === 1) {
        setMapZoom(15);
      } else {
        setMapZoom(11);
      }
    }
  }, [vehicles, mapCenter]);

  // Opções para o menu de tipos de mapa
  const mapTypeOptions = [
    { id: 'roadmap', label: 'Mapa', icon: <MapIcon size={16} /> },
    { id: 'satellite', label: 'Satélite', icon: <Layers size={16} /> },
    { id: 'hybrid', label: 'Híbrido', icon: <Layers size={16} /> },
    { id: 'terrain', label: 'Terreno', icon: <MapIcon size={16} /> },
  ];

  // Definição das abas
  const tabItems = [
    {
      id: 'map',
      label: 'Mapa em Tempo Real',
      icon: <MapIcon size={16} />,
      content: (
        <div className="relative w-full h-[calc(100vh-220px)]">
          <GoogleMapsComponent
            mapType={mapType}
            showTraffic={showTraffic}
            showGeofences={showGeofences}
            editableGeofences={editableGeofences}
            showRouteHistory={showRouteHistory}
            routeHistoryVehicleId={routeHistoryVehicleId}
            routeHistoryStartDate={routeHistoryStartDate}
            routeHistoryEndDate={routeHistoryEndDate}
            selectedVehicleId={selectedVehicleId}
            onVehicleSelect={handleVehicleSelect}
            onGeofenceSelect={handleGeofenceSelect}
            onGeofenceCreate={handleGeofenceCreate}
            onGeofenceUpdate={handleGeofenceUpdate}
            onGeofenceDelete={handleGeofenceDelete}
            onRoutePointClick={handleRoutePointClick}
          />
        </div>
      ),
    },
    {
      id: 'history',
      label: 'Histórico de Rotas',
      icon: <Clock size={16} />,
      content: (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Histórico de Rotas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Veículo</label>
              <select
                className="w-full p-2 border rounded-md"
                value={routeHistoryVehicleId || ''}
                onChange={(e) => setRouteHistoryVehicleId(Number(e.target.value) || null)}
              >
                <option value="">Selecione um veículo</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.plate})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="p-2 border rounded-md"
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setRouteHistoryStartDate(date);
                  }}
                />
                <input
                  type="date"
                  className="p-2 border rounded-md"
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setRouteHistoryEndDate(date);
                  }}
                />
              </div>
            </div>
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={() => setShowRouteHistory(true)}
            disabled={!routeHistoryVehicleId}
          >
            Mostrar Histórico
          </button>
          <div className="bg-yellow-50 border-yellow-200 border p-3 rounded-md mt-4">
            <div className="flex items-start">
              <AlertTriangle size={18} className="text-yellow-500 mt-0.5 mr-2" />
              <div>
                <p className="text-sm text-gray-700">
                  O histórico de rotas está disponível apenas para assinantes do plano &quot;Premium&quot; ou superior.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'geofences',
      label: 'Geocercas',
      icon: <AlertTriangle size={16} />,
      content: (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gerenciamento de Geocercas</h2>
            <button
              className={`px-4 py-2 rounded-md ${
                editableGeofences
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
              }`}
              onClick={toggleGeofenceEditing}
            >
              {editableGeofences ? 'Concluir Edição' : 'Editar Geocercas'}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <h3 className="font-medium mb-2">Instruções:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Clique no botão "Editar Geocercas" para entrar no modo de edição</li>
              <li>Use as ferramentas do mapa para desenhar polígonos ou círculos</li>
              <li>Clique em uma geocerca existente para editá-la</li>
              <li>Arraste os pontos para ajustar o formato da geocerca</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
            <h3 className="font-medium mb-2">Geocercas Existentes:</h3>
            {geofences.length === 0 ? (
              <p className="text-gray-500">Nenhuma geocerca cadastrada</p>
            ) : (
              <ul className="divide-y">
                {geofences.map((geofence) => (
                  <li 
                    key={geofence.id} 
                    className={`py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedGeofence?.id === geofence.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                    }`}
                    onClick={() => handleGeofenceSelect(geofence)}
                  >
                    <div className="flex items-center">
                      <span 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: geofence.color }}
                      />
                      <span className="flex-1">{geofence.name}</span>
                      <Badge variant="outline">
                        {geofence.type === 'circle' ? 'Círculo' : 'Polígono'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {selectedGeofence && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Geocerca Selecionada:</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={selectedGeofence.name}
                    onChange={(e) => setSelectedGeofence({ ...selectedGeofence, name: e.target.value })}
                    disabled={!editableGeofences}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    value={selectedGeofence.description || ''}
                    onChange={(e) => setSelectedGeofence({ ...selectedGeofence, description: e.target.value })}
                    disabled={!editableGeofences}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <Badge
                    variant="primary"
                    style={{ backgroundColor: selectedGeofence.color, color: 'white' }}
                  >
                    {selectedGeofence.type === 'circle' ? 'Círculo' : 'Polígono'}
                  </Badge>
                </div>
                {selectedGeofence.type === 'circle' && selectedGeofence.radius && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Raio</label>
                    <p>{(selectedGeofence.radius / 1000).toFixed(2)} km</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                {editableGeofences && (
                  <button 
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm"
                    onClick={() => handleGeofenceUpdate(selectedGeofence)}
                  >
                    Salvar
                  </button>
                )}
                <button 
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                  onClick={() => handleGeofenceDelete(selectedGeofence.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings size={16} />,
      content: (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Configurações do Mapa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">Aparência do Mapa</h3>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Tipo de Mapa</label>
                <div className="flex flex-wrap gap-2">
                  {mapTypeOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`flex items-center px-3 py-2 rounded-md text-sm ${
                        mapType === option.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                      }`}
                      onClick={() => setMapType(option.id as any)}
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTraffic"
                    checked={showTraffic}
                    onChange={() => setShowTraffic(!showTraffic)}
                    className="mr-2"
                  />
                  <label htmlFor="showTraffic" className="text-sm">
                    Mostrar tráfego
                  </label>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showGeofences"
                    checked={showGeofences}
                    onChange={() => setShowGeofences(!showGeofences)}
                    className="mr-2"
                  />
                  <label htmlFor="showGeofences" className="text-sm">
                    Mostrar geocercas
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium mb-3">Atualizações</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                O mapa é atualizado automaticamente a cada 10 segundos para mostrar a posição mais recente dos veículos.
              </p>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
                onClick={refreshVehicles}
              >
                Atualizar Agora
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Monitoramento</h1>
      <Tabs items={tabItems} />
    </div>
  );
} 