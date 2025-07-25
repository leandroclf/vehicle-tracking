/**
 * Serviço de Analytics - Versão 2.0
 * @description Serviço responsável por calcular métricas, gerar insights e fornecer dados para o dashboard
 */

import { supabase } from '@/lib/supabase';
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
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          name,
          status,
          last_location,
          last_update,
          odometer,
          fuel_level
        `)
        .eq('user_id', userId);

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
      const { data: recentPositions } = await supabase
        .from('vehicle_positions')
        .select('speed, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const averageSpeed = recentPositions?.length 
        ? recentPositions.reduce((sum, pos) => sum + (pos.speed || 0), 0) / recentPositions.length
        : 0;

      // Calcular distância total do dia
      const { data: dailyDistance } = await supabase
        .rpc('calculate_daily_distance', {
          p_user_id: userId,
          p_date: now.toISOString().split('T')[0]
        });

      const totalDistance = dailyDistance || 0;

      // Calcular consumo de combustível estimado
      const fuelConsumption = totalDistance * 0.08; // 8L/100km estimado

      // Contar alertas de manutenção
      const { data: maintenanceAlerts } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .eq('user_id', userId)
        .lte('next_maintenance', now.toISOString())
        .eq('status', 'pending');

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
      const { data: dailyActive } = await supabase
        .rpc('get_daily_active_vehicles', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      const dailyActiveVehicles: TimeSeries = {
        name: 'Veículos Ativos Diários',
        data: dailyActive?.map((item: any) => ({
          timestamp: item.date,
          value: item.active_count
        })) || []
      };

      // Distância semanal
      const { data: weeklyDist } = await supabase
        .rpc('get_weekly_distance', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      const weeklyDistance: TimeSeries = {
        name: 'Distância Semanal',
        data: weeklyDist?.map((item: any) => ({
          timestamp: item.week,
          value: item.total_distance
        })) || [],
        unit: 'km'
      };

      // Consumo mensal de combustível
      const { data: monthlyFuel } = await supabase
        .rpc('get_monthly_fuel_consumption', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      const monthlyFuelConsumption: TimeSeries = {
        name: 'Consumo Mensal de Combustível',
        data: monthlyFuel?.map((item: any) => ({
          timestamp: item.month,
          value: item.fuel_consumption
        })) || [],
        unit: 'L'
      };

      // Distribuição de velocidade
      const { data: speedDist } = await supabase
        .rpc('get_speed_distribution', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      const speedDistribution = {
        ranges: ['0-30', '31-60', '61-90', '91-120', '120+'],
        values: speedDist || [0, 0, 0, 0, 0]
      };

      // Eficiência de rotas
      const { data: routeEff } = await supabase
        .rpc('calculate_route_efficiency', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

      const routeEfficiency: MetricValue = {
        value: Math.round((routeEff || 0) * 100),
        unit: '%'
      };

      // Tempo ocioso
      const { data: idleData } = await supabase
        .rpc('calculate_idle_time', {
          p_user_id: userId,
          p_start_date: startDate,
          p_end_date: endDate
        });

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
      const { data: speedingViolations } = await supabase
        .from('speed_violations')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Violações de geocerca
      const { data: geofenceViolations } = await supabase
        .from('geofence_violations')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Acessos não autorizados
      const { data: unauthorizedAccess } = await supabase
        .from('security_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'unauthorized_access')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Alertas de emergência
      const { data: emergencyAlerts } = await supabase
        .from('emergency_alerts')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // Manutenções em atraso
      const { data: maintenanceOverdue } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .eq('user_id', userId)
        .lt('next_maintenance', new Date().toISOString())
        .eq('status', 'pending');

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
      const { data: fuelEfficiency } = await supabase
        .rpc('analyze_fuel_efficiency', { p_user_id: userId });

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
      const { data: maintenanceData } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('user_id', userId)
        .lte('next_maintenance', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'pending');

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
        const { data: speedingVehicles } = await supabase
          .from('vehicle_positions')
          .select('vehicle_id, speed')
          .eq('user_id', userId)
          .gt('speed', thresholds.maxSpeed)
          .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString());

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
        const { data: lowFuelVehicles } = await supabase
          .from('vehicles')
          .select('id, name, fuel_level')
          .eq('user_id', userId)
          .lt('fuel_level', thresholds.minFuelLevel);

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