import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FormFieldWithValidation } from '@/components/ui/form-field-with-validation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { cn } from '@/lib/utils';

// Schema de validação
const vehicleSchema = z.object({
  plate: z.string()
    .min(1, 'Placa é obrigatória')
    .regex(/^[A-Z]{3}-?[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, 'Formato de placa inválido (AAA-0000 ou AAA0A00)'),
  model: z.string()
    .min(1, 'Modelo é obrigatório')
    .min(2, 'Modelo deve ter pelo menos 2 caracteres'),
  year: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const year = parseInt(val);
      const currentYear = new Date().getFullYear();
      return year >= 1900 && year <= currentYear + 1;
    }, 'Ano deve estar entre 1900 e o próximo ano'),
  color: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance'], {
    required_error: 'Status é obrigatório'
  })
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

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
  onSubmit: (data: VehicleFormData & { id?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
  "data-testid"?: string;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  isEdit = false,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  className,
  "data-testid": testId
}) => {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plate: initialData.plate || '',
      model: initialData.model || '',
      year: initialData.year || '',
      color: initialData.color || '',
      status: (initialData.status as 'active' | 'inactive' | 'maintenance') || 'active'
    }
  });

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'maintenance', label: 'Em Manutenção' }
  ] as const;

  const handleFormSubmit = (data: VehicleFormData) => {
    onSubmit({
      ...data,
      ...(isEdit && initialData.id ? { id: initialData.id } : {})
    });
  };

  // Validação customizada para placa
  const validatePlate = (value: string) => {
    if (!value) return 'Placa é obrigatória';
    
    // Remove hífens e espaços para validação
    const cleanPlate = value.replace(/[-\s]/g, '').toUpperCase();
    
    // Formato antigo: AAA0000
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/.test(cleanPlate);
    // Formato Mercosul: AAA0A00
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlate);
    
    if (oldFormat || mercosulFormat) {
      return true; // Válido
    }
    
    return 'Formato de placa inválido. Use AAA-0000 ou AAA0A00';
  };

  return (
    <Card className={cn("relative", className)} data-testid={testId}>
      {isLoading && <LoadingOverlay />}
      
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Veículo' : 'Novo Veículo'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormFieldWithValidation
                control={form.control}
                name="plate"
                label="Placa"
                placeholder="ABC-1234 ou ABC1A23"
                required
                validate={validatePlate}
                className="uppercase"
                data-testid="vehicle-form-plate"
              />

              <FormFieldWithValidation
                control={form.control}
                name="model"
                label="Modelo"
                placeholder="Ex: Honda Civic"
                required
                data-testid="vehicle-form-model"
              />

              <FormFieldWithValidation
                control={form.control}
                name="year"
                label="Ano"
                type="number"
                placeholder="2023"
                min={1900}
                max={new Date().getFullYear() + 1}
                data-testid="vehicle-form-year"
              />

              <FormFieldWithValidation
                control={form.control}
                name="color"
                label="Cor"
                placeholder="Ex: Branco"
                data-testid="vehicle-form-color"
              />

              <div className="md:col-span-2">
                <FormFieldWithValidation
                  control={form.control}
                  name="status"
                  label="Status"
                  type="select"
                  placeholder="Selecione o status"
                  required
                  data-testid="vehicle-form-status"
                >
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </FormFieldWithValidation>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                data-testid="vehicle-form-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                data-testid="vehicle-form-submit"
              >
                {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VehicleForm;