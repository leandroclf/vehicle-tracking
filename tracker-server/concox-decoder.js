// Módulo para decodificação do protocolo Concox
// Baseado na documentação do protocolo Concox

/**
 * Decodifica um pacote de dados Concox
 * @param {Buffer} data - Buffer contendo os dados brutos recebidos
 * @returns {Object|null} - Objeto com os dados decodificados ou null se inválido
 */
function decodeConcoxData(data) {
  try {
    // Verificar se temos dados suficientes e marcadores de início/fim
    if (!data || data.length < 10 || data[0] !== 0x78 || data[1] !== 0x78) {
      // Concox geralmente começa com 0x7878 ou 0x7979
      if (data && data.length >= 2 && data[0] === 0x79 && data[1] === 0x79) {
        // Formato alternativo 0x7979
      } else {
        console.error('Formato de pacote Concox inválido ou não reconhecido');
        return null;
      }
    }

    // Extrair o tamanho do pacote (exclui os bytes de marcador inicial e tamanho)
    const packetLength = data[2];
    
    // Verificar se o pacote está completo
    if (data.length < packetLength + 5) { // 2 (start) + 1 (length) + packetLength + 2 (checksum)
      console.error('Pacote Concox incompleto');
      return null;
    }
    
    // Extrair o tipo de protocolo
    const protocolId = data[3];
    
    // Processar com base no tipo de protocolo
    
    // Pacote de login (0x01)
    if (protocolId === 0x01) {
      // O IMEI está entre o 4º byte e o 12º byte (8 bytes)
      const imeiBytes = data.slice(4, 12);
      const imei = parseConcoxImei(imeiBytes);
      
      return {
        type: 'imei',
        imei: imei
      };
    }
    
    // Pacote de informação GPS (0x10, 0x11, 0x12)
    if (protocolId === 0x10 || protocolId === 0x11 || protocolId === 0x12) {
      // Extrair timestamp (bytes 4-9)
      const timestamp = parseConcoxTimestamp(data.slice(4, 10));
      
      // Extrair quantidade de satélites e status GPS (byte 10)
      const gpsInfo = data[10];
      const satellites = gpsInfo & 0x0F; // 4 bits menos significativos
      const isValid = (gpsInfo & 0x10) === 0; // Bit 4: 0 = válido, 1 = inválido
      
      // Se GPS for válido, extrair coordenadas
      let latitude = 0, longitude = 0, speed = 0, heading = 0;
      
      if (isValid) {
        // Latitude (bytes 11-14)
        latitude = parseConcoxCoordinate(data.slice(11, 15));
        
        // Longitude (bytes 15-18)
        longitude = parseConcoxCoordinate(data.slice(15, 19));
        
        // Velocidade (byte 19)
        speed = data[19];
        
        // Status e direção (bytes 20-21)
        const headingBytes = data.slice(20, 22);
        heading = headingBytes[0] * 256 + headingBytes[1] & 0x03FF; // 10 bits para direção
      }
      
      // Extrair dados de status (pode variar por dispositivo)
      const statusByte = data[data.length - 4]; // Normalmente o 4º byte do final antes do checksum
      const ioEvents = {
        ignition: (statusByte & 0x01) !== 0,
        charging: (statusByte & 0x02) !== 0,
        acc: (statusByte & 0x04) !== 0,
        // Outros status conforme documentação específica
      };
      
      return {
        type: 'avl_data',
        recordCount: 1,
        records: [{
          timestamp: timestamp,
          latitude: latitude,
          longitude: longitude,
          altitude: 0, // Não disponível em formatos básicos Concox
          angle: heading,
          speed: speed,
          satellites: satellites,
          ioEvents: ioEvents,
          priority: 0,
          isValid: isValid
        }]
      };
    }
    
    // Pacote de heartbeat (0x13)
    if (protocolId === 0x13) {
      // No pacote heartbeat, geralmente temos informações de terminal
      const voltageLevel = data[4] & 0x07; // 3 bits menos significativos
      const gsmSignal = (data[4] >> 3) & 0x07; // 3 bits do meio (3-5)
      const alarmType = (data[4] >> 6) & 0x03; // 2 bits mais significativos
      
      return {
        type: 'heartbeat',
        terminalInfo: {
          voltageLevel: voltageLevel,
          gsmSignal: gsmSignal,
          alarmType: alarmType
        }
      };
    }
    
    // Pacote de status (0x14)
    if (protocolId === 0x14) {
      const statusBytes = data.slice(4, 9);
      
      return {
        type: 'status',
        terminalStatus: {
          reserved: statusBytes[0],
          battery: statusBytes[1],
          powerVoltage: statusBytes[2] * 256 + statusBytes[3], // mV
          gsmSignal: statusBytes[4] & 0x0F,
          statusFlag: (statusBytes[4] >> 4) & 0x0F
        }
      };
    }
    
    // Pacote de resposta a comando (0x15)
    if (protocolId === 0x15) {
      // Extrair tipo de comando e conteúdo
      const cmdType = data[4];
      const contentLength = data[5];
      const content = data.slice(6, 6 + contentLength).toString('ascii');
      
      return {
        type: 'command_response',
        commandType: cmdType,
        content: content
      };
    }
    
    // Pacote desconhecido
    return {
      type: 'unknown',
      protocolId: protocolId,
      rawData: data.toString('hex')
    };
    
  } catch (error) {
    console.error('Erro ao decodificar pacote Concox:', error);
    return null;
  }
}

/**
 * Converte bytes de timestamp Concox para formato ISO
 * @param {Buffer} bytes - Buffer de 6 bytes contendo o timestamp
 * @returns {string} - Timestamp ISO
 */
function parseConcoxTimestamp(bytes) {
  try {
    // Formato: YY MM DD HH mm SS
    const year = 2000 + bytes[0]; // Ano a partir de 2000
    const month = bytes[1];
    const day = bytes[2];
    const hour = bytes[3];
    const minute = bytes[4];
    const second = bytes[5];
    
    return new Date(
      year,
      month - 1, // Mês em JS é 0-indexed
      day,
      hour,
      minute,
      second
    ).toISOString();
  } catch (error) {
    console.error('Erro ao processar timestamp Concox:', error);
    return new Date().toISOString(); // Fallback para data atual
  }
}

/**
 * Extrai IMEI a partir dos bytes do Concox
 * @param {Buffer} bytes - Buffer contendo os bytes do IMEI
 * @returns {string} - IMEI como string
 */
function parseConcoxImei(bytes) {
  // Converte bytes para string hexadecimal e remove zeros à esquerda
  const hexString = bytes.toString('hex').replace(/^0+/, '');
  return hexString;
}

/**
 * Converte bytes de coordenadas Concox para decimal
 * @param {Buffer} bytes - Buffer de 4 bytes contendo a coordenada
 * @returns {number} - Coordenada em formato decimal
 */
function parseConcoxCoordinate(bytes) {
  // Concox usa um formato especial: graus * 1000000
  const value = bytes[0] * 16777216 + bytes[1] * 65536 + bytes[2] * 256 + bytes[3];
  return value / 1000000;
}

/**
 * Calcula checksum para pacotes Concox
 * @param {Buffer} data - Dados para calcular o checksum
 * @returns {number} - Checksum calculado
 */
function calculateConcoxChecksum(data) {
  let sum = 0;
  for (let i = 2; i < data.length - 2; i++) {
    sum ^= data[i];
  }
  return sum;
}

/**
 * Cria um pacote de resposta para o dispositivo Concox
 * @param {number} protocolId - ID do protocolo
 * @param {Object} data - Dados adicionais para a resposta
 * @returns {Buffer} - Buffer contendo a resposta
 */
function createConcoxResponse(protocolId, data = {}) {
  let responseBuffer;
  
  // Resposta de login (0x01)
  if (protocolId === 0x01) {
    // Criar pacote de resposta com tamanho 5
    responseBuffer = Buffer.alloc(8);
    responseBuffer[0] = 0x78; // Start bit
    responseBuffer[1] = 0x78; // Start bit
    responseBuffer[2] = 0x05; // Tamanho
    responseBuffer[3] = 0x01; // Protocolo ID (mesmo do recebido)
    responseBuffer[4] = Math.floor(Date.now() / 1000) % 256; // Timestamp (LSB)
    responseBuffer[5] = 0x00; // Checksum placeholder
    
    // Calcular checksum
    responseBuffer[5] = calculateConcoxChecksum(responseBuffer);
    responseBuffer[6] = 0x0D; // Stop bit (CR)
    responseBuffer[7] = 0x0A; // Stop bit (LF)
  }
  
  // Resposta heartbeat (0x13)
  else if (protocolId === 0x13) {
    responseBuffer = Buffer.alloc(8);
    responseBuffer[0] = 0x78; // Start bit
    responseBuffer[1] = 0x78; // Start bit
    responseBuffer[2] = 0x05; // Tamanho
    responseBuffer[3] = 0x13; // Protocolo ID (mesmo do recebido)
    responseBuffer[4] = 0x00; // Reservado
    responseBuffer[5] = 0x00; // Checksum placeholder
    
    // Calcular checksum
    responseBuffer[5] = calculateConcoxChecksum(responseBuffer);
    responseBuffer[6] = 0x0D; // Stop bit (CR)
    responseBuffer[7] = 0x0A; // Stop bit (LF)
  }
  
  // Resposta para pacotes de dados GPS (0x10, 0x11, 0x12)
  else if (protocolId === 0x10 || protocolId === 0x11 || protocolId === 0x12) {
    responseBuffer = Buffer.alloc(8);
    responseBuffer[0] = 0x78; // Start bit
    responseBuffer[1] = 0x78; // Start bit
    responseBuffer[2] = 0x05; // Tamanho
    responseBuffer[3] = protocolId; // Protocolo ID (mesmo do recebido)
    responseBuffer[4] = 0x00; // Reservado
    responseBuffer[5] = 0x00; // Checksum placeholder
    
    // Calcular checksum
    responseBuffer[5] = calculateConcoxChecksum(responseBuffer);
    responseBuffer[6] = 0x0D; // Stop bit (CR)
    responseBuffer[7] = 0x0A; // Stop bit (LF)
  }
  
  // Resposta padrão para outros tipos de pacotes
  else {
    responseBuffer = Buffer.alloc(8);
    responseBuffer[0] = 0x78; // Start bit
    responseBuffer[1] = 0x78; // Start bit
    responseBuffer[2] = 0x05; // Tamanho
    responseBuffer[3] = protocolId; // Protocolo ID (mesmo do recebido)
    responseBuffer[4] = 0x00; // Reservado
    responseBuffer[5] = 0x00; // Checksum placeholder
    
    // Calcular checksum
    responseBuffer[5] = calculateConcoxChecksum(responseBuffer);
    responseBuffer[6] = 0x0D; // Stop bit (CR)
    responseBuffer[7] = 0x0A; // Stop bit (LF)
  }
  
  return responseBuffer;
}

module.exports = {
  decodeConcoxData,
  createConcoxResponse
}; 