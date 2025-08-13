/**
 * Serviço de Analytics - Versão 2.0
 * @description Serviço responsável por calcular métricas, gerar insights e fornecer dados para o dashboard
 */

import { getDbPool } from '@/lib/database';
import {
  FleetMetrics,
  UsageMetrics,
  SecurityMetrics,
  FinancialMetrics,
  RouteAnalytics,
  DriverAnalytics,
  MaintenanceAnalytics,
  AnalyticsInsight,
  AnalyticsAlert,
  TimeSeries,
  MetricValue,
  DashboardConfig,
  AnalyticsApiResponse
} from '@/types/analytics';

export class AnalyticsService {
  /**
   * Calcula métricas da frota
   */
  async getFleetMetrics(userId: string, filters?: DashboardConfig['filters']): Promise<FleetMetrics> {
    try {
      // TODO: Implementar query SQL direta
      const pool = getDbPool();
      const vehiclesQuery = `
        SELECT id, name, status, last_location, last_update, odometer, fuel_level
        FROM vehicles
        WHERE user_id = $1
      `;
      const vehiclesResult = await pool.query(vehiclesQuery, [userId]);
      const vehicles = vehiclesResult.rows;
      const error = null;

      if (error) throw error;

      const now = new Date();
      const onlineThreshold = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutos

      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.status === 'active').length || 0;
      const onlineVehicles = vehicles?.filter(v => 
        v.last_update && new Date(v.last_update) > onlineThreshold
      ).length || 0;
      const offlineVehicles = totalVehicles - onlineVehicles;

      // Calcular métricas de velocidade e distância
      const recentPositionsQuery = `
        SELECT speed, created_at
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2
        ORDER BY created_at DESC
      `;
      const recentPositionsResult = await pool.query(recentPositionsQuery, [
        userId,
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      ]);
      const recentPositions = recentPositionsResult.rows;

      const averageSpeed = recentPositions?.length 
        ? recentPositions.reduce((sum, pos) => sum + (pos.speed || 0), 0) / recentPositions.length
        : 0;

      // Calcular distância total do dia
      // TODO: Implementar função calculate_daily_distance no PostgreSQL
      const dailyDistanceQuery = `
        SELECT COALESCE(SUM(distance), 0) as total_distance
        FROM vehicle_positions
        WHERE user_id = $1 AND DATE(created_at) = $2
      `;
      const dailyDistanceResult = await pool.query(dailyDistanceQuery, [
        userId,
        now.toISOString().split('T')[0]
      ]);
      const dailyDistance = dailyDistanceResult.rows[0]?.total_distance || 0;

      const totalDistance = dailyDistance || 0;

      // Calcular consumo de combustível estimado
      const fuelConsumption = totalDistance * 0.08; // 8L/100km estimado

      // Contar alertas de manutenção
      const maintenanceAlertsQuery = `
        SELECT id
        FROM maintenance_schedules
        WHERE user_id = $1 AND next_maintenance <= $2 AND status = 'pending'
      `;
      const maintenanceAlertsResult = await pool.query(maintenanceAlertsQuery, [
        userId,
        now.toISOString()
      ]);
      const maintenanceAlerts = maintenanceAlertsResult.rows;

      return {
        totalVehicles: { value: totalVehicles, unit: 'veículos' },
        activeVehicles: { value: activeVehicles, unit: 'veículos' },
        onlineVehicles: { value: onlineVehicles, unit: 'veículos' },
        offlineVehicles: { value: offlineVehicles, unit: 'veículos' },
        averageSpeed: { value: Math.round(averageSpeed), unit: 'km/h' },
        totalDistance: { value: Math.round(totalDistance), unit: 'km' },
        fuelConsumption: { value: Math.round(fuelConsumption), unit: 'L' },
        maintenanceAlerts: { value: maintenanceAlerts?.length || 0, unit: 'alertas' }
      };
    } catch (error) {
      console.error('Erro ao calcular métricas da frota:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de utilização
   */
  async getUsageMetrics(userId: string, filters?: DashboardConfig['filters']): Promise<UsageMetrics> {
    try {
      const endDate = filters?.dateRange?.end || new Date().toISOString();
      const startDate = filters?.dateRange?.start || 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Veículos ativos diários
      const pool = getDbPool();
      // TODO: Implementar função get_daily_active_vehicles no PostgreSQL
      const dailyActiveQuery = `
        SELECT DATE(created_at) as date, COUNT(DISTINCT vehicle_id) as active_count
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const dailyActiveResult = await pool.query(dailyActiveQuery, [userId, startDate, endDate]);
      const dailyActive = dailyActiveResult.rows;

      const dailyActiveVehicles: TimeSeries = {
        name: 'Veículos Ativos Diários',
        data: dailyActive?.map((item: any) => ({
          timestamp: item.date,
          value: item.active_count
        })) || []
      };

      // Distância semanal
      // TODO: Implementar função get_weekly_distance no PostgreSQL
      const weeklyDistQuery = `
        SELECT DATE_TRUNC('week', created_at) as week, COALESCE(SUM(distance), 0) as total_distance
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week
      `;
      const weeklyDistResult = await pool.query(weeklyDistQuery, [userId, startDate, endDate]);
      const weeklyDist = weeklyDistResult.rows;

      const weeklyDistance: TimeSeries = {
        name: 'Distância Semanal',
        data: weeklyDist?.map((item: any) => ({
          timestamp: item.week,
          value: item.total_distance
        })) || [],
        unit: 'km'
      };

      // Consumo mensal de combustível
      // TODO: Implementar função get_monthly_fuel_consumption no PostgreSQL
      const monthlyFuelQuery = `
        SELECT DATE_TRUNC('month', created_at) as month, COALESCE(SUM(distance * 0.08), 0) as fuel_consumption
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `;
      const monthlyFuelResult = await pool.query(monthlyFuelQuery, [userId, startDate, endDate]);
      const monthlyFuel = monthlyFuelResult.rows;

      const monthlyFuelConsumption: TimeSeries = {
        name: 'Consumo Mensal de Combustível',
        data: monthlyFuel?.map((item: any) => ({
          timestamp: item.month,
          value: item.fuel_consumption
        })) || [],
        unit: 'L'
      };

      // Distribuição de velocidade
      // TODO: Implementar função get_speed_distribution no PostgreSQL
      const speedDistQuery = `
        SELECT 
          COUNT(CASE WHEN speed BETWEEN 0 AND 30 THEN 1 END) as range_0_30,
          COUNT(CASE WHEN speed BETWEEN 31 AND 60 THEN 1 END) as range_31_60,
          COUNT(CASE WHEN speed BETWEEN 61 AND 90 THEN 1 END) as range_61_90,
          COUNT(CASE WHEN speed BETWEEN 91 AND 120 THEN 1 END) as range_91_120,
          COUNT(CASE WHEN speed > 120 THEN 1 END) as range_120_plus
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3 AND speed IS NOT NULL
      `;
      const speedDistResult = await pool.query(speedDistQuery, [userId, startDate, endDate]);
      const speedDistRow = speedDistResult.rows[0] || {};
      const speedDist = [speedDistRow.range_0_30 || 0, speedDistRow.range_31_60 || 0, speedDistRow.range_61_90 || 0, speedDistRow.range_91_120 || 0, speedDistRow.range_120_plus || 0];

      const speedDistribution = {
        ranges: ['0-30', '31-60', '61-90', '91-120', '120+'],
        values: speedDist || [0, 0, 0, 0, 0]
      };

      // Eficiência de rotas
      // TODO: Implementar função calculate_route_efficiency no PostgreSQL
      const routeEffQuery = `
        SELECT AVG(CASE WHEN distance > 0 THEN 0.85 ELSE 0 END) as efficiency
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const routeEffResult = await pool.query(routeEffQuery, [userId, startDate, endDate]);
      const routeEff = routeEffResult.rows[0]?.efficiency || 0;

      const routeEfficiency: MetricValue = {
        value: Math.round((routeEff || 0) * 100),
        unit: '%'
      };

      // Tempo ocioso
      // TODO: Implementar função calculate_idle_time no PostgreSQL
      const idleDataQuery = `
        SELECT COALESCE(SUM(CASE WHEN speed = 0 THEN 1 ELSE 0 END) / 60.0, 0) as idle_hours
        FROM vehicle_positions
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const idleDataResult = await pool.query(idleDataQuery, [userId, startDate, endDate]);
      const idleData = idleDataResult.rows[0]?.idle_hours || 0;

      const idleTime: MetricValue = {
        value: Math.round(idleData || 0),
        unit: 'horas'
      };

      return {
        dailyActiveVehicles,
        weeklyDistance,
        monthlyFuelConsumption,
        speedDistribution,
        routeEfficiency,
        idleTime
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de utilização:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de segurança
   */
  async getSecurityMetrics(userId: string, filters?: DashboardConfig['filters']): Promise<SecurityMetrics> {
    try {
      const endDate = filters?.dateRange?.end || new Date().toISOString();
      const startDate = filters?.dateRange?.start || 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Violações de velocidade
      const pool = getDbPool();
      const speedingViolationsQuery = `
        SELECT id
        FROM speed_violations
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const speedingViolationsResult = await pool.query(speedingViolationsQuery, [userId, startDate, endDate]);
      const speedingViolations = speedingViolationsResult.rows;

      // Violações de geocerca
      const geofenceViolationsQuery = `
        SELECT id
        FROM geofence_violations
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const geofenceViolationsResult = await pool.query(geofenceViolationsQuery, [userId, startDate, endDate]);
      const geofenceViolations = geofenceViolationsResult.rows;

      // Acessos não autorizados
      const unauthorizedAccessQuery = `
        SELECT id
        FROM security_events
        WHERE user_id = $1 AND event_type = 'unauthorized_access' AND created_at >= $2 AND created_at <= $3
      `;
      const unauthorizedAccessResult = await pool.query(unauthorizedAccessQuery, [userId, startDate, endDate]);
      const unauthorizedAccess = unauthorizedAccessResult.rows;

      // Alertas de emergência
      const emergencyAlertsQuery = `
        SELECT id
        FROM emergency_alerts
        WHERE user_id = $1 AND created_at >= $2 AND created_at <= $3
      `;
      const emergencyAlertsResult = await pool.query(emergencyAlertsQuery, [userId, startDate, endDate]);
      const emergencyAlerts = emergencyAlertsResult.rows;

      // Manutenções em atraso
      const maintenanceOverdueQuery = `
        SELECT id
        FROM maintenance_schedules
        WHERE user_id = $1 AND next_maintenance < $2 AND status = 'pending'
      `;
      const maintenanceOverdueResult = await pool.query(maintenanceOverdueQuery, [userId, new Date().toISOString()]);
      const maintenanceOverdue = maintenanceOverdueResult.rows;

      // Calcular score de risco
      const totalViolations = (speedingViolations?.length || 0) + 
                             (geofenceViolations?.length || 0) + 
                             (unauthorizedAccess?.length || 0);
      const riskScore = Math.max(0, 100 - (totalViolations * 5));

      return {
        speedingViolations: { value: speedingViolations?.length || 0, unit: 'violações' },
        geofenceViolations: { value: geofenceViolations?.length || 0, unit: 'violações' },
        unauthorizedAccess: { value: unauthorizedAccess?.length || 0, unit: 'eventos' },
        emergencyAlerts: { value: emergencyAlerts?.length || 0, unit: 'alertas' },
        maintenanceOverdue: { value: maintenanceOverdue?.length || 0, unit: 'veículos' },
        riskScore: { value: riskScore, unit: 'pontos' }
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de segurança:', error);
      throw error;
    }
  }

  /**
   * Gera insights automáticos baseados nos dados
   */
  async generateInsights(userId: string): Promise<AnalyticsInsight[]> {
    try {
      const insights: AnalyticsInsight[] = [];
      const now = new Date();

      // Insight sobre eficiência de combustível
      // TODO: Implementar função analyze_fuel_efficiency no PostgreSQL
      const fuelEfficiencyQuery = `
        SELECT 
          AVG(fuel_consumption / distance) as efficiency,
          SUM(fuel_consumption * 1.5) as potential_saving
        FROM vehicle_trips
        WHERE user_id = $1 AND created_at >= $2
      `;
      const fuelEfficiencyResult = await pool.query(fuelEfficiencyQuery, [userId, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()]);
      const fuelEfficiency = fuelEfficiencyResult.rows[0];

      if (fuelEfficiency && fuelEfficiency.efficiency < 0.8) {
        insights.push({
          id: `fuel-efficiency-${now.getTime()}`,
          type: 'cost_saving',
          title: 'Oportunidade de Economia de Combustível',
          description: `A eficiência de combustível da frota está ${Math.round((1 - fuelEfficiency.efficiency) * 100)}% abaixo do ideal.`,
          impact: 'high',
          confidence: 85,
          potentialSaving: fuelEfficiency.potential_saving || 0,
          actionRequired: true,
          recommendations: [
            'Revisar rotas para otimização',
            'Treinar motoristas em direção econômica',
            'Verificar manutenção dos veículos'
          ],
          dataPoints: { efficiency: fuelEfficiency.efficiency },
          createdAt: now.toISOString()
        });
      }

      // Insight sobre manutenção preventiva
      const maintenanceQuery = `
        SELECT *
        FROM maintenance_schedules
        WHERE user_id = $1 AND next_maintenance <= $2 AND status = 'pending'
      `;
      const maintenanceResult = await pool.query(maintenanceQuery, [userId, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()]);
      const maintenanceData = maintenanceResult.rows;

      if (maintenanceData && maintenanceData.length > 0) {
        insights.push({
          id: `maintenance-alert-${now.getTime()}`,
          type: 'maintenance',
          title: 'Manutenções Programadas Próximas',
          description: `${maintenanceData.length} veículo(s) precisam de manutenção nos próximos 7 dias.`,
          impact: 'medium',
          confidence: 100,
          potentialSaving: 0,
          actionRequired: true,
          recommendations: [
            'Agendar manutenções preventivas',
            'Verificar disponibilidade de peças',
            'Planejar rotas alternativas'
          ],
          dataPoints: { vehicles: maintenanceData.length },
          createdAt: now.toISOString()
        });
      }

      return insights;
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return [];
    }
  }

  /**
   * Verifica alertas baseados em thresholds
   */
  async checkAlerts(userId: string, thresholds: Record<string, number>): Promise<AnalyticsAlert[]> {
    try {
      const alerts: AnalyticsAlert[] = [];
      const now = new Date();

      // Verificar velocidade excessiva
      if (thresholds.maxSpeed) {
        const speedingQuery = `
          SELECT vehicle_id, speed
          FROM vehicle_positions
          WHERE user_id = $1 AND speed > $2 AND created_at >= $3
        `;
        const speedingResult = await pool.query(speedingQuery, [userId, thresholds.maxSpeed, new Date(now.getTime() - 5 * 60 * 1000).toISOString()]);
        const speedingVehicles = speedingResult.rows;

        speedingVehicles?.forEach(vehicle => {
          alerts.push({
            id: `speed-alert-${vehicle.vehicle_id}-${now.getTime()}`,
            type: 'threshold',
            severity: 'warning',
            title: 'Velocidade Excessiva',
            message: `Veículo excedendo limite de velocidade: ${vehicle.speed} km/h`,
            metric: 'speed',
            currentValue: vehicle.speed,
            thresholdValue: thresholds.maxSpeed,
            vehicleId: vehicle.vehicle_id,
            createdAt: now.toISOString()
          });
        });
      }

      // Verificar combustível baixo
      if (thresholds.minFuelLevel) {
        const lowFuelQuery = `
          SELECT id, name, fuel_level
          FROM vehicles
          WHERE user_id = $1 AND fuel_level < $2
        `;
        const lowFuelResult = await pool.query(lowFuelQuery, [userId, thresholds.minFuelLevel]);
        const lowFuelVehicles = lowFuelResult.rows;

        lowFuelVehicles?.forEach(vehicle => {
          alerts.push({
            id: `fuel-alert-${vehicle.id}-${now.getTime()}`,
            type: 'threshold',
            severity: 'warning',
            title: 'Combustível Baixo',
            message: `Veículo ${vehicle.name} com combustível baixo: ${vehicle.fuel_level}%`,
            metric: 'fuel_level',
            currentValue: vehicle.fuel_level,
            thresholdValue: thresholds.minFuelLevel,
            vehicleId: vehicle.id,
            createdAt: now.toISOString()
          });
        });
      }

      return alerts;
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
      return [];
    }
  }

  /**
   * Exporta dados para relatório
   */
  async exportData(
    userId: string, 
    type: 'analytics' | 'raw_data' | 'report',
    format: 'csv' | 'excel' | 'json',
    filters?: DashboardConfig['filters']
  ): Promise<AnalyticsApiResponse<{ downloadUrl: string }>> {
    try {
      // Implementar lógica de exportação
      // Por enquanto, retorna URL simulada
      const exportId = `export-${Date.now()}`;
      const downloadUrl = `/api/analytics/export/${exportId}.${format}`;

      return {
        success: true,
        data: { downloadUrl }
      };
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      return {
        success: false,
        error: 'Erro ao exportar dados'
      };
    }
  }
}

export const analyticsService = new AnalyticsService();