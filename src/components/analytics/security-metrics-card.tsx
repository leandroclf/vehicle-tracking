/**
 * Security Metrics Card - Componente de Métricas de Segurança
 * @description Exibe métricas e alertas de segurança da frota
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  MapPin, 
  Gauge, 
  Lock,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { SecurityMetrics } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface SecurityMetricsCardProps {
  data?: SecurityMetrics;
  loading?: boolean;
  className?: string;
}

export function SecurityMetricsCard({ data, loading, className }: SecurityMetricsCardProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Métricas de Segurança</CardTitle>
          <CardDescription>Análise de segurança da frota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
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
          <CardTitle>Métricas de Segurança</CardTitle>
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

  const riskScore = data.riskScore?.value || 0;
  const totalViolations = (data.speedingViolations?.value || 0) + 
                         (data.geofenceViolations?.value || 0) + 
                         (data.unauthorizedAccess?.value || 0);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Baixo', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'Médio', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Alto', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Risk Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Score de Segurança</span>
          </CardTitle>
          <CardDescription>
            Avaliação geral da segurança da frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{riskScore}</div>
                <div className="text-sm text-muted-foreground">de 100 pontos</div>
              </div>
              <Badge className={cn('text-sm', riskLevel.bg, riskLevel.color)}>
                Risco {riskLevel.level}
              </Badge>
            </div>
            
            <Progress value={riskScore} className="h-3" />
            
            <div className="text-sm text-muted-foreground">
              {riskScore >= 80 
                ? 'Excelente! Sua frota está operando com alta segurança.'
                : riskScore >= 60
                ? 'Bom nível de segurança, mas há espaço para melhorias.'
                : 'Atenção necessária! Várias violações detectadas.'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speeding Violations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Gauge className="h-4 w-4 text-red-600" />
              <span>Excesso de Velocidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {data.speedingViolations?.value || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                violações detectadas
              </div>
              {(data.speedingViolations?.value || 0) > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Veículos excedendo limites de velocidade
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geofence Violations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span>Violações de Geocerca</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {data.geofenceViolations?.value || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                violações detectadas
              </div>
              {(data.geofenceViolations?.value || 0) > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Veículos fora das áreas permitidas
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unauthorized Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Lock className="h-4 w-4 text-purple-600" />
              <span>Acesso Não Autorizado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {data.unauthorizedAccess?.value || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                eventos detectados
              </div>
              {(data.unauthorizedAccess?.value || 0) > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Tentativas de acesso não autorizado
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Alertas de Emergência</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {data.emergencyAlerts?.value || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                alertas acionados
              </div>
              {(data.emergencyAlerts?.value || 0) > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Botões de pânico acionados
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Overdue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Manutenção em Atraso</span>
          </CardTitle>
          <CardDescription>
            Veículos que precisam de manutenção urgente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {data.maintenanceOverdue?.value || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                veículos em atraso
              </div>
            </div>
            
            {(data.maintenanceOverdue?.value || 0) === 0 ? (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Em dia</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-orange-600">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Atenção</span>
              </div>
            )}
          </div>
          
          {(data.maintenanceOverdue?.value || 0) > 0 && (
            <Alert className="mt-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {data.maintenanceOverdue?.value} veículo(s) com manutenção em atraso. 
                Agende as manutenções para evitar problemas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de Violações</span>
              <span className="text-sm font-medium">{totalViolations}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nível de Risco</span>
              <Badge className={cn('text-xs', riskLevel.bg, riskLevel.color)}>
                {riskLevel.level}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Geral</span>
              {totalViolations === 0 ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Seguro</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Requer Atenção</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}