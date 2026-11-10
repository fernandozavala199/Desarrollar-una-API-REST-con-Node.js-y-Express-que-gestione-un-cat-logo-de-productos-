const app = require('./app');
const env = require('./config/env');
const { pool } = require('../database/connection');

const server = app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(` Servidor API REST ejecutándose en el puerto ${env.PORT}`);
    console.log(` Modo: ${env.NODE_ENV}`);
    console.log(` Base de datos: ${env.DB.database} en ${env.DB.host}:${env.DB.port}`);
    console.log(` Base URL: http://localhost:${env.PORT}/api`);
    console.log(`=======================================================`);
});

// Manejo de apagado controlado (Graceful shutdown)
const gracefulShutdown = async (signal) => {
    console.log(`\nRecibida señal ${signal}. Cerrando servidor y conexiones de base de datos...`);
    server.close(async () => {
        try {
            await pool.end();
            console.log('Pool de PostgreSQL cerrado correctamente.');
            process.exit(0);
        } catch (err) {
            console.error('Error al cerrar el pool de PostgreSQL:', err.message);
            process.exit(1);
        }
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
