import { useState, useEffect, useCallback } from 'react';
import { useVehicles } from '@/lib/vehicles-client';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Terminal, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface VehicleCommandHistoryProps {
  vehicleId: number | string;
  className?: string;
  'data-testid'?: string;
}

// Componente para exibir o histórico de comandos
export default function VehicleCommandHistory({ 
  vehicleId, 
  className,
  'data-testid': dataTestId 
}: VehicleCommandHistoryProps) {
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
  const loadCommandHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const numericVehicleId = typeof vehicleId === 'string' ? parseInt(vehicleId, 10) : vehicleId;
      const response = await fetchCommandHistory(
        numericVehicleId,
        pagination.limit,
        pagination.offset
      );

      const mapped: Command[] = response.commands.map(record => ({
        id: String(record.id),
        vehicle_id: String(record.vehicleId),
        type: record.type,
        status: (record.status ?? 'pending') as Command['status'],
        sent_at: record.sentAt ?? record.createdAt ?? '',
        executed_at: record.executedAt ?? undefined,
        created_at: record.createdAt ?? '',
        updated_at: record.updatedAt ?? '',
      }));

      setCommandHistory(mapped);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar histórico de comandos:', err);
      setError('Falha ao carregar histórico de comandos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCommandHistory, vehicleId, pagination.limit, pagination.offset]);

  // Carregar histórico ao montar o componente e quando mudar a paginação
  useEffect(() => {
    loadCommandHistory();
  }, [loadCommandHistory]);

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
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const statusMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'outline',
      'sent': 'secondary',
      'executed': 'default',
      'failed': 'destructive',
    };
    return statusMap[status] || 'secondary';
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

  // Definir colunas da tabela
  const columns: DataTableColumn<Command>[] = [
    {
      key: 'type',
      title: 'Comando',
      sortable: true,
      render: (_value, command) => (
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{translateCommandType(command.type)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_value, command) => (
        <Badge variant={getStatusVariant(command.status)}>
          {translateStatus(command.status)}
        </Badge>
      ),
    },
    {
      key: 'sent_at',
      title: 'Enviado em',
      sortable: true,
      render: (_value, command) => (
        <span className="text-sm text-gray-600">
          {formatDate(command.sent_at)}
        </span>
      ),
    },
    {
      key: 'executed_at',
      title: 'Executado em',
      render: (_value, command) => (
        <span className="text-sm text-gray-600">
          {command.executed_at ? formatDate(command.executed_at) : '-'}
        </span>
      ),
    },
  ];

  // Renderizar indicador de carregamento
  if (isLoading && commandHistory.length === 0) {
    return (
      <Card className={cn("w-full", className)} data-testid={dataTestId}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>Histórico de Comandos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <Card className={cn("w-full", className)} data-testid={dataTestId}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Terminal className="h-5 w-5" />
            <span>Histórico de Comandos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={loadCommandHistory}
            className="mt-4"
            data-testid="retry-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)} data-testid={dataTestId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Terminal className="h-5 w-5" />
          <span>Histórico de Comandos</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCommandHistory}
          disabled={isLoading}
          data-testid="refresh-commands"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Atualizar
        </Button>
      </CardHeader>
      
      <CardContent>
        <DataTable
          data={commandHistory}
          columns={columns}
          searchable
          sortable
          pagination
          loading={isLoading}
          emptyMessage="Nenhum comando foi enviado para este veículo."
          className="border rounded-lg"
          data-testid="commands-table"
        />
        
        {/* Informações de paginação customizada se necessário */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center mt-4 pt-3 border-t">
            <div className="text-sm text-gray-500">
              Exibindo {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={pagination.offset === 0}
                data-testid="prev-page"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={pagination.offset + pagination.limit >= pagination.total}
                data-testid="next-page"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}