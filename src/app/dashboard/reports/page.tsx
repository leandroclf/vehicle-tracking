export default function ReportsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Gerar Relatório</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Relatório
              </label>
              <select 
                id="reportType"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Selecione um tipo</option>
                <option value="movement">Movimentação de Veículos</option>
                <option value="stops">Paradas</option>
                <option value="geofence">Violações de Geocerca</option>
                <option value="speed">Excesso de Velocidade</option>
                <option value="mileage">Quilometragem</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input 
                  type="date" 
                  id="startDate"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input 
                  type="date" 
                  id="endDate"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="vehicles" className="block text-sm font-medium text-gray-700 mb-1">
                Veículos
              </label>
              <select 
                id="vehicles"
                multiple
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32"
              >
                <option value="ABC-1234">ABC-1234 - Ford F-350</option>
                <option value="DEF-5678">DEF-5678 - Mercedes Sprinter</option>
                <option value="GHI-9012">GHI-9012 - Volvo FH</option>
                <option value="JKL-3456">JKL-3456 - Iveco Daily</option>
                <option value="MNO-7890">MNO-7890 - Scania P310</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Pressione Ctrl para selecionar múltiplos veículos</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Gerar
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Relatórios Recentes</h2>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Movimentação de Veículos</h3>
                <span className="text-sm text-gray-500">Hoje</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">5 veículos • 01/06/2023 - 15/06/2023</p>
              <div className="flex mt-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">Baixar PDF</button>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Baixar CSV</button>
              </div>
            </div>
            
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Paradas</h3>
                <span className="text-sm text-gray-500">Ontem</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">2 veículos • 10/06/2023 - 14/06/2023</p>
              <div className="flex mt-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">Baixar PDF</button>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Baixar CSV</button>
              </div>
            </div>
            
            <div className="pb-3">
              <div className="flex justify-between">
                <h3 className="font-medium">Quilometragem</h3>
                <span className="text-sm text-gray-500">12/06/2023</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Todos os veículos • 01/05/2023 - 31/05/2023</p>
              <div className="flex mt-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">Baixar PDF</button>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Baixar CSV</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 