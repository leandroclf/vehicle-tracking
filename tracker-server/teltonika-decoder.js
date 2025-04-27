// Módulo para decodificação do protocolo Teltonika Codec8
// Baseado na documentação oficial do protocolo Teltonika Codec8/Codec8 Extended

/**
 * Decodifica um pacote de dados Teltonika Codec8
 * @param {Buffer} data - Buffer contendo os dados brutos recebidos
 * @returns {Object|null} - Objeto com os dados decodificados ou null se inválido
 */
function decodeTeltonikaCodec8(data) {
  try {
    // Verificar se temos dados suficientes
    if (!data || data.length < 10) {
      console.error('Pacote de dados muito pequeno para ser Codec8');
      return null;
    }

    // Verificar se é um pacote de IMEI (primeira conexão)
    if (data[0] === 0x00 && data[1] <= 0x0F) {
      const imeiLength = data[1];
      if (data.length < imeiLength + 2) {
        console.error('Pacote IMEI incompleto');
        return null;
      }
      
      const imei = data.toString('ascii', 2, 2 + imeiLength);
      console.log(`Pacote IMEI recebido: ${imei}`);
      
      return {
        type: 'imei',
        imei: imei
      };
    }

    // Verificar se é um pacote de dados AVL
    // Pular os 4 bytes do preamble (0x00000000)
    let offset = 4;
    
    // Verificar se temos dados suficientes para o cabeçalho
    if (data.length < offset + 4) {
      console.error('Pacote de dados muito pequeno para conter cabeçalho AVL');
      return null;
    }
    
    // Ler o tamanho dos dados
    const dataLength = data.readUInt32BE(offset);
    offset += 4;
    
    // Verificar se o pacote está completo
    if (data.length < offset + dataLength + 4) { // +4 para o CRC
      console.error(`Pacote incompleto. Esperado: ${offset + dataLength + 4}, Recebido: ${data.length}`);
      return null;
    }
    
    // Ler o codec ID (8 para Codec8, 8E para Codec8 Extended)
    const codecId = data[offset];
    offset += 1;
    
    // Ler o número de registros de dados
    const recordCount = data[offset];
    offset += 1;
    
    // Preparar o objeto de resposta
    const result = {
      type: 'avl_data',
      codec: codecId === 0x08 ? 'codec8' : (codecId === 0x8E ? 'codec8_extended' : 'unknown'),
      recordCount: recordCount,
      records: []
    };
    
    // Processar cada registro
    for (let i = 0; i < recordCount; i++) {
      // Verificar se temos dados suficientes para o timestamp
      if (offset + 8 > data.length) {
        console.error('Dados insuficientes para ler timestamp');
        return null;
      }
      
      // Ler timestamp (8 bytes)
      const timestamp = data.readBigUInt64BE(offset);
      const date = new Date(Number(timestamp));
      offset += 8;
      
      // Ler prioridade (1 byte)
      const priority = data[offset];
      offset += 1;
      
      // Ler longitude (4 bytes)
      const longitude = data.readInt32BE(offset) / 10000000;
      offset += 4;
      
      // Ler latitude (4 bytes)
      const latitude = data.readInt32BE(offset) / 10000000;
      offset += 4;
      
      // Ler altitude (2 bytes)
      const altitude = data.readInt16BE(offset);
      offset += 2;
      
      // Ler ângulo (2 bytes)
      const angle = data.readUInt16BE(offset);
      offset += 2;
      
      // Ler satélites (1 byte)
      const satellites = data[offset];
      offset += 1;
      
      // Ler velocidade (2 bytes)
      const speed = data.readUInt16BE(offset);
      offset += 2;
      
      // Ler eventos IO
      // Número de eventos IO (1 byte)
      const ioEventCount = data[offset];
      offset += 1;
      
      const ioEvents = {};
      
      // Processar eventos IO de 1 byte
      const io1ByteCount = data[offset];
      offset += 1;
      
      for (let j = 0; j < io1ByteCount; j++) {
        const ioId = data.readUInt16BE(offset);
        offset += 2;
        const ioValue = data[offset];
        offset += 1;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 2 bytes
      const io2ByteCount = data[offset];
      offset += 1;
      
      for (let j = 0; j < io2ByteCount; j++) {
        const ioId = data.readUInt16BE(offset);
        offset += 2;
        const ioValue = data.readUInt16BE(offset);
        offset += 2;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 4 bytes
      const io4ByteCount = data[offset];
      offset += 1;
      
      for (let j = 0; j < io4ByteCount; j++) {
        const ioId = data.readUInt16BE(offset);
        offset += 2;
        const ioValue = data.readUInt32BE(offset);
        offset += 4;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 8 bytes (se for Codec8 Extended)
      let io8ByteCount = 0;
      if (codecId === 0x8E) {
        io8ByteCount = data[offset];
        offset += 1;
        
        for (let j = 0; j < io8ByteCount; j++) {
          const ioId = data.readUInt16BE(offset);
          offset += 2;
          const ioValue = data.readBigUInt64BE(offset);
          offset += 8;
          ioEvents[ioId] = Number(ioValue);
        }
      }
      
      // Mapear IDs de IO para nomes mais amigáveis
      // Baseado na documentação Teltonika
      const mappedIoEvents = mapIoEvents(ioEvents);
      
      // Adicionar o registro ao resultado
      result.records.push({
        timestamp: date.toISOString(),
        priority: priority,
        longitude: longitude,
        latitude: latitude,
        altitude: altitude,
        angle: angle,
        satellites: satellites,
        speed: speed,
        ioEvents: mappedIoEvents
      });
    }
    
    // Verificar CRC (4 bytes no final)
    const crc = data.readUInt32BE(data.length - 4);
    
    // Retornar o resultado
    return result;
    
  } catch (error) {
    console.error('Erro ao decodificar pacote Teltonika:', error);
    return null;
  }
}

/**
 * Mapeia IDs de eventos IO para nomes mais amigáveis
 * @param {Object} ioEvents - Objeto com IDs de eventos IO como chaves
 * @returns {Object} - Objeto com nomes amigáveis como chaves
 */
function mapIoEvents(ioEvents) {
  const ioMap = {
    // Mapeamento baseado na documentação Teltonika
    // https://wiki.teltonika-gps.com/view/FMB_AVL_ID
    1: 'ignition',
    9: 'movement',
    10: 'total_distance',
    12: 'external_voltage',
    16: 'gsm_signal',
    24: 'speed',
    66: 'external_power_voltage',
    67: 'battery_voltage',
    68: 'battery_current',
    78: 'ibutton',
    80: 'data_mode',
    181: 'gsm_operator',
    182: 'sleep_mode',
    199: 'trip_odometer',
    200: 'sleep_mode_status',
    205: 'gsm_cell_id',
    206: 'gsm_area_code',
    239: 'ignition_status',
    240: 'movement_status',
    // Adicionar mais mapeamentos conforme necessário
  };
  
  const result = {};
  
  for (const [id, value] of Object.entries(ioEvents)) {
    const name = ioMap[id] || `io_${id}`;
    result[name] = value;
  }
  
  return result;
}

/**
 * Cria um pacote de resposta para o dispositivo Teltonika
 * @param {number} recordCount - Número de registros recebidos
 * @returns {Buffer} - Buffer contendo a resposta
 */
function createTeltonikaResponse(recordCount) {
  const response = Buffer.alloc(4);
  response.writeUInt32BE(recordCount, 0);
  return response;
}

module.exports = {
  decodeTeltonikaCodec8,
  createTeltonikaResponse
};
