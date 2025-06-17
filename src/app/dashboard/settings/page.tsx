"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Tabs } from '@/components/ui/tabs';
import { useSettings } from '@/lib/settings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('geral');
  const { settings, isLoading, updatePreferences, updateNotifications } = useSettings();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Identificar a categoria da configuração
    const [category, setting, subSetting] = id.split('.');
    
    if (category === 'preferences') {
      if (setting === 'map_settings') {
        updatePreferences({
          ...settings.preferences,
          map_settings: {
            ...settings.preferences.map_settings,
            [subSetting]: type === 'checkbox' ? checked : value
          }
        });
      } else {
        updatePreferences({
          ...settings.preferences,
          [setting]: type === 'checkbox' ? checked : value
        });
      }
    } else if (category === 'notifications') {
      updateNotifications({
        ...settings.notifications,
        [setting]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleMapStyleChange = (style: string) => {
    updatePreferences({
      ...settings.preferences,
      map_settings: {
        ...settings.preferences.map_settings,
        style: style as 'standard' | 'satellite' | 'terrain' | 'night'
      }
    });
  };

  const handleThemeChange = (theme: string) => {
    updatePreferences({
      ...settings.preferences,
      theme: theme as 'light' | 'dark' | 'system'
    });
  };

  const handleSubmitGeneral = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      toast.success('Configurações gerais salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
    }
  };

  const handleSubmitNotifications = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      toast.success('Configurações de notificações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
      toast.error('Erro ao salvar configurações. Tente novamente.');
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
              className={`px-6 py-3 font-medium ${activeTab === 'interface' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('interface')}
            >
              Interface
            </button>
            <button 
              className={`px-6 py-3 font-medium ${activeTab === 'mapa' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'}`}
              onClick={() => setActiveTab('mapa')}
            >
              Mapa
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'geral' && (
            <form onSubmit={handleSubmitGeneral}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Unidades de Medida</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="preferences.distance_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distância
                    </label>
                    <select 
                      id="preferences.distance_unit"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.preferences.distance_unit || 'km'}
                      onChange={handleInputChange}
                    >
                      <option value="km">Quilômetros (km)</option>
                      <option value="mi">Milhas (mi)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Idioma e Regional</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="preferences.language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Idioma
                    </label>
                    <select 
                      id="preferences.language"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.preferences.language || 'pt-BR'}
                      onChange={handleInputChange}
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'notificacoes' && (
            <form onSubmit={handleSubmitNotifications}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Configurações de Notificações</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notifications.email_notifications"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.notifications.email_notifications}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="notifications.email_notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Receber notificações por e-mail
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notifications.push_notifications"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.notifications.push_notifications}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="notifications.push_notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Receber notificações no navegador
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="notifications.sms_notifications"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.notifications.sms_notifications}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="notifications.sms_notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Receber notificações por SMS
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="notifications.time_threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Intervalo mínimo entre notificações (minutos)
                    </label>
                    <input 
                      type="number" 
                      id="notifications.time_threshold"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.notifications.time_threshold}
                      min={1}
                      max={60}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Tipos de Notificações</h2>
                <div className="space-y-3">
                  {['geocerca', 'velocidade', 'bateria', 'ignição', 'movimento'].map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`notification_type_${type}`}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.notifications.notification_types.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...settings.notifications.notification_types, type]
                            : settings.notifications.notification_types.filter(t => t !== type);
                          
                          updateNotifications({
                            ...settings.notifications,
                            notification_types: newTypes
                          });
                        }}
                      />
                      <label htmlFor={`notification_type_${type}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
          
          {activeTab === 'interface' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Aparência</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tema
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['light', 'dark', 'system'].map((theme) => (
                        <div 
                          key={theme}
                          className={`border p-3 rounded-lg cursor-pointer ${
                            settings.preferences.theme === theme ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={() => handleThemeChange(theme)}
                        >
                          <div className="flex items-center justify-center h-16 mb-2 bg-white dark:bg-gray-800 rounded">
                            {theme === 'light' && <span className="text-2xl">☀️</span>}
                            {theme === 'dark' && <span className="text-2xl">🌙</span>}
                            {theme === 'system' && <span className="text-2xl">💻</span>}
                          </div>
                          <p className="text-center text-sm font-medium">
                            {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="preferences.sidebar_collapsed" className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        id="preferences.sidebar_collapsed"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        checked={settings.preferences.sidebar_collapsed}
                        onChange={handleInputChange}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Menu lateral recolhido por padrão
                      </span>
                    </label>
                  </div>
                  
                  <div>
                    <label htmlFor="preferences.dashboard_layout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Layout do Dashboard
                    </label>
                    <select 
                      id="preferences.dashboard_layout"
                      className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2"
                      value={settings.preferences.dashboard_layout}
                      onChange={handleInputChange}
                    >
                      <option value="compact">Compacto</option>
                      <option value="detailed">Detalhado</option>
                      <option value="grid">Grade</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => toast.success('Configurações de interface salvas com sucesso!')}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'mapa' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-gray-200">Configurações do Mapa</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estilo do Mapa
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['standard', 'satellite', 'terrain', 'night'].map((style) => (
                        <div 
                          key={style}
                          className={`border p-3 rounded-lg cursor-pointer ${
                            settings.preferences.map_settings.style === style ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          onClick={() => handleMapStyleChange(style)}
                        >
                          <div className="flex items-center justify-center h-24 mb-2 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                            {/* Aqui poderia ter uma miniatura de cada estilo de mapa */}
                            <span className="text-sm font-medium">{style}</span>
                          </div>
                          <p className="text-center text-sm font-medium">
                            {style === 'standard' ? 'Padrão' : 
                             style === 'satellite' ? 'Satélite' : 
                             style === 'terrain' ? 'Terreno' : 'Noturno'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="preferences.map_settings.default_zoom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Zoom Padrão
                    </label>
                    <input 
                      type="range" 
                      id="preferences.map_settings.default_zoom"
                      className="w-full"
                      min={1}
                      max={20}
                      value={settings.preferences.map_settings.default_zoom}
                      onChange={handleInputChange}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Cidade</span>
                      <span>Rua</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="preferences.map_settings.show_traffic"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.preferences.map_settings.show_traffic}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="preferences.map_settings.show_traffic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mostrar tráfego
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="preferences.map_settings.show_weather"
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      checked={settings.preferences.map_settings.show_weather}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="preferences.map_settings.show_weather" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mostrar clima
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                  onClick={() => toast.success('Configurações do mapa salvas com sucesso!')}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}