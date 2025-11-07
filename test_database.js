const { pool, query } = require('./backend/config/database');

async function testDatabase() {
    try {
        console.log('🔍 Iniciando pruebas de base de datos...\n');

        // Test 1: Verificar conexión
        console.log('Test 1: Verificando conexión a la base de datos...');
        await query('SELECT 1');
        console.log('✅ Conexión exitosa\n');

        // Test 2: Verificar estructura de tabla ciclo_dotacion
        console.log('Test 2: Verificando estructura de tabla ciclo_dotacion...');
        const [cicloDotacionColumns] = await query('DESCRIBE ciclo_dotacion');
        console.log('Columnas encontradas:', cicloDotacionColumns.length);
        console.log('✅ Estructura de ciclo_dotacion verificada\n');

        // Test 3: Verificar estructura de tabla empleado_ciclo
        console.log('Test 3: Verificando estructura de tabla empleado_ciclo...');
        const [empleadoCicloColumns] = await query('DESCRIBE empleado_ciclo');
        console.log('Columnas encontradas:', empleadoCicloColumns.length);
        console.log('Estructura de empleado_ciclo:');
        empleadoCicloColumns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(Required)' : '(Optional)'}`);
        });
        console.log('✅ Estructura de empleado_ciclo verificada\n');

        // Test 4: Verificar relaciones
        console.log('Test 4: Verificando relaciones entre tablas...');
        const [relations] = await query(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = DATABASE()
                AND (TABLE_NAME = 'empleado_ciclo' OR REFERENCED_TABLE_NAME = 'empleado_ciclo')
        `);
        console.log('Relaciones encontradas:', relations.length);
        relations.forEach(rel => {
            console.log(`- ${rel.TABLE_NAME}.${rel.COLUMN_NAME} -> ${rel.REFERENCED_TABLE_NAME}.${rel.REFERENCED_COLUMN_NAME}`);
        });
        console.log('✅ Relaciones verificadas\n');

        // Test 5: Verificar datos existentes
        console.log('Test 5: Verificando datos existentes...');
        const [ciclosCount] = await query('SELECT COUNT(*) as total FROM ciclo_dotacion');
        const [empleadosCicloCount] = await query('SELECT COUNT(*) as total FROM empleado_ciclo');
        console.log(`- Ciclos de dotación: ${ciclosCount[0].total}`);
        console.log(`- Registros en empleado_ciclo: ${empleadosCicloCount[0].total}`);
        console.log('✅ Datos verificados\n');

        // Test 6: Verificar estados de empleado_ciclo
        console.log('Test 6: Verificando estados en empleado_ciclo...');
        const [estadosCount] = await query(`
            SELECT estado, COUNT(*) as total 
            FROM empleado_ciclo 
            GROUP BY estado
        `);
        console.log('Estados encontrados:');
        estadosCount.forEach(estado => {
            console.log(`- ${estado.estado}: ${estado.total} registros`);
        });
        console.log('✅ Estados verificados\n');

        console.log('✨ Todas las pruebas completadas exitosamente');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        pool.end();
    }
}

testDatabase();