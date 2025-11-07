const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
// Verificar conexión a la base de datos antes de iniciar Express
const { testConnection } = require('./backend/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());

// --- CORS CONFIG REFACTORIZADO (incluye 5174 y FRONTEND_URL) ---
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3001'
]);
if (process.env.FRONTEND_URL) {
    allowedOrigins.add(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // curl / same-origin / SSR
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Origen no permitido por CORS: ' + origin), false);
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','Accept'],
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Parseo de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
const frontDir = process.env.NODE_ENV === 'production' ? path.join(__dirname, 'frontend', 'dist') : path.join(__dirname, 'frontend');
app.use(express.static(frontDir));

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
const dotacionesRoutes = require('./backend/routes/dotacionesRoutes');
const dotacionesChRoutes = require('./backend/routes/dotacionesChRoutes');
const tallaRoutes = require('./backend/routes/tallaRoutes');
const stockRoutes = require('./backend/routes/stockRoutes');
const kitRoutes = require('./backend/routes/kitRoutes');
const debugRoutes = require('./backend/routes/debugRoutes');
const solicitudRoutes = require('./backend/routes/solicitudRoutes');
const pedidoRoutes = require('./backend/routes/pedidoRoutes');
const entregaRoutes = require('./backend/routes/entregaRoutes');
const ciclosRoutes = require('./backend/routes/ciclosRoutes');
const entregasCicloRoutes = require('./backend/routes/entregasRoutes');

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
app.use('/api/dotaciones', dotacionesRoutes);
app.use('/api/dotaciones_ch', dotacionesChRoutes);
app.use('/api/tallas', tallaRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/ciclos', ciclosRoutes);
app.use('/api/entregas-ciclo', entregasCicloRoutes);

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
        res.sendFile(path.join(frontDir, 'index.html'));
    } else {
        // Servir la página principal
        res.sendFile(path.join(frontDir, 'index.html'));
    }
});

// Iniciar servidor sólo después de confirmar la conexión a la DB
(async () => {
    try {
        const ok = await testConnection();
        if (!ok) {
            console.error('❌ No se pudo establecer conexión a la base de datos. Abortando inicio del servidor.');
            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor SIRDS ejecutándose en puerto ${PORT}`);
            console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
        });

        server.on('error', (err) => {
            console.error('❌ Error al iniciar servidor:', err.message);
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${PORT} ya está en uso`);
                process.exit(1);
            }
        });

    } catch (err) {
        console.error('❌ Error durante la verificación de la base de datos:', err);
        process.exit(1);
    }
})();

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