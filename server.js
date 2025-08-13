const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
// Importar RealtimeServer usando require dinâmico para TypeScript
let RealtimeServer;
try {
  RealtimeServer = require('./src/lib/realtime/websocket-server.ts').RealtimeServer;
} catch (error) {
  console.warn('Não foi possível carregar RealtimeServer:', error.message);
  console.log('Continuando sem servidor WebSocket...');
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;
const wsPort = parseInt(process.env.WS_PORT, 10) || 3001;

// Preparar aplicação Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Criar servidor HTTP para Next.js
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Erro ao processar requisição:', err);
      res.statusCode = 500;
      res.end('Erro interno do servidor');
    }
  });

  // Inicializar servidor WebSocket se disponível
  let realtimeServer;
  if (RealtimeServer) {
    try {
      realtimeServer = new RealtimeServer(wsPort);
      console.log(`🚀 Servidor WebSocket iniciado na porta ${wsPort}`);
    } catch (error) {
      console.error('Erro ao inicializar servidor WebSocket:', error.message);
      console.log('Continuando sem servidor WebSocket...');
    }
  } else {
    console.log('⚠️ Servidor WebSocket não disponível');
  }

  // Iniciar servidor HTTP
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Servidor Next.js pronto em http://${hostname}:${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidores...');
    server.close(() => {
      console.log('Servidor HTTP encerrado');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidores...');
    server.close(() => {
      console.log('Servidor HTTP encerrado');
      process.exit(0);
    });
  });
});