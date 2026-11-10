const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const favoriteRoutes = require('./favorite.routes');

// Ruta informativa de bienvenida/salud del API
router.get('/', (req, res) => {
    res.status(200).json({
        mensaje: 'API REST - Catálogo de Productos y Favoritos Personales',
        version: '1.0.0',
        autores: 'Zavala & Cataña',
        documentacion: {
            auth: '/api/auth (POST /registro, POST /login)',
            productos: '/api/productos (GET /, GET /:id, POST /, PUT /:id, DELETE /:id)',
            favoritos: '/api/favoritos (GET /, POST /, DELETE /:productoId)'
        }
    });
});

// Enlace de submódulos
router.use('/auth', authRoutes);
router.use('/productos', productRoutes);
router.use('/favoritos', favoriteRoutes);

module.exports = router;
