import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';
import { AuthService } from '../auth/auth-service';
import { redis } from '../database';
import Redis from 'ioredis';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  table?: string;
  filter?: any;
  id?: string;
}

interface DatabaseChange {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  userId?: string;
  timestamp: string;
}

export class RealtimeServer {
  private wss: WebSocketServer;
  private subscriber: Redis;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.subscriber = new Redis(process.env.REDIS_URL!);
    this.setupWebSocketServer();
    this.setupRedisSubscriptions();
    this.setupHeartbeat();
    
    console.log(`WebSocket server iniciado na porta ${port}`);
  }

  private setupWebSocketServer() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      try {
        // Autenticar conexão
        const token = this.extractTokenFromRequest(req);
        const user = await AuthService.verifyToken(token);
        
        ws.userId = user.id;
        ws.subscriptions = new Set();
        ws.isAlive = true;
        
        // Adicionar cliente à lista
        if (!this.clients.has(user.id)) {
          this.clients.set(user.id, new Set());
        }
        this.clients.get(user.id)!.add(ws);

        console.log(`Cliente conectado: ${user.email} (${user.id})`);

        // Configurar handlers
        ws.on('message', (data) => this.handleMessage(ws, data));
        ws.on('close', () => this.handleDisconnection(ws));
        ws.on('pong', () => {
          ws.isAlive = true;
        });
        
        // Confirmar conexão
        this.sendMessage(ws, {
          type: 'connected',
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
        
      } catch (error) {
        console.error('Erro na autenticação WebSocket:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    this.wss.on('error', (error) => {
      console.error('Erro no servidor WebSocket:', error);
    });
  }

  private setupRedisSubscriptions() {
    // Subscriber para mudanças no banco
    this.subscriber.subscribe('db_changes', (err, count) => {
      if (err) {
        console.error('Erro ao se inscrever no Redis:', err);
      } else {
        console.log(`Inscrito em ${count} canais Redis`);
      }
    });
    
    this.subscriber.on('message', (channel, message) => {
      if (channel === 'db_changes') {
        try {
          const change: DatabaseChange = JSON.parse(message);
          this.broadcastChange(change);
        } catch (error) {
          console.error('Erro ao processar mudança do banco:', error);
        }
      }
    });

    this.subscriber.on('error', (error) => {
      console.error('Erro no Redis subscriber:', error);
    });
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          console.log('Terminando conexão inativa');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: RawData) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message.table!, message.filter);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, message.table!);
          break;
        case 'ping':
          this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
        default:
          console.warn('Tipo de mensagem desconhecido:', message.type);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      this.sendMessage(ws, {
        type: 'error',
        message: 'Formato de mensagem inválido',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private handleSubscription(ws: AuthenticatedWebSocket, table: string, filter?: any) {
    const subscriptionKey = `${table}:${JSON.stringify(filter || {})}`;
    ws.subscriptions!.add(subscriptionKey);
    
    console.log(`Cliente ${ws.userId} se inscreveu em ${subscriptionKey}`);
    
    this.sendMessage(ws, {
      type: 'subscription_success',
      table,
      filter,
      timestamp: new Date().toISOString(),
    });
  }

  private handleUnsubscription(ws: AuthenticatedWebSocket, table: string) {
    // Remover todas as inscrições da tabela
    const subscriptionsToRemove = Array.from(ws.subscriptions!).filter(sub => 
      sub.startsWith(`${table}:`)
    );
    
    subscriptionsToRemove.forEach(sub => ws.subscriptions!.delete(sub));
    
    console.log(`Cliente ${ws.userId} cancelou inscrição em ${table}`);
    
    this.sendMessage(ws, {
      type: 'unsubscription_success',
      table,
      timestamp: new Date().toISOString(),
    });
  }

  private broadcastChange(change: DatabaseChange) {
    const { table, operation, data, userId } = change;
    
    // Enviar para clientes específicos baseado no userId
    if (userId && this.clients.has(userId)) {
      const userClients = this.clients.get(userId)!;
      
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          // Verificar se o cliente está inscrito nesta tabela
          const isSubscribed = Array.from(client.subscriptions!).some(sub => 
            sub.startsWith(`${table}:`)
          );
          
          if (isSubscribed) {
            this.sendMessage(client, {
              type: 'db_change',
              table,
              operation,
              data,
              timestamp: change.timestamp,
            });
          }
        }
      });
    } else {
      // Broadcast para todos os clientes inscritos na tabela
      this.wss.clients.forEach((client: AuthenticatedWebSocket) => {
        if (client.readyState === WebSocket.OPEN && client.subscriptions) {
          const isSubscribed = Array.from(client.subscriptions).some(sub => 
            sub.startsWith(`${table}:`)
          );
          
          if (isSubscribed) {
            this.sendMessage(client, {
              type: 'db_change',
              table,
              operation,
              data,
              timestamp: change.timestamp,
            });
          }
        }
      });
    }
  }

  private sendMessage(ws: AuthenticatedWebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private extractTokenFromRequest(req: IncomingMessage): string {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw new Error('Token não fornecido');
    }
    
    return token;
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.userId) {
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(ws.userId);
        }
      }
      console.log(`Cliente desconectado: ${ws.userId}`);
    }
  }

  public getStats() {
    return {
      totalClients: this.wss.clients.size,
      connectedUsers: this.clients.size,
      subscriptions: Array.from(this.wss.clients).reduce((total, client: AuthenticatedWebSocket) => {
        return total + (client.subscriptions?.size || 0);
      }, 0),
    };
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.subscriber.quit();
    this.wss.close();
    console.log('Servidor WebSocket fechado');
  }
}