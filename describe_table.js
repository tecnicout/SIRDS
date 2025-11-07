const { query } = require('./backend/config/database');

async function describeTable() {
    try {
        console.log('=== Estructura actual de empleado_ciclo ===\n');
        
        const columnas = await query('DESCRIBE empleado_ciclo');
        console.log('Columnas:', JSON.stringify(columnas, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

describeTable();