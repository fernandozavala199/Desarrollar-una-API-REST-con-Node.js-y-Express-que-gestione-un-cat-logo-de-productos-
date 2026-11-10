/**
 * Middleware para capturar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: `Ruta no encontrada: [${req.method}] ${req.originalUrl}`
    });
};

/**
 * Middleware para captura global de errores y formato de respuesta seguro
 */
const errorHandler = (err, req, res, next) => {
    // Error al parsear JSON mal formado en el body
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Cuerpo de la petición contiene formato JSON inválido o mal formado.'
        });
    }

    console.error(`[Error inesperado en ${req.method} ${req.url}]:`, err.message);

    // No exponer detalles internos del servidor ni stack traces
    return res.status(500).json({
        error: 'Ocurrió un error interno en el servidor. Por favor, intente más tarde.'
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
