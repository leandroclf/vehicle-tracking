export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  licensePlate: string;
  model?: string;
  year?: number;
  deviceId?: string;
  status: 'active' | 'inactive' | 'maintenance';
  color?: string;
  vin?: string;
  createdAt: Date;
  updatedAt: Date;
}

class VehiclesMockService {
  private vehicles: Vehicle[] = [
    {
      id: '1',
      userId: '1',
      name: 'Caminhão 01',
      licensePlate: 'ABC-1234',
      model: 'Volvo FH',
      year: 2020,
      deviceId: 'DEV001',
      status: 'active',
      color: 'Azul',
      vin: '1HGBH41JXMN109186',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '2',
      userId: '1',
      name: 'Van 02',
      licensePlate: 'XYZ-5678',
      model: 'Mercedes Sprinter',
      year: 2021,
      deviceId: 'DEV002',
      status: 'active',
      color: 'Branco',
      vin: '2HGBH41JXMN109187',
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2023-02-01')
    },
    {
      id: '3',
      userId: '1',
      name: 'Carro 03',
      licensePlate: 'DEF-9012',
      model: 'Toyota Corolla',
      year: 2019,
      deviceId: 'DEV003',
      status: 'maintenance',
      color: 'Prata',
      vin: '3HGBH41JXMN109188',
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date('2023-03-01')
    }
  ];

  async getVehicles(userId: string, filters?: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive' | 'maintenance' | 'all';
    sort?: 'asc' | 'desc';
  }) {
    let userVehicles = this.vehicles.filter(v => v.userId === userId);

    // Aplicar filtro de status
    if (filters?.status && filters.status !== 'all') {
      userVehicles = userVehicles.filter(v => v.status === filters.status);
    }

    // Aplicar ordenação
    if (filters?.sort === 'desc') {
      userVehicles.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      userVehicles.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Aplicar paginação
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginatedVehicles = userVehicles.slice(offset, offset + limit);

    return {
      vehicles: paginatedVehicles,
      pagination: {
        total: userVehicles.length,
        limit,
        offset
      }
    };
  }

  async createVehicle(userId: string, vehicleData: Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    // Verificar se já existe veículo com a mesma placa
    const existingVehicle = this.vehicles.find(
      v => v.licensePlate === vehicleData.licensePlate && v.userId === userId
    );

    if (existingVehicle) {
      throw new Error('Já existe um veículo com esta placa');
    }

    const newVehicle: Vehicle = {
      ...vehicleData,
      id: (this.vehicles.length + 1).toString(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.vehicles.push(newVehicle);
    return newVehicle;
  }

  async updateVehicle(userId: string, vehicleId: string, vehicleData: Partial<Omit<Vehicle, 'id' | 'userId' | 'createdAt'>>) {
    const vehicleIndex = this.vehicles.findIndex(
      v => v.id === vehicleId && v.userId === userId
    );

    if (vehicleIndex === -1) {
      throw new Error('Veículo não encontrado');
    }

    this.vehicles[vehicleIndex] = {
      ...this.vehicles[vehicleIndex],
      ...vehicleData,
      updatedAt: new Date()
    };

    return this.vehicles[vehicleIndex];
  }

  async deleteVehicle(userId: string, vehicleId: string) {
    const vehicleIndex = this.vehicles.findIndex(
      v => v.id === vehicleId && v.userId === userId
    );

    if (vehicleIndex === -1) {
      throw new Error('Veículo não encontrado');
    }

    const deletedVehicle = this.vehicles[vehicleIndex];
    this.vehicles.splice(vehicleIndex, 1);
    return deletedVehicle;
  }

  async getVehicleById(userId: string, vehicleId: string) {
    const vehicle = this.vehicles.find(
      v => v.id === vehicleId && v.userId === userId
    );

    if (!vehicle) {
      throw new Error('Veículo não encontrado');
    }

    return vehicle;
  }
}

export const VehiclesService = new VehiclesMockService();