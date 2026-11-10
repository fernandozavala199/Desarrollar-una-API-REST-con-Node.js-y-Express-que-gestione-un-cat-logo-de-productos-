require('dotenv').config();

const env = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'catalogo_db',
    },
    JWT: {
        secret: process.env.JWT_SECRET || 'clave_secreta_jwt_por_defecto_desarrollo',
        expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    },
    ADMIN: {
        name: process.env.ADMIN_NAME || 'Administrador Inicial',
        email: process.env.ADMIN_EMAIL || 'admin@catalogo.com',
        password: process.env.ADMIN_PASSWORD || 'Admin1234!',
    }
};

module.exports = env;
