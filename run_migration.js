const { pool } = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await pool.getConnection();
    
    try {
        console.log('Ejecutando migración...');
        
        const sql = fs.readFileSync(
            path.join(__dirname, 'database', 'migrations', '2025-11-07_add_id_kit_empleado_ciclo.sql'),
            'utf8'
        );

        await connection.query(sql);
        
        console.log('Migración completada exitosamente');
    } catch (error) {
        console.error('Error en la migración:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

runMigration();