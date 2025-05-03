'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Grid from '@/components/ui/Grid';
import { Search, MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { useGeofences } from '@/lib/geofences';
import Tabs from '@/components/ui/Tabs';
import dynamic from 'next/dynamic';

// Carregamento dinâmico do componente do mapa para evitar erros de SSR
const GoogleMapsComponent = dynamic(
  () => import('@/components/map/GoogleMapsComponent'),
  { ssr: false }
);

// Tipo para dados de geocerca
interface Geofence {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function GeofencesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'view' | 'edit'>('view');
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [newGeofenceName, setNewGeofenceName] = useState('');
  const [newGeofenceDescription, setNewGeofenceDescription] = useState('');
  
  // Obter geocercas do hook
  const { 
    geofences, 
    loading, 
    error, 
    createGeofence, 
    updateGeofence, 
    deleteGeofence 
  } = useGeofences();

  // Filtrar geocercas de acordo com a busca
  const filteredGeofences = geofences.filter(geofence =>
    geofence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (geofence.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Obter a geocerca selecionada
  const selectedGeofence = selectedGeofenceId ? 
    geofences.find(g => g.id === selectedGeofenceId) || null : null;

  // Manipulador para selecionar uma geocerca
  const handleGeofenceSelect = (geofenceId: string) => {
    setSelectedGeofenceId(geofenceId);
    setMapMode('view');
  };

  // Manipulador para criar nova geocerca
  const handleNewGeofence = () => {
    setSelectedGeofenceId(null);
    setMapMode('edit');
    setShowGeofenceForm(true);
    setNewGeofenceName('');
    setNewGeofenceDescription('');
  };

  // Manipulador para editar geocerca
  const handleEditGeofence = (geofenceId: string) => {
    setSelectedGeofenceId(geofenceId);
    setMapMode('edit');
    
    // Preencher formulário com dados da geocerca selecionada
    const geofence = geofences.find(g => g.id === geofenceId);
    if (geofence) {
      setNewGeofenceName(geofence.name);
      setNewGeofenceDescription(geofence.description || '');
      setShowGeofenceForm(true);
    }
  };

  // Manipulador para excluir geocerca
  const handleDeleteGeofence = async (geofenceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta geocerca?')) {
      const success = await deleteGeofence(geofenceId);
      if (success) {
        if (selectedGeofenceId === geofenceId) {
          setSelectedGeofenceId(null);
        }
      }
    }
  };

  // Manipulador para criar geocerca no mapa
  const handleGeofenceCreate = async (geofence: any) => {
    // Adicionar os dados do formulário
    geofence.name = newGeofenceName || `Nova Geocerca ${geofences.length + 1}`;
    geofence.description = newGeofenceDescription;
    
    const success = await createGeofence(geofence);
    if (success) {
      setShowGeofenceForm(false);
      setMapMode('view');
    }
  };

  // Manipulador para atualizar geocerca no mapa
  const handleGeofenceUpdate = async (geofence: any) => {
    // Adicionar os dados do formulário se estiver editando
    if (mapMode === 'edit' && geofence.id === selectedGeofenceId) {
      geofence.name = newGeofenceName;
      geofence.description = newGeofenceDescription;
    }
    
    const success = await updateGeofence(geofence);
    if (success && mapMode === 'edit') {
      setShowGeofenceForm(false);
      setMapMode('view');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Geocercas</h1>
      
      <Tabs 
        items={[
          {
            id: 'list',
            label: 'Lista de Geocercas',
            content: (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Buscar geocerca..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="h-5 w-5" />}
                      className="w-64"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    leftIcon={<Plus size={16} />}
                    onClick={handleNewGeofence}
                  >
                    Nova Geocerca
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex justify-center my-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                  </div>
                ) : filteredGeofences.length === 0 ? (
                  <div className="text-center my-8 text-gray-500">
                    Nenhuma geocerca encontrada. Crie uma nova para começar.
                  </div>
                ) : (
                  <Grid cols={3} gap="lg" className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGeofences.map((geofence) => (
                      <Card key={geofence.id} className="p-0">
                        <div 
                          className="bg-gray-100 h-36 rounded-t-lg flex items-center justify-center cursor-pointer"
                          onClick={() => handleGeofenceSelect(geofence.id)}
                          style={{
                            backgroundColor: geofence.fillColor,
                            borderTop: `4px solid ${geofence.color}`
                          }}
                        >
                          <MapPin className="h-12 w-12 text-white drop-shadow-md" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">{geofence.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{geofence.description || 'Sem descrição'}</p>
                          <div className="flex justify-between items-center mt-4">
                            <Badge variant="info">
                              {geofence.type === 'circle' ? 'Círculo' : 'Polígono'}
                            </Badge>
                            <div className="space-x-2">
                              <Button 
                                variant="primary" 
                                size="sm" 
                                leftIcon={<Edit size={16} />}
                                onClick={() => handleEditGeofence(geofence.id)}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                leftIcon={<Trash2 size={16} />}
                                onClick={() => handleDeleteGeofence(geofence.id)}
                              >
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Grid>
                )}
              </>
            ),
          },
          {
            id: 'map',
            label: 'Mapa de Geocercas',
            content: (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {mapMode === 'view' ? 'Visualizar Geocercas' : 'Editar Geocerca'}
                  </h2>
                  {mapMode === 'view' ? (
                    <Button 
                      variant="primary"
                      onClick={handleNewGeofence}
                    >
                      Nova Geocerca
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        variant="secondary"
                        onClick={() => {
                          setMapMode('view');
                          setShowGeofenceForm(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
                
                {showGeofenceForm && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-4">
                    <h3 className="text-lg font-medium mb-3">
                      {selectedGeofenceId ? 'Editar Geocerca' : 'Nova Geocerca'}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <Input
                          type="text"
                          value={newGeofenceName}
                          onChange={(e) => setNewGeofenceName(e.target.value)}
                          placeholder="Nome da geocerca"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <Input
                          type="text"
                          value={newGeofenceDescription}
                          onChange={(e) => setNewGeofenceDescription(e.target.value)}
                          placeholder="Descrição (opcional)"
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        {selectedGeofenceId
                          ? 'Edite a forma da geocerca no mapa abaixo.'
                          : 'Use as ferramentas de desenho no mapa para criar a geocerca.'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="h-[calc(100vh-400px)] min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                  <GoogleMapsComponent
                    mapType="roadmap"
                    showTraffic={false}
                    showGeofences={true}
                    editableGeofences={mapMode === 'edit'}
                    selectedVehicleId={null}
                    geofences={geofences}
                    onGeofenceSelect={(geofence) => {
                      if (geofence) setSelectedGeofenceId(geofence.id);
                      else setSelectedGeofenceId(null);
                    }}
                    onGeofenceCreate={handleGeofenceCreate}
                    onGeofenceUpdate={handleGeofenceUpdate}
                    onGeofenceDelete={handleDeleteGeofence}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
} 