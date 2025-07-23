import VehicleRemoteControlDemo from '@/components/vehicle/VehicleRemoteControlDemo';

export default function CommandsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comandos Remotos
        </h1>
        <p className="text-gray-600">
          Controle seu veículo remotamente com comandos seguros e confirmação dupla.
        </p>
      </div>
      
      <VehicleRemoteControlDemo />
    </div>
  );
}