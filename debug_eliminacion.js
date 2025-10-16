const { query } = require('./backend/config/database');

async function debugEliminacion() {
    try {
        console.log('🔍 Debugueando proceso de eliminación...\n');
        
        const ubicacionId = 1; // Planta Principal Bogotá
        
        // Verificar áreas relacionadas
        console.log('1. Verificando áreas relacionadas...');
        const countSql = 'SELECT COUNT(*) as count FROM area WHERE id_ubicacion = ?';
        const countResult = await query(countSql, [ubicacionId]);
        console.log(`   Áreas encontradas: ${countResult[0].count}`);
        
        // Listar áreas específicas
        const areasSql = 'SELECT id_area, nombre_area FROM area WHERE id_ubicacion = ?';
        const areasResult = await query(areasSql, [ubicacionId]);
        console.log('   Áreas específicas:');
        areasResult.forEach(area => {
            console.log(`     - ${area.nombre_area} (ID: ${area.id_area})`);
        });
        
        // Probar desvinculación manual
        console.log('\n2. Probando desvinculación manual...');
        const unlinkSql = 'UPDATE area SET id_ubicacion = NULL WHERE id_ubicacion = ?';
        const unlinkResult = await query(unlinkSql, [ubicacionId]);
        console.log(`   Filas afectadas: ${unlinkResult.affectedRows}`);
        
        // Verificar que se desvincularon
        const verifyCountResult = await query(countSql, [ubicacionId]);
        console.log(`   Áreas que quedan vinculadas: ${verifyCountResult[0].count}`);
        
        // Probar eliminación
        console.log('\n3. Probando eliminación de ubicación...');
        const deleteSql = 'DELETE FROM ubicacion WHERE id_ubicacion = ?';
        const deleteResult = await query(deleteSql, [ubicacionId]);
        console.log(`   Eliminación exitosa: ${deleteResult.affectedRows > 0}`);
        
        if (deleteResult.affectedRows > 0) {
            console.log('✅ ÉXITO: Ubicación eliminada correctamente');
        } else {
            console.log('❌ ERROR: No se pudo eliminar la ubicación');
        }
        
    } catch (error) {
        console.error('❌ Error durante debug:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

debugEliminacion();