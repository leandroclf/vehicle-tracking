'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Grid from '@/components/ui/Grid';
import { Search, MapPin, Edit, Trash2 } from 'lucide-react';

// Tipo para dados de geocerca
interface Geofence {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export default function GeofencesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Dados de exemplo
  const geofencesData: Geofence[] = [
    {
      id: '1',
      name: 'Zona de Entrega Sul',
      description: 'Área de entrega setor sul',
      active: true
    },
    {
      id: '2',
      name: 'Centro Logístico',
      description: 'Depósito central',
      active: true
    },
    {
      id: '3',
      name: 'Área Restrita',
      description: 'Zona de exclusão para caminhões',
      active: false
    }
  ];

  // Filtrar geocercas de acordo com a busca
  const filteredGeofences = geofencesData.filter(geofence =>
    geofence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    geofence.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Geocercas</h1>
      
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
        <Button variant="primary">Nova Geocerca</Button>
      </div>
      
      <Grid cols={3} gap="lg" className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredGeofences.map((geofence) => (
          <Card key={geofence.id} className="p-0">
            <div className="bg-gray-100 h-36 rounded-t-lg flex items-center justify-center">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{geofence.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{geofence.description}</p>
              <div className="flex justify-between items-center mt-4">
                <Badge variant={geofence.active ? "success" : "warning"}>
                  {geofence.active ? "Ativa" : "Inativa"}
                </Badge>
                <div className="space-x-2">
                  <Button variant="primary" size="sm" leftIcon={<Edit size={16} />}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" leftIcon={<Trash2 size={16} />}>
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </Grid>
    </div>
  );
} 