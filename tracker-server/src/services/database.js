/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');

class DatabaseService {
    constructor() {
        this.pool = null;
    }

    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
            DatabaseService.instance.initialize();
        }
        return DatabaseService.instance;
    }

    initialize() {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            console.error('DATABASE_URL não configurada');
            return;
        }

        this.pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Erro inesperado no pool de conexões:', err);
        });

        console.log('✅ Conexão com banco de dados PostgreSQL estabelecida');
    }

    async query(text, params) {
        if (!this.pool) {
            throw new Error('Pool de conexões não inicializado');
        }

        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Query executada', { text, duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Erro na query:', { text, error: error.message });
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Pool de conexões fechado');
        }
    }
}

module.exports = DatabaseService;
