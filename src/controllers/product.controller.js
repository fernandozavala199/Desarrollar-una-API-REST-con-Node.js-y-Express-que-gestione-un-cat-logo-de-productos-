const ProductModel = require('../models/product.model');

const ProductController = {
    /**
     * GET /api/productos
     * Acceso: Público. Lista todos los productos o filtra por categoría.
     */
    async getAll(req, res, next) {
        try {
            const { categoria } = req.query;
            const productos = await ProductModel.getAll({ categoria });
            return res.status(200).json({
                total: productos.length,
                categoria_filtrada: categoria || null,
                productos
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/productos/:id
     * Acceso: Público. Consulta el detalle de un producto específico.
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const producto = await ProductModel.getById(id);

            if (!producto) {
                return res.status(404).json({
                    error: `El producto con ID ${id} no existe en el catálogo.`
                });
            }

            return res.status(200).json({ producto });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/productos
     * Acceso: Administrador. Crea un nuevo producto.
     */
    async create(req, res, next) {
        try {
            const { nombre, descripcion, categoria, precio } = req.body;
            const nuevoProducto = await ProductModel.create({
                nombre,
                descripcion,
                categoria,
                precio
            });

            return res.status(201).json({
                mensaje: 'Producto creado exitosamente en el catálogo.',
                producto: nuevoProducto
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * PUT /api/productos/:id
     * Acceso: Administrador. Actualiza la información de un producto.
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, categoria, precio } = req.body;

            // Verificar existencia previa
            const existente = await ProductModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    error: `No se puede actualizar: el producto con ID ${id} no existe.`
                });
            }

            const productoActualizado = await ProductModel.update(id, {
                nombre,
                descripcion,
                categoria,
                precio
            });

            return res.status(200).json({
                mensaje: 'Producto actualizado exitosamente.',
                producto: productoActualizado
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/productos/:id
     * Acceso: Administrador. Elimina un producto.
     * Gracias a ON DELETE CASCADE, sus referencias en favoritos se limpian automáticamente.
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            const existente = await ProductModel.getById(id);
            if (!existente) {
                return res.status(404).json({
                    error: `No se puede eliminar: el producto con ID ${id} no existe en el catálogo.`
                });
            }

            await ProductModel.delete(id);

            return res.status(200).json({
                mensaje: `El producto "${existente.nombre}" (ID: ${id}) fue eliminado exitosamente del catálogo.`
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = ProductController;
