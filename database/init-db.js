const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');

async function ensureDatabaseExists() {
    const rootClient = new Client({
        host: env.DB.host,
        port: env.DB.port,
        user: env.DB.user,
        password: env.DB.password,
        database: 'postgres', // Base de datos administrativa por defecto
    });

    try {
        await rootClient.connect();
        const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1;`;
        const res = await rootClient.query(checkDbQuery, [env.DB.database]);

        if (res.rowCount === 0) {
            console.log(`Creando base de datos "${env.DB.database}"...`);
            // Los nombres de base de datos no se parametrizan en CREATE DATABASE
            await rootClient.query(`CREATE DATABASE "${env.DB.database}";`);
            console.log(`Base de datos "${env.DB.database}" creada con éxito.`);
        } else {
            console.log(`Base de datos "${env.DB.database}" ya existe.`);
        }
    } catch (error) {
        console.warn(`Aviso al verificar/crear base de datos en postgres root: ${error.message}`);
        console.warn(`Intentando conectar directamente a "${env.DB.database}"...`);
    } finally {
        await rootClient.end().catch(() => {});
    }
}

async function initializeDatabase() {
    console.log('=== Iniciando inicialización de la Base de Datos ===');

    await ensureDatabaseExists();

    const targetPool = new Pool({
        host: env.DB.host,
        port: env.DB.port,
        user: env.DB.user,
        password: env.DB.password,
        database: env.DB.database,
    });

    const client = await targetPool.connect();

    try {
        // 1. Ejecutar esquema DDL
        console.log('Aplicando esquema de tablas (schema.sql)...');
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await client.query(schemaSql);
        console.log('Tablas "usuarios", "productos" y "favoritos" creadas o verificadas.');

        // 2. Crear usuario Administrador inicial si no existe
        console.log('Verificando usuario Administrador...');
        const adminCheck = await client.query('SELECT id, rol FROM usuarios WHERE correo = $1', [env.ADMIN.email]);
        if (adminCheck.rowCount === 0) {
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(env.ADMIN.password, saltRounds);
            await client.query(
                `INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES ($1, $2, $3, 'admin')`,
                [env.ADMIN.name, env.ADMIN.email, passwordHash]
            );
            console.log(`Administrador creado con éxito: ${env.ADMIN.email} (rol: admin)`);
        } else {
            console.log(`Usuario administrador (${env.ADMIN.email}) ya existe.`);
        }

        // 3. Insertar productos de ejemplo
        const prodCount = await client.query('SELECT COUNT(*) FROM productos');
        if (parseInt(prodCount.rows[0].count, 10) === 0) {
            console.log('Poblando catálogo con productos iniciales (seed.sql)...');
            const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
            await client.query(seedSql);
            console.log('Productos de prueba insertados con éxito.');
        } else {
            console.log(`El catálogo ya contiene ${prodCount.rows[0].count} producto(s).`);
        }

        console.log('=== Base de datos inicializada correctamente ===');
    } catch (error) {
        console.error('Error durante la inicialización de la base de datos:', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await targetPool.end();
    }
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
