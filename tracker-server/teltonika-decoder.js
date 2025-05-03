// Módulo para decodificação do protocolo Teltonika Codec8
// Baseado na documentação oficial do protocolo Teltonika Codec8/Codec8 Extended/Codec16

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
    
    // Ler o codec ID (8 para Codec8, 8E para Codec8 Extended, 10 para Codec16)
    const codecId = data[offset];
    offset += 1;
    
    // Ler o número de registros de dados
    const recordCount = data[offset];
    offset += 1;
    
    // Preparar o objeto de resposta
    const result = {
      type: 'avl_data',
      codec: getCodecName(codecId),
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
      const ioEvents = {};
      
      // Número de eventos IO (1 byte para Codec8/Codec8 Extended, 2 bytes para Codec16)
      let ioEventCount = 0;
      if (codecId === 0x10) { // Codec16
        ioEventCount = data.readUInt16BE(offset);
        offset += 2;
      } else {
        ioEventCount = data[offset];
        offset += 1;
      }
      
      // Processar eventos IO de 1 byte
      let io1ByteCount = 0;
      if (codecId === 0x10) { // Codec16
        io1ByteCount = data.readUInt16BE(offset);
        offset += 2;
      } else {
        io1ByteCount = data[offset];
        offset += 1;
      }
      
      for (let j = 0; j < io1ByteCount; j++) {
        // Ler ID do evento (2 bytes para Codec16, 2 bytes para Codec8/Codec8 Extended)
        let ioId = 0;
        if (codecId === 0x10) { // Codec16
          ioId = data.readUInt16BE(offset);
        } else {
          ioId = data.readUInt16BE(offset);
        }
        offset += 2;
        
        // Ler valor do evento (1 byte)
        const ioValue = data[offset];
        offset += 1;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 2 bytes
      let io2ByteCount = 0;
      if (codecId === 0x10) { // Codec16
        io2ByteCount = data.readUInt16BE(offset);
        offset += 2;
      } else {
        io2ByteCount = data[offset];
        offset += 1;
      }
      
      for (let j = 0; j < io2ByteCount; j++) {
        // Ler ID do evento
        let ioId = 0;
        if (codecId === 0x10) { // Codec16
          ioId = data.readUInt16BE(offset);
        } else {
          ioId = data.readUInt16BE(offset);
        }
        offset += 2;
        
        // Ler valor do evento (2 bytes)
        const ioValue = data.readUInt16BE(offset);
        offset += 2;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 4 bytes
      let io4ByteCount = 0;
      if (codecId === 0x10) { // Codec16
        io4ByteCount = data.readUInt16BE(offset);
        offset += 2;
      } else {
        io4ByteCount = data[offset];
        offset += 1;
      }
      
      for (let j = 0; j < io4ByteCount; j++) {
        // Ler ID do evento
        let ioId = 0;
        if (codecId === 0x10) { // Codec16
          ioId = data.readUInt16BE(offset);
        } else {
          ioId = data.readUInt16BE(offset);
        }
        offset += 2;
        
        // Ler valor do evento (4 bytes)
        const ioValue = data.readUInt32BE(offset);
        offset += 4;
        ioEvents[ioId] = ioValue;
      }
      
      // Processar eventos IO de 8 bytes (se for Codec8 Extended ou Codec16)
      let io8ByteCount = 0;
      if (codecId === 0x8E || codecId === 0x10) {
        if (codecId === 0x10) { // Codec16
          io8ByteCount = data.readUInt16BE(offset);
          offset += 2;
        } else {
          io8ByteCount = data[offset];
          offset += 1;
        }
        
        for (let j = 0; j < io8ByteCount; j++) {
          // Ler ID do evento
          let ioId = 0;
          if (codecId === 0x10) { // Codec16
            ioId = data.readUInt16BE(offset);
          } else {
            ioId = data.readUInt16BE(offset);
          }
          offset += 2;
          
          // Ler valor do evento (8 bytes)
          const ioValue = data.readBigUInt64BE(offset);
          offset += 8;
          ioEvents[ioId] = Number(ioValue);
        }
      }
      
      // Processar eventos IO de X bytes (específico do Codec16)
      let ioXByteCount = 0;
      if (codecId === 0x10) {
        ioXByteCount = data.readUInt16BE(offset);
        offset += 2;
        
        for (let j = 0; j < ioXByteCount; j++) {
          // Ler ID do evento
          const ioId = data.readUInt16BE(offset);
          offset += 2;
          
          // Ler tamanho do valor
          const valueLength = data.readUInt16BE(offset);
          offset += 2;
          
          // Ler valor como array de bytes
          const valueBytes = data.slice(offset, offset + valueLength);
          offset += valueLength;
          
          // Tentar converter para string se for ASCII válido, senão manter como hex
          const isAscii = valueBytes.every(byte => byte >= 32 && byte <= 126);
          ioEvents[ioId] = isAscii ? valueBytes.toString('ascii') : valueBytes.toString('hex');
        }
      }
      
      // Mapear IDs de IO para nomes mais amigáveis
      // Baseado na documentação Teltonika
      const mappedIoEvents = mapIoEvents(ioEvents);
      
      // Extrair informações de status do veículo
      const ignitionStatus = mappedIoEvents.ignition_status || 
                           (mappedIoEvents.ignition !== undefined ? Boolean(mappedIoEvents.ignition) : undefined);
      
      const movementStatus = mappedIoEvents.movement_status || 
                           (mappedIoEvents.movement !== undefined ? Boolean(mappedIoEvents.movement) : speed > 0);
      
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
        ioEvents: mappedIoEvents,
        ignition: ignitionStatus,
        moving: movementStatus
      });
    }
    
    // Verificar CRC (4 bytes no final)
    const crc = data.readUInt32BE(data.length - 4);
    const calculatedCrc = calculateCrc(data.slice(8, data.length - 4));
    
    // Validar CRC
    if (crc !== calculatedCrc) {
      console.warn(`Aviso: CRC não corresponde. Recebido: ${crc}, Calculado: ${calculatedCrc}`);
    }
    
    // Retornar o resultado
    return result;
    
  } catch (error) {
    console.error('Erro ao decodificar pacote Teltonika:', error);
    return null;
  }
}

/**
 * Calcula o CRC para um buffer de dados Teltonika
 * @param {Buffer} data - Buffer de dados para calcular o CRC
 * @returns {number} - CRC calculado
 */
function calculateCrc(data) {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
  }
  return crc;
}

/**
 * Retorna o nome do codec baseado no ID
 * @param {number} codecId - ID do codec
 * @returns {string} - Nome do codec
 */
function getCodecName(codecId) {
  switch (codecId) {
    case 0x08:
      return 'codec8';
    case 0x8E:
      return 'codec8_extended';
    case 0x10:
      return 'codec16';
    default:
      return 'unknown';
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
    2: 'movement',
    3: 'pedal',
    4: 'trip_odometer',
    9: 'movement',
    10: 'total_distance',
    11: 'acceleration',
    12: 'external_voltage',
    13: 'gps_power',
    16: 'gsm_signal',
    19: 'temperature',
    20: 'seatbelt',
    21: 'power_switch',
    22: 'door_status',
    24: 'speed',
    25: 'overcurrent',
    26: 'gsm_status',
    27: 'panic_button',
    30: 'analogue_input1',
    31: 'analogue_input2',
    32: 'analogue_input3',
    33: 'analogue_input4',
    50: 'jamming',
    66: 'external_power_voltage',
    67: 'battery_voltage',
    68: 'battery_current',
    69: 'gnss_status',
    73: 'wakeup_event',
    78: 'ibutton',
    79: 'gps_pdop',
    80: 'data_mode',
    81: 'hardware_version',
    82: 'firmware_version',
    89: 'crash_detection',
    155: 'geofence_zone_01',
    156: 'geofence_zone_02',
    157: 'geofence_zone_03',
    158: 'geofence_zone_04',
    159: 'geofence_zone_05',
    175: 'auto_geofence',
    181: 'gsm_operator',
    182: 'sleep_mode',
    183: 'gsm_area_code',
    184: 'gsm_cell_id',
    199: 'trip_odometer',
    200: 'sleep_mode_status',
    205: 'gsm_cell_id',
    206: 'gsm_area_code',
    239: 'ignition_status',
    240: 'movement_status',
    241: 'active_gps_profile',
    246: 'towing_detection',
    247: 'crash_detection',
    249: 'jamming_detection',
    250: 'immobilizer',
    253: 'green_driving_event',
    254: 'track_trigger',
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
