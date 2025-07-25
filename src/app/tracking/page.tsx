'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/container';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackingDashboard } from '@/components/tracking/simple-tracking-dashboard';
import { SimpleMap } from '@/components/tracking/simple-map';
import { Map, Activity, BarChart3, Settings } from 'lucide-react';

export default function TrackingPage() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <Container className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Rastreamento em Tempo Real
          </h1>
          <Breadcrumb />
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings size={16} className="mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="map" className="flex items-center">
              <Map size={16} className="mr-2" />
              Mapa
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center">
              <BarChart3 size={16} className="mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center">
              <Activity size={16} className="mr-2" />
              Atividade
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="map" className="h-full m-0">
                <Card className="h-full">
                  <SimpleMap />
                </Card>
              </TabsContent>

            <TabsContent value="dashboard" className="h-full m-0">
              <Card className="h-full">
                <TrackingDashboard />
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="h-full m-0">
              <Card className="h-full p-6">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Atividade em Tempo Real
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Visualize eventos e atividades dos veículos em tempo real
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Container>
  );
}