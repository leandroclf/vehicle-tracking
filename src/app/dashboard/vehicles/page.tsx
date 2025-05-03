'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import VehicleForm from '@/components/vehicle/VehicleForm';
import { Search, Eye, Edit, AlertCircle, Trash2 } from 'lucide-react';
import { TableColumn } from '@/components/ui/Table';
import { toast } from 'sonner';

// Tipo para os dados de veículos
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: 'moving' | 'stopped' | 'offline';
  lastUpdate: string;
  year?: string;
  color?: string;
}

export default function VehiclesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Estados para controle dos modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // Em uma implementação real, buscaríamos do backend
      // Por enquanto, usamos dados de exemplo
      
      // Simular resposta do servidor
      setTimeout(() => {
        const vehiclesData: Vehicle[] = [
          { 
            id: '1', 
            plate: 'ABC-1234', 
            model: 'Ford F-350', 
            status: 'moving', 
            lastUpdate: 'Há 5 minutos',
            year: '2022',
            color: 'Preto'
          },
          { 
            id: '2', 
            plate: 'DEF-5678', 
            model: 'Mercedes Sprinter', 
            status: 'moving', 
            lastUpdate: 'Há 10 minutos',
            year: '2021',
            color: 'Branco'
          },
          { 
            id: '3', 
            plate: 'GHI-9012', 
            model: 'Volvo FH', 
            status: 'stopped', 
            lastUpdate: 'Há 45 minutos',
            year: '2020',
            color: 'Azul'
          },
          { 
            id: '4', 
            plate: 'JKL-3456', 
            model: 'Volkswagen Delivery', 
            status: 'offline', 
            lastUpdate: 'Há 3 horas',
            year: '2019',
            color: 'Prata'
          },
        ];
        
        setVehicles(vehiclesData);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast.error('Erro ao carregar veículos. Tente novamente.');
      setLoading(false);
    }
  };
  
  // Filtrar veículos de acordo com a busca
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Adicionar veículo
  const handleAddVehicle = () => {
    setIsAddModalOpen(true);
  };
  
  // Visualizar detalhes do veículo
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };
  
  // Editar veículo
  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };
  
  // Excluir veículo
  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };
  
  // Submeter formulário de adição
  const handleSubmitAdd = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Simular envio para API
      setTimeout(() => {
        // Criar novo veículo com ID único e adicionar à lista
        const newVehicle: Vehicle = {
          id: Math.random().toString(36).substring(2, 9),
          plate: data.plate,
          model: data.model,
          status: 'offline',
          lastUpdate: 'Agora',
          year: data.year,
          color: data.color
        };
        
        setVehicles(prev => [...prev, newVehicle]);
        setIsAddModalOpen(false);
        setIsSubmitting(false);
        toast.success('Veículo adicionado com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error);
      toast.error('Erro ao adicionar veículo. Tente novamente.');
      setIsSubmitting(false);
    }
  };
  
  // Submeter formulário de edição
  const handleSubmitEdit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Simular envio para API
      setTimeout(() => {
        // Atualizar veículo na lista
        setVehicles(prev => 
          prev.map(vehicle => 
            vehicle.id === data.id 
              ? { 
                  ...vehicle, 
                  plate: data.plate,
                  model: data.model,
                  year: data.year,
                  color: data.color
                } 
              : vehicle
          )
        );
        
        setIsEditModalOpen(false);
        setIsSubmitting(false);
        toast.success('Veículo atualizado com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      toast.error('Erro ao atualizar veículo. Tente novamente.');
      setIsSubmitting(false);
    }
  };
  
  // Confirmar exclusão de veículo
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      
      if (!selectedVehicle) return;
      
      // Simular envio para API
      setTimeout(() => {
        setVehicles(prev => prev.filter(vehicle => vehicle.id !== selectedVehicle.id));
        setIsDeleteModalOpen(false);
        setSelectedVehicle(null);
        setIsSubmitting(false);
        toast.success('Veículo excluído com sucesso!');
      }, 1000);
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      toast.error('Erro ao excluir veículo. Tente novamente.');
      setIsSubmitting(false);
    }
  };
  
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
          <Button 
            variant="primary" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewVehicle(vehicle);
            }}
          >
            Ver
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditVehicle(vehicle);
            }}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ];
  
  // Handler para clique na linha
  const handleRowClick = (vehicle: Vehicle) => {
    handleViewVehicle(vehicle);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Veículos</h1>
      
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
        <Button 
          variant="primary" 
          onClick={handleAddVehicle}
        >
          Adicionar Veículo
        </Button>
      </div>
      
      <Table
        data={filteredVehicles}
        columns={columns}
        onRowClick={handleRowClick}
        pagination={true}
        itemsPerPage={10}
        className="shadow-md rounded-lg"
        emptyMessage="Nenhum veículo encontrado"
        isLoading={loading}
      />
      
      {/* Modal para adicionar veículo */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Veículo"
        size="md"
      >
        <VehicleForm
          onSubmit={handleSubmitAdd}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
      
      {/* Modal para visualizar veículo */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Veículo"
        size="md"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Placa</h3>
                <p className="mt-1 text-lg font-semibold">{selectedVehicle.plate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Modelo</h3>
                <p className="mt-1 text-lg font-semibold">{selectedVehicle.model}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ano</h3>
                <p className="mt-1 text-lg font-semibold">{selectedVehicle.year || 'Não informado'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cor</h3>
                <p className="mt-1 text-lg font-semibold">{selectedVehicle.color || 'Não informada'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
              <div className="mt-1">
                {selectedVehicle.status === 'moving' ? (
                  <Badge variant="success">Em movimento</Badge>
                ) : selectedVehicle.status === 'stopped' ? (
                  <Badge variant="warning">Parado</Badge>
                ) : (
                  <Badge variant="default">Offline</Badge>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Atualização</h3>
              <p className="mt-1 text-lg font-semibold">{selectedVehicle.lastUpdate}</p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
              >
                Editar Veículo
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal para editar veículo */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Veículo"
        size="md"
      >
        {selectedVehicle && (
          <VehicleForm
            isEdit
            initialData={{
              id: selectedVehicle.id,
              plate: selectedVehicle.plate,
              model: selectedVehicle.model,
              year: selectedVehicle.year,
              color: selectedVehicle.color,
            }}
            onSubmit={handleSubmitEdit}
            onCancel={() => setIsEditModalOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
      
      {/* Modal para confirmar exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Veículo"
        size="sm"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir o veículo <strong>{selectedVehicle.plate}</strong>?
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={isSubmitting}
              >
                Excluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 