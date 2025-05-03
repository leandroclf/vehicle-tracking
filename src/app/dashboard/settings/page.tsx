"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { toast } from 'sonner';

interface SettingsData {
  company_name?: string;
  notification_email?: string;
  timezone?: string;
  distance_unit?: string;
  speed_unit?: string;
  fuel_unit?: string;
  map_type?: string;
  show_traffic?: boolean;
}

interface SettingsState {
  companyName: string;
  notification_email: string;
  timezone: string;
  distance_unit: string;
  speed_unit: string;
  fuel_unit: string;
  map_type: string;
  show_traffic: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    companyName: '',
    notification_email: '',
    timezone: 'America/Sao_Paulo',
    distance_unit: 'km',
    speed_unit: 'kmh',
    fuel_unit: 'liter',
    map_type: 'roadmap',
    show_traffic: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar configurações');
      }

      const data = await response.json() as SettingsData;
      
      setSettings({
        companyName: data.company_name || '',
        notification_email: data.notification_email || '',
        timezone: data.timezone || 'America/Sao_Paulo',
        distance_unit: data.distance_unit || 'km',
        speed_unit: data.speed_unit || 'kmh',
        fuel_unit: data.fuel_unit || 'liter',
        map_type: data.map_type || 'roadmap',
        show_traffic: data.show_traffic !== undefined ? data.show_traffic : true
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setSettings({
      ...settings,
      [id]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: settings.companyName,
          notification_email: settings.notification_email,
          timezone: settings.timezone,
          distance_unit: settings.distance_unit,
          speed_unit: settings.speed_unit,
          fuel_unit: settings.fuel_unit,
          map_type: settings.map_type,
          show_traffic: settings.show_traffic
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Configurações</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'geral' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('geral')}
            >
              Geral
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'notificacoes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('notificacoes')}
            >
              Notificações
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'seguranca' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('seguranca')}
            >
              Segurança
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'usuarios' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('usuarios')}
            >
              Usuários
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'geral' && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Configurações da Empresa</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nome da Empresa
                    </label>
                    <input 
                      type="text" 
                      id="companyName"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.companyName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="notification_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email para Relatórios
                    </label>
                    <input 
                      type="email" 
                      id="notification_email"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.notification_email}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fuso Horário
                    </label>
                    <select 
                      id="timezone"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.timezone}
                      onChange={handleInputChange}
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
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Unidades de Medida</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="distance_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distância
                    </label>
                    <select 
                      id="distance_unit"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.distance_unit}
                      onChange={handleInputChange}
                    >
                      <option value="km">Quilômetros (km)</option>
                      <option value="mi">Milhas (mi)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="speed_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Velocidade
                    </label>
                    <select 
                      id="speed_unit"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.speed_unit}
                      onChange={handleInputChange}
                    >
                      <option value="kmh">Quilômetros por hora (km/h)</option>
                      <option value="mph">Milhas por hora (mph)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="fuel_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Combustível
                    </label>
                    <select 
                      id="fuel_unit"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.fuel_unit}
                      onChange={handleInputChange}
                    >
                      <option value="liter">Litros (L)</option>
                      <option value="gallon">Galões (gal)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Mapa</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="map_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Visualização Padrão
                    </label>
                    <select 
                      id="map_type"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.map_type}
                      onChange={handleInputChange}
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
                      id="show_traffic"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.show_traffic}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="show_traffic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Exibir tráfego
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                  onClick={fetchSettings}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'notificacoes' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Configurações de notificações estarão disponíveis em breve.
            </div>
          )}
          
          {activeTab === 'seguranca' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Configurações de segurança estarão disponíveis em breve.
            </div>
          )}
          
          {activeTab === 'usuarios' && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Gerenciamento de usuários estará disponível em breve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 