const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Middleware para autenticar usuarios mediante JWT en el encabezado Authorization
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({
            error: 'Acceso no autorizado: no se proporcionó el token de autenticación.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            error: 'Formato de token inválido. El formato esperado es: Bearer <token>'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, env.JWT.secret);
        // Asignamos la identidad verificada del token al objeto request
        req.user = {
            id: decoded.id,
            correo: decoded.correo,
            rol: decoded.rol,
            nombre: decoded.nombre
        };
        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'El token de autenticación ha expirado. Por favor, inicie sesión nuevamente.'
            });
        }
        return res.status(401).json({
            error: 'Token de autenticación inválido o alterado.'
        });
    }
};

module.exports = authenticateToken;
