const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montaje de rutas con prefijo /api
app.use('/api', apiRoutes);

// Redirección o información en la raíz /
app.get('/', (req, res) => {
    res.status(200).json({
        mensaje: 'Bienvenido a la API del Catálogo de Productos y Favoritos',
        api_base: '/api'
    });
});

// Manejador para rutas inexistentes (404)
app.use(notFoundHandler);

// Manejador global centralizado de errores (500 / 400)
app.use(errorHandler);

module.exports = app;
