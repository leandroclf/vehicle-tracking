/**
 * Caso de uso para criação de veículos
 * Contém a lógica de negócio para esta operação
 */
import { Vehicle, VehicleStatus } from '../../domain/entities/vehicle.entity';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';
import { CreateVehicleDto } from '../dtos/vehicle.dto';
import { generateId } from '../../shared/utils/id.utils';

export class CreateVehicleUseCase {
  constructor(
    private readonly vehicleRepository: VehicleRepository
  ) {}

  async execute(dto: CreateVehicleDto): Promise<Vehicle> {
    // Validações de negócio
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Nome do veículo é obrigatório');
    }

    if (!dto.licensePlate || dto.licensePlate.trim().length === 0) {
      throw new Error('Placa do veículo é obrigatória');
    }

    // Criar entidade
    const vehicle = new Vehicle(
      generateId(),
      dto.name.trim(),
      dto.licensePlate.trim().toUpperCase(),
      VehicleStatus.INACTIVE,
      { lat: 0, lng: 0 } // Coordenadas iniciais
    );

    // Persistir
    await this.vehicleRepository.save(vehicle);
    
    return vehicle;
  }
}
