'use client';

import { useState } from 'react';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Search } from 'lucide-react';
import { TableColumn } from '@/components/ui/Table';

// Tipo para os dados de veículos
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: 'moving' | 'stopped' | 'offline';
  lastUpdate: string;
}

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dados de exemplo
  const vehiclesData: Vehicle[] = [
    { 
      id: '1', 
      plate: 'ABC-1234', 
      model: 'Ford F-350', 
      status: 'moving', 
      lastUpdate: 'Há 5 minutos'
    },
    { 
      id: '2', 
      plate: 'DEF-5678', 
      model: 'Mercedes Sprinter', 
      status: 'moving', 
      lastUpdate: 'Há 10 minutos'
    },
    { 
      id: '3', 
      plate: 'GHI-9012', 
      model: 'Volvo FH', 
      status: 'stopped', 
      lastUpdate: 'Há 45 minutos'
    },
    { 
      id: '4', 
      plate: 'JKL-3456', 
      model: 'Volkswagen Delivery', 
      status: 'offline', 
      lastUpdate: 'Há 3 horas'
    },
  ];
  
  // Filtrar veículos de acordo com a busca
  const filteredVehicles = vehiclesData.filter(vehicle => 
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Definição das colunas da tabela
  const columns: TableColumn<Vehicle>[] = [
    {
      header: 'Placa',
      accessor: 'plate',
      sortable: true,
    },
    {
      header: 'Modelo',
      accessor: 'model',
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (vehicle: Vehicle) => {
        if (vehicle.status === 'moving') {
          return <Badge variant="success">Em movimento</Badge>;
        } else if (vehicle.status === 'stopped') {
          return <Badge variant="warning">Parado</Badge>;
        } else {
          return <Badge variant="default">Offline</Badge>;
        }
      },
    },
    {
      header: 'Última Atualização',
      accessor: 'lastUpdate',
    },
    {
      header: 'Ações',
      accessor: (vehicle: Vehicle) => (
        <div className="flex space-x-2">
          <Button variant="primary" size="sm">Ver</Button>
          <Button variant="secondary" size="sm">Editar</Button>
        </div>
      ),
    },
  ];
  
  // Handler para clique na linha
  const handleRowClick = (vehicle: Vehicle) => {
    console.log('Veículo selecionado:', vehicle);
    // Implementar navegação para página de detalhes
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Veículos</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Buscar veículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
            className="w-64"
          />
        </div>
        <Button variant="primary">Adicionar Veículo</Button>
      </div>
      
      <Table
        data={filteredVehicles}
        columns={columns}
        onRowClick={handleRowClick}
        pagination={true}
        itemsPerPage={10}
        className="shadow-md rounded-lg"
        emptyMessage="Nenhum veículo encontrado"
      />
    </div>
  );
} 