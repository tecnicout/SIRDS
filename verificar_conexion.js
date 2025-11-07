require('dotenv').config();
const { query } = require('./backend/config/database');

async function verificarConexion() {
    try {
        console.log('🔄 Verificando conexión a la base de datos...');
        
        // Verificar ciclos activos
        const [ciclos] = await query(
            `SELECT * FROM ciclo_dotacion WHERE estado = 'activo'`
        );
        console.log('\n1. Ciclos activos encontrados:', ciclos.length);
        
        // Verificar empleados activos
        const [empleados] = await query(
            `SELECT COUNT(*) as total FROM empleado WHERE estado = 'activo'`
        );
        console.log('2. Total de empleados activos:', empleados[0].total);
        
        // Verificar áreas
        const [areas] = await query(
            `SELECT COUNT(*) as total FROM area`
        );
        console.log('3. Total de áreas:', areas[0].total);

        console.log('\n✅ Conexión verificada correctamente!');
    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error);
    }
}

verificarConexion();