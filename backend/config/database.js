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
    // Nota: muchos dumps locales usan 'sirds' en minúsculas.
    // Usamos 'SIRDS' por defecto pero haremos un fallback automático a 'sirds' si no existen tablas.
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SIRDS',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? Number(process.env.DB_CONNECTION_LIMIT) : 10,
    queueLimit: 0
};

// Crear pool de conexiones (se declara let para permitir reemplazar el pool
// si intentamos reconectar usando 127.0.0.1 como fallback)
let pool = mysql.createPool(dbConfig);

// Verificar si el esquema actual contiene las tablas esperadas; si no, intentar fallback a 'sirds'
const ensureDatabaseCase = async () => {
    try {
        const [rows] = await pool.execute(
            "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'kitdotacion'"
        );
        const hasKitsTable = Array.isArray(rows) && rows[0] && Number(rows[0].cnt) > 0;
        if (hasKitsTable) {
            return true;
        }

        // Si no encuentra la tabla, verificar si existe el esquema 'sirds' (minúsculas)
        const [schemas] = await pool.execute(
            "SELECT SCHEMA_NAME AS name FROM information_schema.schemata WHERE SCHEMA_NAME IN ('sirds','SIRDS') ORDER BY CASE WHEN SCHEMA_NAME='sirds' THEN 0 ELSE 1 END"
        );
        const preferred = schemas.find(s => s.name.toLowerCase() === 'sirds');
        if (preferred && preferred.name !== dbConfig.database) {
            // Recrear pool apuntando a 'sirds'
            const fallbackConfig = Object.assign({}, dbConfig, { database: preferred.name });
            pool = mysql.createPool(fallbackConfig);
            console.log(`🔁 Cambiando base de datos a '${preferred.name}' (fallback automático)`);
            return true;
        }
        return false;
    } catch (err) {
        // No bloquear por esto
        console.warn('Advertencia ensureDatabaseCase:', err.message);
        return false;
    }
};

// Función para probar la conexión
const testConnection = async () => {
    // Intentar conectarse al pool actual
    try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente (host:', dbConfig.host, 'db:', dbConfig.database, ')');
    connection.release();
    await ensureDatabaseCase();
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

// Función para obtener una conexión del pool
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = {
    pool,
    query,
    transaction,
    getConnection,
    testConnection
};