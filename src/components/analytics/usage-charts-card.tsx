/**
 * Usage Charts Card - Componente de Gráficos de Utilização
 * @description Exibe gráficos e métricas de utilização da frota
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Fuel, 
  Clock,
  Gauge
} from 'lucide-react';
import { UsageMetrics } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface UsageChartsCardProps {
  data?: UsageMetrics;
  loading?: boolean;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function UsageChartsCard({ data, loading, className }: UsageChartsCardProps) {
  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Análise de Utilização</CardTitle>
          <CardDescription>Gráficos de utilização da frota</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Análise de Utilização</CardTitle>
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

  // Preparar dados para gráficos
  const dailyActiveData = data.dailyActiveVehicles?.data?.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString('pt-BR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    vehicles: item.value
  })) || [];

  const weeklyDistanceData = data.weeklyDistance?.data?.map(item => ({
    week: new Date(item.timestamp).toLocaleDateString('pt-BR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    distance: item.value
  })) || [];

  const monthlyFuelData = data.monthlyFuelConsumption?.data?.map(item => ({
    month: new Date(item.timestamp).toLocaleDateString('pt-BR', { 
      month: 'short' 
    }),
    fuel: item.value
  })) || [];

  const speedDistributionData = data.speedDistribution?.ranges?.map((range, index) => ({
    range,
    count: data.speedDistribution?.values?.[index] || 0,
    percentage: data.speedDistribution?.values?.[index] 
      ? ((data.speedDistribution.values[index] / data.speedDistribution.values.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
      : '0'
  })) || [];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Análise de Utilização</span>
        </CardTitle>
        <CardDescription>
          Gráficos detalhados de utilização e performance da frota
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="distance">Distância</TabsTrigger>
            <TabsTrigger value="fuel">Combustível</TabsTrigger>
            <TabsTrigger value="speed">Velocidade</TabsTrigger>
          </TabsList>

          {/* Atividade Diária */}
          <TabsContent value="activity" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Veículos Ativos por Dia</h4>
              <Badge variant="secondary">
                Últimos {dailyActiveData.length} dias
              </Badge>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-md">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-blue-600">
                              Veículos: {payload[0].value}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vehicles" 
                    stroke="#0088FE" 
                    fill="#0088FE" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas de Eficiência */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Eficiência de Rotas</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {data.routeEfficiency?.value || 0}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Tempo Ocioso</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {data.idleTime?.value || 0}h
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Distância Semanal */}
          <TabsContent value="distance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Distância Percorrida por Semana</h4>
              <Badge variant="secondary">
                km
              </Badge>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyDistanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-md">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-green-600">
                              Distância: {payload[0].value} km
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="distance" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Consumo de Combustível */}
          <TabsContent value="fuel" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Consumo de Combustível Mensal</h4>
              <Badge variant="secondary">
                Litros
              </Badge>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyFuelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-md">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-sm text-orange-600">
                              Combustível: {payload[0].value}L
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fuel" 
                    stroke="#FFBB28" 
                    strokeWidth={3}
                    dot={{ fill: '#FFBB28', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Distribuição de Velocidade */}
          <TabsContent value="speed" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Distribuição de Velocidade</h4>
              <Badge variant="secondary">
                km/h
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de Pizza */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speedDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percentage }) => `${range}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {speedDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Estatísticas */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium">Estatísticas de Velocidade</h5>
                
                <div className="space-y-3">
                  {speedDistributionData.map((item, index) => (
                    <div key={item.range} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm">{item.range} km/h</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}