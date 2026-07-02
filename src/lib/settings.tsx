'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

// Definição do tipo de configurações
export interface Settings {
  notifications: {
    enabled: boolean;
    email_notifications: boolean;
    push_notifications: boolean;
    sms_notifications: boolean;
    notification_types: string[];
    time_threshold: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    sidebar_collapsed: boolean;
    dashboard_layout: 'compact' | 'detailed' | 'grid';
    favorite_vehicles: string[];
    default_page: 'dashboard' | 'map' | 'vehicles' | 'reports';
    distance_unit?: 'km' | 'mi';
    language?: 'pt-BR' | 'en-US' | 'es';
    map_settings: {
      default_zoom: number;
      show_traffic: boolean;
      show_weather: boolean;
      style: 'standard' | 'satellite' | 'terrain' | 'night';
    };
  };
}

// Definição do contexto de configurações
interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  updateNotifications: (notifications: Settings['notifications']) => Promise<void>;
  updatePreferences: (preferences: Settings['preferences']) => Promise<void>;
  resetSettings: () => Promise<void>;
}

// Configurações padrão
const defaultSettings: Settings = {
  notifications: {
    enabled: true,
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_types: ['geocerca', 'velocidade', 'bateria'],
    time_threshold: 15
  },
  preferences: {
    theme: 'system',
    sidebar_collapsed: false,
    dashboard_layout: 'detailed',
    favorite_vehicles: [],
    default_page: 'dashboard',
    distance_unit: 'km',
    language: 'pt-BR',
    map_settings: {
      default_zoom: 13,
      show_traffic: true,
      show_weather: false,
      style: 'standard'
    }
  }
};

// Criação do contexto
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

// Função auxiliar para mesclar configurações
const mergeSettings = (oldSettings: Settings, newSettings: Partial<Settings>): Settings => {
  return {
    ...oldSettings,
    notifications: {
      ...oldSettings.notifications,
      ...(newSettings.notifications || {})
    },
    preferences: {
      ...oldSettings.preferences,
      ...(newSettings.preferences || {}),
      map_settings: {
        ...oldSettings.preferences.map_settings,
        ...(newSettings.preferences?.map_settings || {})
      }
    }
  };
};

// Provedor de configurações
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar configurações
  const fetchSettings = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar preferências
      const preferencesResponse = await fetch('/api/settings/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Buscar configurações de notificações
      const notificationsResponse = await fetch('/api/settings/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!preferencesResponse.ok || !notificationsResponse.ok) {
        throw new Error('Falha ao buscar configurações');
      }
      
      const preferencesData = await preferencesResponse.json() as { data?: { preferences?: Settings['preferences'] } };
      const notificationsData = await notificationsResponse.json() as { data?: { settings?: { notifications?: Settings['notifications'] } } };
      
      const loadedSettings: Settings = {
        preferences: preferencesData.data?.preferences || defaultSettings.preferences,
        notifications: notificationsData.data?.settings?.notifications || defaultSettings.notifications
      };
      
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setError('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);
  
  // Buscar configurações quando o token estiver disponível
  useEffect(() => {
    if (token && isAuthenticated) {
      fetchSettings();
    }
  }, [token, isAuthenticated, fetchSettings]);

  // Atualizar todas as configurações
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const updatedSettings = mergeSettings(settings, newSettings);
      
      if (newSettings.preferences) {
        await updatePreferences(updatedSettings.preferences);
      }
      
      if (newSettings.notifications) {
        await updateNotifications(updatedSettings.notifications);
      }
      
      setSettings(updatedSettings);
    } catch (error) {
      setError('Erro ao atualizar configurações');
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Atualizar apenas as configurações de notificações
  const updateNotifications = async (notifications: Settings['notifications']): Promise<void> => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notifications)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar configurações de notificações');
      }
      
      setSettings({
        ...settings,
        notifications
      });
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
      throw error;
    }
  };
  
  // Atualizar apenas as preferências
  const updatePreferences = async (preferences: Settings['preferences']): Promise<void> => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar preferências');
      }
      
      setSettings({
        ...settings,
        preferences
      });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  };

  // Resetar configurações para o padrão
  const resetSettings = async (): Promise<void> => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await updateSettings(defaultSettings);
    } catch (error) {
      setError('Erro ao resetar configurações');
      console.error('Erro ao resetar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    settings,
    isLoading,
    error,
    updateSettings,
    updateNotifications,
    updatePreferences,
    resetSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
