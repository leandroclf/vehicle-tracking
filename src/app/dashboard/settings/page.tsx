export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Geral
            </button>
            <button className="px-6 py-3 text-gray-600 font-medium">
              Notificações
            </button>
            <button className="px-6 py-3 text-gray-600 font-medium">
              Segurança
            </button>
            <button className="px-6 py-3 text-gray-600 font-medium">
              Usuários
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          <form>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Configurações da Empresa</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa
                  </label>
                  <input 
                    type="text" 
                    id="companyName"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    defaultValue="Transportadora Exemplo Ltda."
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email para Relatórios
                  </label>
                  <input 
                    type="email" 
                    id="email"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    defaultValue="relatorios@exemplo.com.br"
                  />
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Fuso Horário
                  </label>
                  <select 
                    id="timezone"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                    <option value="America/Manaus">América/Manaus (GMT-4)</option>
                    <option value="America/Belem">América/Belém (GMT-3)</option>
                    <option value="America/Recife">América/Recife (GMT-3)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Unidades de Medida</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="distanceUnit" className="block text-sm font-medium text-gray-700 mb-1">
                    Distância
                  </label>
                  <select 
                    id="distanceUnit"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="km">Quilômetros (km)</option>
                    <option value="mi">Milhas (mi)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="speedUnit" className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidade
                  </label>
                  <select 
                    id="speedUnit"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="kmh">Quilômetros por hora (km/h)</option>
                    <option value="mph">Milhas por hora (mph)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="fuelUnit" className="block text-sm font-medium text-gray-700 mb-1">
                    Combustível
                  </label>
                  <select 
                    id="fuelUnit"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="liter">Litros (L)</option>
                    <option value="gallon">Galões (gal)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Mapa</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="defaultMapView" className="block text-sm font-medium text-gray-700 mb-1">
                    Visualização Padrão
                  </label>
                  <select 
                    id="defaultMapView"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="roadmap">Ruas</option>
                    <option value="satellite">Satélite</option>
                    <option value="hybrid">Híbrido</option>
                    <option value="terrain">Terreno</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="showTraffic"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    defaultChecked
                  />
                  <label htmlFor="showTraffic" className="text-sm font-medium text-gray-700">
                    Exibir tráfego
                  </label>
                </div>
              </div>
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
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 