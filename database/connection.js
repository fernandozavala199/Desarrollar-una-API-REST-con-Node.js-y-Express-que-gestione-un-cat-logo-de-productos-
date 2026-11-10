const { Pool } = require('pg');
const env = require('../src/config/env');

const pool = new Pool({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Error inesperado en el cliente del pool de PostgreSQL:', err.message);
});

const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (env.NODE_ENV === 'development') {
            // Log ligero de consultas en desarrollo
            // console.log(`[SQL] Ejecutado en ${duration}ms: ${text.slice(0, 80)}...`);
        }
        return res;
    } catch (error) {
        console.error(`[SQL Error] Consulta: ${text}`, error.message);
        throw error;
    }
};

module.exports = {
    pool,
    query,
};
