require("dotenv").config();
const net = require("net");
const dgram = require("dgram"); // Adicionar suporte a UDP
const { Pool } = require('pg');
const winston = require('winston');
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
const TCP_PORT = process.env.TRACKER_TCP_PORT || 5027; // Porta padrão para Teltonika
const UDP_PORT = process.env.TRACKER_UDP_PORT || 5028; // Porta UDP para dispositivos que usam UDP
const QUECLINK_TCP_PORT = process.env.QUECLINK_TCP_PORT || 5029; // Porta TCP para Queclink
const CONCOX_TCP_PORT = process.env.CONCOX_TCP_PORT || 5030; // Porta TCP para Concox
const DATABASE_URL = process.env.DATABASE_URL;
const RECONNECT_INTERVAL = 5000; // Intervalo de reconexão ao banco em ms

// Validar configurações essenciais
if (!DATABASE_URL) {
  logger.error("Erro: Variável de ambiente DATABASE_URL não configurada.");
  process.exit(1);
}

// Inicializar cliente PostgreSQL
let pool = new Pool({ connectionString: DATABASE_URL });
let isDatabaseConnected = true; // Flag para controlar estado da conexão com o banco

// Função para reconectar ao banco em caso de erros
function reconnectDatabase() {
  logger.info("Tentando reconexão com o banco de dados...");
  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    isDatabaseConnected = true;
    logger.info("Reconectado ao banco de dados com sucesso.");
  } catch (error) {
    logger.error(`Falha ao reconectar com o banco: ${error.message}`);
    isDatabaseConnected = false;
    setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
  }
}

// Armazenar IMEI por conexão TCP
const tcpConnections = new Map(); // socket -> { imei: string | null, protocol: string | null }

// Armazenar IMEI para clientes UDP (usando endereço como chave)
const udpClients = new Map(); // "ip:port" -> { imei: string | null, lastSeen: Date, protocol: string | null }

// Função para limpar clientes UDP inativos
function cleanupIdleUdpClients() {
  const now = new Date();
  const timeout = 30 * 60 * 1000; // 30 minutos em milissegundos
  let removedCount = 0;
  
  for (const [address, client] of udpClients.entries()) {
    if (now - client.lastSeen > timeout) {
      logger.debug(`Removendo cliente UDP inativo: ${address}`);
      udpClients.delete(address);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    logger.info(`Limpeza de clientes UDP inativos: ${removedCount} clientes removidos`);
  }
}

// Configurar limpeza periódica de clientes UDP inativos
setInterval(cleanupIdleUdpClients, 10 * 60 * 1000); // A cada 10 minutos

// Função para verificar alertas de velocidade
async function checkSpeedAlert(vehicle, speed, status, location) {
  if (!isDatabaseConnected) {
    logger.warn("Banco desconectado. Não foi possível verificar alertas de velocidade.");
    return;
  }

  try {
    // Buscar configurações de alerta de velocidade para o veículo
    const settingsQuery = `
      SELECT id, max_speed, active
      FROM speed_alerts
      WHERE vehicle_id = $1 AND active = true
      LIMIT 1
    `;
    const settingsResult = await pool.query(settingsQuery, [vehicle.id]);

    if (settingsResult.rows.length > 0) {
      const speedSettings = settingsResult.rows[0];
      
      if (speed > speedSettings.max_speed) {
        // Criar alerta de velocidade
        const alertQuery = `
          INSERT INTO alerts (user_id, vehicle_id, type, message, details, status, created_at, severity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        const alertValues = [
          vehicle.user_id,
          vehicle.id,
          "speed",
          `Velocidade excedida: ${speed} km/h (limite: ${speedSettings.max_speed} km/h)`,
          JSON.stringify({
            speed,
            max_speed: speedSettings.max_speed,
            location
          }),
          "unread",
          new Date(),
          "medium"
        ];

        const alertResult = await pool.query(alertQuery, alertValues);
        
        if (alertResult.rowCount > 0) {
          logger.info(`Alerta de velocidade criado para veículo ${vehicle.id}: ${speed} km/h`);
        }
      }
    }
  } catch (error) {
    logger.error("Erro na verificação de alerta de velocidade:", error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isDatabaseConnected = false;
      setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
    }
  }
}

// Função para verificar alertas de geocerca
async function checkGeofenceAlert(vehicle, lat, lng, status) {
  if (!isDatabaseConnected) {
    logger.warn("Banco desconectado. Não foi possível verificar alertas de geocerca.");
    return;
  }

  try {
    // Buscar geocercas ativas para o veículo ou usuário
    const geofenceQuery = `
      SELECT *
      FROM geofences
      WHERE active = true AND (vehicle_id = $1 OR user_id = $2)
    `;
    const geofenceResult = await pool.query(geofenceQuery, [vehicle.id, vehicle.user_id]);

    if (geofenceResult.rows.length === 0) {
      return; // Nenhuma geocerca configurada
    }

    // Status atual do veículo na geocerca
    const statesQuery = `
      SELECT *
      FROM vehicle_geofence_state
      WHERE vehicle_id = $1
    `;
    const statesResult = await pool.query(statesQuery, [vehicle.id]);

    // Mapa de estados atuais por geocerca
    const currentStateMap = new Map();
    if (statesResult.rows.length > 0) {
      statesResult.rows.forEach(state => {
        currentStateMap.set(state.geofence_id, state.inside);
      });
    }

    // Verificar cada geocerca
    for (const geofence of geofenceResult.rows) {
      // Verificar se coordenadas estão dentro da geocerca
      // Aqui implementamos uma lógica simples para exemplo - polígonos precisariam de algo mais complexo
      let inside = false;
      
      if (geofence.type === 'circle') {
        // Distância entre dois pontos usando fórmula de Haversine
        const R = 6371e3; // raio da Terra em metros
        const φ1 = lat * Math.PI / 180;
        const φ2 = geofence.center_lat * Math.PI / 180;
        const Δφ = (geofence.center_lat - lat) * Math.PI / 180;
        const Δλ = (geofence.center_lng - lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        inside = distance <= geofence.radius;
      }
      // Outros tipos (polígono, etc.) precisariam de implementações específicas
      
      // Verificar se o estado mudou
      const wasInside = currentStateMap.has(geofence.id) ? currentStateMap.get(geofence.id) : null;
      
      if (wasInside !== null && wasInside !== inside) {
        // Estado mudou, gerar alerta
        const alertQuery = `
          INSERT INTO alerts (user_id, vehicle_id, geofence_id, type, message, details, status, created_at, severity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        const alertValues = [
          vehicle.user_id,
          vehicle.id,
          geofence.id,
          "geofence",
          inside 
            ? `Veículo entrou na geocerca "${geofence.name}"` 
            : `Veículo saiu da geocerca "${geofence.name}"`,
          JSON.stringify({
            geofence_name: geofence.name,
            geofence_id: geofence.id,
            action: inside ? "entered" : "exited",
            location: { lat, lng }
          }),
          "unread",
          new Date(),
          geofence.alert_severity || "medium"
        ];

        const alertResult = await pool.query(alertQuery, alertValues);

        if (alertResult.rowCount > 0) {
          logger.info(`Alerta de geocerca criado para veículo ${vehicle.id}: ${inside ? 'entrada' : 'saída'} em ${geofence.name}`);
        }
      }
      
      // Atualizar o estado
      const upsertQuery = `
        INSERT INTO vehicle_geofence_state (vehicle_id, geofence_id, inside, updated_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (vehicle_id, geofence_id) DO UPDATE SET
          inside = EXCLUDED.inside,
          updated_at = EXCLUDED.updated_at
      `;
      
      await pool.query(upsertQuery, [vehicle.id, geofence.id, inside, new Date()]);
    }
  } catch (error) {
    logger.error("Erro na verificação de alertas de geocerca:", error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isDatabaseConnected = false;
      setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
    }
  }
}

// Função para verificar alertas de parada prolongada
async function checkIdleAlert(vehicle, status, isMoving) {
  if (!isDatabaseConnected) {
    logger.warn("Banco desconectado. Não foi possível verificar alertas de parada.");
    return;
  }

  try {
    // Se o veículo está em movimento, resetar o contador de parada
    if (isMoving) {
      // Verificar se havia um alerta de parada pendente
      const stateQuery = `
        SELECT *
        FROM vehicle_idle_state
        WHERE vehicle_id = $1
        LIMIT 1
      `;
      const stateResult = await pool.query(stateQuery, [vehicle.id]);
      
      if (stateResult.rows.length > 0 && stateResult.rows[0].idle_start_time) {
        // O veículo voltou a se mover após uma parada - resetar estado
        const updateQuery = `
          UPDATE vehicle_idle_state
          SET idle_start_time = NULL, is_idle = false, updated_at = $1
          WHERE vehicle_id = $2
        `;
        
        await pool.query(updateQuery, [new Date(), vehicle.id]);
      }
      return;
    }
    
    // Veículo está parado, verificar configurações de alerta de parada
    const settingsQuery = `
      SELECT *
      FROM idle_alerts
      WHERE vehicle_id = $1 AND active = true
      LIMIT 1
    `;
    const settingsResult = await pool.query(settingsQuery, [vehicle.id]);
    
    if (settingsResult.rows.length === 0) {
      return; // Sem configurações de alerta de parada para este veículo
    }
    
    const idleSettings = settingsResult.rows[0];
    
    // Verificar o estado atual de parada do veículo
    const stateQuery = `
      SELECT *
      FROM vehicle_idle_state
      WHERE vehicle_id = $1
      LIMIT 1
    `;
    const stateResult = await pool.query(stateQuery, [vehicle.id]);
    
    const now = new Date();
    
    if (stateResult.rows.length === 0) {
      // Primeiro registro de parada para este veículo
      const insertQuery = `
        INSERT INTO vehicle_idle_state (vehicle_id, idle_start_time, is_idle, updated_at)
        VALUES ($1, $2, $3, $4)
      `;
      
      await pool.query(insertQuery, [vehicle.id, now, true, now]);
      return;
    }
    
    const idleState = stateResult.rows[0];
    
    // Se o veículo já está em estado de parada, verificar se excedeu o tempo máximo
    if (idleState && idleState.idle_start_time && !idleState.alert_triggered) {
      const idleStartTime = new Date(idleState.idle_start_time);
      const idleDurationMinutes = (now.getTime() - idleStartTime.getTime()) / (1000 * 60);
      
      if (idleDurationMinutes >= idleSettings.max_idle_minutes) {
        // Criar alerta de parada prolongada
        const alertQuery = `
          INSERT INTO alerts (user_id, vehicle_id, type, message, details, status, created_at, severity)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `;
        const alertValues = [
          vehicle.user_id,
          vehicle.id,
          "idle",
          `Veículo parado por ${Math.round(idleDurationMinutes)} minutos`,
          JSON.stringify({
            idle_minutes: Math.round(idleDurationMinutes),
            max_idle_minutes: idleSettings.max_idle_minutes,
            idle_start_time: idleState.idle_start_time,
            location: { lat: status.lat, lng: status.lng }
          }),
          "unread",
          now,
          idleSettings.severity || "low"
        ];
        
        const alertResult = await pool.query(alertQuery, alertValues);
        
        if (alertResult.rowCount > 0) {
          logger.info(`Alerta de parada criado para veículo ${vehicle.id}: ${Math.round(idleDurationMinutes)} minutos`);
          
          // Marcar que o alerta foi disparado para esta parada
          const updateQuery = `
            UPDATE vehicle_idle_state
            SET alert_triggered = true, updated_at = $1
            WHERE vehicle_id = $2
          `;
          
          await pool.query(updateQuery, [now, vehicle.id]);
        }
      }
    }
  } catch (error) {
    logger.error("Erro na verificação de alerta de parada:", error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isDatabaseConnected = false;
      setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
    }
  }
}

// Função para verificar todos os tipos de alertas
async function checkAllAlerts(vehicleId, status) {
  if (!isDatabaseConnected) {
    logger.warn("Banco desconectado. Não foi possível verificar alertas.");
    return;
  }

  try {
    // Buscar dados do veículo
    const vehicleQuery = `
      SELECT id, user_id, name, license_plate
      FROM vehicles
      WHERE id = $1
      LIMIT 1
    `;
    const vehicleResult = await pool.query(vehicleQuery, [vehicleId]);
    
    if (vehicleResult.rows.length === 0) {
      logger.error(`Veículo com ID ${vehicleId} não encontrado para verificação de alertas`);
      return;
    }
    
    const vehicle = vehicleResult.rows[0];
    
    // Verificar alertas de velocidade
    await checkSpeedAlert(
      vehicle, 
      status.speed, 
      status,
      { lat: status.lat, lng: status.lng }
    );
    
    // Verificar alertas de geocerca
    await checkGeofenceAlert(
      vehicle, 
      status.lat, 
      status.lng, 
      status
    );
    
    // Verificar alertas de parada prolongada
    await checkIdleAlert(
      vehicle, 
      status, 
      status.is_moving
    );
    
    // Outros tipos de alertas podem ser implementados conforme necessário
    
  } catch (error) {
    logger.error(`Erro na verificação de alertas para veículo ${vehicleId}:`, error);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isDatabaseConnected = false;
      setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
    }
  }
}

// Função para atualizar o status do veículo no banco
async function updateVehicleStatusInDatabase(imei, record) {
  if (!imei) {
    logger.error("IMEI não conhecido para este registro, não é possível atualizar o banco.");
    return;
  }

  if (!isDatabaseConnected) {
    logger.error("Banco desconectado. Não é possível atualizar os dados.");
    return;
  }

  try {
    // 1. Encontrar o veículo pelo IMEI
    const vehicleQuery = `
      SELECT id, user_id
      FROM vehicles
      WHERE device_imei = $1
      LIMIT 1
    `;
    const vehicleResult = await pool.query(vehicleQuery, [imei]);

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
      battery: record.ioEvents.battery_voltage !== undefined ? record.ioEvents.battery_voltage / 1000 : null, // Exemplo: converter mV para V
      satellites: record.satellites,
      is_moving: record.ioEvents.movement_status !== undefined ? Boolean(record.ioEvents.movement_status) : (record.speed > 0),
      status: "online", // Assumir online se recebemos dados
      // Adicionar outros campos relevantes do ioEvents se necessário
      // address: será preenchido por um trigger ou função no banco (geocodificação reversa)
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
      statusData.vehicle_id,
      statusData.last_update,
      statusData.lat,
      statusData.lng,
      statusData.speed,
      statusData.direction,
      statusData.ignition,
      statusData.battery,
      statusData.satellites,
      statusData.is_moving,
      statusData.status
    ];

    const upsertResult = await pool.query(upsertQuery, upsertValues);

    if (upsertResult.rowCount > 0) {
      logger.info(`Status atualizado para veículo ${vehicle.id} (IMEI: ${imei})`);
    }

    // Verificar alertas para o veículo
    await checkAllAlerts(vehicle.id, statusData);

  } catch (error) {
    logger.error(`Erro inesperado ao processar registro para IMEI ${imei}: ${error.message}`);
    
    // Verificar se é um erro de conexão e tentar reconectar
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      isDatabaseConnected = false;
      setTimeout(reconnectDatabase, RECONNECT_INTERVAL);
    }
  }
}

// Função para processar dados de qualquer fonte (TCP ou UDP)
async function processData(data, connectionInfo, sendResponse) {
  // Tentar decodificar o pacote com os diferentes decodificadores
  let decodedData = null;
  
  // Se já conhecemos o protocolo do dispositivo, use o decodificador apropriado
  if (connectionInfo.protocol) {
    switch (connectionInfo.protocol) {
      case 'teltonika':
        decodedData = decodeTeltonikaCodec8(data);
        break;
      case 'queclink':
        decodedData = decodeQueclinkData(data);
        break;
      case 'concox':
        decodedData = decodeConcoxData(data);
        break;
    }
  } else {
    // Se não conhecemos o protocolo, tentamos detectar automaticamente
    
    // 1. Tentar Teltonika primeiro
    decodedData = decodeTeltonikaCodec8(data);
    if (decodedData) {
      connectionInfo.protocol = 'teltonika';
      logger.info(`Protocolo detectado: Teltonika para ${connectionInfo.imei || 'dispositivo desconhecido'}`);
    }
    
    // 2. Se falhar, tentar Queclink
    if (!decodedData) {
      decodedData = decodeQueclinkData(data);
      if (decodedData) {
        connectionInfo.protocol = 'queclink';
        logger.info(`Protocolo detectado: Queclink para ${connectionInfo.imei || 'dispositivo desconhecido'}`);
      }
    }
    
    // 3. Se ainda falhar, tentar Concox
    if (!decodedData) {
      decodedData = decodeConcoxData(data);
      if (decodedData) {
        connectionInfo.protocol = 'concox';
        logger.info(`Protocolo detectado: Concox para ${connectionInfo.imei || 'dispositivo desconhecido'}`);
      }
    }
  }

  if (!decodedData) {
    logger.error("Falha ao decodificar dados com qualquer protocolo suportado");
    return;
  }

  // Processar pacote IMEI (login)
  if (decodedData.type === "imei") {
    // Recebeu pacote IMEI
    logger.info(`IMEI ${decodedData.imei} recebido (protocolo: ${connectionInfo.protocol})`);
    connectionInfo.imei = decodedData.imei;
    
    // Enviar confirmação de aceitação baseada no protocolo
    if (sendResponse) {
      let response;
      
      switch (connectionInfo.protocol) {
        case 'teltonika':
          response = Buffer.from([0x01]);
          break;
        case 'queclink':
          response = createQueclinkResponse('imei', decodedData.imei);
          break;
        case 'concox':
          response = createConcoxResponse(0x01); // Protocolo de login Concox
          break;
        default:
          response = Buffer.from([0x01]); // Resposta genérica
      }
      
      sendResponse(response);
      logger.debug(`Confirmação de IMEI enviada para ${decodedData.imei}`);
    }
  } 
  // Processar pacotes de heartbeat/status
  else if (decodedData.type === "heartbeat" || decodedData.type === "status") {
    const imei = connectionInfo?.imei;
    if (!imei) {
      logger.error("Recebido pacote heartbeat/status antes do IMEI. Ignorando.");
      return;
    }
    
    logger.info(`Heartbeat/status recebido de ${imei} (protocolo: ${connectionInfo.protocol})`);
    
    // Enviar confirmação baseada no protocolo
    if (sendResponse) {
      let response;
      
      switch (connectionInfo.protocol) {
        case 'queclink':
          response = createQueclinkResponse('heartbeat', imei);
          break;
        case 'concox':
          response = createConcoxResponse(0x13); // Protocolo de heartbeat Concox
          break;
        default:
          // Teltonika não tem heartbeat específico, ignorar
          return;
      }
      
      sendResponse(response);
      logger.debug(`Confirmação de heartbeat enviada para ${imei}`);
    }
  } 
  // Processar pacotes de dados AVL
  else if (decodedData.type === "avl_data") {
    // Recebeu pacote de dados AVL
    const imei = connectionInfo?.imei;
    if (!imei) {
      logger.error("Recebido pacote AVL antes do IMEI. Ignorando.");
      return;
    }

    logger.info(`Recebido ${decodedData.recordCount} registro(s) AVL de ${imei} (protocolo: ${connectionInfo.protocol})`);
    logger.debug(`Detalhes dos registros: ${JSON.stringify(decodedData.records.map(r => ({
      timestamp: r.timestamp,
      lat: r.latitude,
      lng: r.longitude,
      speed: r.speed
    })))}`);

    // Processar cada registro AVL
    for (const record of decodedData.records) {
      await updateVehicleStatusInDatabase(imei, record);
    }

    // Enviar confirmação com o número de registros recebidos baseada no protocolo
    if (sendResponse) {
      let response;
      
      switch (connectionInfo.protocol) {
        case 'teltonika':
          response = createTeltonikaResponse(decodedData.recordCount);
          break;
        case 'queclink':
          response = createQueclinkResponse('avl_data', imei);
          break;
        case 'concox':
          // Determinar o tipo de pacote GPS Concox (0x10, 0x11, 0x12)
          // e criar resposta apropriada
          let protocolId = 0x10; // Padrão
          if (decodedData.protocolId) {
            protocolId = decodedData.protocolId;
          }
          response = createConcoxResponse(protocolId);
          break;
        default:
          response = Buffer.from([0x01]); // Resposta genérica
      }
      
      sendResponse(response);
      logger.debug(`Confirmação AVL enviada para ${imei}`);
    }
  }
  // Processar outros tipos de pacotes (comando, alarme, etc.)
  else if (decodedData.type === "command_response") {
    const imei = connectionInfo?.imei;
    if (!imei) {
      logger.error("Recebido pacote de comando antes do IMEI. Ignorando.");
      return;
    }
    
    logger.info(`Resposta de comando recebida de ${imei} (protocolo: ${connectionInfo.protocol})`);
    
    // Enviar confirmação baseada no protocolo
    if (sendResponse) {
      let response;
      
      switch (connectionInfo.protocol) {
        case 'queclink':
          response = createQueclinkResponse('command_response', imei);
          break;
        case 'concox':
          response = createConcoxResponse(0x15); // Protocolo de comando Concox
          break;
        default:
          // Teltonika não tem comando específico, ignorar
          return;
      }
      
      sendResponse(response);
      logger.debug(`Confirmação de comando enviada para ${imei}`);
    }
  }
}

// Criar servidor TCP (Teltonika)
const teltonikaServer = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  logger.info(`Cliente TCP (Teltonika) conectado: ${clientAddress}`);
  tcpConnections.set(socket, { imei: null, protocol: 'teltonika' });

  // Handler para recebimento de dados
  socket.on("data", async (data) => {
    logger.debug(`Dados TCP recebidos de ${clientAddress}: ${data.toString("hex").substring(0, 50)}...`);

    const connectionInfo = tcpConnections.get(socket);
    await processData(data, connectionInfo, (response) => {
      socket.write(response);
    });
  });

  // Handler para fechamento da conexão
  socket.on("close", () => {
    logger.info(`Cliente TCP (Teltonika) desconectado: ${clientAddress}`);
    tcpConnections.delete(socket);
  });

  // Handler para erros na conexão
  socket.on("error", (err) => {
    logger.error(`Erro na conexão TCP (Teltonika) com ${clientAddress}: ${err.message}`);
    tcpConnections.delete(socket); // Remover conexão em caso de erro
  });
});

// Criar servidor TCP para Queclink
const queclinkServer = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  logger.info(`Cliente TCP (Queclink) conectado: ${clientAddress}`);
  tcpConnections.set(socket, { imei: null, protocol: 'queclink' });

  // Handler para recebimento de dados
  socket.on("data", async (data) => {
    logger.debug(`Dados TCP (Queclink) recebidos de ${clientAddress}: ${data.toString("hex").substring(0, 50)}...`);

    const connectionInfo = tcpConnections.get(socket);
    await processData(data, connectionInfo, (response) => {
      socket.write(response);
    });
  });

  // Handler para fechamento da conexão
  socket.on("close", () => {
    logger.info(`Cliente TCP (Queclink) desconectado: ${clientAddress}`);
    tcpConnections.delete(socket);
  });

  // Handler para erros na conexão
  socket.on("error", (err) => {
    logger.error(`Erro na conexão TCP (Queclink) com ${clientAddress}: ${err.message}`);
    tcpConnections.delete(socket); // Remover conexão em caso de erro
  });
});

// Criar servidor TCP para Concox
const concoxServer = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  logger.info(`Cliente TCP (Concox) conectado: ${clientAddress}`);
  tcpConnections.set(socket, { imei: null, protocol: 'concox' });

  // Handler para recebimento de dados
  socket.on("data", async (data) => {
    logger.debug(`Dados TCP (Concox) recebidos de ${clientAddress}: ${data.toString("hex").substring(0, 50)}...`);

    const connectionInfo = tcpConnections.get(socket);
    await processData(data, connectionInfo, (response) => {
      socket.write(response);
    });
  });

  // Handler para fechamento da conexão
  socket.on("close", () => {
    logger.info(`Cliente TCP (Concox) desconectado: ${clientAddress}`);
    tcpConnections.delete(socket);
  });

  // Handler para erros na conexão
  socket.on("error", (err) => {
    logger.error(`Erro na conexão TCP (Concox) com ${clientAddress}: ${err.message}`);
    tcpConnections.delete(socket); // Remover conexão em caso de erro
  });
});

// Criar servidor UDP
const udpServer = dgram.createSocket('udp4');

udpServer.on('error', (err) => {
  logger.error(`Erro no servidor UDP: ${err.message}`);
});

udpServer.on('message', async (data, rinfo) => {
  const clientAddress = `${rinfo.address}:${rinfo.port}`;
  logger.debug(`Dados UDP recebidos de ${clientAddress}: ${data.toString("hex").substring(0, 50)}...`);
  
  // Obter ou criar informações do cliente
  if (!udpClients.has(clientAddress)) {
    udpClients.set(clientAddress, { 
      imei: null, 
      lastSeen: new Date(),
      protocol: null // Vamos detectar o protocolo
    });
    logger.info(`Novo cliente UDP: ${clientAddress}`);
  }
  
  const connectionInfo = udpClients.get(clientAddress);
  connectionInfo.lastSeen = new Date(); // Atualizar timestamp de atividade
  
  await processData(data, connectionInfo, (response) => {
    udpServer.send(response, rinfo.port, rinfo.address, (err) => {
      if (err) {
        logger.error(`Erro ao enviar resposta UDP para ${clientAddress}: ${err.message}`);
      }
    });
  });
});

udpServer.on('listening', () => {
  const address = udpServer.address();
  logger.info(`Servidor UDP de rastreadores ouvindo em ${address.address}:${address.port}`);
});

// Iniciar servidores
teltonikaServer.listen(TCP_PORT, "0.0.0.0", () => {
  logger.info(`Servidor TCP de rastreadores (Teltonika) ouvindo na porta ${TCP_PORT}`);
});

queclinkServer.listen(QUECLINK_TCP_PORT, "0.0.0.0", () => {
  logger.info(`Servidor TCP de rastreadores (Queclink) ouvindo na porta ${QUECLINK_TCP_PORT}`);
});

concoxServer.listen(CONCOX_TCP_PORT, "0.0.0.0", () => {
  logger.info(`Servidor TCP de rastreadores (Concox) ouvindo na porta ${CONCOX_TCP_PORT}`);
});

udpServer.bind(UDP_PORT, "0.0.0.0");

// Lidar com erros dos servidores TCP
teltonikaServer.on("error", (err) => {
  logger.error(`Erro no servidor TCP (Teltonika): ${err.message}`);
});

queclinkServer.on("error", (err) => {
  logger.error(`Erro no servidor TCP (Queclink): ${err.message}`);
});

concoxServer.on("error", (err) => {
  logger.error(`Erro no servidor TCP (Concox): ${err.message}`);
});

// Lidar com sinais de término do processo
process.on('SIGINT', () => {
  logger.info("Recebido sinal SIGINT. Encerrando servidores...");
  teltonikaServer.close();
  queclinkServer.close();
  concoxServer.close();
  udpServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info("Recebido sinal SIGTERM. Encerrando servidores...");
  teltonikaServer.close();
  queclinkServer.close();
  concoxServer.close();
  udpServer.close();
  process.exit(0);
});

logger.info(`Servidores de rastreamento iniciados:
- Teltonika (TCP): ${TCP_PORT}
- Queclink (TCP): ${QUECLINK_TCP_PORT}
- Concox (TCP): ${CONCOX_TCP_PORT}
- Todos os protocolos (UDP): ${UDP_PORT}`);

