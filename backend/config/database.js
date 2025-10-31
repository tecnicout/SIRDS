const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
// Aceptar varias variantes de variables de entorno para compatibilidad
const dbConfig = {
    // Usar 127.0.0.1 por defecto para evitar problemas de resolución a ::1 en Windows
    host: process.env.DB_HOST || process.env.DB_HOSTNAME || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    // Permitir DB_PASSWORD o DB_PASS según convenga al entorno
    password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SIRDS',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
    queueLimit: 0
};

// Crear pool de conexiones (se declara let para permitir reemplazar el pool
// si intentamos reconectar usando 127.0.0.1 como fallback)
let pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    // Intentar conectarse al pool actual
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente (host:', dbConfig.host, ')');
        connection.release();
        return true;
    } catch (error) {
        // Log conciso del error inicial
        console.error('❌ Error al conectar con MySQL (primer intento):', {
            message: error.message,
            code: error.code,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database
        });

        // Si el host es 'localhost' o '::1' intentamos un fallback a 127.0.0.1
        const normalizedHost = (dbConfig.host || '').toString();
        if (normalizedHost === 'localhost' || normalizedHost === '::1') {
            try {
                console.log('🔁 Intentando reconectar usando 127.0.0.1 como fallback...');
                const fallbackConfig = Object.assign({}, dbConfig, { host: '127.0.0.1' });
                // Reemplazar pool temporalmente
                pool = mysql.createPool(fallbackConfig);
                const conn2 = await pool.getConnection();
                console.log('✅ Conexión establecida correctamente usando 127.0.0.1');
                conn2.release();
                // Actualizar dbConfig.host para reflejar el cambio en logs
                dbConfig.host = '127.0.0.1';
                return true;
            } catch (err2) {
                console.error('❌ Fallback a 127.0.0.1 falló:', { message: err2.message, code: err2.code });
                // no retornamos aún; caemos al return false
            }
        }

        return false;
    }
};

// Función para ejecutar consultas
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Error en consulta SQL:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage
        });
        throw error;
    }
};

// Función para transacciones
const transaction = async (queries) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { sql, params } of queries) {
            const [result] = await connection.execute(sql, params || []);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    query,
    transaction,
    testConnection
};