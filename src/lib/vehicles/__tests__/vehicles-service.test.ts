import { VehiclesService } from '../vehicles-service';
import { db } from '../../database';

// Mock do módulo de banco de dados
jest.mock('../../database', () => ({
    db: {
        query: {
            vehicles: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
            },
        },
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
    },
}));

describe('VehiclesService', () => {
    const mockUserId = 'user-123';
    const mockVehicle = {
        id: 1,
        userId: mockUserId,
        name: 'Test Vehicle',
        plate: 'ABC-1234',
        status: 'active',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getVehicles', () => {
        it('should return a list of vehicles', async () => {
            // Mock do count
            (db.select as jest.Mock).mockReturnValue([{ count: 1 }]);

            // Mock do findMany
            (db.query.vehicles.findMany as jest.Mock).mockResolvedValue([mockVehicle]);

            const result = await VehiclesService.getVehicles(mockUserId);

            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toEqual(mockVehicle);
            expect(result.pagination.total).toBe(1);
        });
    });

    describe('createVehicle', () => {
        it('should create a new vehicle successfully', async () => {
            const newVehicleData = {
                name: 'New Vehicle',
                licensePlate: 'XYZ-9876',
                model: 'Truck',
                status: 'active',
            };

            // Mock verificação de placa existente (retorna null = não existe)
            (db.query.vehicles.findFirst as jest.Mock).mockResolvedValue(null);

            // Mock insert vehicle
            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([{ ...mockVehicle, ...newVehicleData }]),
                }),
            });

            // Mock insert status (segunda chamada do insert)
            // Precisamos garantir que o mock funcione para ambas as chamadas

            const result = await VehiclesService.createVehicle(mockUserId, newVehicleData);

            expect(result.plate).toBe(newVehicleData.licensePlate);
            expect(db.insert).toHaveBeenCalledTimes(2); // Veículo e Status
        });

        it('should throw error if license plate already exists', async () => {
            const newVehicleData = {
                name: 'Duplicate Vehicle',
                licensePlate: 'ABC-1234',
            };

            // Mock placa existente
            (db.query.vehicles.findFirst as jest.Mock).mockResolvedValue(mockVehicle);

            await expect(VehiclesService.createVehicle(mockUserId, newVehicleData))
                .rejects
                .toThrow('Já existe um veículo com esta placa');
        });
    });
});
