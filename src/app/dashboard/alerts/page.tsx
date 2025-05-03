'use client';

import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function AlertsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Alertas</h1>
      
      <Card 
        title="Lista de Alertas" 
        elevated={true}
        className="mb-6"
      >
        <div className="space-y-4">
          <Alert
            variant="error"
            title="Veículo fora da geocerca"
            className="flex justify-between items-start"
          >
            <div>
              <p className="text-sm text-gray-600">O veículo ABC-1234 saiu da geocerca &quot;Zona de Entrega&quot;</p>
              <p className="text-xs text-gray-500 mt-1">Hoje às 14:25</p>
            </div>
            <Badge variant="danger" className="ml-4">Crítico</Badge>
          </Alert>
          
          <Alert
            variant="warning"
            title="Velocidade excedida"
            className="flex justify-between items-start"
          >
            <div>
              <p className="text-sm text-gray-600">O veículo DEF-5678 está a 95 km/h em zona de 60 km/h</p>
              <p className="text-xs text-gray-500 mt-1">Hoje às 13:10</p>
            </div>
            <Badge variant="warning" className="ml-4">Médio</Badge>
          </Alert>
          
          <Alert
            variant="info"
            title="Parada não programada"
            className="flex justify-between items-start"
          >
            <div>
              <p className="text-sm text-gray-600">O veículo GHI-9012 está parado há 45 minutos</p>
              <p className="text-xs text-gray-500 mt-1">Ontem às 17:30</p>
            </div>
            <Badge variant="info" className="ml-4">Informativo</Badge>
          </Alert>
        </div>
      </Card>
    </div>
  );
} 