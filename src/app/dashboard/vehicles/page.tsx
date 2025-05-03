'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import VehicleForm from '@/components/vehicle/VehicleForm';
import { Search, Eye, Edit, AlertCircle, Trash2, Plus, Filter, Car } from 'lucide-react';
import { TableColumn } from '@/components/ui/Table';
import { toast } from 'sonner';
import Card from '@/components/ui/Card';
import VehicleTelemetry from '@/components/vehicle/VehicleTelemetry';
import VehicleHistory from '@/components/vehicle/VehicleHistory';
import VehicleStatusFilters from '@/components/ui/VehicleStatusFilters';
import { useVehicles } from '@/lib/vehicles';

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
  const { vehicles, isLoading, error, refreshVehicles } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<boolean | null>(null);
  
  // Estados para controle dos modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    // Filtrar os veículos com base nos filtros ativos
    let filtered = [...vehicles];
    
    if (activeFilters.length > 0) {
      filtered = filtered.filter(vehicle => {
        // Filtrar por status (online/offline)
        if (activeFilters.includes('online') && vehicle.status !== 'online') return false;
        if (activeFilters.includes('offline') && vehicle.status !== 'offline') return false;
        
        // Filtrar por ignição
        if (activeFilters.includes('ignicao_ligada') && !vehicle.ignition) return false;
        
        // Filtrar por movimento
        if (activeFilters.includes('em_movimento') && !vehicle.is_moving) return false;
        
        return true;
      });
    }
    
    // Filtrar por tipo de veículo
    if (activeTypes.length > 0) {
      filtered = filtered.filter(vehicle => activeTypes.includes(vehicle.type));
    }
    
    // Filtrar por status de bloqueio (se implementado)
    if (blockStatus !== null) {
      filtered = filtered.filter(vehicle => {
        // Aqui precisaria de uma lógica para verificar se o veículo está bloqueado
        // Por enquanto, vamos usar uma propriedade fictícia
        return vehicle.blocked === blockStatus;
      });
    }
    
    setFilteredVehicles(filtered);
  }, [vehicles, activeFilters, activeTypes, blockStatus]);
  
  const handleFilterChange = (filters: string[]) => {
    setActiveFilters(filters);
  };
  
  const handleTypeChange = (types: string[]) => {
    setActiveTypes(types);
  };
  
  const handleBlockStatusChange = (hasBlock: boolean | null) => {
    setBlockStatus(hasBlock);
  };
  
  const handleAddVehicle = () => {
    setIsAddModalOpen(true);
  };
  
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };
  
  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };
  
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
        
        refreshVehicles(prev => [...prev, newVehicle]);
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
  
  const handleSubmitEdit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Simular envio para API
      setTimeout(() => {
        // Atualizar veículo na lista
        refreshVehicles(prev => 
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
  
  const confirmDelete = async () => {
    try {
      setIsSubmitting(true);
      
      if (!selectedVehicle) return;
      
      // Simular envio para API
      setTimeout(() => {
        refreshVehicles(prev => prev.filter(vehicle => vehicle.id !== selectedVehicle.id));
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
  
  const handleShowDetails = (vehicle: Vehicle) => {
    router.push(`/dashboard/vehicles/${vehicle.id}`);
  };
  
  const handleShowHistory = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };
  
  const handleShowFilters = () => {
    setIsViewModalOpen(false);
    setIsViewModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedVehicle(null);
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
              handleShowDetails(vehicle);
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
        <div className="flex space-x-2">
          <Button 
            variant="primary" 
            onClick={handleAddVehicle}
          >
            <Plus size={16} className="mr-2" /> Adicionar Veículo
          </Button>
          <Button 
            variant="secondary" 
            onClick={handleShowFilters}
          >
            <Filter size={16} className="mr-2" /> Filtros
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <Card
        title="Lista de Veículos"
        elevated={true}
        className="mb-6"
      >
        {isLoading ? (
          <div className="p-4 text-center">
            <p>Carregando veículos...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-4 text-center">
            <p>Nenhum veículo encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veículo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Atualização
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Car size={24} className="text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{vehicle.plate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vehicle.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {vehicle.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.lastUpdate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => handleShowDetails(vehicle)}
                        >
                          Detalhes
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditVehicle(vehicle)}
                        >
                          Editar
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteVehicle(vehicle)}
                        >
                          Excluir
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleShowHistory(vehicle)}
                        >
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Modal para adicionar veículo */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Adicionar Veículo"
        size="md"
      >
        <VehicleForm
          onSubmit={handleSubmitAdd}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </Modal>
      
      {/* Modal para visualizar veículo */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowDetails(selectedVehicle);
                }}
              >
                Ver Detalhes
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Modal para editar veículo */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
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
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
      
      {/* Modal para confirmar exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
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
                onClick={handleCloseModal}
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
      
      {/* Modal de Filtros */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <VehicleStatusFilters
              onFilterChange={handleFilterChange}
              onTypeChange={handleTypeChange}
              onBlockStatusChange={handleBlockStatusChange}
            />
          </div>
        </div>
      )}
      
      {/* Modal de Histórico */}
      {isViewModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <VehicleHistory 
              vehicleName={selectedVehicle.name}
              vehicleDetails={`${selectedVehicle.details?.manufacturer || ''} ${selectedVehicle.details?.model || ''} (${selectedVehicle.plate})`}
              vehicleImei="865190070481786" // Exemplo
            />
          </div>
        </div>
      )}
    </div>
  );
} 