// Módulo para decodificação do protocolo Queclink
// Baseado na documentação do protocolo Queclink

/**
 * Decodifica um pacote de dados Queclink
 * @param {Buffer} data - Buffer contendo os dados brutos recebidos
 * @returns {Object|null} - Objeto com os dados decodificados ou null se inválido
 */
function decodeQueclinkData(data) {
  try {
    // Verificar se temos dados suficientes
    if (!data || data.length < 10) {
      console.error('Pacote de dados muito pequeno para ser Queclink');
      return null;
    }

    // Converter para string para facilitar o processamento
    const dataStr = data.toString('ascii');
    
    // Queclink geralmente envia mensagens no formato:
    // +ACK:GTHBD,350901152423096,,,,,20230803143902,00A6$
    // +RESP:GTFRI,350901152423096,,,,,,,20230804103450,20230804103452,,,,,,93,8,20,,,,,,,,,,,20230804103452,00BB$
    
    // Verificar se tem formato válido começando com +ACK ou +RESP
    if (!dataStr.startsWith('+ACK:') && !dataStr.startsWith('+RESP:') && !dataStr.startsWith('+BUFF:')) {
      return null;
    }
    
    // Extrair partes da mensagem
    const parts = dataStr.substring(0, dataStr.length - 1).split(','); // Remover $ no final e dividir
    
    // Verificar se temos partes suficientes
    if (parts.length < 3) {
      console.error('Formato de mensagem Queclink inválido');
      return null;
    }
    
    // Extrair o tipo de mensagem e protocolo
    const [headerType, protocolType] = parts[0].split(':');
    
    // Processar diferentes tipos de pacotes
    
    // 1. Pacote de heartbeat (mantenha-vivo)
    if (protocolType === 'GTHBD') {
      return {
        type: 'heartbeat',
        imei: parts[1],
        timestamp: parseQueclinkTimestamp(parts[parts.length - 2])
      };
    }
    
    // 2. Pacote de informação de localização (GPS)
    if (protocolType === 'GTFRI' || protocolType === 'GTTOW' || 
        protocolType === 'GTSOS' || protocolType === 'GTSPD' || 
        protocolType === 'GTRTL' || protocolType === 'GTPNL') {
      
      // Estrutura depende do modelo exato, mas geralmente:
      let imei, timestamp, latitude, longitude, speed, heading, altitude;
      let satellites = 0;
      let ioEvents = {};
      
      imei = parts[1];
      
      // Encontrar índices básicos (podem variar por modelo)
      let reportTypeIndex, reportIdIndex, timestampIndex, longitudeIndex, latitudeIndex, speedIndex;
      let headingIndex, altitudeIndex, satellitesIndex;
      
      if (protocolType === 'GTFRI') {
        // GV300 format: +RESP:GTFRI,350901152423096,,,,,,,20230804103450,20230804103452,,,,,,93,8,20,...
        timestampIndex = 8;
        latitudeIndex = 11;
        longitudeIndex = 12;
        speedIndex = 13;
        headingIndex = 14;
        altitudeIndex = 15;
        satellitesIndex = 16;
      } else {
        // Formato genérico/outros modelos - ajustar conforme necessário
        timestampIndex = parts.length - 3;
        latitudeIndex = parts.length - 8;
        longitudeIndex = parts.length - 7;
        speedIndex = parts.length - 6;
        headingIndex = parts.length - 5;
        altitudeIndex = parts.length - 4;
      }
      
      // Extrair valores dos campos
      timestamp = parseQueclinkTimestamp(parts[timestampIndex]);
      
      // Verificar se temos coordenadas válidas
      if (parts[latitudeIndex] && parts[longitudeIndex]) {
        latitude = parseFloat(parts[latitudeIndex]);
        longitude = parseFloat(parts[longitudeIndex]);
      }
      
      if (parts[speedIndex]) {
        speed = parseFloat(parts[speedIndex]);
      }
      
      if (parts[headingIndex]) {
        heading = parseInt(parts[headingIndex], 10);
      }
      
      if (parts[altitudeIndex]) {
        altitude = parseFloat(parts[altitudeIndex]);
      }
      
      // Extrair dados de satélites se disponíveis
      if (parts[satellitesIndex] && !isNaN(parseInt(parts[satellitesIndex], 10))) {
        satellites = parseInt(parts[satellitesIndex], 10);
      }
      
      // Construir objeto de resposta
      return {
        type: 'avl_data',
        protocolType: protocolType,
        imei: imei,
        recordCount: 1,
        records: [{
          timestamp: timestamp,
          latitude: latitude,
          longitude: longitude,
          altitude: altitude,
          angle: heading,
          speed: speed,
          satellites: satellites,
          ioEvents: ioEvents,
          priority: 0,
        }]
      };
    }
    
    // 3. Pacote de login/inicialização
    if (protocolType === 'GTPNA' || protocolType === 'GTPDP') {
      return {
        type: 'imei',
        imei: parts[1],
        timestamp: parseQueclinkTimestamp(parts[parts.length - 2])
      };
    }
    
    // 4. Pacote de comando/resposta
    if (protocolType.startsWith('GT') && (headerType === '+ACK' || headerType === '+RESP')) {
      return {
        type: 'command_response',
        imei: parts[1],
        commandType: protocolType,
        timestamp: parseQueclinkTimestamp(parts[parts.length - 2])
      };
    }
    
    // Pacote desconhecido mas reconhecível como Queclink
    return {
      type: 'unknown',
      imei: parts[1],
      rawData: dataStr
    };
    
  } catch (error) {
    console.error('Erro ao decodificar pacote Queclink:', error);
    return null;
  }
}

/**
 * Converte formato de timestamp Queclink (YYYYMMDDHHMMSS) para formato ISO
 * @param {string} timestamp - Timestamp no formato Queclink
 * @returns {string} - Timestamp ISO
 */
function parseQueclinkTimestamp(timestamp) {
  if (!timestamp || timestamp.length !== 14) {
    return new Date().toISOString(); // Fallback para data atual
  }
  
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);
  const minute = timestamp.substring(10, 12);
  const second = timestamp.substring(12, 14);
  
  return new Date(
    parseInt(year, 10),
    parseInt(month, 10) - 1, // Mês em JS é 0-indexed
    parseInt(day, 10),
    parseInt(hour, 10),
    parseInt(minute, 10),
    parseInt(second, 10)
  ).toISOString();
}

/**
 * Cria um pacote de resposta para o dispositivo Queclink
 * @param {string} type - Tipo de resposta
 * @param {string} imei - IMEI do dispositivo
 * @returns {Buffer} - Buffer contendo a resposta
 */
function createQueclinkResponse(type, imei) {
  // Diferentes tipos de resposta baseados no tipo de mensagem
  if (type === 'heartbeat') {
    return Buffer.from(`+SACK:GTHBD,${imei},${getQueclinkTimestamp()}$`);
  } else if (type === 'command_response') {
    return Buffer.from(`+SACK:GTCMD,${imei},${getQueclinkTimestamp()}$`);
  } else {
    // Resposta genérica para outros tipos de mensagem
    return Buffer.from(`+SACK:GTFRI,${imei},${getQueclinkTimestamp()}$`);
  }
}

/**
 * Obtém o timestamp atual no formato Queclink (YYYYMMDDHHMMSS)
 * @returns {string} - Timestamp no formato Queclink
 */
function getQueclinkTimestamp() {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

module.exports = {
  decodeQueclinkData,
  createQueclinkResponse
}; 