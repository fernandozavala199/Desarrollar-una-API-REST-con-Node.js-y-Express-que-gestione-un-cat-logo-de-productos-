const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/favorite.controller');
const authenticateToken = require('../middlewares/auth.middleware');
const { validateFavoritoBody, validateIdParam } = require('../middlewares/validate.middleware');

// Todas las rutas de favoritos requieren usuario autenticado
router.use(authenticateToken);

router.get('/', FavoriteController.list);
router.post('/', validateFavoritoBody, FavoriteController.add);
router.delete('/:productoId', validateIdParam('productoId'), FavoriteController.remove);

module.exports = router;
