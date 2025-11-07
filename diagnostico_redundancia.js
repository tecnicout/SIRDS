require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Iniciando diagnóstico de redundancia en la base de datos...\n');

    // 1. Verificar empleados duplicados por identificación
    console.log('1. Verificando empleados duplicados por identificación...');
    const [empleadosDuplicados] = await connection.query(`
        SELECT identificacion, COUNT(*) as count, GROUP_CONCAT(id_empleado) as ids
        FROM empleado
        GROUP BY identificacion
        HAVING count > 1
    `);
    
    if (empleadosDuplicados.length > 0) {
        console.log('⚠️ Se encontraron empleados con identificación duplicada:');
        empleadosDuplicados.forEach(emp => {
            console.log(`  - Identificación: ${emp.identificacion}, IDs: ${emp.ids}`);
        });
    } else {
        console.log('✅ No se encontraron empleados duplicados\n');
    }

    // 2. Verificar entradas duplicadas en empleado_ciclo
    console.log('2. Verificando entradas duplicadas en empleado_ciclo...');
    const [entradasDuplicadas] = await connection.query(`
        SELECT id_empleado, id_ciclo, COUNT(*) as count
        FROM empleado_ciclo
        GROUP BY id_empleado, id_ciclo
        HAVING count > 1
    `);

    if (entradasDuplicadas.length > 0) {
        console.log('⚠️ Se encontraron entradas duplicadas en empleado_ciclo:');
        for (const entrada of entradasDuplicadas) {
            const [empleadoInfo] = await connection.query(`
                SELECT nombre, apellido, identificacion 
                FROM empleado 
                WHERE id_empleado = ?
            `, [entrada.id_empleado]);
            
            console.log(`  - Empleado: ${empleadoInfo[0].nombre} ${empleadoInfo[0].apellido} (${empleadoInfo[0].identificacion})`);
            console.log(`    Ciclo: ${entrada.id_ciclo}, Cantidad: ${entrada.count}`);
        }
    } else {
        console.log('✅ No se encontraron entradas duplicadas en empleado_ciclo\n');
    }

    // 3. Verificar inconsistencias entre ciclo_dotacion y empleado_ciclo
    console.log('3. Verificando inconsistencias entre ciclo_dotacion y empleado_ciclo...');
    const [inconsistenciasCiclos] = await connection.query(`
        SELECT ec.id_ciclo, COUNT(*) as count
        FROM empleado_ciclo ec
        LEFT JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
        WHERE cd.id_ciclo IS NULL
        GROUP BY ec.id_ciclo
    `);

    if (inconsistenciasCiclos.length > 0) {
        console.log('⚠️ Se encontraron referencias a ciclos que no existen:');
        inconsistenciasCiclos.forEach(inc => {
            console.log(`  - Ciclo ID: ${inc.id_ciclo}, Cantidad de registros: ${inc.count}`);
        });
    } else {
        console.log('✅ No se encontraron inconsistencias en ciclos\n');
    }

    // 4. Verificar áreas duplicadas por empleado en el mismo ciclo
    console.log('4. Verificando áreas duplicadas por empleado en el mismo ciclo...');
    const [areasDuplicadas] = await connection.query(`
        SELECT 
            e.nombre,
            e.apellido,
            e.identificacion,
            ec.id_ciclo,
            COUNT(DISTINCT ec.id_area) as areas_count,
            GROUP_CONCAT(DISTINCT a.nombre_area) as areas
        FROM empleado_ciclo ec
        INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
        INNER JOIN area a ON ec.id_area = a.id_area
        GROUP BY ec.id_empleado, ec.id_ciclo
        HAVING areas_count > 1
    `);

    if (areasDuplicadas.length > 0) {
        console.log('⚠️ Se encontraron empleados con múltiples áreas en el mismo ciclo:');
        areasDuplicadas.forEach(emp => {
            console.log(`  - ${emp.nombre} ${emp.apellido} (${emp.identificacion})`);
            console.log(`    Ciclo: ${emp.id_ciclo}, Áreas: ${emp.areas}`);
        });
    } else {
        console.log('✅ No se encontraron áreas duplicadas por empleado\n');
    }

    console.log('\nDiagnóstico completado.');
    await connection.end();
}

main().catch(error => {
    console.error('Error durante el diagnóstico:', error);
    process.exit(1);
});