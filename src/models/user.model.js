const { query } = require('../../database/connection');

const UserModel = {
    /**
     * Busca un usuario por correo electrónico (incluye password_hash para validar login)
     */
    async findByEmailWithPassword(correo) {
        const sql = `
            SELECT id, nombre, correo, password_hash, rol, creado_en
            FROM usuarios
            WHERE LOWER(correo) = LOWER($1)
            LIMIT 1;
        `;
        const result = await query(sql, [correo]);
        return result.rows[0] || null;
    },

    /**
     * Busca un usuario por ID (sin incluir password_hash)
     */
    async findById(id) {
        const sql = `
            SELECT id, nombre, correo, rol, creado_en
            FROM usuarios
            WHERE id = $1
            LIMIT 1;
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    },

    /**
     * Registra un nuevo usuario en la base de datos (siempre con rol 'usuario' por defecto)
     */
    async create({ nombre, correo, passwordHash, rol = 'usuario' }) {
        const sql = `
            INSERT INTO usuarios (nombre, correo, password_hash, rol)
            VALUES ($1, LOWER($2), $3, $4)
            RETURNING id, nombre, correo, rol, creado_en;
        `;
        const result = await query(sql, [nombre, correo, passwordHash, rol]);
        return result.rows[0];
    },

    /**
     * Verifica si ya existe un usuario con dicho correo
     */
    async existsByEmail(correo) {
        const sql = `
            SELECT 1 FROM usuarios
            WHERE LOWER(correo) = LOWER($1)
            LIMIT 1;
        `;
        const result = await query(sql, [correo]);
        return result.rowCount > 0;
    }
};

module.exports = UserModel;
