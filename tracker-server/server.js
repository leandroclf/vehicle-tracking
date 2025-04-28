require("dotenv").config();
const net = require("net");
const { createClient } = require("@supabase/supabase-js");
const { decodeTeltonikaCodec8, createTeltonikaResponse } = require("./teltonika-decoder");

// Configurações
const TCP_PORT = process.env.TRACKER_TCP_PORT || 5027; // Porta padrão para Teltonika
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar chave de serviço para operações no backend

// Validar configurações essenciais
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Erro: Variáveis de ambiente Supabase (URL e SERVICE_ROLE_KEY) não configuradas.");
  process.exit(1);
}

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Armazenar IMEI por conexão
const connections = new Map(); // socket -> { imei: string | null }

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
      console.error(`Erro ao buscar configurações de alerta de velocidade: ${settingsError.message}`);
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
        console.error(`Erro ao criar alerta de velocidade: ${insertError.message}`);
      } else {
        console.log(`Alerta de velocidade criado para veículo ${vehicle.id}: ${speed} km/h`);
      }
    }
  } catch (error) {
    console.error("Erro na verificação de alerta de velocidade:", error);
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
      console.error(`Erro ao buscar geocercas: ${geofenceError.message}`);
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
      console.error(`Erro ao buscar estado atual de geocercas: ${statesError.message}`);
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
          console.error(`Erro ao criar alerta de geocerca: ${insertError.message}`);
        } else {
          console.log(`Alerta de geocerca criado para veículo ${vehicle.id}: ${alertData.message}`);
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
        console.error(`Erro ao atualizar estado de geocerca: ${upsertError.message}`);
      }
    }
  } catch (error) {
    console.error("Erro na verificação de alertas de geocerca:", error);
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
          console.error(`Erro ao resetar estado de parada: ${updateError.message}`);
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
      console.error(`Erro ao buscar configurações de alerta de parada: ${settingsError.message}`);
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
        console.error(`Erro ao criar estado de parada: ${insertError.message}`);
      }
      return;
    }
    
    if (stateError) {
      console.error(`Erro ao verificar estado de parada: ${stateError.message}`);
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
          console.error(`Erro ao criar alerta de parada: ${insertError.message}`);
        } else {
          console.log(`Alerta de parada criado para veículo ${vehicle.id}: ${alertData.message}`);
          
          // Marcar que o alerta foi disparado para esta parada
          const { error: updateError } = await supabase
            .from("vehicle_idle_state")
            .update({ alert_triggered: true, updated_at: now.toISOString() })
            .eq("vehicle_id", vehicle.id);
          
          if (updateError) {
            console.error(`Erro ao atualizar estado de alerta de parada: ${updateError.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Erro na verificação de alerta de parada:", error);
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
      console.error(`Erro ao buscar dados do veículo para alertas: ${vehicleError.message}`);
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
    console.error(`Erro na verificação de alertas para veículo ${vehicleId}:`, error);
  }
}

// Função para atualizar o status do veículo no Supabase
async function updateVehicleStatusInSupabase(imei, record) {
  if (!imei) {
    console.error("IMEI não conhecido para este registro, não é possível atualizar o Supabase.");
    return;
  }

  try {
    // 1. Encontrar o veículo pelo IMEI
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, user_id")
      .eq("device_imei", imei)
      .single();

    if (vehicleError || !vehicle) {
      console.error(`Veículo com IMEI ${imei} não encontrado ou erro:`, vehicleError?.message);
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
      console.error(`Erro ao atualizar status para veículo ${vehicle.id} (IMEI: ${imei}):`, upsertError.message);
    } else {
      console.log(`[${new Date().toISOString()}] Status atualizado para veículo ${vehicle.id} (IMEI: ${imei})`);
    }

    // Verificar alertas para o veículo
    await checkAllAlerts(vehicle.id, statusData);

  } catch (error) {
    console.error(`Erro inesperado ao processar registro para IMEI ${imei}:`, error);
  }
}

// Criar servidor TCP
const server = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[${new Date().toISOString()}] Cliente conectado: ${clientAddress}`);
  connections.set(socket, { imei: null });

  // Handler para recebimento de dados
  socket.on("data", async (data) => {
    console.log(`[${new Date().toISOString()}] Dados recebidos de ${clientAddress}: ${data.toString("hex")}`);

    const decodedData = decodeTeltonikaCodec8(data);

    if (!decodedData) {
      console.error(`[${new Date().toISOString()}] Falha ao decodificar dados de ${clientAddress}`);
      // Considerar fechar a conexão se os dados forem inválidos repetidamente
      return;
    }

    const connectionInfo = connections.get(socket);

    if (decodedData.type === "imei") {
      // Recebeu pacote IMEI
      console.log(`[${new Date().toISOString()}] IMEI ${decodedData.imei} recebido de ${clientAddress}`);
      if (connectionInfo) {
        connectionInfo.imei = decodedData.imei;
      }
      // Enviar confirmação de aceitação (0x01)
      socket.write(Buffer.from([0x01]));
      console.log(`[${new Date().toISOString()}] Confirmação de IMEI enviada para ${clientAddress}`);

    } else if (decodedData.type === "avl_data") {
      // Recebeu pacote de dados AVL
      const imei = connectionInfo?.imei;
      if (!imei) {
        console.error(`[${new Date().toISOString()}] Recebido pacote AVL antes do IMEI de ${clientAddress}. Ignorando.`);
        // O dispositivo deve enviar o IMEI primeiro. Se não enviou, algo está errado.
        // Poderia solicitar o IMEI ou fechar a conexão.
        return;
      }

      console.log(`[${new Date().toISOString()}] Recebido ${decodedData.recordCount} registro(s) AVL de ${imei} (${clientAddress})`);

      // Processar cada registro AVL
      for (const record of decodedData.records) {
        await updateVehicleStatusInSupabase(imei, record);
      }

      // Enviar confirmação com o número de registros recebidos
      const confirmation = createTeltonikaResponse(decodedData.recordCount);
      socket.write(confirmation);
      console.log(`[${new Date().toISOString()}] Confirmação AVL (${decodedData.recordCount} registros) enviada para ${imei} (${clientAddress})`);
    }
  });

  // Handler para fechamento da conexão
  socket.on("close", () => {
    console.log(`[${new Date().toISOString()}] Cliente desconectado: ${clientAddress}`);
    connections.delete(socket);
  });

  // Handler para erros na conexão
  socket.on("error", (err) => {
    console.error(`[${new Date().toISOString()}] Erro na conexão com ${clientAddress}:`, err.message);
    connections.delete(socket); // Remover conexão em caso de erro
  });
});

// Iniciar o servidor
server.listen(TCP_PORT, "0.0.0.0", () => {
  console.log(`[${new Date().toISOString()}] Servidor TCP de rastreadores (Teltonika) ouvindo na porta ${TCP_PORT}`);
});

// Lidar com erros do servidor
server.on("error", (err) => {
  console.error(`[${new Date().toISOString()}] Erro no servidor TCP:`, err);
  process.exit(1);
});

