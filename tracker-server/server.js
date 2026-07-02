/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const net = require("net");
const winston = require('winston');
const DatabaseService = require('./src/services/database');
const AlertsService = require('./src/services/alerts');
const { CommandDispatcher } = require('./src/services/commands');
const { decodeTeltonikaCodec8, createTeltonikaResponse } = require("./teltonika-decoder");
const { decodeQueclinkData, createQueclinkResponse } = require("./queclink-decoder");
const { decodeConcoxData, createConcoxResponse } = require("./concox-decoder");

// Configurar o logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'tracker-server.log' })
  ]
});

// Configurações
const TRACKER_TCP_PORT = process.env.TRACKER_TCP_PORT || 5027;
const QUECLINK_TCP_PORT = process.env.QUECLINK_TCP_PORT || 5029;
const CONCOX_TCP_PORT = process.env.CONCOX_TCP_PORT || 5030;

// Inicializar serviços
const db = DatabaseService.getInstance();

// Armazenar conexões
const tcpConnections = new Map(); // socket -> { imei: string | null, protocol: string | null }

// Despachante de comandos remotos (feature flag; ver src/services/commands.js)
const commandDispatcher = new CommandDispatcher(
  { db, tcpConnections, logger },
  {
    pollIntervalMs: parseInt(process.env.COMMANDS_POLL_INTERVAL_MS || '5000', 10),
    timeoutMs: parseInt(process.env.COMMANDS_TIMEOUT_MS || '60000', 10),
  }
);
if (process.env.COMMANDS_DISPATCH_ENABLED === 'true') {
  commandDispatcher.start();
} else {
  logger.info('Despachante de comandos desativado (COMMANDS_DISPATCH_ENABLED != true)');
}

// Função para atualizar o status do veículo no banco
async function updateVehicleStatusInDatabase(imei, record) {
  if (!imei) {
    logger.error("IMEI não conhecido para este registro, não é possível atualizar o banco.");
    return;
  }

  try {
    // 1. Encontrar o veículo pelo IMEI
    const vehicleResult = await db.query(
      'SELECT id, user_id FROM vehicles WHERE device_imei = $1 LIMIT 1',
      [imei]
    );

    if (vehicleResult.rows.length === 0) {
      logger.warn(`Veículo com IMEI ${imei} não encontrado no banco de dados.`);
      return;
    }

    const vehicle = vehicleResult.rows[0];

    // 2. Preparar os dados de status
    const statusData = {
      vehicle_id: vehicle.id,
      last_update: record.timestamp,
      lat: record.latitude,
      lng: record.longitude,
      speed: record.speed,
      direction: record.angle,
      ignition: record.ioEvents.ignition_status !== undefined ? Boolean(record.ioEvents.ignition_status) : null,
      battery: record.ioEvents.battery_voltage !== undefined ? record.ioEvents.battery_voltage / 1000 : null,
      satellites: record.satellites,
      is_moving: record.ioEvents.movement_status !== undefined ? Boolean(record.ioEvents.movement_status) : (record.speed > 0),
      status: "online"
    };

    // 3. Atualizar ou inserir o status do veículo (upsert)
    const upsertQuery = `
      INSERT INTO vehicle_status (
        vehicle_id, last_update, lat, lng, speed, direction, ignition, 
        battery, satellites, is_moving, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (vehicle_id) DO UPDATE SET
        last_update = EXCLUDED.last_update,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        speed = EXCLUDED.speed,
        direction = EXCLUDED.direction,
        ignition = EXCLUDED.ignition,
        battery = EXCLUDED.battery,
        satellites = EXCLUDED.satellites,
        is_moving = EXCLUDED.is_moving,
        status = EXCLUDED.status
      RETURNING vehicle_id
    `;

    const upsertValues = [
      statusData.vehicle_id, statusData.last_update, statusData.lat, statusData.lng,
      statusData.speed, statusData.direction, statusData.ignition, statusData.battery,
      statusData.satellites, statusData.is_moving, statusData.status
    ];

    await db.query(upsertQuery, upsertValues);
    logger.info(`Status atualizado para veículo ${vehicle.id} (IMEI: ${imei})`);

    // Verificar alertas
    await AlertsService.checkAll(vehicle.id, statusData);

  } catch (error) {
    logger.error(`Erro ao processar registro para IMEI ${imei}: ${error.message}`);
  }
}

// Função para processar dados
async function processData(data, connectionInfo, sendResponse) {
  let decodedData = null;

  // Decodificação baseada no protocolo
  if (connectionInfo.protocol === 'teltonika' || !connectionInfo.protocol) {
    decodedData = decodeTeltonikaCodec8(data);
    if (decodedData && !connectionInfo.protocol) connectionInfo.protocol = 'teltonika';
  }

  if (!decodedData && (connectionInfo.protocol === 'queclink' || !connectionInfo.protocol)) {
    decodedData = decodeQueclinkData(data);
    if (decodedData && !connectionInfo.protocol) connectionInfo.protocol = 'queclink';
  }

  if (!decodedData && (connectionInfo.protocol === 'concox' || !connectionInfo.protocol)) {
    decodedData = decodeConcoxData(data);
    if (decodedData && !connectionInfo.protocol) connectionInfo.protocol = 'concox';
  }

  if (!decodedData) {
    logger.error("Falha ao decodificar dados com qualquer protocolo suportado");
    return;
  }

  // Processamento de pacotes
  if (decodedData.type === "imei") {
    logger.info(`IMEI ${decodedData.imei} recebido (${connectionInfo.protocol})`);
    connectionInfo.imei = decodedData.imei;

    if (sendResponse) {
      let response;
      switch (connectionInfo.protocol) {
        case 'teltonika': response = Buffer.from([0x01]); break;
        case 'queclink': response = createQueclinkResponse('imei', decodedData.imei); break;
        case 'concox': response = createConcoxResponse(0x01); break;
        default: response = Buffer.from([0x01]);
      }
      sendResponse(response);
    }
  }
  else if (decodedData.type === "avl_data") {
    const imei = connectionInfo?.imei;
    if (!imei) return;

    logger.info(`Recebido ${decodedData.recordCount} registros de ${imei}`);

    for (const record of decodedData.records) {
      await updateVehicleStatusInDatabase(imei, record);
    }

    if (sendResponse) {
      let response;
      switch (connectionInfo.protocol) {
        case 'teltonika': response = createTeltonikaResponse(decodedData.recordCount); break;
        case 'queclink': response = createQueclinkResponse('avl_data', imei); break;
        case 'concox': response = createConcoxResponse(decodedData.protocolId || 0x10); break;
        default: response = Buffer.from([0x01]);
      }
      sendResponse(response);
    }
  }
  else if (decodedData.type === "command_response") {
    const imei = connectionInfo?.imei;
    logger.info(`Resposta de comando recebida de ${imei || 'IMEI desconhecido'}`);
    if (imei) {
      await commandDispatcher.handleDeviceResponse(imei, decodedData);
    }
  }
  // ... outros tipos de pacotes (heartbeat) podem ser adicionados aqui
}

// Função auxiliar para criar servidores TCP
function createTcpServer(name, protocol, port) {
  const server = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`Cliente TCP (${name}) conectado: ${clientAddress}`);
    tcpConnections.set(socket, { imei: null, protocol });

    socket.on("data", async (data) => {
      const connectionInfo = tcpConnections.get(socket);
      await processData(data, connectionInfo, (response) => socket.write(response));
    });

    socket.on("close", () => {
      logger.info(`Cliente TCP (${name}) desconectado: ${clientAddress}`);
      tcpConnections.delete(socket);
    });

    socket.on("error", (err) => {
      logger.error(`Erro na conexão TCP (${name}): ${err.message}`);
      tcpConnections.delete(socket);
    });
  });

  server.listen(port, () => {
    logger.info(`Servidor de Rastreamento (${name}) rodando na porta ${port}`);
  });

  return server;
}

// Iniciar servidores
createTcpServer('Teltonika', 'teltonika', TRACKER_TCP_PORT);
createTcpServer('Queclink', 'queclink', QUECLINK_TCP_PORT);
createTcpServer('Concox', 'concox', CONCOX_TCP_PORT);

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error(`Erro não tratado: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});
