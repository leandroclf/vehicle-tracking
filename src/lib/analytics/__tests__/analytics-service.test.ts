import { analyticsService } from '../analytics-service';
import { db } from '../../database';

// Mock do módulo de banco de dados
jest.mock('../../database', () => ({
    db: {
        query: {
            vehicles: {
                findMany: jest.fn(),
            },
            trips: {
                findMany: jest.fn(),
            },
            alerts: {
                findMany: jest.fn(),
            },
        },
    },
}));

describe('AnalyticsService', () => {
    const mockUserId = 'user-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFleetMetrics', () => {
        it('should calculate fleet metrics correctly', async () => {
            // Mock vehicles
            (db.query.vehicles.findMany as jest.Mock).mockResolvedValue([
                { id: 1, status: 'active', status_data: { lastUpdate: new Date().toISOString() } },
                { id: 2, status: 'inactive', status_data: { lastUpdate: new Date(Date.now() - 10000000).toISOString() } },
            ]);

            // Mock trips
            (db.query.trips.findMany as jest.Mock).mockResolvedValue([
                { vehicleId: 1, distance: 100 },
                { vehicleId: 1, distance: 50 },
            ]);

            const result = await analyticsService.getFleetMetrics(mockUserId);

            expect(result.totalVehicles.value).toBe(2);
            expect(result.activeVehicles.value).toBe(1);
            expect(result.totalDistance.value).toBe(150);
        });
    });

    describe('getSecurityMetrics', () => {
        it('should calculate security metrics correctly', async () => {
            // Mock alerts
            (db.query.alerts.findMany as jest.Mock).mockResolvedValue([
                { type: 'speed', isResolved: false },
                { type: 'geofence', isResolved: false },
                { type: 'speed', isResolved: false },
            ]);

            const result = await analyticsService.getSecurityMetrics(mockUserId);

            expect(result.speedingViolations.value).toBe(2);
            expect(result.geofenceViolations.value).toBe(1);
            // Score: 100 - (3 * 5) = 85
            expect(result.riskScore.value).toBe(85);
        });
    });
});
