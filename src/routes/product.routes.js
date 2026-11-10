const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const { validateProducto, validateIdParam } = require('../middlewares/validate.middleware');

// Rutas públicas de consulta de catálogo
router.get('/', ProductController.getAll);
router.get('/:id', validateIdParam('id'), ProductController.getById);

// Rutas protegidas exclusivas para el rol Administrador
router.post(
    '/',
    authenticateToken,
    requireRole('admin'),
    validateProducto,
    ProductController.create
);

router.put(
    '/:id',
    authenticateToken,
    requireRole('admin'),
    validateIdParam('id'),
    validateProducto,
    ProductController.update
);

router.delete(
    '/:id',
    authenticateToken,
    requireRole('admin'),
    validateIdParam('id'),
    ProductController.delete
);

module.exports = router;
