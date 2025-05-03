import { useState, useEffect } from 'react';
import { useVehicles } from '@/lib/vehicles';

// Tipo para os comandos
interface Command {
  id: string;
  vehicle_id: string;
  type: string;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  sent_at: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

// Tipo para a resposta da API
interface CommandResponse {
  commands: Command[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Componente para exibir o histórico de comandos
export default function VehicleCommandHistory({ vehicleId }: { vehicleId: number | string }) {
  const { fetchCommandHistory } = useVehicles();
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
  });

  // Carregar histórico de comandos
  const loadCommandHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: CommandResponse = await fetchCommandHistory(
        vehicleId,
        pagination.limit,
        pagination.offset
      );

      setCommandHistory(response.commands);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar histórico de comandos:', err);
      setError('Falha ao carregar histórico de comandos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar histórico ao montar o componente e quando mudar a paginação
  useEffect(() => {
    loadCommandHistory();
  }, [vehicleId, pagination.limit, pagination.offset]);

  // Função para obter a próxima página
  const nextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination({
        ...pagination,
        offset: pagination.offset + pagination.limit,
      });
    }
  };

  // Função para obter a página anterior
  const prevPage = () => {
    if (pagination.offset - pagination.limit >= 0) {
      setPagination({
        ...pagination,
        offset: pagination.offset - pagination.limit,
      });
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Função para traduzir tipo de comando
  const translateCommandType = (type: string) => {
    const typeMap: Record<string, string> = {
      'block_engine': 'Bloquear Motor',
      'unblock_engine': 'Desbloquear Motor',
      'siren': 'Sirene',
      'lights': 'Faróis',
    };
    return typeMap[type] || type;
  };

  // Função para obter classe de cores baseado no status
  const getStatusColorClass = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      'pending': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      'sent': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'executed': { bg: 'bg-green-50', text: 'text-green-700' },
      'failed': { bg: 'bg-red-50', text: 'text-red-700' },
    };
    return statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-700' };
  };

  // Função para traduzir status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'sent': 'Enviado',
      'executed': 'Executado',
      'failed': 'Falhou',
    };
    return statusMap[status] || status;
  };

  // Renderizar indicador de carregamento
  if (isLoading && commandHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Comandos</h2>
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Comandos</h2>
        <div className="bg-red-50 border border-red-200 p-3 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            className="mt-2 px-3 py-1 bg-white text-red-700 border border-red-300 rounded-md text-sm"
            onClick={loadCommandHistory}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Renderizar mensagem quando não há comandos
  if (commandHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Comandos</h2>
        <p className="text-center text-gray-500 my-4">Nenhum comando foi enviado para este veículo.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Histórico de Comandos</h2>
      
      {/* Tabela de comandos */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comando
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enviado em
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Executado em
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {commandHistory.map((command) => {
              const statusColors = getStatusColorClass(command.status);
              
              return (
                <tr key={command.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {translateCommandType(command.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                      {translateStatus(command.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(command.sent_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {command.executed_at ? formatDate(command.executed_at) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Paginação */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Exibindo {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={prevPage}
              disabled={pagination.offset === 0}
              className={`px-3 py-1 border rounded-md text-sm ${
                pagination.offset === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={nextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className={`px-3 py-1 border rounded-md text-sm ${
                pagination.offset + pagination.limit >= pagination.total
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
              }`}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      
      {/* Botão de atualização */}
      <button
        className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm transition-colors"
        onClick={loadCommandHistory}
      >
        Atualizar histórico
      </button>
    </div>
  );
} 