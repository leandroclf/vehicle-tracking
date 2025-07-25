/**
 * Tipos TypeScript para Dashboard Analytics - Versão 2.0
 * @description Definições de tipos para métricas, relatórios e analytics avançados
 */

// Tipos base para métricas
export interface MetricValue {
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  previousValue?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeries {
  name: string;
  data: TimeSeriesPoint[];
  color?: string;
  unit?: string;
}

// Métricas de frota
export interface FleetMetrics {
  totalVehicles: MetricValue;
  activeVehicles: MetricValue;
  onlineVehicles: MetricValue;
  offlineVehicles: MetricValue;
  averageSpeed: MetricValue;
  totalDistance: MetricValue;
  fuelConsumption: MetricValue;
  maintenanceAlerts: MetricValue;
}

// Métricas de utilização
export interface UsageMetrics {
  dailyActiveVehicles: TimeSeries;
  weeklyDistance: TimeSeries;
  monthlyFuelConsumption: TimeSeries;
  speedDistribution: {
    ranges: string[];
    values: number[];
  };
  routeEfficiency: MetricValue;
  idleTime: MetricValue;
}

// Métricas de segurança
export interface SecurityMetrics {
  speedingViolations: MetricValue;
  geofenceViolations: MetricValue;
  unauthorizedAccess: MetricValue;
  emergencyAlerts: MetricValue;
  maintenanceOverdue: MetricValue;
  riskScore: MetricValue;
}

// Métricas financeiras
export interface FinancialMetrics {
  fuelCosts: MetricValue;
  maintenanceCosts: MetricValue;
  operationalCosts: MetricValue;
  costPerKm: MetricValue;
  costPerVehicle: MetricValue;
  savingsFromOptimization: MetricValue;
}

// Análise de rotas
export interface RouteAnalytics {
  mostUsedRoutes: Array<{
    id: string;
    name: string;
    frequency: number;
    averageTime: number;
    averageDistance: number;
    efficiency: number;
  }>;
  routeOptimizationSuggestions: Array<{
    routeId: string;
    currentDistance: number;
    optimizedDistance: number;
    timeSaving: number;
    fuelSaving: number;
  }>;
  trafficPatterns: {
    hourly: TimeSeries;
    daily: TimeSeries;
    weekly: TimeSeries;
  };
}

// Análise de motoristas
export interface DriverAnalytics {
  driverPerformance: Array<{
    driverId: string;
    driverName: string;
    safetyScore: number;
    efficiencyScore: number;
    totalDistance: number;
    averageSpeed: number;
    violations: number;
    fuelEfficiency: number;
  }>;
  driverRankings: {
    safety: Array<{ driverId: string; score: number; rank: number }>;
    efficiency: Array<{ driverId: string; score: number; rank: number }>;
    distance: Array<{ driverId: string; distance: number; rank: number }>;
  };
  behaviorPatterns: {
    speedingTrends: TimeSeries;
    brakingPatterns: TimeSeries;
    idleTimePatterns: TimeSeries;
  };
}

// Análise de manutenção
export interface MaintenanceAnalytics {
  maintenanceSchedule: Array<{
    vehicleId: string;
    vehicleName: string;
    nextMaintenance: string;
    type: 'preventive' | 'corrective' | 'emergency';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedCost: number;
  }>;
  maintenanceHistory: TimeSeries;
  costAnalysis: {
    preventiveCosts: MetricValue;
    correctiveCosts: MetricValue;
    emergencyCosts: MetricValue;
    costTrends: TimeSeries;
  };
  vehicleHealth: Array<{
    vehicleId: string;
    healthScore: number;
    issues: string[];
    recommendations: string[];
  }>;
}

// Configurações de dashboard
export interface DashboardConfig {
  userId: string;
  layout: Array<{
    id: string;
    type: 'metric' | 'chart' | 'table' | 'map';
    position: { x: number; y: number; w: number; h: number };
    config: Record<string, any>;
  }>;
  filters: {
    dateRange: {
      start: string;
      end: string;
      preset?: 'today' | 'week' | 'month' | 'quarter' | 'year';
    };
    vehicles: string[];
    drivers: string[];
    routes: string[];
  };
  refreshInterval: number; // em segundos
  notifications: {
    email: boolean;
    push: boolean;
    thresholds: Record<string, number>;
  };
}

// Relatórios personalizados
export interface CustomReport {
  id: string;
  name: string;
  description: string;
  type: 'fleet' | 'driver' | 'route' | 'maintenance' | 'financial';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    recipients: string[];
  };
  filters: DashboardConfig['filters'];
  sections: Array<{
    type: 'summary' | 'chart' | 'table' | 'insights';
    title: string;
    config: Record<string, any>;
  }>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Insights e recomendações
export interface AnalyticsInsight {
  id: string;
  type: 'cost_saving' | 'efficiency' | 'safety' | 'maintenance' | 'route_optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  potentialSaving: number;
  actionRequired: boolean;
  recommendations: string[];
  dataPoints: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

// Comparações e benchmarks
export interface BenchmarkData {
  category: 'industry' | 'fleet_size' | 'region' | 'vehicle_type';
  metrics: {
    fuelEfficiency: { value: number; percentile: number };
    safetyScore: { value: number; percentile: number };
    utilizationRate: { value: number; percentile: number };
    maintenanceCost: { value: number; percentile: number };
  };
  lastUpdated: string;
}

// Alertas e notificações
export interface AnalyticsAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'prediction';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  thresholdValue?: number;
  vehicleId?: string;
  driverId?: string;
  routeId?: string;
  actionUrl?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

// Exportação de dados
export interface DataExport {
  id: string;
  type: 'analytics' | 'raw_data' | 'report';
  format: 'csv' | 'excel' | 'json' | 'pdf';
  filters: DashboardConfig['filters'];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: number;
  createdAt: string;
  expiresAt: string;
  requestedBy: string;
}

// Dashboard principal
export interface AnalyticsDashboard {
  config: DashboardConfig;
  metrics: {
    fleet: FleetMetrics;
    usage: UsageMetrics;
    security: SecurityMetrics;
    financial: FinancialMetrics;
  };
  analytics: {
    routes: RouteAnalytics;
    drivers: DriverAnalytics;
    maintenance: MaintenanceAnalytics;
  };
  insights: AnalyticsInsight[];
  alerts: AnalyticsAlert[];
  benchmarks: BenchmarkData[];
  lastUpdated: string;
}

// Tipos para APIs
export interface AnalyticsApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface AnalyticsApiRequest {
  filters?: Partial<DashboardConfig['filters']>;
  metrics?: string[];
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  page?: number;
  limit?: number;
}

// Tipos para machine learning e predições
export interface PredictionModel {
  id: string;
  name: string;
  type: 'fuel_consumption' | 'maintenance' | 'route_optimization' | 'driver_behavior';
  accuracy: number;
  lastTrained: string;
  features: string[];
  status: 'active' | 'training' | 'deprecated';
}

export interface Prediction {
  modelId: string;
  targetDate: string;
  confidence: number;
  value: number;
  range: { min: number; max: number };
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  createdAt: string;
}