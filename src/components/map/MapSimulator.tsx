import { useEffect, useState } from 'react';
import { useVehicles } from '@/lib/vehicles-client';

// Componente para simular um mapa com localização de veículos
export default function MapSimulator({ vehicleId }: { vehicleId?: number }) {
  const { vehicles, selectedVehicle, selectVehicle } = useVehicles();
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Selecionar veículo se o ID for fornecido
  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      selectVehicle(vehicleId);
    }
  }, [vehicleId, vehicles, selectVehicle]);
  
  // Simular carregamento do mapa
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Veículo a ser exibido no mapa
  const vehicleToShow = vehicleId 
    ? vehicles.find(v => v.id === vehicleId) || selectedVehicle
    : selectedVehicle;
  
  if (!mapLoaded) {
    return (
      <div className="bg-gray-200 rounded-lg h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-200 rounded-lg h-[400px] flex items-center justify-center relative overflow-hidden">
      {/* Simulação visual de um mapa */}
      <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-23.550520,-46.633308&zoom=13&size=600x400&maptype=roadmap')] bg-cover bg-center opacity-70"></div>
      
      {/* Overlay com mensagem */}
      <div className="absolute top-4 right-4 z-10 p-3 bg-white bg-opacity-90 rounded-lg shadow-md text-sm">
        <p className="text-gray-800 font-medium">Visualização de Mapa Simulada</p>
        <p className="text-xs text-gray-600 mt-1">Em um aplicativo real, aqui seria exibido um mapa interativo</p>
      </div>
      
      {/* Marcador de veículo simulado */}
      {vehicleToShow && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative">
            <div className="text-3xl animate-bounce-slow">
              {vehicleToShow.type === 'car' ? '🚗' : 
               vehicleToShow.type === 'motorcycle' ? '🏍️' : 
               vehicleToShow.type === 'truck' ? '🚚' : 
               vehicleToShow.type === 'boat' ? '🚤' : 
               vehicleToShow.type === 'jetski' ? '🏄' : '🚗'}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
              {vehicleToShow.name}
            </div>
          </div>
        </div>
      )}
      
      {/* Controles do mapa */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
        <button className="bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md">
          <span className="text-gray-700">+</span>
        </button>
        <button className="bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md">
          <span className="text-gray-700">-</span>
        </button>
      </div>
    </div>
  );
}
