export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Perfil do Usuário</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="md:flex">
          {/* Sidebar */}
          <div className="md:w-1/3 bg-gray-50 p-6 border-r border-gray-200">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl text-blue-600 font-bold">JD</span>
              </div>
              
              <h2 className="text-xl font-semibold">João da Silva</h2>
              <p className="text-gray-600 mb-4">Administrador</p>
              
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                Alterar Foto
              </button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-3">Informações de Contato</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-700">joao@exemplo.com.br</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-700">(11) 98765-4321</span>
                </li>
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">Último acesso: 15/06/2023 às 14:30</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:w-2/3 p-6">
            <form>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome
                    </label>
                    <input 
                      type="text" 
                      id="firstName"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      defaultValue="João"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Sobrenome
                    </label>
                    <input 
                      type="text" 
                      id="lastName"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      defaultValue="da Silva"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input 
                      type="email" 
                      id="email"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      defaultValue="joao@exemplo.com.br"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input 
                      type="tel" 
                      id="phone"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      defaultValue="(11) 98765-4321"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Senha Atual
                    </label>
                    <input 
                      type="password" 
                      id="currentPassword"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha
                    </label>
                    <input 
                      type="password" 
                      id="newPassword"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input 
                      type="password" 
                      id="confirmPassword"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Preferências</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="emailNotifications"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      defaultChecked
                    />
                    <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                      Receber notificações por email
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="smsNotifications"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="smsNotifications" className="ml-2 text-sm text-gray-700">
                      Receber notificações por SMS
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
    </div>
  );
} 