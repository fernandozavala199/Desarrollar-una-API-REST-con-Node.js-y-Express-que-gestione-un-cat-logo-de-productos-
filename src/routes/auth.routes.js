const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { validateRegistro, validateLogin } = require('../middlewares/validate.middleware');

// Rutas públicas de autenticación
router.post('/registro', validateRegistro, AuthController.registro);
router.post('/login', validateLogin, AuthController.login);

module.exports = router;
