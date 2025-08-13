require('dotenv').config();
const { WebSocketServer } = require('ws');
const http = require('http');

// Configurações
const WS_PORT = parseInt(process.env.WS_PORT, 10) || 3001;

// Criar servidor HTTP simples para WebSocket
const server = http.createServer();

// Criar servidor WebSocket
const wss = new WebSocketServer({ 
  server,
  path: '/'
});

// Configurar WebSocket
wss.on('connection', (ws, req) => {
  console.log('Nova conexão WebSocket estabelecida');
  
  // Enviar mensagem de boas-vindas
  ws.send(JSON.stringify({
    type: 'connection_established',
    timestamp: new Date().toISOString()
  }));
  
  // Configurar heartbeat
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
  
  // Lidar com mensagens
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Mensagem recebida:', message);
      
      // Echo da mensagem para teste
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  });
  
  // Lidar com desconexão
  ws.on('close', () => {
    console.log('Conexão WebSocket fechada');
  });
  
  ws.on('error', (error) => {
    console.error('Erro WebSocket:', error);
  });
});

// Configurar heartbeat interval
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminando conexão inativa');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Iniciar servidor
server.listen(WS_PORT, () => {
  console.log(`🚀 Servidor WebSocket rodando na porta ${WS_PORT}`);
  console.log(`📡 WebSocket URL: ws://localhost:${WS_PORT}`);
});

// Lidar com encerramento graceful
process.on('SIGTERM', () => {
  console.log('Encerrando servidor WebSocket...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('Servidor WebSocket encerrado');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Encerrando servidor WebSocket...');
  clearInterval(heartbeatInterval);
  wss.close(() => {
    server.close(() => {
      console.log('Servidor WebSocket encerrado');
      process.exit(0);
    });
  });
});