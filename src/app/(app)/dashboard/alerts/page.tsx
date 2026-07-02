'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAlerts } from '@/lib/alerts';
import AlertNotifications from '@/components/dashboard/AlertNotifications';

export default function AlertsPage() {
  const { alerts, markAsRead, markAllAsRead } = useAlerts();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ name?: string, plate?: string, model?: string } | null>(null);

  const handleShowNotifications = (vehicleName?: string, vehiclePlate?: string, vehicleModel?: string) => {
    setSelectedVehicle({
      name: vehicleName,
      plate: vehiclePlate,
      model: vehicleModel,
    });
    setShowNotifications(true);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    setSelectedVehicle(null);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Alertas</h1>
        <div className="flex space-x-2">
          <Button 
            variant="secondary" 
            onClick={() => handleShowNotifications()}
          >
            <Bell size={16} className="mr-2" /> Ver Notificações
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleMarkAllAsRead}
          >
            <Trash2 size={16} className="mr-2" /> Limpar Todos
          </Button>
        </div>
      </div>
      
      <Card className="mb-6 p-4">
        <h2 className="text-lg font-semibold mb-4">Lista de Alertas</h2>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Nenhum alerta disponível no momento.
            </div>
          ) : (
            alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={
                  alert.severity === 'critical' ? 'destructive' :
                  alert.severity === 'warning' ? 'warning' :
                  'info'
                }
                title={
                  alert.type === 'speed' ? 'Velocidade Excedida' :
                  alert.type === 'geofence' ? 'Violação de Cerca Virtual' :
                  alert.type === 'battery' ? 'Bateria Baixa' :
                  alert.type === 'engine' ? 'Alerta do Motor' :
                  'Alerta'
                }
                className="flex justify-between items-start"
              >
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex space-x-2 items-center">
                  <Badge 
                    variant={
                      alert.severity === 'critical' ? 'destructive' :
                      alert.severity === 'warning' ? 'warning' :
                      'info'
                    } 
                    className="ml-4"
                  >
                    {
                      alert.severity === 'critical' ? 'Crítico' :
                      alert.severity === 'warning' ? 'Médio' :
                      'Informativo'
                    }
                  </Badge>
                  
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    onClick={() => handleShowNotifications(
                      alert.vehicleName,
                      "ABC-1234", // Placa exemplo
                      "Ford Ecosport" // Modelo exemplo
                    )}
                  >
                    Ver Detalhes
                  </button>
                  
                  {!alert.acknowledged && (
                    <button
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Novo
                    </button>
                  )}
                </div>
              </Alert>
            ))
          )}
        </div>
      </Card>
      
      {/* Modal de notificações */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div>
            <AlertNotifications 
              vehicleName={selectedVehicle?.name}
              vehiclePlate={selectedVehicle?.plate}
              vehicleModel={selectedVehicle?.model}
            />
          </div>
          
          <button 
            className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2"
            onClick={handleCloseNotifications}
          >
            <span className="text-2xl">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
