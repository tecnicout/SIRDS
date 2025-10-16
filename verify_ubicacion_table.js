const { query } = require('./backend/config/database');

async function verificarTablaUbicacion() {
    try {
        console.log('🔍 Verificando estructura de la tabla ubicacion...\n');
        
        // Verificar estructura de la tabla
        const estructura = await query('DESCRIBE ubicacion');
        console.log('📋 Estructura de la tabla ubicacion:');
        estructura.forEach(campo => {
            console.log(`   ${campo.Field}: ${campo.Type} ${campo.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${campo.Key ? `[${campo.Key}]` : ''} ${campo.Default !== null ? `Default: ${campo.Default}` : ''}`);
        });

        // Verificar datos existentes
        const count = await query('SELECT COUNT(*) as total FROM ubicacion');
        console.log(`\n📊 Total de ubicaciones: ${count[0].total}`);

        if (count[0].total > 0) {
            const ubicaciones = await query('SELECT * FROM ubicacion ORDER BY nombre LIMIT 5');
            console.log('\n📍 Primeras 5 ubicaciones:');
            ubicaciones.forEach(ub => {
                console.log(`   ID: ${ub.id_ubicacion} - ${ub.nombre} (${ub.tipo}) - ${ub.direccion || 'Sin dirección'}`);
            });
        }

        // Verificar relaciones con tabla area
        const relaciones = await query(`
            SELECT 
                a.id_area,
                a.nombre_area,
                u.nombre as nombre_ubicacion,
                u.tipo as tipo_ubicacion
            FROM area a 
            LEFT JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion
            WHERE a.id_ubicacion IS NOT NULL
            LIMIT 3
        `);
        
        console.log(`\n🔗 Áreas vinculadas a ubicaciones: ${relaciones.length} ejemplos:`);
        relaciones.forEach(rel => {
            console.log(`   Área: ${rel.nombre_area} -> Ubicación: ${rel.nombre_ubicacion || 'N/A'} (${rel.tipo_ubicacion || 'N/A'})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

verificarTablaUbicacion();