/**
 * Insights and Alerts Card - Componente de Insights e Alertas
 * @description Exibe insights automáticos e alertas do sistema
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Info,
  CheckCircle,
  Clock,
  Fuel,
  Wrench,
  Target,
  BarChart3
} from 'lucide-react';
import { AnalyticsInsight, AnalyticsAlert } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface InsightsAndAlertsCardProps {
  insights?: AnalyticsInsight[];
  alerts?: AnalyticsAlert[];
  loading?: boolean;
  className?: string;
  onDismissAlert?: (alertId: string) => void;
  onViewDetails?: (insightId: string) => void;
}

export function InsightsAndAlertsCard({ 
  insights = [], 
  alerts = [], 
  loading, 
  className,
  onDismissAlert,
  onViewDetails
}: InsightsAndAlertsCardProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Insights e Alertas</CardTitle>
          <CardDescription>Análises automáticas e notificações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'fuel_efficiency':
        return <Fuel className="h-4 w-4 text-green-600" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'cost_optimization':
        return <Target className="h-4 w-4 text-purple-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'fuel_efficiency':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'performance':
        return 'bg-blue-100 text-blue-800';
      case 'cost_optimization':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatImpact = (impact: AnalyticsInsight['impact']) => {
    const impacts: Record<AnalyticsInsight['impact'], string> = {
      low: 'Baixo',
      medium: 'Médio',
      high: 'Alto'
    };
    return impacts[impact] || impact;
  };

  const formatInsightType = (type: string) => {
    const types: Record<string, string> = {
      fuel_efficiency: 'Eficiência de Combustível',
      maintenance: 'Manutenção',
      performance: 'Performance',
      cost_optimization: 'Otimização de Custos',
      route_optimization: 'Otimização de Rotas',
      driver_behavior: 'Comportamento do Motorista'
    };
    return types[type] || type;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Alertas Ativos</span>
              <Badge variant="secondary">{alerts.length}</Badge>
            </CardTitle>
            <CardDescription>
              Notificações que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="relative">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.severity)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{alert.title}</div>
                        <div className="flex items-center space-x-2">
                          <Badge className={cn('text-xs', getAlertBadgeColor(alert.severity))}>
                            {alert.severity === 'critical' ? 'Crítico' : 
                             alert.severity === 'warning' ? 'Aviso' : 'Info'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                      {alert.vehicleId && (
                        <div className="text-xs text-muted-foreground">
                          Veículo: {alert.vehicleId}
                        </div>
                      )}
                    </div>
                  </div>
                  {onDismissAlert && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => onDismissAlert(alert.id)}
                    >
                      ×
                    </Button>
                  )}
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <span>Insights Automáticos</span>
            <Badge variant="secondary">{insights.length}</Badge>
          </CardTitle>
          <CardDescription>
            Análises inteligentes baseadas nos dados da sua frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum insight disponível no momento
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Continue coletando dados para gerar insights automáticos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getInsightIcon(insight.type)}
                          <Badge className={cn('text-xs', getInsightBadgeColor(insight.type))}>
                            {formatInsightType(insight.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(insight.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>

                      {insight.impact && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <div className="text-sm font-medium mb-1">Impacto Estimado:</div>
                          <div className="text-sm text-muted-foreground">
                            {formatImpact(insight.impact)}
                          </div>
                        </div>
                      )}

                      {insight.recommendations.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="text-sm font-medium mb-1 text-blue-800">
                            Recomendação:
                          </div>
                          <div className="text-sm text-blue-700">
                            {insight.recommendations.join(' ')}
                          </div>
                        </div>
                      )}

                      {insight.confidence && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Confiança: {Math.round(insight.confidence)}%</span>
                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => onViewDetails(insight.id)}
                            >
                              Ver Detalhes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {(alerts.length > 0 || insights.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.length > 0 && (
                <Button variant="outline" size="sm" className="justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Resolver Alertas ({alerts.length})
                </Button>
              )}
              
              {insights.length > 0 && (
                <Button variant="outline" size="sm" className="justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aplicar Recomendações
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Agendar Manutenções
              </Button>
              
              <Button variant="outline" size="sm" className="justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatório Detalhado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}