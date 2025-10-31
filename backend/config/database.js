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

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        // Log detallado sin exponer credenciales
        console.error('❌ Error al conectar con MySQL:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            stack: error.stack ? error.stack.split('\n')[0] : undefined,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            user: dbConfig.user
        });
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