import { useState } from 'react';
import { useVehicles } from '@/lib/vehicles-client';
import { motion } from 'framer-motion';
import { Tooltip } from '@/components/ui/tooltip';
import { AlertTriangle, Power, VolumeX, Lightbulb } from 'lucide-react';

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
    <motion.div 
      className="bg-white rounded-lg shadow-md p-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🎮 Comandos Remotos
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Controle em tempo real</span>
      </h2>
      
      {/* Resultado do comando */}
      {commandResult && (
        <motion.div 
          className={`mb-5 p-4 rounded-md ${commandResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <p className={`text-sm flex items-center ${commandResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {commandResult.success ? '✅' : '❌'} 
            <span className="ml-2">{commandResult.message}</span>
          </p>
        </motion.div>
      )}
      
      {/* Lista de comandos disponíveis */}
      <div className="grid grid-cols-3 gap-4">
        <Tooltip content={vehicle.ignition ? "Bloquear motor do veículo" : "Desbloquear motor do veículo"}>
          <motion.button
            className={`flex flex-col items-center p-4 rounded-md transition-all duration-200 ${
              vehicle.ignition 
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' 
                : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
            onClick={handleBlockCommand}
            disabled={isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Power className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">{vehicle.ignition ? 'Bloquear' : 'Desbloquear'}</span>
          </motion.button>
        </Tooltip>
        
        <Tooltip content="Ativar sirene do veículo por 30 segundos">
          <motion.button
            className={`flex flex-col items-center p-4 rounded-md bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-all duration-200 border border-yellow-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
            onClick={handleSirenCommand}
            disabled={isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <VolumeX className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Sirene</span>
          </motion.button>
        </Tooltip>
        
        <Tooltip content="Piscar faróis do veículo por 30 segundos">
          <motion.button
            className={`flex flex-col items-center p-4 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all duration-200 border border-blue-200 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
            onClick={handleLightsCommand}
            disabled={isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Lightbulb className="w-6 h-6 mb-2" />
            <span className="text-sm font-medium">Faróis</span>
          </motion.button>
        </Tooltip>
      </div>
      
      {/* Indicador de processamento */}
      {isProcessing && (
        <motion.div 
          className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-center text-blue-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span>Enviando comando ao veículo...</span>
          </div>
        </motion.div>
      )}
      
      {/* Aviso de segurança */}
      <motion.div 
        className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 text-amber-500" />
        <p>O bloqueio do veículo deve ser usado com cautela e apenas quando o veículo estiver parado em local seguro. A empresa não se responsabiliza por acidentes causados pelo bloqueio indevido.</p>
      </motion.div>
    </motion.div>
  );
}
