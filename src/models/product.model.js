const { query } = require('../../database/connection');

const ProductModel = {
    /**
     * Lista todos los productos, con soporte opcional de filtro por categoría
     */
    async getAll({ categoria } = {}) {
        let sql = `
            SELECT id, nombre, descripcion, categoria, precio::float, creado_en
            FROM productos
        `;
        const params = [];

        if (categoria && categoria.trim() !== '') {
            params.push(categoria.trim());
            sql += ` WHERE LOWER(categoria) = LOWER($1)`;
        }

        sql += ` ORDER BY id ASC;`;

        const result = await query(sql, params);
        return result.rows;
    },

    /**
     * Obtiene un producto por su identificador único
     */
    async getById(id) {
        const sql = `
            SELECT id, nombre, descripcion, categoria, precio::float, creado_en
            FROM productos
            WHERE id = $1
            LIMIT 1;
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    },

    /**
     * Inserta un nuevo producto en la base de datos
     */
    async create({ nombre, descripcion, categoria, precio }) {
        const sql = `
            INSERT INTO productos (nombre, descripcion, categoria, precio)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nombre, descripcion, categoria, precio::float, creado_en;
        `;
        const result = await query(sql, [nombre, descripcion, categoria, precio]);
        return result.rows[0];
    },

    /**
     * Actualiza los datos de un producto existente
     */
    async update(id, { nombre, descripcion, categoria, precio }) {
        const sql = `
            UPDATE productos
            SET nombre = $1,
                descripcion = $2,
                categoria = $3,
                precio = $4
            WHERE id = $5
            RETURNING id, nombre, descripcion, categoria, precio::float, creado_en;
        `;
        const result = await query(sql, [nombre, descripcion, categoria, precio, id]);
        return result.rows[0] || null;
    },

    /**
     * Elimina un producto por ID. La restricción ON DELETE CASCADE
     * en la tabla 'favoritos' asegura que cualquier favorito asociado se elimine automáticamente.
     */
    async delete(id) {
        const sql = `
            DELETE FROM productos
            WHERE id = $1
            RETURNING id, nombre;
        `;
        const result = await query(sql, [id]);
        return result.rows[0] || null;
    }
};

module.exports = ProductModel;
