import { Vehicle, VehicleStatus } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';

/**
 * Implementação simples em memória para testes e cenários sem persistência.
 */
export class InMemoryVehicleRepository implements VehicleRepository {
  private readonly vehicles = new Map<string, Vehicle>();

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.get(id) ?? null;
  }

  async findAll(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async findByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    return (await this.findAll()).filter((vehicle) => vehicle.status === status);
  }

  async save(vehicle: Vehicle): Promise<void> {
    this.vehicles.set(vehicle.id, vehicle);
  }

  async delete(id: string): Promise<void> {
    this.vehicles.delete(id);
  }
}
