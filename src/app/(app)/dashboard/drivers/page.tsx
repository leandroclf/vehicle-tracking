'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

// Tipos para os dados da API
interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_type?: string;
  license_expiry?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_vehicles?: VehicleAssignment[];
}

interface VehicleAssignment {
  id: string;
  name: string;
  license_plate: string;
}

interface Vehicle {
  id: string;
  name: string;
  license_plate: string;
  model?: string;
  year?: number;
  status: 'active' | 'inactive' | 'maintenance';
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

// Componente da página de gerenciamento de condutores
export default function DriversPage() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 10, offset: 0 });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  
  // Modal states
  const [showDriverModal, setShowDriverModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  // Form states
  const [formDriver, setFormDriver] = useState<Partial<Driver>>({
    name: '',
    license_number: '',
    license_type: '',
    license_expiry: '',
    phone: '',
    email: '',
    status: 'active',
    notes: ''
  });
  const [editingDriver, setEditingDriver] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Vehicles states for assignment
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [assignedVehicles, setAssignedVehicles] = useState<VehicleAssignment[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState<boolean>(false);

  // Fetch drivers on component mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDrivers();
    }
  }, [isAuthenticated, token, pagination.offset, pagination.limit]);

  // Function to fetch drivers
  const fetchDrivers = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/drivers?limit=${pagination.limit}&offset=${pagination.offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados dos condutores');
      }
      
      const data = await response.json() as { drivers: Driver[], pagination: Pagination };
      setDrivers(data.drivers || []);
      setPagination(data.pagination || { total: 0, limit: 10, offset: 0 });
    } catch (err) {
      setError('Erro ao carregar dados dos condutores');
      console.error('Erro ao buscar condutores:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDriver(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open driver form modal
  const openDriverModal = (driver?: Driver) => {
    if (driver) {
      setFormDriver({
        name: driver.name,
        license_number: driver.license_number,
        license_type: driver.license_type || '',
        license_expiry: driver.license_expiry || '',
        phone: driver.phone || '',
        email: driver.email || '',
        status: driver.status,
        notes: driver.notes || ''
      });
      setEditingDriver(driver.id);
    } else {
      setFormDriver({
        name: '',
        license_number: '',
        license_type: '',
        license_expiry: '',
        phone: '',
        email: '',
        status: 'active',
        notes: ''
      });
      setEditingDriver(null);
    }
    setShowDriverModal(true);
  };

  // Submit driver form
  const submitDriverForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const url = editingDriver 
        ? '/api/drivers' 
        : '/api/drivers';
      
      const method = editingDriver ? 'PUT' : 'POST';
      
      const body = editingDriver 
        ? JSON.stringify({ id: editingDriver, ...formDriver }) 
        : JSON.stringify(formDriver);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });
      
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Falha ao salvar condutor');
      }
      
      // Refresh drivers list
      await fetchDrivers();
      
      // Show success message
      setMessage({ 
        type: 'success', 
        text: editingDriver ? 'Condutor atualizado com sucesso!' : 'Condutor adicionado com sucesso!' 
      });
      
      // Close modal and reset form
      setShowDriverModal(false);
      setEditingDriver(null);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar dados do condutor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete driver
  const deleteDriver = async (driverId: string) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/drivers?id=${driverId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Falha ao excluir condutor');
      }
      
      // Refresh drivers list
      await fetchDrivers();
      
      // Show success message
      setMessage({ 
        type: 'success', 
        text: 'Condutor excluído com sucesso!' 
      });
      
      // Close modal
      setShowDeleteConfirm(false);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir condutor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  // Function to open vehicle assignment modal
  const openAssignModal = async (driver: Driver) => {
    setSelectedDriver(driver.id);
    setAssignedVehicles(driver.assigned_vehicles || []);
    setSelectedVehicles(driver.assigned_vehicles?.map(v => v.id) || []);
    
    // Fetch available vehicles
    await fetchAvailableVehicles();
    
    setShowAssignModal(true);
  };

  // Function to fetch available vehicles
  const fetchAvailableVehicles = async () => {
    setIsLoadingVehicles(true);
    
    try {
      const response = await fetch('/api/vehicles/status?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar veículos disponíveis');
      }
      
      const data = await response.json() as { vehicles: Vehicle[] };
      setAvailableVehicles(data.vehicles || []);
    } catch (err) {
      setError('Erro ao carregar veículos disponíveis');
      console.error('Erro ao buscar veículos:', err);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicles(prev => {
      if (prev.includes(vehicleId)) {
        return prev.filter(id => id !== vehicleId);
      } else {
        return [...prev, vehicleId];
      }
    });
  };

  // Submit vehicle assignments
  const submitVehicleAssignments = async () => {
    if (!selectedDriver) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drivers/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driver_id: selectedDriver,
          vehicle_ids: selectedVehicles
        })
      });
      
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Falha ao associar veículos');
      }
      
      // Refresh drivers list to show updated assignments
      await fetchDrivers();
      
      // Show success message
      setMessage({
        type: 'success',
        text: 'Veículos associados com sucesso!'
      });
      
      // Close modal
      setShowAssignModal(false);
      
    } catch (err: any) {
      setError(err.message || 'Erro ao associar veículos');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Você precisa estar autenticado para ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Condutores</h1>
        <Button onClick={() => openDriverModal()} variant="primary">
          Adicionar Condutor
        </Button>
      </div>
      
      {/* Messages */}
      {message && (
        <Alert 
          variant={message.type as 'success' | 'error' | 'warning' | 'info'} 
          className="mb-4"
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}
      
      {/* Error message */}
      {error && (
        <Alert 
          variant="error"
          className="mb-4"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* Drivers list */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {isLoadingData ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Nenhum condutor encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CNH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Veículos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{driver.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{driver.license_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{driver.license_type || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {driver.license_expiry 
                        ? new Date(driver.license_expiry).toLocaleDateString('pt-BR') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        driver.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {driver.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {driver.assigned_vehicles?.length ? (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          {driver.assigned_vehicles.length} veículo(s)
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => openDriverModal(driver)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => openAssignModal(driver)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-4"
                      >
                        Veículos
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDriver(driver.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoadingData && drivers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando <span className="font-medium">{pagination.offset + 1}</span> a 
                  <span className="font-medium">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> de
                  <span className="font-medium">{pagination.total}</span> resultados
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingDriver ? 'Editar Condutor' : 'Adicionar Novo Condutor'}
              </h3>
            </div>
            <form onSubmit={submitDriverForm}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                  <Input
                    id="name"
                    name="name"
                    value={formDriver.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Número da CNH</label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formDriver.license_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="license_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo da CNH</label>
                    <select
                      id="license_type"
                      name="license_type"
                      value={formDriver.license_type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Selecione</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="AB">AB</option>
                      <option value="AC">AC</option>
                      <option value="AD">AD</option>
                      <option value="AE">AE</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="license_expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Validade</label>
                    <Input
                      type="date"
                      id="license_expiry"
                      name="license_expiry"
                      value={formDriver.license_expiry}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formDriver.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formDriver.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formDriver.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formDriver.notes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowDriverModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  {editingDriver ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Vehicle Assignment Modal */}
      {showAssignModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Associar Veículos ao Condutor
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {isLoadingVehicles ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400">Carregando veículos...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Selecione os veículos que deseja associar a este condutor.
                    </p>
                    {assignedVehicles.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Veículos atualmente associados:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {assignedVehicles.map(vehicle => (
                            <span key={vehicle.id} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
                              {vehicle.name} ({vehicle.license_plate})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {availableVehicles.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {availableVehicles.map(vehicle => (
                          <li key={vehicle.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                            <label className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedVehicles.includes(vehicle.id)}
                                onChange={() => handleVehicleSelection(vehicle.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-gray-900 dark:text-gray-100">
                                {vehicle.name} - {vehicle.license_plate}
                                {vehicle.model && ` - ${vehicle.model}`}
                                {vehicle.year && ` (${vehicle.year})`}
                              </span>
                              <span className={`px-2 ml-auto inline-flex text-xs leading-5 font-semibold rounded-full ${
                                vehicle.status === 'active' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : vehicle.status === 'maintenance'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {vehicle.status === 'active' ? 'Ativo' : 
                                 vehicle.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        Nenhum veículo disponível para associação.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => setShowAssignModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                variant="primary"
                onClick={submitVehicleAssignments}
                isLoading={isSubmitting}
                disabled={isLoadingVehicles}
              >
                Salvar Associações
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Confirmar exclusão</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 dark:text-gray-300">
                Tem certeza que deseja excluir este condutor? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <Button 
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                variant="danger"
                onClick={() => deleteDriver(selectedDriver)}
                isLoading={isSubmitting}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}