/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Despachante de comandos remotos (change: post-baseline-hardening, tarefa 3.2).
 *
 * O banco PostgreSQL compartilhado é a fila: a API grava comandos com status
 * 'sent_to_device' (tabela `commands`) e este serviço os entrega ao dispositivo
 * pela conexão TCP ativa, atualizando o status conforme o resultado real:
 *   sent_to_device → executed  (command_response do dispositivo)
 *   sent_to_device → failed    (dispositivo offline, protocolo sem encoder,
 *                               erro de escrita ou timeout)
 *
 * Controlado pela feature flag COMMANDS_DISPATCH_ENABLED (default: desligado).
 */

// Comandos ASCII Queclink (família GV; ajustáveis por env se o modelo divergir)
const QUECLINK_COMMANDS = {
  block_vehicle: 'AT+GTOUT=gv300,1,,,0,0,0,,,,,,0,,,,,FFFF$',
  unblock_vehicle: 'AT+GTOUT=gv300,0,,,0,0,0,,,,,,0,,,,,FFFF$',
  block_engine: 'AT+GTOUT=gv300,1,,,0,0,0,,,,,,0,,,,,FFFF$',
  unblock_engine: 'AT+GTOUT=gv300,0,,,0,0,0,,,,,,0,,,,,FFFF$',
  request_location: 'AT+GTRTO=gv300,1,,,,,,FFFF$',
};

class CommandDispatcher {
  /**
   * @param {object} deps
   * @param {{query: Function}} deps.db serviço de banco
   * @param {Map} deps.tcpConnections mapa socket -> { imei, protocol }
   * @param {{info: Function, warn: Function, error: Function}} deps.logger
   * @param {object} [options]
   */
  constructor({ db, tcpConnections, logger }, options = {}) {
    this.db = db;
    this.tcpConnections = tcpConnections;
    this.logger = logger;
    this.pollIntervalMs = options.pollIntervalMs || 5000;
    this.timeoutMs = options.timeoutMs || 60000;
    this.timer = null;
    // command_id -> { sentAt } para casar command_response com comando em voo
    this.inFlight = new Map();
  }

  start() {
    if (this.timer) return;
    this.logger.info(
      `Despachante de comandos ativo (poll ${this.pollIntervalMs}ms, timeout ${this.timeoutMs}ms)`
    );
    this.timer = setInterval(() => {
      this.tick().catch((error) =>
        this.logger.error(`Erro no ciclo do despachante de comandos: ${error.message}`)
      );
    }, this.pollIntervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Encontra o socket ativo do dispositivo pelo IMEI. */
  findConnection(imei) {
    for (const [socket, info] of this.tcpConnections.entries()) {
      if (info.imei === imei) {
        return { socket, protocol: info.protocol };
      }
    }
    return null;
  }

  /** Constrói o payload do comando para o protocolo do dispositivo. */
  encodeCommand(protocol, type, parameters) {
    // Comando cru explícito tem precedência (params.metadata.raw_command)
    const raw = parameters && parameters.metadata && parameters.metadata.raw_command;
    if (typeof raw === 'string' && raw.length > 0) {
      return Buffer.from(raw, 'ascii');
    }

    if (protocol === 'queclink') {
      const template = process.env[`QUECLINK_CMD_${type.toUpperCase()}`] || QUECLINK_COMMANDS[type];
      return template ? Buffer.from(template, 'ascii') : null;
    }

    // Teltonika (Codec12) e Concox (frame 0x80) exigem encoders binários
    // específicos de modelo — sem encoder, o comando falha explicitamente.
    return null;
  }

  async failCommand(id, message) {
    this.inFlight.delete(id);
    await this.db.query(
      `UPDATE commands
       SET status = 'failed', error_message = $2, updated_at = NOW()
       WHERE id = $1 AND status = 'sent_to_device'`,
      [id, message]
    );
    this.logger.warn(`Comando ${id} falhou: ${message}`);
  }

  async executeCommand(id, responsePayload) {
    this.inFlight.delete(id);
    await this.db.query(
      `UPDATE commands
       SET status = 'executed', executed_at = NOW(), updated_at = NOW(), response = $2
       WHERE id = $1 AND status = 'sent_to_device'`,
      [id, JSON.stringify(responsePayload || { acknowledged: true })]
    );
    this.logger.info(`Comando ${id} executado pelo dispositivo`);
  }

  /**
   * Chamado pelo servidor quando um decoder produz um command_response.
   * Resolve o comando em voo mais antigo do IMEI correspondente.
   */
  async handleDeviceResponse(imei, payload) {
    const result = await this.db.query(
      `SELECT c.id FROM commands c
       JOIN vehicles v ON v.id = c.vehicle_id
       WHERE v.device_imei = $1 AND c.status = 'sent_to_device'
       ORDER BY c.sent_at ASC LIMIT 1`,
      [imei]
    );
    const command = result.rows[0];
    if (!command) return;
    await this.executeCommand(command.id, payload);
  }

  async tick() {
    // 1. Expirar comandos em voo além do timeout
    await this.db.query(
      `UPDATE commands
       SET status = 'failed',
           error_message = 'Timeout aguardando resposta do dispositivo',
           updated_at = NOW()
       WHERE status = 'sent_to_device'
         AND sent_at IS NOT NULL
         AND sent_at < NOW() - ($1 || ' milliseconds')::interval`,
      [String(this.timeoutMs)]
    );

    // 2. Buscar comandos aguardando entrega (ainda não despachados neste processo)
    const result = await this.db.query(
      `SELECT c.id, c.type, c.parameters, v.device_imei
       FROM commands c
       JOIN vehicles v ON v.id = c.vehicle_id
       WHERE c.status = 'sent_to_device'
       ORDER BY c.sent_at ASC
       LIMIT 20`
    );

    for (const command of result.rows) {
      if (this.inFlight.has(command.id)) continue; // já entregue, aguardando resposta

      if (!command.device_imei) {
        await this.failCommand(command.id, 'Veículo sem IMEI de dispositivo cadastrado');
        continue;
      }

      const connection = this.findConnection(command.device_imei);
      if (!connection) {
        // Dispositivo offline: mantém aguardando até o timeout expirar
        continue;
      }

      const payload = this.encodeCommand(connection.protocol, command.type, command.parameters);
      if (!payload) {
        await this.failCommand(
          command.id,
          `Protocolo ${connection.protocol} sem encoder para o comando ${command.type}`
        );
        continue;
      }

      try {
        connection.socket.write(payload);
        this.inFlight.set(command.id, { sentAt: Date.now() });
        this.logger.info(
          `Comando ${command.id} (${command.type}) enviado ao dispositivo ${command.device_imei}`
        );
      } catch (error) {
        await this.failCommand(command.id, `Erro ao escrever no socket: ${error.message}`);
      }
    }
  }
}

module.exports = { CommandDispatcher };
