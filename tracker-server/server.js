require("dotenv").config();
const net = require("net");
const { createClient } = require("@supabase/supabase-js");
const { decodeTeltonikaCodec8, createTeltonikaResponse } = require("./teltonika-decoder");

// Configurações
const TCP_PORT = process.env.TRACKER_TCP_PORT || 5027; // Porta padrão para Teltonika
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar chave de serviço para operações no backend

// Validar configurações essenciais
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Erro: Variáveis de ambiente Supabase (URL e SERVICE_ROLE_KEY) não configuradas.");
  process.exit(1);
}

// Inicializar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Armazenar IMEI por conexão
const connections = new Map(); // socket -> { imei: string | null }

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

    // TODO: Implementar lógica de verificação de alertas (velocidade, geocerca, etc.)
    // Comparar statusData com as configurações do usuário (vehicle.user_id)

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

