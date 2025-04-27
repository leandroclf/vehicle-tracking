import { useVehicles } from '@/lib/vehicles';

// Componente para exibir telemetria do veículo
export default function VehicleTelemetry({ vehicleId }: { vehicleId: number }) {
  const { vehicles } = useVehicles();
  
  // Encontrar o veículo pelo ID
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  if (!vehicle) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
        <p className="text-yellow-700">Veículo não encontrado</p>
      </div>
    );
  }
  
  // Definir ícones e cores para cada métrica
  const telemetryItems = [
    {
      title: 'Velocidade',
      value: `${vehicle.speed} km/h`,
      icon: '🏁',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Ignição',
      value: vehicle.ignition ? 'Ligada' : 'Desligada',
      icon: '🔑',
      color: vehicle.ignition ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    },
    {
      title: 'Direção',
      value: vehicle.direction || 'N/A',
      icon: '🧭',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'Bateria',
      value: `${vehicle.battery}%`,
      icon: '🔋',
      color: vehicle.battery > 70 ? 'bg-green-100 text-green-700' : 
             vehicle.battery > 30 ? 'bg-yellow-100 text-yellow-700' : 
             'bg-red-100 text-red-700'
    },
    {
      title: 'Satélites GPS',
      value: `${vehicle.satellites}`,
      icon: '📡',
      color: vehicle.satellites > 6 ? 'bg-green-100 text-green-700' : 
             vehicle.satellites > 3 ? 'bg-yellow-100 text-yellow-700' : 
             'bg-red-100 text-red-700'
    },
    {
      title: 'Última Atualização',
      value: vehicle.lastUpdate,
      icon: '🕒',
      color: 'bg-gray-100 text-gray-700'
    },
    {
      title: 'Status',
      value: vehicle.isMoving ? 'Em movimento' : 'Parado',
      icon: '📊',
      color: vehicle.isMoving ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
    },
    {
      title: 'Coordenadas',
      value: `${vehicle.location.lat.toFixed(6)}, ${vehicle.location.lng.toFixed(6)}`,
      icon: '📍',
      color: 'bg-indigo-100 text-indigo-700'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Telemetria em Tempo Real</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {telemetryItems.map((item, index) => (
          <div key={index} className={`rounded-lg p-3 ${item.color}`}>
            <div className="flex items-center">
              <div className="text-2xl mr-3">{item.icon}</div>
              <div>
                <p className="text-xs opacity-75">{item.title}</p>
                <p className="text-lg font-medium">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Os dados são atualizados automaticamente a cada 10 segundos.</p>
      </div>
    </div>
  );
}
