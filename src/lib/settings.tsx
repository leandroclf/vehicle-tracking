'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Definição do tipo de configurações
export interface Settings {
  notifications: {
    enabled: boolean;
    speedAlert: {
      enabled: boolean;
      value: number;
    };
    ignitionAlert: boolean;
    movementAlert: boolean;
    panicAlert: boolean;
    batteryAlert: boolean;
  };
  map: {
    type: 'standard' | 'satellite' | 'hybrid';
  };
  appearance: {
    darkMode: boolean;
    measurementUnit: 'km' | 'mi';
    language: 'pt-BR' | 'en-US' | 'es';
  };
}

// Definição do contexto de configurações
interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

// Configurações padrão
const defaultSettings: Settings = {
  notifications: {
    enabled: true,
    speedAlert: {
      enabled: true,
      value: 120
    },
    ignitionAlert: true,
    movementAlert: true,
    panicAlert: true,
    batteryAlert: true
  },
  map: {
    type: 'standard'
  },
  appearance: {
    darkMode: false,
    measurementUnit: 'km',
    language: 'pt-BR'
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
      ...(newSettings.notifications || {}),
      speedAlert: {
        ...oldSettings.notifications.speedAlert,
        ...(newSettings.notifications?.speedAlert || {})
      }
    },
    map: {
      ...oldSettings.map,
      ...(newSettings.map || {})
    },
    appearance: {
      ...oldSettings.appearance,
      ...(newSettings.appearance || {})
    }
  };
};

// Provedor de configurações
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Tentar carregar configurações do localStorage
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('yukz_settings');
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (error) {
          console.error('Erro ao carregar configurações:', error);
        }
      }
    }
    return defaultSettings;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Atualizar configurações
  const updateSettings = async (newSettings: Partial<Settings>): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulação de atualização de configurações
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedSettings = mergeSettings(settings, newSettings);
      setSettings(updatedSettings);
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('yukz_settings', JSON.stringify(updatedSettings));
      }
    } catch (error) {
      setError('Erro ao atualizar configurações');
      console.error('Erro ao atualizar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Resetar configurações para o padrão
  const resetSettings = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulação de reset de configurações
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSettings(defaultSettings);
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('yukz_settings', JSON.stringify(defaultSettings));
      }
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
    resetSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
