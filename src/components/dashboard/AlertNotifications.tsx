'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Tabs, { TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs-fixed';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  id: string;
  type: 'bloqueado' | 'desbloqueado';
  date: string;
  vehicleName?: string;
  vehiclePlate?: string;
}

interface AlertNotificationsProps {
  vehicleName?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
}

export default function AlertNotifications({ 
  vehicleName, 
  vehiclePlate, 
  vehicleModel 
}: AlertNotificationsProps) {
  const [activeTab, setActiveTab] = useState('alertas');
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Simular dados de alertas
    const mockAlerts: Alert[] = [
      { id: '1', type: 'desbloqueado', date: '26/04/25 10:10' },
      { id: '2', type: 'bloqueado', date: '26/04/25 10:10' },
      { id: '3', type: 'desbloqueado', date: '26/04/25 09:42' },
      { id: '4', type: 'bloqueado', date: '26/04/25 09:42' },
    ];
    setAlerts(mockAlerts);
  }, []);

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleDeleteAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🔔</span>
          <h2 className="text-xl font-semibold">Alertas e Notificações</h2>
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {}}
        >
          <span className="text-2xl">×</span>
        </button>
      </div>

      {(vehicleName || vehicleModel || vehiclePlate) && (
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 rounded-md p-3">
              <div className="w-20 h-16 relative">
                <Image 
                  src="/icons/car.svg"
                  alt="Veículo"
                  layout="fill"
                  objectFit="contain"
                />
              </div>
            </div>
            <div>
              <p className="font-medium">{vehicleModel || 'Ford Ecosport Freestyle 1.5 12V Flex 5P Aut.'}</p>
              <div className="mt-1">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {vehiclePlate || 'EVW2G86'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="alertas" value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="alertas" className="py-3">Alertas</TabsTrigger>
            <TabsTrigger value="notificacoes" className="py-3">Notificações</TabsTrigger>
          </TabsList>
        </div>

        <div className="p-2">
          {alerts.length > 0 && (
            <div className="flex justify-end mb-2">
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleDeleteAllAlerts}
                className="flex items-center text-sm"
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Excluir todos
              </Button>
            </div>
          )}

          <TabsContent value="alertas" className="mt-0 space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum alerta disponível
              </div>
            ) : (
              alerts.map(alert => (
                <Card key={alert.id} className="shadow-sm">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {alert.type === 'desbloqueado' ? (
                            <span className="text-green-500">🔓</span>
                          ) : (
                            <span className="text-red-500">🔒</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {alert.type === 'desbloqueado' ? 'Desbloqueado' : 'Bloqueado'}
                          </p>
                          <div className="flex items-center text-gray-500 mt-1">
                            <span className="text-sm">📅 Data {alert.date}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <span className="text-2xl">🗑️</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="notificacoes" className="mt-0">
            <div className="text-center py-6 text-gray-500">
              Nenhuma notificação disponível
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}