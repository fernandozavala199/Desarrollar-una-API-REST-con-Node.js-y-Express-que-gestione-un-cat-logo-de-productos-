const { query } = require('../../database/connection');

const FavoriteModel = {
    /**
     * Lista todos los favoritos pertenecientes al usuario autenticado,
     * uniendo los datos detallados del producto correspondiente.
     */
    async listByUser(usuarioId) {
        const sql = `
            SELECT 
                f.id AS favorito_id,
                f.creado_en AS fecha_agregado,
                p.id AS producto_id,
                p.nombre,
                p.descripcion,
                p.categoria,
                p.precio::float,
                p.creado_en AS producto_creado_en
            FROM favoritos f
            INNER JOIN productos p ON f.producto_id = p.id
            WHERE f.usuario_id = $1
            ORDER BY f.creado_en DESC;
        `;
        const result = await query(sql, [usuarioId]);
        return result.rows;
    },

    /**
     * Comprueba si un usuario ya tiene marcado un producto en sus favoritos
     */
    async exists(usuarioId, productoId) {
        const sql = `
            SELECT 1 FROM favoritos
            WHERE usuario_id = $1 AND producto_id = $2
            LIMIT 1;
        `;
        const result = await query(sql, [usuarioId, productoId]);
        return result.rowCount > 0;
    },

    /**
     * Agrega un producto a los favoritos del usuario
     */
    async add(usuarioId, productoId) {
        const sql = `
            INSERT INTO favoritos (usuario_id, producto_id)
            VALUES ($1, $2)
            RETURNING id, usuario_id, producto_id, creado_en;
        `;
        const result = await query(sql, [usuarioId, productoId]);
        return result.rows[0];
    },

    /**
     * Quita un producto de los favoritos del usuario autenticado.
     * Garantiza el aislamiento: solo puede borrar si coincide el usuario_id del token.
     */
    async remove(usuarioId, productoId) {
        const sql = `
            DELETE FROM favoritos
            WHERE usuario_id = $1 AND producto_id = $2
            RETURNING id, producto_id;
        `;
        const result = await query(sql, [usuarioId, productoId]);
        return result.rows[0] || null;
    }
};

module.exports = FavoriteModel;
