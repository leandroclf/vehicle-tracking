'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

interface Command {
  id: string;
  type: string;
  status: 'pending' | 'confirmed' | 'executed' | 'failed';
  timestamp: Date;
  confirmationToken?: string;
  requiresConfirmation: boolean;
}

export default function VehicleRemoteControlDemo() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [vehicleStatus, setVehicleStatus] = useState({
    online: true,
    locked: false,
    sirenActive: false,
    lastSeen: new Date()
  });
  const [confirmationToken, setConfirmationToken] = useState('');
  const [pendingCommand, setPendingCommand] = useState<Command | null>(null);

  const commandLabels = {
    block_vehicle: 'Bloquear Veículo',
    unblock_vehicle: 'Desbloquear Veículo',
    activate_siren: 'Ativar Sirene',
    deactivate_siren: 'Desativar Sirene',
    flash_lights: 'Piscar Faróis',
    request_location: 'Solicitar Localização',
    emergency_stop: 'Parada de Emergência'
  };

  const commandIcons = {
    block_vehicle: Lock,
    unblock_vehicle: Unlock,
    activate_siren: Volume2,
    deactivate_siren: VolumeX,
    flash_lights: Lightbulb,
    request_location: MapPin,
    emergency_stop: AlertTriangle
  };

  const criticalCommands = ['block_vehicle', 'emergency_stop'];

  const createCommand = (type: string) => {
    const requiresConfirmation = criticalCommands.includes(type);
    const command: Command = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      status: requiresConfirmation ? 'pending' : 'executed',
      timestamp: new Date(),
      requiresConfirmation,
      confirmationToken: requiresConfirmation ? Math.random().toString(36).substr(2, 8).toUpperCase() : undefined
    };

    setCommands(prev => [command, ...prev]);

    if (requiresConfirmation) {
      setPendingCommand(command);
    } else {
      // Simular execução imediata para comandos não críticos
      setTimeout(() => {
        executeCommand(command);
      }, 1000);
    }
  };

  const confirmCommand = () => {
    if (!pendingCommand || !confirmationToken) return;

    if (confirmationToken.toUpperCase() === pendingCommand.confirmationToken) {
      const updatedCommand = { ...pendingCommand, status: 'confirmed' as const };
      setCommands(prev => prev.map(cmd => 
        cmd.id === pendingCommand.id ? updatedCommand : cmd
      ));
      
      setTimeout(() => {
        executeCommand(updatedCommand);
      }, 1000);

      setPendingCommand(null);
      setConfirmationToken('');
    } else {
      alert('Token de confirmação inválido!');
    }
  };

  const executeCommand = (command: Command) => {
    setCommands(prev => prev.map(cmd => 
      cmd.id === command.id ? { ...cmd, status: 'executed' } : cmd
    ));

    // Simular efeitos no veículo
    switch (command.type) {
      case 'block_vehicle':
        setVehicleStatus(prev => ({ ...prev, locked: true }));
        break;
      case 'unblock_vehicle':
        setVehicleStatus(prev => ({ ...prev, locked: false }));
        break;
      case 'activate_siren':
        setVehicleStatus(prev => ({ ...prev, sirenActive: true }));
        break;
      case 'deactivate_siren':
        setVehicleStatus(prev => ({ ...prev, sirenActive: false }));
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'executed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${vehicleStatus.online ? 'bg-green-500' : 'bg-red-500'}`} />
            Status do Veículo
          </CardTitle>
          <CardDescription>
            Última atualização: {vehicleStatus.lastSeen.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-1">
                {vehicleStatus.locked ? <Lock className="mx-auto text-red-500" /> : <Unlock className="mx-auto text-green-500" />}
              </div>
              <p className="text-sm text-gray-600">
                {vehicleStatus.locked ? 'Bloqueado' : 'Desbloqueado'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                {vehicleStatus.sirenActive ? <Volume2 className="mx-auto text-red-500" /> : <VolumeX className="mx-auto text-gray-400" />}
              </div>
              <p className="text-sm text-gray-600">
                {vehicleStatus.sirenActive ? 'Sirene Ativa' : 'Sirene Inativa'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                <CheckCircle className="mx-auto text-green-500" />
              </div>
              <p className="text-sm text-gray-600">Online</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">
                <MapPin className="mx-auto text-blue-500" />
              </div>
              <p className="text-sm text-gray-600">GPS Ativo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comandos Remotos */}
      <Card>
        <CardHeader>
          <CardTitle>Comandos Remotos</CardTitle>
          <CardDescription>
            Envie comandos para o seu veículo. Comandos críticos requerem confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(commandLabels).map(([type, label]) => {
              const Icon = commandIcons[type as keyof typeof commandIcons];
              const isCritical = criticalCommands.includes(type);
              
              return (
                <Button
                  key={type}
                  variant={isCritical ? "destructive" : "outline"}
                  className="h-auto p-4 flex flex-col gap-2"
                  onClick={() => createCommand(type)}
                  disabled={!vehicleStatus.online}
                >
                  <Icon size={24} />
                  <span className="text-xs text-center">{label}</span>
                  {isCritical && (
                    <Badge variant="secondary" className="text-xs">
                      Requer Confirmação
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmação de Comando */}
      {pendingCommand && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock size={20} />
              Confirmação Necessária
            </CardTitle>
            <CardDescription>
              O comando "{commandLabels[pendingCommand.type as keyof typeof commandLabels]}" requer confirmação dupla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Token de Confirmação:</strong> {pendingCommand.confirmationToken}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="confirmation">Digite o token de confirmação:</Label>
                <Input
                  id="confirmation"
                  value={confirmationToken}
                  onChange={(e) => setConfirmationToken(e.target.value)}
                  placeholder="Digite o token aqui"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={confirmCommand} className="flex-1">
                  Confirmar Comando
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPendingCommand(null);
                    setConfirmationToken('');
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Comandos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comandos</CardTitle>
          <CardDescription>
            Últimos comandos enviados para o veículo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum comando enviado ainda
            </p>
          ) : (
            <div className="space-y-3">
              {commands.slice(0, 10).map((command) => {
                const Icon = commandIcons[command.type as keyof typeof commandIcons];
                return (
                  <div key={command.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium">
                          {commandLabels[command.type as keyof typeof commandLabels]}
                        </p>
                        <p className="text-sm text-gray-500">
                          {command.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(command.status)}>
                      {command.status === 'pending' && 'Pendente'}
                      {command.status === 'confirmed' && 'Confirmado'}
                      {command.status === 'executed' && 'Executado'}
                      {command.status === 'failed' && 'Falhou'}
                    </Badge>
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