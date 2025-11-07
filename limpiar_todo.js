const { pool } = require('./backend/config/database');

async function limpiarTodo() {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log('Limpiando todas las tablas de prueba...');
        
        // Eliminar en orden correcto por las foreign keys
        await connection.query('DELETE FROM empleado_ciclo');
        await connection.query('DELETE FROM ciclo_dotacion');
        
        await connection.commit();
        console.log('Limpieza completada exitosamente');
    } catch (error) {
        await connection.rollback();
        console.error('Error durante la limpieza:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

limpiarTodo();