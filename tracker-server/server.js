require("dotenv").config();
const net = require("net");
const dgram = require("dgram"); // Adicionar suporte a UDP
const { createClient } = require("@supabase/supabase-js");
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
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar chave de serviço para operações no backend
const RECONNECT_INTERVAL = 5000; // Intervalo de reconexão ao Supabase em ms

// Validar configurações essenciais
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error("Erro: Variáveis de ambiente Supabase (URL e SERVICE_ROLE_KEY) não configuradas.");
  process.exit(1);
}

// Inicializar cliente Supabase
let supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
let isSupabaseConnected = true; // Flag para controlar estado da conexão com Supabase

// Função para reconectar ao Supabase em caso de erros
function reconnectSupabase() {
  logger.info("Tentando reconexão com Supabase...");
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    isSupabaseConnected = true;
    logger.info("Reconectado ao Supabase com sucesso.");
  } catch (error) {
    logger.error(`Falha ao reconectar com Supabase: ${error.message}`);
    isSupabaseConnected = false;
    setTimeout(reconnectSupabase, RECONNECT_INTERVAL);
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
  try {
    // Buscar configurações de alerta de velocidade para o veículo
    const { data: speedSettings, error: settingsError } = await supabase
      .from("speed_alerts")
      .select("id, max_speed, active")
      .eq("vehicle_id", vehicle.id)
      .eq("active", true)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = Não encontrado
      logger.error(`Erro ao buscar configurações de alerta de velocidade: ${settingsError.message}`);
      return;
    }

    if (speedSettings && speed > speedSettings.max_speed) {
      // Criar alerta de velocidade
      const alertData = {
        user_id: vehicle.user_id,
        vehicle_id: vehicle.id,
        type: "speed",
        message: `Velocidade excedida: ${speed} km/h (limite: ${speedSettings.max_speed} km/h)`,
        details: JSON.stringify({
          speed,
          max_speed: speedSettings.max_speed,
          location
        }),
        status: "unread",
        created_at: new Date().toISOString(),
        severity: "medium"
      };

      const { error: insertError } = await supabase
        .from("alerts")
        .insert([alertData]);

      if (insertError) {
        logger.error(`Erro ao criar alerta de velocidade: ${insertError.message}`);
      } else {
        logger.info(`Alerta de velocidade criado para veículo ${vehicle.id}: ${speed} km/h`);
      }
    }
  } catch (error) {
    logger.error("Erro na verificação de alerta de velocidade:", error);
  }
}

// Função para verificar alertas de geocerca
async function checkGeofenceAlert(vehicle, lat, lng, status) {
  try {
    // Buscar geocercas ativas para o veículo ou usuário
    const { data: geofences, error: geofenceError } = await supabase
      .from("geofences")
      .select("*")
      .eq("active", true)
      .or(`vehicle_id.eq.${vehicle.id},user_id.eq.${vehicle.user_id}`);

    if (geofenceError) {
      logger.error(`Erro ao buscar geocercas: ${geofenceError.message}`);
      return;
    }

    if (!geofences || geofences.length === 0) {
      return; // Nenhuma geocerca configurada
    }

    // Status atual do veículo na geocerca
    const { data: currentStates, error: statesError } = await supabase
      .from("vehicle_geofence_state")
      .select("*")
      .eq("vehicle_id", vehicle.id);

    if (statesError) {
      logger.error(`Erro ao buscar estado atual de geocercas: ${statesError.message}`);
      return;
    }

    // Mapa de estados atuais por geocerca
    const currentStateMap = new Map();
    if (currentStates && currentStates.length > 0) {
      currentStates.forEach(state => {
        currentStateMap.set(state.geofence_id, state.inside);
      });
    }

    // Verificar cada geocerca
    for (const geofence of geofences) {
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
        const alertData = {
          user_id: vehicle.user_id,
          vehicle_id: vehicle.id,
          geofence_id: geofence.id,
          type: "geofence",
          message: inside 
            ? `Veículo entrou na geocerca "${geofence.name}"` 
            : `Veículo saiu da geocerca "${geofence.name}"`,
          details: JSON.stringify({
            geofence_name: geofence.name,
            geofence_id: geofence.id,
            action: inside ? "entered" : "exited",
            location: { lat, lng }
          }),
          status: "unread",
          created_at: new Date().toISOString(),
          severity: geofence.alert_severity || "medium"
        };

        const { error: insertError } = await supabase
          .from("alerts")
          .insert([alertData]);

        if (insertError) {
          logger.error(`Erro ao criar alerta de geocerca: ${insertError.message}`);
        } else {
          logger.info(`Alerta de geocerca criado para veículo ${vehicle.id}: ${alertData.message}`);
        }
      }
      
      // Atualizar o estado
      const { error: upsertError } = await supabase
        .from("vehicle_geofence_state")
        .upsert({
          vehicle_id: vehicle.id,
          geofence_id: geofence.id,
          inside,
          updated_at: new Date().toISOString()
        }, { onConflict: 'vehicle_id,geofence_id' });
      
      if (upsertError) {
        logger.error(`Erro ao atualizar estado de geocerca: ${upsertError.message}`);
      }
    }
  } catch (error) {
    logger.error("Erro na verificação de alertas de geocerca:", error);
  }
}

// Função para verificar alertas de parada prolongada
async function checkIdleAlert(vehicle, status, isMoving) {
  try {
    // Se o veículo está em movimento, resetar o contador de parada
    if (isMoving) {
      // Verificar se havia um alerta de parada pendente
      const { data: pendingIdleState, error: stateError } = await supabase
        .from("vehicle_idle_state")
        .select("*")
        .eq("vehicle_id", vehicle.id)
        .single();
      
      if (!stateError && pendingIdleState && pendingIdleState.idle_start_time) {
        // O veículo voltou a se mover após uma parada - resetar estado
        const { error: updateError } = await supabase
          .from("vehicle_idle_state")
          .update({ 
            idle_start_time: null,
            is_idle: false,
            updated_at: new Date().toISOString()
          })
          .eq("vehicle_id", vehicle.id);
        
        if (updateError) {
          logger.error(`Erro ao resetar estado de parada: ${updateError.message}`);
        }
      }
      return;
    }
    
    // Veículo está parado, verificar configurações de alerta de parada
    const { data: idleSettings, error: settingsError } = await supabase
      .from("idle_alerts")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .eq("active", true)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      logger.error(`Erro ao buscar configurações de alerta de parada: ${settingsError.message}`);
      return;
    }
    
    if (!idleSettings) {
      return; // Sem configurações de alerta de parada para este veículo
    }
    
    // Verificar o estado atual de parada do veículo
    const { data: idleState, error: stateError } = await supabase
      .from("vehicle_idle_state")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .single();
    
    const now = new Date();
    
    if (stateError && stateError.code === 'PGRST116') {
      // Primeiro registro de parada para este veículo
      const { error: insertError } = await supabase
        .from("vehicle_idle_state")
        .insert([{
          vehicle_id: vehicle.id,
          idle_start_time: now.toISOString(),
          is_idle: true,
          updated_at: now.toISOString()
        }]);
      
      if (insertError) {
        logger.error(`Erro ao criar estado de parada: ${insertError.message}`);
      }
      return;
    }
    
    if (stateError) {
      logger.error(`Erro ao verificar estado de parada: ${stateError.message}`);
      return;
    }
    
    // Se o veículo já está em estado de parada, verificar se excedeu o tempo máximo
    if (idleState && idleState.idle_start_time && !idleState.alert_triggered) {
      const idleStartTime = new Date(idleState.idle_start_time);
      const idleDurationMinutes = (now.getTime() - idleStartTime.getTime()) / (1000 * 60);
      
      if (idleDurationMinutes >= idleSettings.max_idle_minutes) {
        // Criar alerta de parada prolongada
        const alertData = {
          user_id: vehicle.user_id,
          vehicle_id: vehicle.id,
          type: "idle",
          message: `Veículo parado por ${Math.round(idleDurationMinutes)} minutos`,
          details: JSON.stringify({
            idle_minutes: Math.round(idleDurationMinutes),
            max_idle_minutes: idleSettings.max_idle_minutes,
            idle_start_time: idleState.idle_start_time,
            location: { lat: status.lat, lng: status.lng }
          }),
          status: "unread",
          created_at: now.toISOString(),
          severity: idleSettings.severity || "low"
        };
        
        const { error: insertError } = await supabase
          .from("alerts")
          .insert([alertData]);
        
        if (insertError) {
          logger.error(`Erro ao criar alerta de parada: ${insertError.message}`);
        } else {
          logger.info(`Alerta de parada criado para veículo ${vehicle.id}: ${alertData.message}`);
          
          // Marcar que o alerta foi disparado para esta parada
          const { error: updateError } = await supabase
            .from("vehicle_idle_state")
            .update({ alert_triggered: true, updated_at: now.toISOString() })
            .eq("vehicle_id", vehicle.id);
          
          if (updateError) {
            logger.error(`Erro ao atualizar estado de alerta de parada: ${updateError.message}`);
          }
        }
      }
    }
  } catch (error) {
    logger.error("Erro na verificação de alerta de parada:", error);
  }
}

// Função para verificar todos os tipos de alertas
async function checkAllAlerts(vehicleId, status) {
  try {
    // Buscar dados do veículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, user_id, name, license_plate")
      .eq("id", vehicleId)
      .single();
    
    if (vehicleError) {
      logger.error(`Erro ao buscar dados do veículo para alertas: ${vehicleError.message}`);
      return;
    }
    
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
  }
}

// Função para atualizar o status do veículo no Supabase
async function updateVehicleStatusInSupabase(imei, record) {
  if (!imei) {
    logger.error("IMEI não conhecido para este registro, não é possível atualizar o Supabase.");
    return;
  }

  if (!isSupabaseConnected) {
    logger.error("Supabase desconectado. Não é possível atualizar os dados.");
    return;
  }

  try {
    // 1. Encontrar o veículo pelo IMEI
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, user_id")
      .eq("device_imei", imei)
      .single();

    if (vehicleError) {
      if (vehicleError.code === 'PGRST116') { // Não encontrado
        logger.warn(`Veículo com IMEI ${imei} não encontrado no banco de dados.`);
      } else {
        logger.error(`Erro ao buscar veículo com IMEI ${imei}: ${vehicleError.message}`);
        // Verificar se é um erro de conexão e tentar reconectar
        if (vehicleError.code === 'PGRST301' || vehicleError.message.includes('connection')) {
          isSupabaseConnected = false;
          setTimeout(reconnectSupabase, RECONNECT_INTERVAL);
        }
      }
      return;
    }

    if (!vehicle) {
      logger.warn(`Veículo com IMEI ${imei} não encontrado.`);
      return;
    }

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
      // address: será preenchido por um trigger ou função no Supabase (geocodificação reversa)
    };

    // 3. Atualizar ou inserir o status do veículo (upsert)
    const { error: upsertError } = await supabase
      .from("vehicle_status")
      .upsert(statusData, { onConflict: "vehicle_id" });

    if (upsertError) {
      logger.error(`Erro ao atualizar status para veículo ${vehicle.id} (IMEI: ${imei}): ${upsertError.message}`);
      
      // Verificar se é um erro de conexão e tentar reconectar
      if (upsertError.code === 'PGRST301' || upsertError.message.includes('connection')) {
        isSupabaseConnected = false;
        setTimeout(reconnectSupabase, RECONNECT_INTERVAL);
      }
    } else {
      logger.info(`Status atualizado para veículo ${vehicle.id} (IMEI: ${imei})`);
    }

    // Verificar alertas para o veículo
    await checkAllAlerts(vehicle.id, statusData);

  } catch (error) {
    logger.error(`Erro inesperado ao processar registro para IMEI ${imei}: ${error.message}`);
    
    // Verificar se é um erro de conexão e tentar reconectar
    if (error.message && error.message.includes('connection')) {
      isSupabaseConnected = false;
      setTimeout(reconnectSupabase, RECONNECT_INTERVAL);
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
      await updateVehicleStatusInSupabase(imei, record);
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

