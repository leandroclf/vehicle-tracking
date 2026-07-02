import { db } from '@/lib/database';
import { alerts, events, trips, vehicles } from '@/lib/schema';
import { and, count, eq, gte, inArray, lte, max, sum } from 'drizzle-orm';

// Conteúdo persistido em reports.content (jsonb)
export interface ReportVehicleSummary {
  vehicle_id: number;
  name: string;
  plate: string;
  trips: number;
  distance_km: number;
  fuel_l: number;
  max_speed: number;
  events: number;
  alerts: number;
}

export interface ReportContent {
  vehicles: ReportVehicleSummary[];
  totals: {
    trips: number;
    distance_km: number;
    fuel_l: number;
    events: number;
    alerts: number;
  };
}

/**
 * Valida a posse dos veículos e retorna os que pertencem ao usuário.
 */
export async function getOwnedVehicles(userId: string, vehicleIds: number[]) {
  if (vehicleIds.length === 0) return [];
  return db
    .select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate })
    .from(vehicles)
    .where(and(inArray(vehicles.id, vehicleIds), eq(vehicles.userId, userId)));
}

/**
 * Retorna todos os veículos do usuário.
 */
export async function getAllUserVehicles(userId: string) {
  return db
    .select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate })
    .from(vehicles)
    .where(eq(vehicles.userId, userId));
}

/**
 * Gera o conteúdo do relatório a partir dos dados reais persistidos
 * (trips, events, alerts) para a janela e veículos informados.
 */
export async function generateReportContent(
  owned: Array<{ id: number; name: string; plate: string }>,
  startDate: Date,
  endDate: Date
): Promise<ReportContent> {
  const summaries: ReportVehicleSummary[] = [];

  for (const vehicle of owned) {
    const [tripsRow, eventsRow, alertsRow] = await Promise.all([
      db
        .select({
          trips: count(),
          distance: sum(trips.distance),
          fuel: sum(trips.fuelConsumed),
          maxSpeed: max(trips.maxSpeed),
        })
        .from(trips)
        .where(and(
          eq(trips.vehicleId, vehicle.id),
          gte(trips.startTime, startDate),
          lte(trips.startTime, endDate)
        ))
        .then(rows => rows[0]),
      db
        .select({ value: count() })
        .from(events)
        .where(and(
          eq(events.vehicleId, vehicle.id),
          gte(events.timestamp, startDate),
          lte(events.timestamp, endDate)
        ))
        .then(rows => rows[0]),
      db
        .select({ value: count() })
        .from(alerts)
        .where(and(
          eq(alerts.vehicleId, vehicle.id),
          gte(alerts.createdAt, startDate),
          lte(alerts.createdAt, endDate)
        ))
        .then(rows => rows[0]),
    ]);

    summaries.push({
      vehicle_id: vehicle.id,
      name: vehicle.name,
      plate: vehicle.plate,
      trips: tripsRow?.trips ?? 0,
      distance_km: Number(tripsRow?.distance ?? 0),
      fuel_l: Number(tripsRow?.fuel ?? 0),
      max_speed: Number(tripsRow?.maxSpeed ?? 0),
      events: eventsRow?.value ?? 0,
      alerts: alertsRow?.value ?? 0,
    });
  }

  return {
    vehicles: summaries,
    totals: {
      trips: summaries.reduce((acc, s) => acc + s.trips, 0),
      distance_km: summaries.reduce((acc, s) => acc + s.distance_km, 0),
      fuel_l: summaries.reduce((acc, s) => acc + s.fuel_l, 0),
      events: summaries.reduce((acc, s) => acc + s.events, 0),
      alerts: summaries.reduce((acc, s) => acc + s.alerts, 0),
    },
  };
}

/**
 * Serializa o conteúdo do relatório como CSV (uma linha por veículo).
 */
export function reportContentToCsv(content: ReportContent): string {
  const header = 'vehicle_id;name;plate;trips;distance_km;fuel_l;max_speed;events;alerts';
  const rows = content.vehicles.map(v =>
    [v.vehicle_id, v.name, v.plate, v.trips, v.distance_km, v.fuel_l, v.max_speed, v.events, v.alerts]
      .map(field => String(field).replace(/;/g, ','))
      .join(';')
  );
  const totals = content.totals;
  rows.push(['TOTAL', '', '', totals.trips, totals.distance_km, totals.fuel_l, '', totals.events, totals.alerts].join(';'));
  return [header, ...rows].join('\n');
}
