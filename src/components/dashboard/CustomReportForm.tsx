'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
}

interface CustomReportFormProps {
  vehicles: Vehicle[];
  onSubmit: (data: {
    title: string;
    vehicleIds: string[];
    startDate: string;
    endDate: string;
    format: 'PDF' | 'Excel';
    customFields: string[];
    customFilters: {
      field: string;
      operator: string;
      value: string | number;
    }[];
  }) => Promise<void>;
  isSubmitting: boolean;
}

const AVAILABLE_FIELDS = [
  { id: 'timestamp', name: 'Data/Hora' },
  { id: 'latitude', name: 'Latitude' },
  { id: 'longitude', name: 'Longitude' },
  { id: 'speed', name: 'Velocidade' },
  { id: 'altitude', name: 'Altitude' },
  { id: 'direction', name: 'Direção' },
  { id: 'odometer', name: 'Odômetro' },
  { id: 'fuel_level', name: 'Nível de Combustível' },
  { id: 'fuel_consumption', name: 'Consumo de Combustível' },
  { id: 'engine_temp', name: 'Temperatura do Motor' },
  { id: 'rpm', name: 'RPM' },
  { id: 'acceleration', name: 'Aceleração' },
  { id: 'braking', name: 'Frenagem' },
  { id: 'ignition', name: 'Ignição' },
  { id: 'battery', name: 'Bateria' },
  { id: 'address', name: 'Endereço' }
];

const OPERATORS = [
  { id: 'eq', name: 'Igual a' },
  { id: 'gt', name: 'Maior que' },
  { id: 'lt', name: 'Menor que' },
  { id: 'gte', name: 'Maior ou igual a' },
  { id: 'lte', name: 'Menor ou igual a' },
  { id: 'contains', name: 'Contém' }
];

export default function CustomReportForm({ vehicles, onSubmit, isSubmitting }: CustomReportFormProps) {
  const [title, setTitle] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'Excel'>('PDF');
  const [selectedFields, setSelectedFields] = useState<string[]>(['timestamp', 'speed', 'address']);
  const [filters, setFilters] = useState<{
    field: string;
    operator: string;
    value: string;
  }[]>([]);
  const [error, setError] = useState('');

  const handleAddFilter = () => {
    setFilters([...filters, { field: 'speed', operator: 'gt', value: '' }]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: 'field' | 'operator' | 'value', value: string) => {
    const newFilters = [...filters];
    newFilters[index][key] = value;
    setFilters(newFilters);
  };

  const toggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldId));
    } else {
      setSelectedFields([...selectedFields, fieldId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title || !startDate || !endDate || selectedVehicles.length === 0) {
      setError('Todos os campos marcados com * são obrigatórios');
      return;
    }
    
    if (selectedFields.length === 0) {
      setError('Selecione pelo menos um campo para o relatório');
      return;
    }
    
    // Validar filtros
    for (const filter of filters) {
      if (!filter.field || !filter.operator || filter.value === '') {
        setError('Todos os campos do filtro devem ser preenchidos');
        return;
      }
    }
    
    // Converter valores para número quando apropriado
    const processedFilters = filters.map(filter => {
      const isNumeric = ['speed', 'altitude', 'odometer', 'fuel_level', 'fuel_consumption', 'engine_temp', 'rpm'].includes(filter.field);
      return {
        field: filter.field,
        operator: filter.operator,
        value: isNumeric ? parseFloat(filter.value) : filter.value
      };
    });
    
    try {
      await onSubmit({
        title,
        vehicleIds: selectedVehicles,
        startDate,
        endDate,
        format: reportFormat,
        customFields: selectedFields,
        customFilters: processedFilters
      });
      
      // Limpar formulário após envio bem-sucedido
      setTitle('');
      setSelectedVehicles([]);
      setStartDate('');
      setEndDate('');
      setReportFormat('PDF');
      setSelectedFields(['timestamp', 'speed', 'address']);
      setFilters([]);
    } catch (err) {
      console.error('Erro ao enviar relatório customizado:', err);
      setError('Ocorreu um erro ao enviar o relatório');
    }
  };

  const getFieldName = (fieldId: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">Criar Relatório Customizado</h2>
      {error && <Alert className="mb-4" variant="destructive">{error}</Alert>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="reportTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Título do Relatório *
          </label>
          <input
            id="reportTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            disabled={isSubmitting}
            placeholder="Ex: Análise de Velocidade Personalizada"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="vehicleSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Veículos *
          </label>
          <select
            id="vehicleSelect"
            multiple
            value={selectedVehicles}
            onChange={(e) => setSelectedVehicles(Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
            disabled={isSubmitting}
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.model} ({vehicle.plate})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Segure Ctrl para selecionar múltiplos veículos</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial *
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final *
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Formato
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="reportFormat"
                value="PDF"
                checked={reportFormat === 'PDF'}
                onChange={() => setReportFormat('PDF')}
                className="h-4 w-4 text-blue-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">PDF</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="reportFormat"
                value="Excel"
                checked={reportFormat === 'Excel'}
                onChange={() => setReportFormat('Excel')}
                className="h-4 w-4 text-green-600"
                disabled={isSubmitting}
              />
              <span className="ml-2">Excel</span>
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campos a Incluir *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {AVAILABLE_FIELDS.map((field) => (
              <label key={field.id} className="inline-flex items-center p-2 border rounded-md hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                  className="h-4 w-4 text-blue-600"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm">{field.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Filtros
            </label>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={handleAddFilter}
              disabled={isSubmitting}
              className="flex items-center gap-1"
            >
              <Plus size={14} /> Adicionar Filtro
            </Button>
          </div>
          
          {filters.length === 0 ? (
            <p className="text-sm text-gray-500 p-2 border border-dashed border-gray-300 rounded-md">
              Sem filtros. Os dados não serão filtrados.
            </p>
          ) : (
            <div className="space-y-2">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, 'field', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    disabled={isSubmitting}
                  >
                    {AVAILABLE_FIELDS.map((field) => (
                      <option key={field.id} value={field.id}>{field.name}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    disabled={isSubmitting}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    placeholder="Valor"
                    disabled={isSubmitting}
                  />
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveFilter(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            Gerar Relatório <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
} 