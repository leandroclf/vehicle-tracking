/**
 * Dashboard Analytics - Componente Principal
 * @description Dashboard principal com métricas, gráficos e insights
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Download, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  Shield,
  DollarSign
} from 'lucide-react';
import { useAnalyticsDashboard } from '@/hooks/use-analytics-dashboard';
import { FleetMetricsCard } from './fleet-metrics-card';
import { UsageChartsCard } from './usage-charts-card';
import { SecurityMetricsCard } from './security-metrics-card';
import { InsightsAndAlertsCard } from './insights-alerts-card';
import { DashboardFilters } from './dashboard-filters';
import { ExportDialog } from './export-dialog';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const {
    data,
    config,
    loading,
    error,
    lastUpdated,
    refreshData,
    updateConfig,
    exportData,
    checkAlerts,
    setFilters,
    toggleAutoRefresh
  } = useAnalyticsDashboard();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle manual refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  /**
   * Handle export
   */
  const handleExport = useCallback(async (
    type: 'analytics' | 'raw_data' | 'report',
    format: 'csv' | 'excel' | 'json'
  ) => {
    try {
      const downloadUrl = await exportData(type, format);
      // Abrir download
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Erro ao exportar:', err);
    }
  }, [exportData]);

  /**
   * Render loading state
   */
  if (loading && !data.fleet) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Analytics</h1>
            <p className="text-muted-foreground">
              Análise completa da sua frota
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  const handleDismissAlert = async (alertId: string) => {
    try {
      // TODO: Implementar API para dismissar alerta
      console.log('Dismissing alert:', alertId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleViewInsightDetails = (insightId: string) => {
    // TODO: Implementar navegação para detalhes do insight
    console.log('Viewing insight details:', insightId);
  };

  if (error) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Erro ao carregar dados: {error}</span>
            </div>
            <Button 
              onClick={handleRefresh} 
              className="mt-4"
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Analytics</h1>
          <p className="text-muted-foreground">
            Análise completa da performance da sua frota
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <DashboardFilters
            filters={config?.filters}
            onFiltersChange={setFilters}
            vehicles={[]} // TODO: Buscar veículos da API
            drivers={[]}  // TODO: Buscar motoristas da API
            regions={[]}  // TODO: Buscar regiões da API
            loading={loading}
          />
          
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Configure os filtros para personalizar a visualização dos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardFilters
              onFiltersChange={setFilters}
              initialFilters={config?.filters}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Veículos
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.fleet?.totalVehicles?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.fleet?.activeVehicles?.value || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Veículos Online
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.fleet?.onlineVehicles?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.fleet?.offlineVehicles?.value || 0} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas de Segurança
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(data.security?.speedingViolations?.value || 0) + 
               (data.security?.geofenceViolations?.value || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Distância Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.fleet?.totalDistance?.value || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              km hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Fleet and Usage Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <FleetMetricsCard 
            data={data?.fleetMetrics} 
            loading={loading} 
          />
          
          <UsageChartsCard 
            data={data?.usageMetrics} 
            loading={loading} 
          />
        </div>
        
        {/* Right Column - Security and Insights */}
        <div className="space-y-6">
          <SecurityMetricsCard 
            data={data?.securityMetrics} 
            loading={loading} 
          />
          
          <InsightsAndAlertsCard
            insights={data?.insights}
            alerts={data?.alerts}
            loading={loading}
            onDismissAlert={handleDismissAlert}
            onViewDetails={handleViewInsightDetails}
          />
        </div>
      </div>

      {/* Export Dialog */}
       <ExportDialog
         open={showExportDialog}
         onOpenChange={setShowExportDialog}
         filters={filters}
         onExport={handleExport}
       />
     </div>
   );
 }