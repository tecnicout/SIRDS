const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:5173'],
    credentials: true
}));

// Logging
app.use(morgan('combined'));

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Importar rutas
const authRoutes = require('./backend/routes/authRoutes');
const usuarioRoutes = require('./backend/routes/usuarioRoutes');
const ubicacionRoutes = require('./backend/routes/ubicacionRoutes');
const areaRoutes = require('./backend/routes/areaRoutes');
const generoRoutes = require('./backend/routes/generoRoutes');
const rolRoutes = require('./backend/routes/rolRoutes');
const empleadoRoutes = require('./backend/routes/empleadoRoutes');
const proveedorRoutes = require('./backend/routes/proveedores');
const categoriaRoutes = require('./backend/routes/categoriaRoutes');
const dotacionRoutes = require('./backend/routes/dotacionRoutes');
const tallaRoutes = require('./backend/routes/tallaRoutes');
const stockRoutes = require('./backend/routes/stockRoutes');
const kitRoutes = require('./backend/routes/kitRoutes');
const solicitudRoutes = require('./backend/routes/solicitudRoutes');
const pedidoRoutes = require('./backend/routes/pedidoRoutes');
const entregaRoutes = require('./backend/routes/entregaRoutes');

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/generos', generoRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/dotaciones', dotacionRoutes);
app.use('/api/tallas', tallaRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/entregas', entregaRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Ruta no encontrada
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({
            success: false,
            message: 'Ruta de API no encontrada'
        });
    } else if (req.originalUrl === '/dashboard.html' || req.originalUrl === '/dashboard') {
        // Servir el dashboard original
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    } else {
        // Servir la página principal
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor SIRDS ejecutándose en puerto ${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('❌ Error al iniciar servidor:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        process.exit(1);
    }
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Error no capturado:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

module.exports = app;