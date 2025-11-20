import { db } from '../database';
import { vehicles, vehicleStatus, NewVehicle } from '../schema';
import { eq, and, desc, count, ilike, or } from 'drizzle-orm';

export interface VehicleFilters {
    limit?: number;
    offset?: number;
    status?: 'active' | 'inactive' | 'maintenance' | 'all';
    sort?: 'asc' | 'desc';
    search?: string;
}

export class VehiclesService {
    static async getVehicles(userId: string, filters: VehicleFilters = {}) {
        const { limit = 50, offset = 0, status = 'all', sort = 'asc', search } = filters;

        // Construir condições de filtro
        const conditions = [eq(vehicles.userId, userId)];

        if (status !== 'all') {
            conditions.push(eq(vehicles.status, status));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(vehicles.name, `%${search}%`),
                    ilike(vehicles.plate, `%${search}%`),
                    ilike(vehicles.deviceImei, `%${search}%`)
                )
            );
        }

        const whereClause = and(...conditions);

        // Buscar total para paginação
        const [totalResult] = await db
            .select({ count: count() })
            .from(vehicles)
            .where(whereClause);

        const total = totalResult ? totalResult.count : 0;

        // Buscar veículos
        const vehiclesList = await db.query.vehicles.findMany({
            where: whereClause,
            limit,
            offset,
            orderBy: (vehicles, { asc, desc }) => [
                sort === 'asc' ? asc(vehicles.name) : desc(vehicles.name)
            ],
            with: {
                status: true,
            }
        });

        return {
            data: vehiclesList,
            pagination: {
                total,
                limit,
                offset,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async getVehicleById(userId: string, vehicleId: number) {
        const vehicle = await db.query.vehicles.findFirst({
            where: and(
                eq(vehicles.id, vehicleId),
                eq(vehicles.userId, userId)
            ),
            with: {
                status: true,
                trips: {
                    limit: 5,
                    orderBy: (trips, { desc }) => [desc(trips.startTime)]
                }
            }
        });

        if (!vehicle) {
            throw new Error('Veículo não encontrado');
        }

        return vehicle;
    }

    static async createVehicle(userId: string, data: any) {
        // Verificar se placa já existe
        const existingPlate = await db.query.vehicles.findFirst({
            where: eq(vehicles.plate, data.licensePlate)
        });

        if (existingPlate) {
            throw new Error('Já existe um veículo com esta placa');
        }

        // Verificar se IMEI já existe (se fornecido)
        if (data.deviceId) {
            const existingImei = await db.query.vehicles.findFirst({
                where: eq(vehicles.deviceImei, data.deviceId)
            });

            if (existingImei) {
                throw new Error('Já existe um veículo com este IMEI');
            }
        }

        // Inserir veículo
        const [newVehicle] = await db.insert(vehicles).values({
            userId,
            name: data.name,
            plate: data.licensePlate,
            model: data.model,
            year: data.year ? String(data.year) : undefined,
            color: data.color,
            deviceImei: data.deviceId,
            status: data.status || 'active',
            type: 'car', // Default type
        }).returning();

        // Criar status inicial
        await db.insert(vehicleStatus).values({
            vehicleId: newVehicle.id,
            status: 'offline',
            isMoving: false,
            lastUpdate: new Date(),
        });

        return newVehicle;
    }

    static async updateVehicle(userId: string, vehicleId: string, data: any) {
        const id = parseInt(vehicleId);

        // Verificar se veículo existe e pertence ao usuário
        const vehicle = await db.query.vehicles.findFirst({
            where: and(
                eq(vehicles.id, id),
                eq(vehicles.userId, userId)
            )
        });

        if (!vehicle) {
            throw new Error('Veículo não encontrado');
        }

        // Atualizar dados
        const [updatedVehicle] = await db.update(vehicles)
            .set({
                name: data.name,
                plate: data.licensePlate,
                model: data.model,
                year: data.year ? String(data.year) : undefined,
                color: data.color,
                deviceImei: data.deviceId,
                status: data.status,
            })
            .where(eq(vehicles.id, id))
            .returning();

        return updatedVehicle;
    }

    static async deleteVehicle(userId: string, vehicleId: string) {
        const id = parseInt(vehicleId);

        // Verificar se veículo existe e pertence ao usuário
        const vehicle = await db.query.vehicles.findFirst({
            where: and(
                eq(vehicles.id, id),
                eq(vehicles.userId, userId)
            )
        });

        if (!vehicle) {
            throw new Error('Veículo não encontrado');
        }

        // Deletar veículo (cascade vai deletar status, trips, etc)
        await db.delete(vehicles).where(eq(vehicles.id, id));
    }
}
