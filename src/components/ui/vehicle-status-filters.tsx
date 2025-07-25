'use client';

import { useState } from 'react';
import { CheckCircle, X, Filter, Car, Truck, Bus, Bike, Ship, Tractor, Smartphone, PawPrint, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VehicleFilterOption {
  id: string;
  label: string;
  icon: string;
  count: number;
  percentage: number;
}

interface VehicleTypeOption {
  id: string;
  label: string;
  icon: string;
}

interface VehicleStatusFiltersProps {
  onFilterChange?: (filters: string[]) => void;
  onTypeChange?: (types: string[]) => void;
  onBlockStatusChange?: (hasBlock: boolean | null) => void;
  className?: string;
  "data-testid"?: string;
}

export default function VehicleStatusFilters({
  onFilterChange,
  onTypeChange,
  onBlockStatusChange,
  className,
  "data-testid": testId
}: VehicleStatusFiltersProps) {
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([
    'online', 'offline', 'sem_resposta', 'sleep', 'sem_gps', 'ignicao_ligada', 'em_movimento'
  ]);
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'carro', 'moto', 'caminhao', 'onibus', 'jetski', 'barco', 'trator', 
    'retroescavadeira', 'moto_eletrica', 'pets', 'celular', 'outros'
  ]);
  
  const [blockStatus, setBlockStatus] = useState<boolean | null>(null);

  // Status de veículos
  const statusOptions: VehicleFilterOption[] = [
    { id: 'online', label: 'Online', icon: 'online', count: 3, percentage: 37.5 },
    { id: 'sem_resposta', label: 'Sem resposta', icon: 'sem_resposta', count: 0, percentage: 0 },
    { id: 'offline', label: 'Offline', icon: 'offline', count: 3, percentage: 37.5 },
    { id: 'sleep', label: 'Modo sleep', icon: 'sleep', count: 2, percentage: 25 },
    { id: 'sem_gps', label: 'Sem sinal GPS', icon: 'sem_gps', count: 0, percentage: 0 },
    { id: 'ignicao_ligada', label: 'Ignição ligada', icon: 'online', count: 2, percentage: 25 },
    { id: 'em_movimento', label: 'Em movimento', icon: 'online', count: 1, percentage: 12.5 },
  ];

  // Tipos de veículos com ícones do Lucide
  const typeOptions: VehicleTypeOption[] = [
    { id: 'carro', label: 'Carro / Utilitário Pequeno', icon: 'Car' },
    { id: 'moto', label: 'Motocicleta', icon: 'Bike' },
    { id: 'caminhao', label: 'Caminhão', icon: 'Truck' },
    { id: 'onibus', label: 'Ônibus e Micro-Ônibus', icon: 'Bus' },
    { id: 'jetski', label: 'Jetski', icon: 'Ship' },
    { id: 'barco', label: 'Barco', icon: 'Ship' },
    { id: 'trator', label: 'Trator', icon: 'Tractor' },
    { id: 'retroescavadeira', label: 'Retroescavadeira', icon: 'Tractor' },
    { id: 'moto_eletrica', label: 'Moto e Bicicleta elétrica', icon: 'Bike' },
    { id: 'pets', label: 'Pets', icon: 'PawPrint' },
    { id: 'celular', label: 'Celular, portátil, relógio e tag', icon: 'Smartphone' },
    { id: 'outros', label: 'Outros não especificados', icon: 'Package' },
  ];

  // Função para renderizar ícones
  const renderIcon = (iconName: string, className?: string) => {
    const iconProps = { className: cn('h-4 w-4', className) };
    switch (iconName) {
      case 'Car': return <Car {...iconProps} />;
      case 'Bike': return <Bike {...iconProps} />;
      case 'Truck': return <Truck {...iconProps} />;
      case 'Bus': return <Bus {...iconProps} />;
      case 'Ship': return <Ship {...iconProps} />;
      case 'Tractor': return <Tractor {...iconProps} />;
      case 'PawPrint': return <PawPrint {...iconProps} />;
      case 'Smartphone': return <Smartphone {...iconProps} />;
      case 'Package': return <Package {...iconProps} />;
      default: return <Package {...iconProps} />;
    }
  };

  const toggleStatusFilter = (id: string) => {
    let newFilters;
    if (selectedStatusFilters.includes(id)) {
      newFilters = selectedStatusFilters.filter(item => item !== id);
    } else {
      newFilters = [...selectedStatusFilters, id];
    }
    
    setSelectedStatusFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleTypeFilter = (id: string) => {
    let newTypes;
    if (selectedTypes.includes(id)) {
      newTypes = selectedTypes.filter(item => item !== id);
    } else {
      newTypes = [...selectedTypes, id];
    }
    
    setSelectedTypes(newTypes);
    onTypeChange?.(newTypes);
  };

  const handleBlockStatusChange = (value: boolean | null) => {
    setBlockStatus(value);
    onBlockStatusChange?.(value);
  };

  return (
    <Card className={cn("w-full max-w-md", className)} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-3">
          <Filter className="h-5 w-5" />
          <span>Filtros</span>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {}}
          data-testid={`${testId}-close`}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Status</h3>
          </div>
          
          <div className="space-y-3" role="group" aria-label="Filtros de status">
            {statusOptions.map(option => {
              const isSelected = selectedStatusFilters.includes(option.id);
              return (
                <div key={option.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`status-${option.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleStatusFilter(option.id)}
                      data-testid={`${testId}-status-${option.id}`}
                    />
                    <Label 
                      htmlFor={`status-${option.id}`} 
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <StatusBadge 
                        status={option.icon as any}
                        className="h-3 w-3 p-0"
                        showPulse={isSelected && option.id === 'online'}
                      />
                      <span>{option.label}</span>
                    </Label>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {option.count} ({option.percentage.toFixed(0)}%)
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Tipo do ativo</h3>
          </div>
          
          <div className="space-y-3" role="group" aria-label="Filtros de tipo de veículo">
            {typeOptions.map(option => {
              const isSelected = selectedTypes.includes(option.id);
              return (
                <div key={option.id} className="flex items-center">
                  <Checkbox
                    id={`type-${option.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleTypeFilter(option.id)}
                    data-testid={`${testId}-type-${option.id}`}
                  />
                  <Label 
                    htmlFor={`type-${option.id}`} 
                    className="ml-3 flex items-center space-x-2 cursor-pointer"
                  >
                    {renderIcon(option.icon, isSelected ? 'text-primary' : 'text-muted-foreground')}
                    <span>{option.label}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Possui bloqueio</h3>
          </div>
          
          <RadioGroup 
            value={blockStatus === null ? 'all' : blockStatus.toString()}
            onValueChange={(value) => {
              if (value === 'all') {
                handleBlockStatusChange(null);
              } else {
                handleBlockStatusChange(value === 'true');
              }
            }}
            className="space-y-2"
            data-testid={`${testId}-block-status`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="block-all" />
              <Label htmlFor="block-all">Todos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="block-yes" />
              <Label htmlFor="block-yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="block-no" />
              <Label htmlFor="block-no">Não</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}