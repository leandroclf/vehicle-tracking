const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
// WebSocket será inicializado separadamente via Docker
console.log('ℹ️ WebSocket será gerenciado via Docker na porta 3001');

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

  // WebSocket será gerenciado via Docker
  console.log(`ℹ️ WebSocket configurado para porta ${wsPort} (gerenciado via Docker)`);

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