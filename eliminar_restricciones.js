const { pool } = require('./backend/config/database');

async function eliminarRestricciones() {
    const connection = await pool.getConnection();
    
    try {
        console.log('Eliminando restricciones...');
        
        // Deshabilitar verificación de llaves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS=0;');

        // Eliminar datos existentes
        await connection.query('TRUNCATE TABLE empleado_ciclo;');
        await connection.query('TRUNCATE TABLE ciclo_dotacion;');

        // Eliminar restricciones
        await connection.query('ALTER TABLE ciclo_dotacion DROP INDEX unique_fecha_entrega;').catch(() => {});
        await connection.query('ALTER TABLE ciclo_dotacion DROP CONSTRAINT chk_fecha_entrega;').catch(() => {});

        // Rehabilitar verificación de llaves foráneas
        await connection.query('SET FOREIGN_KEY_CHECKS=1;');

        console.log('Restricciones eliminadas');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

eliminarRestricciones();