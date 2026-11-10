/**
 * Middleware para autorización basada en roles (RBAC)
 * @param  {...string} rolesPermitidos Lista de roles con permiso de acceso
 */
const requireRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Acceso no autorizado: usuario no autenticado.'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                error: `Acceso prohibido: se requiere uno de los siguientes roles [${rolesPermitidos.join(', ')}] para realizar esta acción. Tu rol actual es: '${req.user.rol}'.`
            });
        }

        next();
    };
};

module.exports = requireRole;
