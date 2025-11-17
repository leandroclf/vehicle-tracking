import { Coordinates, VehicleStatus } from '@/domain/entities/vehicle.entity';

/**
 * Estrutura de dados para criação de veículos.
 * Mantém a camada de aplicação desacoplada de requisições HTTP.
 */
export interface CreateVehicleDto {
  name: string;
  licensePlate: string;
  status?: VehicleStatus;
  coordinates?: Coordinates;
}
