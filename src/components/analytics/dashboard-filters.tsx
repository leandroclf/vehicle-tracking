/**
 * Dashboard Filters - Componente de Filtros do Dashboard
 * @description Filtros avançados para o dashboard analytics
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  RotateCcw,
  Search,
  MapPin,
  User,
  Car
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type PeriodOption =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'custom';

interface FilterType {
  dateRange: {
    start: Date;
    end: Date;
  };
  vehicles: string[];
  drivers: string[];
  regions: string[];
  period: PeriodOption;
}

interface DashboardFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  vehicles?: Array<{ id: string; name: string; plate: string }>;
  drivers?: Array<{ id: string; name: string }>;
  regions?: Array<{ id: string; name: string }>;
  loading?: boolean;
  className?: string;
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  vehicles = [],
  drivers = [],
  regions = [],
  loading,
  className
}: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [searchDriver, setSearchDriver] = useState('');

  const updateFilters = (updates: Partial<FilterType>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    const defaultFilters: FilterType = {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        end: new Date()
      },
      vehicles: [],
      drivers: [],
      regions: [],
      period: 'last_30_days'
    };
    onFiltersChange(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.vehicles?.length) count++;
    if (filters.drivers?.length) count++;
    if (filters.regions?.length) count++;
    if (filters.period !== 'last_30_days') count++;
    return count;
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchVehicle.toLowerCase()) ||
    vehicle.plate.toLowerCase().includes(searchVehicle.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchDriver.toLowerCase())
  );

  const handleVehicleToggle = (vehicleId: string) => {
    const currentVehicles = filters.vehicles || [];
    const newVehicles = currentVehicles.includes(vehicleId)
      ? currentVehicles.filter(id => id !== vehicleId)
      : [...currentVehicles, vehicleId];
    updateFilters({ vehicles: newVehicles });
  };

  const handleDriverToggle = (driverId: string) => {
    const currentDrivers = filters.drivers || [];
    const newDrivers = currentDrivers.includes(driverId)
      ? currentDrivers.filter(id => id !== driverId)
      : [...currentDrivers, driverId];
    updateFilters({ drivers: newDrivers });
  };

  const handleRegionToggle = (regionId: string) => {
    const currentRegions = filters.regions || [];
    const newRegions = currentRegions.includes(regionId)
      ? currentRegions.filter(id => id !== regionId)
      : [...currentRegions, regionId];
    updateFilters({ regions: newRegions });
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn('', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                  <CardDescription>
                    Configure os filtros para personalizar a visualização
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Period Selection */}
              <div className="space-y-2">
                <Label>Período</Label>
                <Select
                  value={filters.period}
                  onValueChange={(value) => updateFilters({ period: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="last_7_days">Últimos 7 dias</SelectItem>
                    <SelectItem value="last_30_days">Últimos 30 dias</SelectItem>
                    <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
                    <SelectItem value="this_month">Este mês</SelectItem>
                    <SelectItem value="last_month">Mês passado</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {filters.period === 'custom' && (
                <div className="space-y-3">
                  <Label>Período Personalizado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange?.start ? (
                            format(filters.dateRange.start, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            'Data inicial'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange?.start}
                          onSelect={(date) => 
                            updateFilters({ 
                              dateRange: { 
                                ...filters.dateRange, 
                                start: date || new Date() 
                              } 
                            })
                          }
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange?.end ? (
                            format(filters.dateRange.end, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            'Data final'
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange?.end}
                          onSelect={(date) => 
                            updateFilters({ 
                              dateRange: { 
                                ...filters.dateRange, 
                                end: date || new Date() 
                              } 
                            })
                          }
                          disabled={(date) =>
                            date > new Date() || 
                            (filters.dateRange?.start && date < filters.dateRange.start)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Vehicles Filter */}
              <div className="space-y-3">
                <Label className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Veículos
                  {filters.vehicles?.length ? (
                    <Badge variant="secondary" className="ml-2">
                      {filters.vehicles.length}
                    </Badge>
                  ) : null}
                </Label>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar veículos..."
                    value={searchVehicle}
                    onChange={(e) => setSearchVehicle(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {filteredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vehicle-${vehicle.id}`}
                        checked={filters.vehicles?.includes(vehicle.id)}
                        onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                      />
                      <Label 
                        htmlFor={`vehicle-${vehicle.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {vehicle.name} ({vehicle.plate})
                      </Label>
                    </div>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum veículo encontrado
                    </p>
                  )}
                </div>
              </div>

              {/* Drivers Filter */}
              <div className="space-y-3">
                <Label className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Motoristas
                  {filters.drivers?.length ? (
                    <Badge variant="secondary" className="ml-2">
                      {filters.drivers.length}
                    </Badge>
                  ) : null}
                </Label>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar motoristas..."
                    value={searchDriver}
                    onChange={(e) => setSearchDriver(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {filteredDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`driver-${driver.id}`}
                        checked={filters.drivers?.includes(driver.id)}
                        onCheckedChange={() => handleDriverToggle(driver.id)}
                      />
                      <Label 
                        htmlFor={`driver-${driver.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {driver.name}
                      </Label>
                    </div>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhum motorista encontrado
                    </p>
                  )}
                </div>
              </div>

              {/* Regions Filter */}
              <div className="space-y-3">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Regiões
                  {filters.regions?.length ? (
                    <Badge variant="secondary" className="ml-2">
                      {filters.regions.length}
                    </Badge>
                  ) : null}
                </Label>
                
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {regions.map((region) => (
                    <div key={region.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region.id}`}
                        checked={filters.regions?.includes(region.id)}
                        onCheckedChange={() => handleRegionToggle(region.id)}
                      />
                      <Label 
                        htmlFor={`region-${region.id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {region.name}
                      </Label>
                    </div>
                  ))}
                  {regions.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nenhuma região configurada
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.vehicles?.map((vehicleId) => {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            return vehicle ? (
              <Badge key={vehicleId} variant="secondary" className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {vehicle.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleVehicleToggle(vehicleId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
          
          {filters.drivers?.map((driverId) => {
            const driver = drivers.find(d => d.id === driverId);
            return driver ? (
              <Badge key={driverId} variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {driver.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleDriverToggle(driverId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
          
          {filters.regions?.map((regionId) => {
            const region = regions.find(r => r.id === regionId);
            return region ? (
              <Badge key={regionId} variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {region.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRegionToggle(regionId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}