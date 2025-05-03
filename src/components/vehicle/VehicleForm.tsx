import React, { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select, { SelectOption } from '@/components/ui/Select';

interface VehicleFormProps {
  isEdit?: boolean;
  initialData?: {
    id?: string;
    plate?: string;
    model?: string;
    year?: string;
    color?: string;
    status?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  isEdit = false,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    year: '',
    color: '',
    status: 'active'
  });

  const statusOptions: SelectOption[] = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'maintenance', label: 'Em Manutenção' }
  ];

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        plate: initialData.plate || '',
        model: initialData.model || '',
        year: initialData.year || '',
        color: initialData.color || '',
        status: initialData.status || 'active'
      });
    }
  }, [isEdit, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      ...(isEdit && initialData.id ? { id: initialData.id } : {})
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="plate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Placa*
        </label>
        <Input
          id="plate"
          name="plate"
          value={formData.plate}
          onChange={handleChange}
          placeholder="AAA-0000"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Modelo*
        </label>
        <Input
          id="model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          placeholder="Ex: Ford F-350"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ano
          </label>
          <Input
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder="Ex: 2023"
            type="number"
            min="1900"
            max={new Date().getFullYear() + 1}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cor
          </label>
          <Input
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="Ex: Branco"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <Select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {isEdit ? 'Atualizar Veículo' : 'Adicionar Veículo'}
        </Button>
      </div>
    </form>
  );
};

export default VehicleForm; 