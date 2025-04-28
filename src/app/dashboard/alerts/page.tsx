export default function AlertsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Alertas</h1>
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Lista de Alertas</h2>
        <div className="space-y-4 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-start">
            <div>
              <p className="font-semibold text-red-800">Veículo fora da geocerca</p>
              <p className="text-sm text-gray-600">O veículo ABC-1234 saiu da geocerca "Zona de Entrega"</p>
              <p className="text-xs text-gray-500 mt-1">Hoje às 14:25</p>
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Crítico</span>
          </div>
          
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex justify-between items-start">
            <div>
              <p className="font-semibold text-orange-800">Velocidade excedida</p>
              <p className="text-sm text-gray-600">O veículo DEF-5678 está a 95 km/h em zona de 60 km/h</p>
              <p className="text-xs text-gray-500 mt-1">Hoje às 13:10</p>
            </div>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">Médio</span>
          </div>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-start">
            <div>
              <p className="font-semibold text-blue-800">Parada não programada</p>
              <p className="text-sm text-gray-600">O veículo GHI-9012 está parado há 45 minutos</p>
              <p className="text-xs text-gray-500 mt-1">Ontem às 17:30</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Informativo</span>
          </div>
        </div>
      </div>
    </div>
  );
} 