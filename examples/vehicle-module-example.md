# Exemplo Prático: Módulo de Veículos

Este documento demonstra como implementar um módulo completo seguindo a nova arquitetura proposta, usando o domínio de veículos como exemplo.

## 1. Camada de Domínio

### Entidade Vehicle

```typescript
// src/domain/entities/vehicle.entity.ts
import { Coordinates } from '../value-objects/coordinates.vo';
import { VehicleStatus } from '../value-objects/vehicle-status.vo';

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly licensePlate: string,
    public readonly status: VehicleStatus,
    public readonly coordinates: Coordinates,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validateLicensePlate(licensePlate);
  }

  updateLocation(newCoordinates: Coordinates): Vehicle {
    return new Vehicle(
      this.id,
      this.name,
      this.licensePlate,
      this.status,
      newCoordinates,
      this.createdAt,
      new Date()
    );
  }

  updateStatus(newStatus: VehicleStatus): Vehicle {
    return new Vehicle(
      this.id,
      this.name,
      this.licensePlate,
      newStatus,
      this.coordinates,
      this.createdAt,
      new Date()
    );
  }

  isActive(): boolean {
    return this.status.equals(VehicleStatus.ACTIVE);
  }

  distanceTo(coordinates: Coordinates): number {
    return this.coordinates.distanceTo(coordinates);
  }

  private validateLicensePlate(licensePlate: string): void {
    const plateRegex = /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    if (!plateRegex.test(licensePlate)) {
      throw new Error('Formato de placa inválido');
    }
  }
}
```

### Value Objects

```typescript
// src/domain/value-objects/coordinates.vo.ts
export class Coordinates {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {
    this.validateCoordinates(latitude, longitude);
  }

  distanceTo(other: Coordinates): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(this.latitude)) * 
              Math.cos(this.toRadians(other.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  equals(other: Coordinates): boolean {
    return this.latitude === other.latitude && 
           this.longitude === other.longitude;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private validateCoordinates(lat: number, lng: number): void {
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude deve estar entre -90 e 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude deve estar entre -180 e 180');
    }
  }
}
```

```typescript
// src/domain/value-objects/vehicle-status.vo.ts
export class VehicleStatus {
  private constructor(private readonly value: string) {}

  static readonly ACTIVE = new VehicleStatus('active');
  static readonly INACTIVE = new VehicleStatus('inactive');
  static readonly MAINTENANCE = new VehicleStatus('maintenance');
  static readonly OUT_OF_SERVICE = new VehicleStatus('out_of_service');

  static fromString(value: string): VehicleStatus {
    switch (value.toLowerCase()) {
      case 'active':
        return VehicleStatus.ACTIVE;
      case 'inactive':
        return VehicleStatus.INACTIVE;
      case 'maintenance':
        return VehicleStatus.MAINTENANCE;
      case 'out_of_service':
        return VehicleStatus.OUT_OF_SERVICE;
      default:
        throw new Error(`Status de veículo inválido: ${value}`);
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: VehicleStatus): boolean {
    return this.value === other.value;
  }

  canTransitionTo(newStatus: VehicleStatus): boolean {
    const transitions = {
      'active': ['inactive', 'maintenance'],
      'inactive': ['active', 'maintenance', 'out_of_service'],
      'maintenance': ['active', 'inactive', 'out_of_service'],
      'out_of_service': ['maintenance']
    };

    return transitions[this.value]?.includes(newStatus.value) ?? false;
  }
}
```

### Interface de Repositório

```typescript
// src/domain/repositories/vehicle.repository.ts
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleStatus } from '../value-objects/vehicle-status.vo';
import { Coordinates } from '../value-objects/coordinates.vo';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  findByStatus(status: VehicleStatus): Promise<Vehicle[]>;
  findNearLocation(coordinates: Coordinates, radiusKm: number): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
  exists(licensePlate: string): Promise<boolean>;
}
```

### Serviço de Domínio

```typescript
// src/domain/services/vehicle-tracking.service.ts
import { Vehicle } from '../entities/vehicle.entity';
import { Coordinates } from '../value-objects/coordinates.vo';

export interface VehicleTrackingService {
  calculateRoute(from: Coordinates, to: Coordinates): Promise<Coordinates[]>;
  estimateArrivalTime(vehicle: Vehicle, destination: Coordinates): Promise<number>;
  isInGeofence(vehicle: Vehicle, geofenceId: string): Promise<boolean>;
}
```

## 2. Camada de Aplicação

### DTOs

```typescript
// src/application/dtos/vehicle.dto.ts
export interface CreateVehicleDto {
  name: string;
  licensePlate: string;
  initialCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateVehicleDto {
  id: string;
  name?: string;
  status?: string;
}

export interface UpdateVehicleLocationDto {
  id: string;
  latitude: number;
  longitude: number;
}

export interface VehicleResponseDto {
  id: string;
  name: string;
  licensePlate: string;
  status: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Casos de Uso

```typescript
// src/application/use-cases/vehicle/create-vehicle.use-case.ts
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { Coordinates } from '@/domain/value-objects/coordinates.vo';
import { VehicleStatus } from '@/domain/value-objects/vehicle-status.vo';
import { CreateVehicleDto, VehicleResponseDto } from '../../dtos/vehicle.dto';
import { generateId } from '@/shared/utils/id.utils';
import { VehicleAlreadyExistsError } from '@/shared/errors/domain.errors';

export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) {}

  async execute(dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    // Validações de negócio
    await this.validateBusinessRules(dto);

    // Criar entidade
    const vehicle = new Vehicle(
      generateId(),
      dto.name.trim(),
      dto.licensePlate.trim().toUpperCase(),
      VehicleStatus.INACTIVE,
      new Coordinates(
        dto.initialCoordinates?.latitude ?? 0,
        dto.initialCoordinates?.longitude ?? 0
      ),
      new Date(),
      new Date()
    );

    // Persistir
    await this.vehicleRepository.save(vehicle);
    
    return this.toResponseDto(vehicle);
  }

  private async validateBusinessRules(dto: CreateVehicleDto): Promise<void> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Nome do veículo é obrigatório');
    }

    if (!dto.licensePlate || dto.licensePlate.trim().length === 0) {
      throw new Error('Placa do veículo é obrigatória');
    }

    // Verificar se já existe veículo com a mesma placa
    const exists = await this.vehicleRepository.exists(dto.licensePlate.trim().toUpperCase());
    if (exists) {
      throw new VehicleAlreadyExistsError(dto.licensePlate);
    }
  }

  private toResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      status: vehicle.status.toString(),
      coordinates: {
        latitude: vehicle.coordinates.latitude,
        longitude: vehicle.coordinates.longitude
      },
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString()
    };
  }
}
```

```typescript
// src/application/use-cases/vehicle/update-vehicle-location.use-case.ts
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { Coordinates } from '@/domain/value-objects/coordinates.vo';
import { UpdateVehicleLocationDto, VehicleResponseDto } from '../../dtos/vehicle.dto';
import { VehicleNotFoundError } from '@/shared/errors/domain.errors';

export class UpdateVehicleLocationUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) {}

  async execute(dto: UpdateVehicleLocationDto): Promise<VehicleResponseDto> {
    // Buscar veículo
    const vehicle = await this.vehicleRepository.findById(dto.id);
    if (!vehicle) {
      throw new VehicleNotFoundError(dto.id);
    }

    // Atualizar localização
    const newCoordinates = new Coordinates(dto.latitude, dto.longitude);
    const updatedVehicle = vehicle.updateLocation(newCoordinates);

    // Persistir
    await this.vehicleRepository.save(updatedVehicle);
    
    return this.toResponseDto(updatedVehicle);
  }

  private toResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      status: vehicle.status.toString(),
      coordinates: {
        latitude: vehicle.coordinates.latitude,
        longitude: vehicle.coordinates.longitude
      },
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString()
    };
  }
}
```

## 3. Camada de Infraestrutura

### Implementação do Repositório

```typescript
// src/infrastructure/repositories/supabase/vehicle.repository.impl.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VehicleStatus } from '@/domain/value-objects/vehicle-status.vo';
import { Coordinates } from '@/domain/value-objects/coordinates.vo';
import { Database } from '@/shared/types/database.types';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(
    private readonly supabaseClient: SupabaseClient<Database>
  ) {}

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabaseClient
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Vehicle[]> {
    const { data, error } = await this.supabaseClient
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    
    return data.map(row => this.mapToEntity(row));
  }

  async findByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const { data, error } = await this.supabaseClient
      .from('vehicles')
      .select('*')
      .eq('status', status.toString())
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    
    return data.map(row => this.mapToEntity(row));
  }

  async findNearLocation(coordinates: Coordinates, radiusKm: number): Promise<Vehicle[]> {
    // Implementação usando PostGIS ou cálculo manual
    const { data, error } = await this.supabaseClient
      .rpc('find_vehicles_near_location', {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        radius_km: radiusKm
      });

    if (error || !data) return [];
    
    return data.map(row => this.mapToEntity(row));
  }

  async save(vehicle: Vehicle): Promise<void> {
    const row = this.mapToRow(vehicle);
    
    const { error } = await this.supabaseClient
      .from('vehicles')
      .upsert(row);

    if (error) {
      throw new Error(`Erro ao salvar veículo: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar veículo: ${error.message}`);
    }
  }

  async exists(licensePlate: string): Promise<boolean> {
    const { data, error } = await this.supabaseClient
      .from('vehicles')
      .select('id')
      .eq('license_plate', licensePlate)
      .single();

    return !error && !!data;
  }

  private mapToEntity(row: VehicleRow): Vehicle {
    return new Vehicle(
      row.id,
      row.name,
      row.license_plate,
      VehicleStatus.fromString(row.status),
      new Coordinates(row.latitude, row.longitude),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private mapToRow(vehicle: Vehicle): Partial<VehicleRow> {
    return {
      id: vehicle.id,
      name: vehicle.name,
      license_plate: vehicle.licensePlate,
      status: vehicle.status.toString(),
      latitude: vehicle.coordinates.latitude,
      longitude: vehicle.coordinates.longitude,
      created_at: vehicle.createdAt.toISOString(),
      updated_at: vehicle.updatedAt.toISOString()
    };
  }
}
```

## 4. Camada de Apresentação

### Hook Customizado

```typescript
// src/presentation/hooks/use-vehicle.hook.ts
import { useState, useCallback } from 'react';
import { CreateVehicleUseCase } from '@/application/use-cases/vehicle/create-vehicle.use-case';
import { UpdateVehicleLocationUseCase } from '@/application/use-cases/vehicle/update-vehicle-location.use-case';
import { CreateVehicleDto, UpdateVehicleLocationDto, VehicleResponseDto } from '@/application/dtos/vehicle.dto';

interface UseVehicleReturn {
  vehicles: VehicleResponseDto[];
  isLoading: boolean;
  error: string | null;
  createVehicle: (data: CreateVehicleDto) => Promise<VehicleResponseDto>;
  updateLocation: (data: UpdateVehicleLocationDto) => Promise<VehicleResponseDto>;
  clearError: () => void;
}

export function useVehicle(
  createVehicleUseCase: CreateVehicleUseCase,
  updateLocationUseCase: UpdateVehicleLocationUseCase
): UseVehicleReturn {
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVehicle = useCallback(async (data: CreateVehicleDto): Promise<VehicleResponseDto> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const vehicle = await createVehicleUseCase.execute(data);
      setVehicles(prev => [vehicle, ...prev]);
      return vehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createVehicleUseCase]);

  const updateLocation = useCallback(async (data: UpdateVehicleLocationDto): Promise<VehicleResponseDto> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedVehicle = await updateLocationUseCase.execute(data);
      setVehicles(prev => 
        prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
      );
      return updatedVehicle;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateLocationUseCase]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    vehicles,
    isLoading,
    error,
    createVehicle,
    updateLocation,
    clearError
  };
}
```

### Componente de Formulário

```typescript
// src/presentation/components/forms/vehicle-form.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { CreateVehicleDto } from '@/application/dtos/vehicle.dto';

const vehicleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  licensePlate: z.string()
    .min(7, 'Placa deve ter pelo menos 7 caracteres')
    .max(8, 'Placa deve ter no máximo 8 caracteres')
    .regex(/^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9][A-Z][0-9]{2}$/, 'Formato de placa inválido'),
  initialCoordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional()
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  onSubmit: (data: CreateVehicleDto) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function VehicleForm({ onSubmit, isLoading = false, className }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema)
  });

  const handleFormSubmit = async (data: VehicleFormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Erro será tratado pelo hook que chama este componente
      console.error('Erro ao criar veículo:', error);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(handleFormSubmit)} 
      className={`space-y-4 ${className}`}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome do Veículo
        </label>
        <Input
          id="name"
          type="text"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
          placeholder="Ex: Caminhão 001"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
          Placa
        </label>
        <Input
          id="licensePlate"
          type="text"
          {...register('licensePlate')}
          className={errors.licensePlate ? 'border-red-500' : ''}
          placeholder="ABC1234 ou ABC1D23"
          style={{ textTransform: 'uppercase' }}
        />
        {errors.licensePlate && (
          <p className="mt-1 text-sm text-red-600">{errors.licensePlate.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
            Latitude (opcional)
          </label>
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register('initialCoordinates.latitude', { valueAsNumber: true })}
            className={errors.initialCoordinates?.latitude ? 'border-red-500' : ''}
            placeholder="-23.5505"
          />
          {errors.initialCoordinates?.latitude && (
            <p className="mt-1 text-sm text-red-600">
              {errors.initialCoordinates.latitude.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
            Longitude (opcional)
          </label>
          <Input
            id="longitude"
            type="number"
            step="any"
            {...register('initialCoordinates.longitude', { valueAsNumber: true })}
            className={errors.initialCoordinates?.longitude ? 'border-red-500' : ''}
            placeholder="-46.6333"
          />
          {errors.initialCoordinates?.longitude && (
            <p className="mt-1 text-sm text-red-600">
              {errors.initialCoordinates.longitude.message}
            </p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Criando...' : 'Criar Veículo'}
      </Button>
    </form>
  );
}
```

## 5. Configuração de Injeção de Dependência

```typescript
// src/shared/config/dependency-injection.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseVehicleRepository } from '@/infrastructure/repositories/supabase/vehicle.repository.impl';
import { CreateVehicleUseCase } from '@/application/use-cases/vehicle/create-vehicle.use-case';
import { UpdateVehicleLocationUseCase } from '@/application/use-cases/vehicle/update-vehicle-location.use-case';
import { supabaseClient } from './supabase.config';

// Container simples de injeção de dependência
class DIContainer {
  private instances = new Map<string, any>();

  register<T>(key: string, factory: () => T): void {
    this.instances.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.instances.get(key);
    if (!factory) {
      throw new Error(`Dependência não encontrada: ${key}`);
    }
    return factory();
  }
}

// Configurar dependências
export const container = new DIContainer();

// Repositórios
container.register('VehicleRepository', () => 
  new SupabaseVehicleRepository(supabaseClient)
);

// Casos de uso
container.register('CreateVehicleUseCase', () => 
  new CreateVehicleUseCase(
    container.resolve('VehicleRepository')
  )
);

container.register('UpdateVehicleLocationUseCase', () => 
  new UpdateVehicleLocationUseCase(
    container.resolve('VehicleRepository')
  )
);

// Helpers para uso nos componentes
export const getCreateVehicleUseCase = () => 
  container.resolve<CreateVehicleUseCase>('CreateVehicleUseCase');

export const getUpdateVehicleLocationUseCase = () => 
  container.resolve<UpdateVehicleLocationUseCase>('UpdateVehicleLocationUseCase');
```

## 6. Uso no Componente da Página

```typescript
// src/app/dashboard/vehicles/page.tsx
'use client';

import React from 'react';
import { VehicleForm } from '@/presentation/components/forms/vehicle-form';
import { useVehicle } from '@/presentation/hooks/use-vehicle.hook';
import { getCreateVehicleUseCase, getUpdateVehicleLocationUseCase } from '@/shared/config/dependency-injection';
import { CreateVehicleDto } from '@/application/dtos/vehicle.dto';

export default function VehiclesPage() {
  const {
    vehicles,
    isLoading,
    error,
    createVehicle,
    clearError
  } = useVehicle(
    getCreateVehicleUseCase(),
    getUpdateVehicleLocationUseCase()
  );

  const handleCreateVehicle = async (data: CreateVehicleDto) => {
    await createVehicle(data);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Gerenciar Veículos</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={clearError}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Novo Veículo</h2>
          <VehicleForm 
            onSubmit={handleCreateVehicle}
            isLoading={isLoading}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Veículos Cadastrados</h2>
          {/* Lista de veículos */}
        </div>
      </div>
    </div>
  );
}
```

Este exemplo demonstra como implementar um módulo completo seguindo a nova arquitetura, com separação clara de responsabilidades, aplicação dos princípios SOLID e facilidade de manutenção e teste.