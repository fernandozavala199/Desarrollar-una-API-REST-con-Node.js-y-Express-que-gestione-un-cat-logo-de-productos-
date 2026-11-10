/**
 * Middlewares de validación de entradas de datos.
 * Criterio de códigos HTTP:
 * - 400 Bad Request: Campos obligatorios faltantes, strings vacíos o parámetros de identificador inválidos (no numéricos).
 * - 422 Unprocessable Entity: El formato o valor es semánticamente inválido (ej. correo sin formato válido, precio <= 0).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida los datos para el registro de un nuevo usuario
 */
const validateRegistro = (req, res, next) => {
    const { nombre, correo, password } = req.body || {};

    // Comprobación de campos obligatorios faltantes o en blanco (400)
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
    }
    if (!correo || typeof correo !== 'string' || correo.trim() === '') {
        return res.status(400).json({ error: 'El campo "correo" es obligatorio y no puede estar vacío.' });
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ error: 'El campo "password" es obligatorio y no puede estar vacío.' });
    }

    // Comprobaciones semánticas de formato (422)
    if (!EMAIL_REGEX.test(correo.trim())) {
        return res.status(422).json({ error: 'El formato del correo electrónico es inválido.' });
    }
    if (password.length < 6) {
        return res.status(422).json({ error: 'La contraseña debe contener al menos 6 caracteres.' });
    }

    // Sanitización
    req.body.nombre = nombre.trim();
    req.body.correo = correo.trim().toLowerCase();
    next();
};

/**
 * Valida los datos para el inicio de sesión
 */
const validateLogin = (req, res, next) => {
    const { correo, password } = req.body || {};

    if (!correo || typeof correo !== 'string' || correo.trim() === '') {
        return res.status(400).json({ error: 'El campo "correo" es obligatorio.' });
    }
    if (!password || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ error: 'El campo "password" es obligatorio.' });
    }

    if (!EMAIL_REGEX.test(correo.trim())) {
        return res.status(422).json({ error: 'El formato del correo electrónico es inválido.' });
    }

    req.body.correo = correo.trim().toLowerCase();
    next();
};

/**
 * Valida los campos de un producto (crear o actualizar)
 */
const validateProducto = (req, res, next) => {
    const { nombre, descripcion, categoria, precio } = req.body || {};

    // 1. Campos obligatorios no vacíos (400)
    if (nombre === undefined || nombre === null || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
    }
    if (descripcion === undefined || descripcion === null || typeof descripcion !== 'string' || descripcion.trim() === '') {
        return res.status(400).json({ error: 'El campo "descripcion" es obligatorio y no puede estar vacío.' });
    }
    if (categoria === undefined || categoria === null || typeof categoria !== 'string' || categoria.trim() === '') {
        return res.status(400).json({ error: 'El campo "categoria" es obligatorio y no puede estar vacío.' });
    }
    if (precio === undefined || precio === null) {
        return res.status(400).json({ error: 'El campo "precio" es obligatorio.' });
    }

    // 2. Validación de precio numérico y mayor que cero (422)
    const numPrecio = Number(precio);
    if (isNaN(numPrecio)) {
        return res.status(422).json({ error: 'El campo "precio" debe ser un número válido.' });
    }
    if (numPrecio <= 0) {
        return res.status(422).json({ error: 'El precio del producto debe ser estrictamente mayor que cero (> 0).' });
    }

    // Sanitización
    req.body.nombre = nombre.trim();
    req.body.descripcion = descripcion.trim();
    req.body.categoria = categoria.trim();
    req.body.precio = Math.round(numPrecio * 100) / 100;

    next();
};

/**
 * Valida que un parámetro de identificador en la URL sea un entero positivo
 */
const validateIdParam = (paramName = 'id') => {
    return (req, res, next) => {
        const rawId = req.params[paramName];
        const numId = parseInt(rawId, 10);

        if (isNaN(numId) || String(numId) !== String(rawId) || numId <= 0) {
            return res.status(400).json({
                error: `El parámetro "${paramName}" debe ser un identificador numérico entero positivo válido.`
            });
        }

        req.params[paramName] = numId;
        next();
    };
};

/**
 * Valida el cuerpo para agregar a favoritos (productoId)
 */
const validateFavoritoBody = (req, res, next) => {
    const { productoId } = req.body || {};

    if (productoId === undefined || productoId === null) {
        return res.status(400).json({ error: 'El campo "productoId" es obligatorio en el cuerpo de la petición.' });
    }

    const numId = parseInt(productoId, 10);
    if (isNaN(numId) || numId <= 0) {
        return res.status(400).json({ error: 'El campo "productoId" debe ser un número entero positivo válido.' });
    }

    req.body.productoId = numId;
    next();
};

module.exports = {
    validateRegistro,
    validateLogin,
    validateProducto,
    validateIdParam,
    validateFavoritoBody,
};
