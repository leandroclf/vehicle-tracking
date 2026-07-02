'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import VehicleForm from '@/components/vehicle/VehicleForm';
import { Search, Eye, Edit, Trash2, Plus, Filter, Car } from 'lucide-react';
import { toast } from 'sonner';
import VehicleHistory from '@/components/vehicle/VehicleHistory';
import VehicleStatusFilters from '@/components/ui/vehicle-status-filters';
import { useVehicles, Vehicle } from '@/lib/vehicles-client';

// Payload do VehicleForm
interface VehicleFormData {
  id?: string;
  name: string;
  plate: string;
  model: string;
  year?: string;
  color?: string;
  status: 'active' | 'inactive' | 'maintenance';
}

// Wrapper local sobre o Modal (Radix Root) com a API declarativa da página
function PageModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        {children}
      </ModalContent>
    </Modal>
  );
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error || body.message || fallback;
  } catch {
    return fallback;
  }
}

export default function VehiclesPage() {
  const router = useRouter();
  const { vehicles, isLoading, error, refreshVehicles } = useVehicles();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);

  // Estados para controle dos modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Filtrar os veículos com base nos filtros ativos
    let filtered = [...vehicles];

    if (activeFilters.length > 0) {
      const wantsOnline = activeFilters.includes('online');
      const wantsOffline = activeFilters.includes('offline');

      filtered = filtered.filter(vehicle => {
        // Estado de conexão (vehicle_status.status): com ambos marcados, não restringe
        if (wantsOnline !== wantsOffline) {
          if (wantsOnline && vehicle.connection_status !== 'online') return false;
          if (wantsOffline && vehicle.connection_status === 'online') return false;
        }

        // Filtrar por ignição
        if (activeFilters.includes('ignicao_ligada') && !vehicle.ignition) return false;

        // Filtrar por movimento
        if (activeFilters.includes('em_movimento') && !vehicle.is_moving) return false;

        return true;
      });
    }

    // Filtrar por tipo de veículo
    if (activeTypes.length > 0) {
      filtered = filtered.filter(vehicle => activeTypes.includes(vehicle.type ?? ''));
    }

    // Busca textual
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.plate.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  }, [vehicles, activeFilters, activeTypes, searchQuery]);

  const handleFilterChange = (filters: string[]) => {
    setActiveFilters(filters);
  };

  const handleTypeChange = (types: string[]) => {
    setActiveTypes(types);
  };

  const handleAddVehicle = () => {
    setIsAddModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: data.name,
          licensePlate: data.plate,
          model: data.model,
          year: data.year ? parseInt(data.year, 10) || undefined : undefined,
          color: data.color,
          status: data.status,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao adicionar veículo'));
      }

      await refreshVehicles();
      setIsAddModalOpen(false);
      toast.success('Veículo adicionado com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar veículo:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar veículo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (data: VehicleFormData) => {
    if (!data.id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          licensePlate: data.plate,
          model: data.model,
          year: data.year ? parseInt(data.year, 10) || undefined : undefined,
          color: data.color,
          status: data.status,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao atualizar veículo'));
      }

      await refreshVehicles();
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
      toast.success('Veículo atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar veículo:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar veículo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedVehicle) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/vehicles?id=${selectedVehicle.id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao excluir veículo'));
      }

      toast.success('Veículo excluído com sucesso!');
      await refreshVehicles();
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir veículo');
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalOpen(false);
      setSelectedVehicle(null);
    }
  };

  const handleShowDetails = (vehicle: Vehicle) => {
    router.push(`/dashboard/vehicles/${vehicle.id}`);
  };

  const handleShowHistory = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsHistoryModalOpen(true);
  };

  const handleShowFilters = () => {
    setIsFiltersModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsViewModalOpen(false);
    setIsFiltersModalOpen(false);
    setIsHistoryModalOpen(false);
    setSelectedVehicle(null);
  };

  // Definir colunas da tabela
  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: 'name',
      title: 'Veículo',
      sortable: true,
      render: (_value, vehicle) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Car size={24} className="text-gray-500" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{vehicle.name}</div>
            <div className="text-sm text-gray-500">{vehicle.type}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plate',
      title: 'Placa',
      sortable: true,
    },
    {
      key: 'connection_status',
      title: 'Status',
      render: (_value, vehicle) => (
        <Badge
          variant={vehicle.connection_status === 'online' ? 'success' : 'destructive'}
          className="capitalize"
        >
          {vehicle.connection_status === 'online' ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'last_update',
      title: 'Última Atualização',
      sortable: true,
      render: (_value, vehicle) => (
        <span className="text-sm text-gray-600">
          {vehicle.last_update
            ? new Date(vehicle.last_update).toLocaleString('pt-BR')
            : 'Sem dados'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Ações',
      render: (_value, vehicle) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleShowDetails(vehicle); }}
            data-testid={`view-vehicle-${vehicle.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleEditVehicle(vehicle); }}
            data-testid={`edit-vehicle-${vehicle.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(vehicle); }}
            data-testid={`delete-vehicle-${vehicle.id}`}
          >
            <Trash2 className="h-4 w-4" />
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
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar veículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-10"
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

      <DataTable
        data={filteredVehicles}
        columns={columns}
        searchable={false}
        sortable
        pagination
        loading={isLoading}
        emptyMessage="Nenhum veículo encontrado."
        className="bg-white shadow rounded-lg"
        data-testid="vehicles-table"
        onRowClick={(vehicle) => handleShowHistory(vehicle)}
      />

      {/* Modal para adicionar veículo */}
      <PageModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Adicionar Veículo"
      >
        <VehicleForm
          onSubmit={handleSubmitAdd}
          onCancel={handleCloseModal}
          isLoading={isSubmitting}
        />
      </PageModal>

      {/* Modal para visualizar veículo */}
      <PageModal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        title="Detalhes do Veículo"
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
                {selectedVehicle.is_moving ? (
                  <Badge variant="success">Em movimento</Badge>
                ) : selectedVehicle.connection_status === 'online' ? (
                  <Badge variant="warning">Parado</Badge>
                ) : (
                  <Badge variant="default">Offline</Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Última Atualização</h3>
              <p className="mt-1 text-lg font-semibold">
                {selectedVehicle.last_update
                  ? new Date(selectedVehicle.last_update).toLocaleString('pt-BR')
                  : 'Sem dados'}
              </p>
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
      </PageModal>

      {/* Modal para editar veículo */}
      <PageModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Editar Veículo"
      >
        {selectedVehicle && (
          <VehicleForm
            isEdit
            initialData={{
              id: String(selectedVehicle.id),
              name: selectedVehicle.name,
              plate: selectedVehicle.plate,
              model: selectedVehicle.model,
              year: selectedVehicle.year ? String(selectedVehicle.year) : undefined,
              color: selectedVehicle.color,
              status: selectedVehicle.status,
            }}
            onSubmit={handleSubmitEdit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        )}
      </PageModal>

      {/* Modal para confirmar exclusão */}
      {selectedVehicle && (
        <ConfirmationDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          title="Excluir Veículo"
          description={`Tem certeza que deseja excluir o veículo ${selectedVehicle.plate}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={confirmDelete}
          loading={isSubmitting}
          data-testid="delete-vehicle-dialog"
        />
      )}

      {/* Modal de Filtros */}
      <PageModal
        isOpen={isFiltersModalOpen}
        onClose={handleCloseModal}
        title="Filtros"
      >
        <VehicleStatusFilters
          onFilterChange={handleFilterChange}
          onTypeChange={handleTypeChange}
        />
      </PageModal>

      {/* Modal de Histórico */}
      {isHistoryModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <VehicleHistory
              vehicleName={selectedVehicle.name}
              vehicleDetails={`${selectedVehicle.model} (${selectedVehicle.plate})`}
              vehicleImei={selectedVehicle.device_imei ?? ''}
            />
          </div>
        </div>
      )}
    </div>
  );
}
