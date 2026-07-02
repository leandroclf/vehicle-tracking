import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { 
  Lock, 
  Unlock, 
  Siren, 
  VolumeX, 
  Zap, 
  MapPin, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Shield
} from 'lucide-react';
import { useVehicleCommandsForVehicle } from '@/lib/hooks/useVehicleCommands';
import type { CommandType, VehicleCommand } from '@/types/commands';

interface VehicleRemoteControlProps {
  vehicleId: string;
  vehicleName: string;
  isOnline: boolean;
}

const COMMAND_CONFIG = {
  block_vehicle: {
    label: 'Bloquear Veículo',
    description: 'Impede que o veículo seja ligado',
    icon: Lock,
    variant: 'destructive' as const,
    requiresConfirmation: true
  },
  unblock_vehicle: {
    label: 'Desbloquear Veículo',
    description: 'Permite que o veículo seja ligado',
    icon: Unlock,
    variant: 'default' as const,
    requiresConfirmation: true
  },
  activate_siren: {
    label: 'Ativar Sirene',
    description: 'Liga a sirene do veículo',
    icon: Siren,
    variant: 'secondary' as const,
    requiresConfirmation: false
  },
  deactivate_siren: {
    label: 'Desativar Sirene',
    description: 'Desliga a sirene do veículo',
    icon: VolumeX,
    variant: 'secondary' as const,
    requiresConfirmation: false
  },
  flash_lights: {
    label: 'Piscar Faróis',
    description: 'Faz os faróis piscarem por alguns segundos',
    icon: Zap,
    variant: 'outline' as const,
    requiresConfirmation: false
  },
  request_location: {
    label: 'Solicitar Localização',
    description: 'Força atualização da posição atual',
    icon: MapPin,
    variant: 'outline' as const,
    requiresConfirmation: false
  },
  emergency_stop: {
    label: 'Parada de Emergência',
    description: 'Para o veículo imediatamente (CUIDADO!)',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    requiresConfirmation: true
  }
} as const;

const STATUS_CONFIG = {
  pending_confirmation: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
  sent_to_device: { label: 'Enviado', color: 'bg-green-500', icon: CheckCircle },
  executed: { label: 'Executado', color: 'bg-green-600', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-500', icon: XCircle },
  expired: { label: 'Expirado', color: 'bg-gray-500', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-400', icon: XCircle }
} as const;

export function VehicleRemoteControl({ vehicleId, vehicleName, isOnline }: VehicleRemoteControlProps) {
  const {
    commands,
    loading,
    error,
    createCommand,
    confirmCommand,
    fetchCommands
  } = useVehicleCommandsForVehicle(vehicleId);

  const [selectedCommand, setSelectedCommand] = useState<CommandType | ''>('');
  const [confirmationToken, setConfirmationToken] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<VehicleCommand | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Carregar comandos ao montar o componente
  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  // Verificar se há comandos pendentes de confirmação
  useEffect(() => {
    const pending = commands.find(cmd => 
      cmd.status === 'pending_confirmation' && 
      cmd.confirmation_required &&
      cmd.confirmation_expires_at != null &&
      new Date(cmd.confirmation_expires_at) > new Date()
    );
    setPendingConfirmation(pending || null);
  }, [commands]);

  const handleCreateCommand = async () => {
    if (!selectedCommand) return;

    try {
      const config = COMMAND_CONFIG[selectedCommand];
      await createCommand(
        selectedCommand,
        config.requiresConfirmation
      );
      
      setSelectedCommand('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar comando:', error);
    }
  };

  const handleConfirmCommand = async () => {
    if (!pendingConfirmation || !confirmationToken.trim()) return;

    try {
      const success = await confirmCommand({
        command_id: pendingConfirmation.id,
        confirmation_token: confirmationToken.trim()
      });

      if (success) {
        setConfirmationToken('');
        setPendingConfirmation(null);
      }
    } catch (error) {
      console.error('Erro ao confirmar comando:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Status do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Comandos Remotos - {vehicleName}
          </CardTitle>
          <CardDescription>
            Controle remoto do veículo via comandos seguros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Badge variant={isOnline ? 'default' : 'secondary'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {!isOnline && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Veículo offline. Comandos serão enviados quando reconectar.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Confirmação Pendente */}
          {pendingConfirmation && (
            <Alert className="mb-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p>
                    Comando <strong>{COMMAND_CONFIG[pendingConfirmation.type].label}</strong> aguardando confirmação.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expira em: {getTimeRemaining(pendingConfirmation.confirmation_expires_at ?? '')}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o token de confirmação"
                      value={confirmationToken}
                      onChange={(e) => setConfirmationToken(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button 
                      onClick={handleConfirmCommand}
                      disabled={!confirmationToken.trim() || loading}
                      size="sm"
                    >
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirmar
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Botão para Novo Comando */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isOnline || loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Novo Comando
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Comando Remoto</DialogTitle>
                <DialogDescription>
                  Selecione o comando que deseja enviar para o veículo.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="command-select">Tipo de Comando</Label>
                  <Select value={selectedCommand} onValueChange={(value) => setSelectedCommand(value as CommandType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um comando" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMMAND_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCommand && COMMAND_CONFIG[selectedCommand].requiresConfirmation && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Este comando requer confirmação dupla por segurança. 
                      Você receberá um token para confirmar a ação.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateCommand}
                    disabled={!selectedCommand || loading}
                    variant={selectedCommand ? COMMAND_CONFIG[selectedCommand].variant : 'default'}
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Enviar Comando
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Histórico de Comandos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comandos</CardTitle>
          <CardDescription>
            Últimos comandos enviados para este veículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {commands.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum comando enviado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {commands.slice(0, 10).map((command) => {
                const config = COMMAND_CONFIG[command.type];
                const status = STATUS_CONFIG[command.status];
                const Icon = config.icon;
                const StatusIcon = status.icon;

                return (
                  <div key={command.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(command.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                      
                      {command.status === 'pending_confirmation' && command.confirmation_required && (
                        <Badge variant="secondary">
                          Aguardando confirmação
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}