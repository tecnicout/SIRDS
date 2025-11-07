const { query } = require('./backend/config/database');

async function limpiarPruebas() {
    try {
        console.log('Limpiando datos de prueba...');
        
        // Primero eliminamos los registros de empleado_ciclo
        await query('DELETE FROM empleado_ciclo WHERE id_ciclo IN (SELECT id_ciclo FROM ciclo_dotacion WHERE nombre_ciclo LIKE "Ciclo Test%")');
        
        // Luego eliminamos los ciclos de prueba
        await query('DELETE FROM ciclo_dotacion WHERE id_ciclo > 0');
        
        console.log('Limpieza completada');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

limpiarPruebas();