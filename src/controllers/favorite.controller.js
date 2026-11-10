const FavoriteModel = require('../models/favorite.model');
const ProductModel = require('../models/product.model');

const FavoriteController = {
    /**
     * GET /api/favoritos
     * Acceso: Autenticado. Lista únicamente los favoritos del usuario en sesión.
     */
    async list(req, res, next) {
        try {
            // La identidad se obtiene exclusivamente del JWT verificado
            const usuarioId = req.user.id;
            const favoritos = await FavoriteModel.listByUser(usuarioId);

            return res.status(200).json({
                total: favoritos.length,
                usuario: {
                    id: req.user.id,
                    nombre: req.user.nombre,
                    correo: req.user.correo
                },
                favoritos
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/favoritos
     * Acceso: Autenticado. Agrega un producto a los favoritos del usuario.
     */
    async add(req, res, next) {
        try {
            const usuarioId = req.user.id;
            const { productoId } = req.body;

            // 1. Validar que el producto exista en el catálogo (404 si no existe)
            const producto = await ProductModel.getById(productoId);
            if (!producto) {
                return res.status(404).json({
                    error: `No se puede agregar a favoritos: el producto con ID ${productoId} no existe en el catálogo.`
                });
            }

            // 2. Validar que no esté ya duplicado en los favoritos del usuario (409 si duplicado)
            const yaExiste = await FavoriteModel.exists(usuarioId, productoId);
            if (yaExiste) {
                return res.status(409).json({
                    error: `El producto "${producto.nombre}" (ID: ${productoId}) ya se encuentra en tu lista de favoritos.`
                });
            }

            // 3. Crear el registro de favorito
            const favoritoCreado = await FavoriteModel.add(usuarioId, productoId);

            return res.status(201).json({
                mensaje: 'Producto agregado a tus favoritos exitosamente.',
                favorito: {
                    id: favoritoCreado.id,
                    usuario_id: favoritoCreado.usuario_id,
                    producto_id: favoritoCreado.producto_id,
                    producto: {
                        nombre: producto.nombre,
                        categoria: producto.categoria,
                        precio: producto.precio
                    },
                    creado_en: favoritoCreado.creado_en
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * DELETE /api/favoritos/:productoId
     * Acceso: Autenticado. Quita un producto de los favoritos del usuario.
     * Garantiza el aislamiento: Si el usuario B intenta quitar un favorito del usuario A,
     * no afectará a A y B recibirá 404 porque no está en SUS propios favoritos.
     */
    async remove(req, res, next) {
        try {
            const usuarioId = req.user.id;
            const { productoId } = req.params;

            // Intentar eliminar asociando obligatoriamente el usuario_id del token
            const resultado = await FavoriteModel.remove(usuarioId, productoId);

            if (!resultado) {
                return res.status(404).json({
                    error: `El producto con ID ${productoId} no se encuentra en tu lista de favoritos.`
                });
            }

            return res.status(200).json({
                mensaje: `El producto con ID ${productoId} fue eliminado exitosamente de tus favoritos.`
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = FavoriteController;
