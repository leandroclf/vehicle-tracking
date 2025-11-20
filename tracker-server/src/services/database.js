const { Pool } = require('pg');
const winston = require('winston');

// Configurar logger (pode ser passado ou criado aqui)
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
        new winston.transports.File({ filename: 'tracker-db.log' })
    ]
});

class DatabaseService {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.reconnectInterval = 5000;
        this.connectionString = process.env.DATABASE_URL;
        this.queryBuffer = [];
        this.MAX_BUFFER_SIZE = 1000; // Limit buffer to prevent memory leaks

        if (!this.connectionString) {
            logger.error("Erro: Variável de ambiente DATABASE_URL não configurada.");
            process.exit(1);
        }
    }

    connect() {
        try {
            this.pool = new Pool({ connectionString: this.connectionString });

            this.pool.on('error', (err) => {
                logger.error('Erro inesperado no cliente PostgreSQL', err);
                this.isConnected = false;
                this.reconnect();
            });

            this.pool.query('SELECT 1')
                .then(() => {
                    this.isConnected = true;
                    logger.info("Conectado ao banco de dados com sucesso.");
                    this.flushBuffer();
                })
                .catch(err => {
                    logger.error(`Falha na verificação inicial de conexão: ${err.message}`);
                    this.isConnected = false;
                    this.reconnect();
                });

        } catch (error) {
            logger.error(`Falha ao conectar com o banco: ${error.message}`);
            this.isConnected = false;
            this.reconnect();
        }
    }

    reconnect() {
        if (this.isReconnecting) return;
        this.isReconnecting = true;

        logger.info(`Tentando reconexão em ${this.reconnectInterval / 1000} segundos...`);
        setTimeout(() => {
            this.isReconnecting = false;
            this.connect();
        }, this.reconnectInterval);
    }

    async query(text, params) {
        if (!this.isConnected || !this.pool) {
            logger.warn("Banco desconectado. Adicionando query ao buffer.");

            if (this.queryBuffer.length >= this.MAX_BUFFER_SIZE) {
                logger.error("Buffer de queries cheio. Descartando query mais antiga.");
                this.queryBuffer.shift();
            }

            return new Promise((resolve, reject) => {
                this.queryBuffer.push({ text, params, resolve, reject });
            });
        }
        return this.pool.query(text, params);
    }

    async flushBuffer() {
        if (this.queryBuffer.length === 0) return;

        logger.info(`Processando ${this.queryBuffer.length} queries do buffer...`);

        const bufferCopy = [...this.queryBuffer];
        this.queryBuffer = [];

        for (const item of bufferCopy) {
            try {
                const result = await this.pool.query(item.text, item.params);
                item.resolve(result);
            } catch (error) {
                logger.error(`Erro ao processar query do buffer: ${error.message}`);
                item.reject(error);
            }
        }
    }

    // Singleton instance
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
            DatabaseService.instance.connect();
        }
        return DatabaseService.instance;
    }
}

module.exports = DatabaseService;
