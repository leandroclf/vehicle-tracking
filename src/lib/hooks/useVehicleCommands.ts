import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { 
  VehicleCommand, 
  CreateCommandRequest, 
  ConfirmCommandRequest,
  CommandType 
} from '@/types/commands';

interface UseVehicleCommandsReturn {
  commands: VehicleCommand[];
  loading: boolean;
  error: string | null;
  createCommand: (request: CreateCommandRequest) => Promise<any>;
  confirmCommand: (request: ConfirmCommandRequest) => Promise<boolean>;
  fetchCommands: (vehicleId?: string) => Promise<void>;
  refreshCommands: () => Promise<void>;
}

export function useVehicleCommands(): UseVehicleCommandsReturn {
  const [commands, setCommands] = useState<VehicleCommand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar comandos do usuário
   */
  const fetchCommands = useCallback(async (vehicleId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (vehicleId) params.append('vehicle_id', vehicleId);
      params.append('limit', '100');

      const response = await fetch(`/api/commands?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Erro ao buscar comandos');
      }

      const data = (await response.json()) as { data?: VehicleCommand[] };
      setCommands(data.data || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao carregar comandos', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Criar novo comando
   */
  const createCommand = useCallback(async (request: CreateCommandRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Erro ao criar comando');
      }

      const data = (await response.json()) as { data: VehicleCommand };
      
      // Mostrar toast baseado no tipo de comando
      const commandLabels: Record<CommandType, string> = {
        block_vehicle: 'Bloqueio do veículo',
        unblock_vehicle: 'Desbloqueio do veículo',
        activate_siren: 'Ativação da sirene',
        deactivate_siren: 'Desativação da sirene',
        flash_lights: 'Piscar faróis',
        request_location: 'Solicitação de localização',
        emergency_stop: 'Parada de emergência'
      };

      if (data.data.confirmation_required) {
        toast.success('Comando criado', {
          description: `${commandLabels[request.type]} requer confirmação. Verifique o token enviado.`
        });
      } else {
        toast.success('Comando enviado', {
          description: `${commandLabels[request.type]} foi enviado para o dispositivo.`
        });
      }

      // Atualizar lista de comandos
      await fetchCommands();

      return data.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao criar comando', {
        description: errorMessage
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCommands]);

  /**
   * Confirmar comando
   */
  const confirmCommand = useCallback(async (request: ConfirmCommandRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/commands/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Erro ao confirmar comando');
      }

      await response.json();
      
      toast.success('Comando confirmado', {
        description: 'O comando foi confirmado e enviado para o dispositivo.'
      });

      // Atualizar lista de comandos
      await fetchCommands();

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Mostrar toast específico baseado no tipo de erro
      if (errorMessage.includes('expirado')) {
        toast.error('Comando expirado', {
          description: 'O tempo para confirmação expirou. Crie um novo comando.'
        });
      } else if (errorMessage.includes('token')) {
        toast.error('Token inválido', {
          description: 'O token de confirmação está incorreto.'
        });
      } else {
        toast.error('Erro ao confirmar comando', {
          description: errorMessage
        });
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCommands]);

  /**
   * Atualizar lista de comandos
   */
  const refreshCommands = useCallback(async () => {
    await fetchCommands();
  }, [fetchCommands]);

  return {
    commands,
    loading,
    error,
    createCommand,
    confirmCommand,
    fetchCommands,
    refreshCommands
  };
}

/**
 * Hook específico para comandos de um veículo
 */
export function useVehicleCommandsForVehicle(vehicleId: string) {
  const {
    commands: allCommands,
    loading,
    error,
    createCommand,
    confirmCommand,
    fetchCommands,
    refreshCommands
  } = useVehicleCommands();

  // Filtrar comandos do veículo específico
  const commands = allCommands.filter(cmd => cmd.vehicle_id === vehicleId);

  // Função para buscar comandos do veículo específico
  const fetchVehicleCommands = useCallback(async () => {
    await fetchCommands(vehicleId);
  }, [fetchCommands, vehicleId]);

  // Função para criar comando para este veículo
  const createVehicleCommand = useCallback(async (
    type: CommandType, 
    confirmationRequired = true,
    metadata = {}
  ) => {
    return createCommand({
      vehicle_id: vehicleId,
      type,
      confirmation_required: confirmationRequired,
      metadata
    });
  }, [createCommand, vehicleId]);

  return {
    commands,
    loading,
    error,
    createCommand: createVehicleCommand,
    confirmCommand,
    fetchCommands: fetchVehicleCommands,
    refreshCommands
  };
}