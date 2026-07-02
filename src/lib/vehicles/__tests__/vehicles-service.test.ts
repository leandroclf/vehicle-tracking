import { VehiclesService } from '../vehicles-service';
import { db } from '../../database';

jest.mock('../../database', () => ({
  db: {
    query: {
      vehicles: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    insert: jest.fn(),
    values: jest.fn(),
    returning: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('VehiclesService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns vehicles list with pagination', async () => {
    const countChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([{ count: 1 }]),
    };

    (db.select as jest.Mock).mockReturnValue(countChain);
    (db.query.vehicles.findMany as jest.Mock).mockResolvedValue([
      { id: 1, userId: mockUserId, name: 'Test Vehicle', plate: 'ABC-1234', status: 'active' },
    ]);

    const result = await VehiclesService.getVehicles(mockUserId);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('creates a new vehicle when plate is unique', async () => {
    (db.query.vehicles.findFirst as jest.Mock).mockResolvedValue(null);

    const insertChain = {
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([
        { id: 1, plate: 'XYZ-9876', name: 'New Vehicle' },
      ]),
    };

    (db.insert as jest.Mock).mockReturnValue(insertChain);

    const result = await VehiclesService.createVehicle(mockUserId, {
      name: 'New Vehicle',
      licensePlate: 'XYZ-9876',
      model: 'Truck',
      status: 'active',
    });

    expect(result.plate).toBe('XYZ-9876');
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it('throws when license plate already exists', async () => {
    (db.query.vehicles.findFirst as jest.Mock).mockResolvedValue({
      id: 1,
      plate: 'ABC-1234',
    });

    await expect(VehiclesService.createVehicle(mockUserId, {
      name: 'Duplicate Vehicle',
      licensePlate: 'ABC-1234',
    })).rejects.toThrow('Já existe um veículo com esta placa');
  });
});
