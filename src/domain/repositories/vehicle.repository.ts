/**
 * Interface do repositório de veículos
 * Define o contrato para persistência de dados
 */
import { Vehicle } from '../entities/vehicle.entity';

export interface VehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  findByStatus(status: VehicleStatus): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
}
