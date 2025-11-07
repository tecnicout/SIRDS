const { pool } = require('./backend/config/database');

async function probarConsulta() {
    const connection = await pool.getConnection();
    
    try {
        console.log('Probando consulta de empleados elegibles...');
        
        const [rows] = await connection.query(`
            SELECT e.*, a.id_area, k.id_kit
            FROM empleado e
            INNER JOIN area a ON e.id_area = a.id_area
            INNER JOIN kitdotacion k ON k.id_area = a.id_area AND k.activo = 1
            WHERE e.estado = 1
        `);

        console.log('Empleados encontrados:', rows.length);
        if (rows.length > 0) {
            console.log('Ejemplo de empleado:', JSON.stringify(rows[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        process.exit(0);
    }
}

probarConsulta();