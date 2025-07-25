/**
 * Fleet Metrics Card - Componente de Métricas da Frota
 * @description Exibe métricas detalhadas da frota com visualizações
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Fuel, 
  Gauge, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { FleetMetrics } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface FleetMetricsCardProps {
  data?: FleetMetrics;
  loading?: boolean;
  className?: string;
}

export function FleetMetricsCard({ data, loading, className }: FleetMetricsCardProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Métricas da Frota</CardTitle>
          <CardDescription>Visão geral do status da frota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Métricas da Frota</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Dados não disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalVehicles = data.totalVehicles?.value || 0;
  const onlineVehicles = data.onlineVehicles?.value || 0;
  const offlineVehicles = data.offlineVehicles?.value || 0;
  const activeVehicles = data.activeVehicles?.value || 0;

  const onlinePercentage = totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 0;
  const activePercentage = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Car className="h-5 w-5" />
          <span>Métricas da Frota</span>
        </CardTitle>
        <CardDescription>
          Visão geral do status e performance da frota
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Frota */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Status da Frota</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-sm font-medium">{totalVehicles}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ativos</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{activeVehicles}</span>
                  <Badge variant="secondary" className="text-xs">
                    {activePercentage.toFixed(0)}%
                  </Badge>
                </div>
              </div>
              <Progress value={activePercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
                <span className="text-sm font-medium text-green-600">{onlineVehicles}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Offline</span>
                </div>
                <span className="text-sm font-medium text-orange-600">{offlineVehicles}</span>
              </div>
              <Progress value={onlinePercentage} className="h-2" />
            </div>
          </div>
        </div>

        {/* Métricas de Performance */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Performance</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Velocidade Média</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {data.averageSpeed?.value || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {data.averageSpeed?.unit}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Distância Total</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {data.totalDistance?.value || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {data.totalDistance?.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Consumo e Manutenção */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Consumo e Manutenção</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Fuel className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Combustível</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {data.fuelConsumption?.value || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {data.fuelConsumption?.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Consumo estimado hoje</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Manutenção</span>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {data.maintenanceAlerts?.value || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {data.maintenanceAlerts?.unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Alertas pendentes</p>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status Geral</span>
            <div className="flex items-center space-x-2">
              {onlinePercentage >= 80 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Excelente
                  </Badge>
                </>
              ) : onlinePercentage >= 60 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Bom
                  </Badge>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Atenção
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}