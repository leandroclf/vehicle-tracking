import { useState } from 'react';
import { useVehicles } from '@/lib/vehicles';

// Componente para enviar comandos para veículos
export default function VehicleCommands({ vehicleId }: { vehicleId: number }) {
  const { vehicles, sendCommand } = useVehicles();
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandResult, setCommandResult] = useState<{success: boolean; message: string} | null>(null);
  
  // Encontrar o veículo pelo ID
  const vehicle = vehicles.find(v => v.id === vehicleId);
  
  if (!vehicle) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
        <p className="text-yellow-700">Veículo não encontrado</p>
      </div>
    );
  }
  
  // Função para enviar comando de bloqueio/desbloqueio
  const handleBlockCommand = async () => {
    setIsProcessing(true);
    setCommandResult(null);
    
    try {
      // Determinar qual comando enviar com base no estado atual
      const command = vehicle.ignition ? 'block' : 'unblock';
      const commandName = vehicle.ignition ? 'bloqueio' : 'desbloqueio';
      
      // Enviar comando
      const result = await sendCommand(vehicleId, command);
      
      // Atualizar resultado
      if (result) {
        setCommandResult({
          success: true,
          message: `Comando de ${commandName} enviado com sucesso para ${vehicle.name}.`
        });
      } else {
        setCommandResult({
          success: false,
          message: `Falha ao enviar comando de ${commandName} para ${vehicle.name}.`
        });
      }
    } catch (error) {
      setCommandResult({
        success: false,
        message: 'Ocorreu um erro ao processar o comando.'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para enviar comando de sirene
  const handleSirenCommand = async () => {
    setIsProcessing(true);
    setCommandResult(null);
    
    try {
      // Simular envio de comando
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado bem-sucedido
      setCommandResult({
        success: true,
        message: `Comando de sirene enviado com sucesso para ${vehicle.name}.`
      });
    } catch (error) {
      setCommandResult({
        success: false,
        message: 'Ocorreu um erro ao processar o comando.'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para enviar comando de faróis
  const handleLightsCommand = async () => {
    setIsProcessing(true);
    setCommandResult(null);
    
    try {
      // Simular envio de comando
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado bem-sucedido
      setCommandResult({
        success: true,
        message: `Comando de acender faróis enviado com sucesso para ${vehicle.name}.`
      });
    } catch (error) {
      setCommandResult({
        success: false,
        message: 'Ocorreu um erro ao processar o comando.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Comandos Remotos</h2>
      
      {/* Resultado do comando */}
      {commandResult && (
        <div className={`mb-4 p-3 rounded-md ${commandResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${commandResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {commandResult.message}
          </p>
        </div>
      )}
      
      {/* Lista de comandos disponíveis */}
      <div className="grid grid-cols-3 gap-3">
        <button
          className={`flex flex-col items-center p-3 rounded-md ${
            vehicle.ignition 
              ? 'bg-red-50 hover:bg-red-100 text-red-700' 
              : 'bg-green-50 hover:bg-green-100 text-green-700'
          } transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleBlockCommand}
          disabled={isProcessing}
        >
          <span className="text-2xl mb-1">{vehicle.ignition ? '🔒' : '🔓'}</span>
          <span className="text-xs font-medium">{vehicle.ignition ? 'Bloquear' : 'Desbloquear'}</span>
        </button>
        
        <button
          className={`flex flex-col items-center p-3 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSirenCommand}
          disabled={isProcessing}
        >
          <span className="text-2xl mb-1">🔔</span>
          <span className="text-xs font-medium">Sirene</span>
        </button>
        
        <button
          className={`flex flex-col items-center p-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleLightsCommand}
          disabled={isProcessing}
        >
          <span className="text-2xl mb-1">💡</span>
          <span className="text-xs font-medium">Faróis</span>
        </button>
      </div>
      
      {/* Indicador de processamento */}
      {isProcessing && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-center text-blue-700">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span>Enviando comando...</span>
          </div>
        </div>
      )}
      
      {/* Aviso de segurança */}
      <div className="mt-4 text-xs text-gray-500">
        <p>⚠️ Atenção: O bloqueio do veículo deve ser usado com cautela e apenas quando o veículo estiver parado em local seguro.</p>
      </div>
    </div>
  );
}
