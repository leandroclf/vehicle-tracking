export default function GeofencesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Geocercas</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Buscar geocerca..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Nova Geocerca
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="bg-gray-100 h-36 rounded-lg mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Zona de Entrega Sul</h3>
          <p className="text-sm text-gray-600 mt-1">Área de entrega setor sul</p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ativa</span>
            <div className="space-x-2">
              <button className="text-blue-600 hover:text-blue-800">Editar</button>
              <button className="text-red-600 hover:text-red-800">Excluir</button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <div className="bg-gray-100 h-36 rounded-lg mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Centro Logístico</h3>
          <p className="text-sm text-gray-600 mt-1">Depósito central</p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Ativa</span>
            <div className="space-x-2">
              <button className="text-blue-600 hover:text-blue-800">Editar</button>
              <button className="text-red-600 hover:text-red-800">Excluir</button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <div className="bg-gray-100 h-36 rounded-lg mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Área Restrita</h3>
          <p className="text-sm text-gray-600 mt-1">Zona de exclusão para caminhões</p>
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Inativa</span>
            <div className="space-x-2">
              <button className="text-blue-600 hover:text-blue-800">Editar</button>
              <button className="text-red-600 hover:text-red-800">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 