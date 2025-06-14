/**
 * Tipo para coordenadas geográficas
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Entidade Vehicle - representa um veículo no domínio
 */
export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly licensePlate: string,
    public readonly status: VehicleStatus,
    public readonly coordinates: Coordinates
  ) {}

  updateLocation(newCoordinates: Coordinates): Vehicle {
    return new Vehicle(
      this.id,
      this.name,
      this.licensePlate,
      this.status,
      newCoordinates
    );
  }

  isActive(): boolean {
    return this.status === VehicleStatus.ACTIVE;
  }
}

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}
