import { WebSocket } from 'ws';

interface CommandMessage {
  command_id: string;
  device_id: string;
  type: string;
  metadata?: any;
}

interface DeviceConnection {
  deviceId: string;
  socket: WebSocket;
  lastSeen: Date;
}

class GPSCommandService {
  private deviceConnections = new Map<string, DeviceConnection>();
  private commandQueue = new Map<string, CommandMessage[]>();
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.setupCommandListener();
    this.setupCleanupInterval();
  }

  /**
   * Registrar conexão de dispositivo
   */
  registerDevice(deviceId: string, socket: WebSocket) {
    console.log(`[GPS] Dispositivo ${deviceId} conectado`);
    
    this.deviceConnections.set(deviceId, {
      deviceId,
      socket,
      lastSeen: new Date()
    });

    // Processar comandos pendentes
    this.processQueuedCommands(deviceId);

    // Configurar handlers do socket
    socket.on('close', () => {
      console.log(`[GPS] Dispositivo ${deviceId} desconectado`);
      this.deviceConnections.delete(deviceId);
    });

    socket.on('error', (error) => {
      console.error(`[GPS] Erro no dispositivo ${deviceId}:`, error);
      this.deviceConnections.delete(deviceId);
    });

    // Heartbeat
    socket.on('pong', () => {
      const connection = this.deviceConnections.get(deviceId);
      if (connection) {
        connection.lastSeen = new Date();
      }
    });
  }

  /**
   * Enviar comando para dispositivo
   */
  async sendCommand(commandId: string, deviceId: string, type: string, metadata: any = {}) {
    const command: CommandMessage = {
      command_id: commandId,
      device_id: deviceId,
      type,
      metadata
    };

    const connection = this.deviceConnections.get(deviceId);
    
    if (connection && connection.socket.readyState === WebSocket.OPEN) {
      try {
        // Enviar comando diretamente
        connection.socket.send(JSON.stringify({
          action: 'command',
          data: command
        }));

        console.log(`[GPS] Comando ${type} enviado para dispositivo ${deviceId}`);
        
        // Atualizar status no banco
        await this.updateCommandStatus(commandId, 'sent');
        
        return true;
      } catch (error) {
        console.error(`[GPS] Erro ao enviar comando para ${deviceId}:`, error);
        await this.updateCommandStatus(commandId, 'failed');
        return false;
      }
    } else {
      // Dispositivo offline - adicionar à fila
      console.log(`[GPS] Dispositivo ${deviceId} offline. Comando adicionado à fila.`);
      
      if (!this.commandQueue.has(deviceId)) {
        this.commandQueue.set(deviceId, []);
      }
      
      this.commandQueue.get(deviceId)!.push(command);
      return false;
    }
  }

  /**
   * Processar comandos na fila quando dispositivo reconectar
   */
  private async processQueuedCommands(deviceId: string) {
    const queuedCommands = this.commandQueue.get(deviceId);
    
    if (!queuedCommands || queuedCommands.length === 0) {
      return;
    }

    console.log(`[GPS] Processando ${queuedCommands.length} comandos na fila para ${deviceId}`);

    const connection = this.deviceConnections.get(deviceId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    // Enviar comandos da fila
    for (const command of queuedCommands) {
      try {
        connection.socket.send(JSON.stringify({
          action: 'command',
          data: command
        }));

        await this.updateCommandStatus(command.command_id, 'sent');
        console.log(`[GPS] Comando da fila ${command.type} enviado para ${deviceId}`);
        
        // Pequeno delay entre comandos
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[GPS] Erro ao enviar comando da fila:`, error);
        await this.updateCommandStatus(command.command_id, 'failed');
      }
    }

    // Limpar fila
    this.commandQueue.delete(deviceId);
  }

  /**
   * Atualizar status do comando no banco via API REST
   */
  private async updateCommandStatus(commandId: string, status: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/vehicle-commands/${commandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
        },
        body: JSON.stringify({
          status,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('[GPS] Erro ao atualizar status do comando:', response.statusText);
      }
    } catch (error) {
      console.error('[GPS] Erro ao conectar com API:', error);
    }
  }

  /**
   * Escutar novos comandos confirmados no banco via API REST
   */
  private setupCommandListener() {
    console.log('[GPS] Configurando listener de comandos...');

    // Polling para comandos confirmados
    setInterval(async () => {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/vehicle-commands?status=confirmed&limit=50`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_TOKEN || ''}`,
          }
        });

        if (!response.ok) {
          console.error('[GPS] Erro ao buscar comandos:', response.statusText);
          return;
        }

        const commands = await response.json();

        if (commands && commands.length > 0) {
          console.log(`[GPS] Processando ${commands.length} comandos confirmados`);

          for (const command of commands) {
            const deviceId = command.vehicle?.device_id;
            
            if (deviceId) {
              await this.sendCommand(
                command.id,
                deviceId,
                command.type,
                command.metadata
              );
            }
          }
        }
      } catch (error) {
        console.error('[GPS] Erro no listener de comandos:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
  }

  /**
   * Limpeza periódica de conexões inativas
   */
  private setupCleanupInterval() {
    setInterval(() => {
      const now = new Date();
      const timeout = 5 * 60 * 1000; // 5 minutos

      for (const [deviceId, connection] of this.deviceConnections.entries()) {
        const timeSinceLastSeen = now.getTime() - connection.lastSeen.getTime();
        
        if (timeSinceLastSeen > timeout) {
          console.log(`[GPS] Removendo conexão inativa: ${deviceId}`);
          connection.socket.terminate();
          this.deviceConnections.delete(deviceId);
        }
      }

      // Limpar filas antigas (comandos com mais de 1 hora)
      for (const [deviceId, commands] of this.commandQueue.entries()) {
        const validCommands = commands.filter(cmd => {
          // Assumir que comandos têm timestamp no metadata
          const cmdTime = cmd.metadata?.timestamp || 0;
          return (now.getTime() - cmdTime) < (60 * 60 * 1000);
        });

        if (validCommands.length === 0) {
          this.commandQueue.delete(deviceId);
        } else {
          this.commandQueue.set(deviceId, validCommands);
        }
      }
    }, 60000); // Executar a cada minuto
  }

  /**
   * Verificar se dispositivo está online
   */
  isDeviceOnline(deviceId: string): boolean {
    const connection = this.deviceConnections.get(deviceId);
    return connection ? connection.socket.readyState === WebSocket.OPEN : false;
  }

  /**
   * Obter estatísticas do serviço
   */
  getStats() {
    return {
      connectedDevices: this.deviceConnections.size,
      queuedCommands: Array.from(this.commandQueue.values())
        .reduce((total, queue) => total + queue.length, 0),
      devices: Array.from(this.deviceConnections.keys())
    };
  }

  /**
   * Processar resposta do dispositivo
   */
  async handleDeviceResponse(deviceId: string, response: any) {
    try {
      if (response.command_id && response.status) {
        await this.updateCommandStatus(response.command_id, response.status);
        console.log(`[GPS] Resposta do dispositivo ${deviceId}: ${response.status}`);
      }
    } catch (error) {
      console.error('[GPS] Erro ao processar resposta do dispositivo:', error);
    }
  }
}

// Instância singleton
export const gpsCommandService = new GPSCommandService();

// Função para integrar com servidor GPS existente
export function setupCommandIntegration(server: any) {
  console.log('[GPS] Configurando integração de comandos...');
  
  // Assumindo que o servidor GPS já tem um sistema de WebSocket
  // Esta função deve ser chamada no servidor GPS principal
  
  server.on('deviceConnected', (deviceId: string, socket: WebSocket) => {
    gpsCommandService.registerDevice(deviceId, socket);
  });

  server.on('deviceMessage', (deviceId: string, message: any) => {
    if (message.type === 'command_response') {
      gpsCommandService.handleDeviceResponse(deviceId, message.data);
    }
  });

  // Endpoint para estatísticas
  server.get('/api/gps/stats', (req: any, res: any) => {
    res.json(gpsCommandService.getStats());
  });

  console.log('[GPS] Integração de comandos configurada com sucesso');
}

export default gpsCommandService;