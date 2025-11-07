const { query, getConnection } = require('./backend/config/database');
const CicloDotacionModel = require('./backend/models/CicloDotacionModel');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testCicloDotacion() {
    try {
        console.log('=== Iniciando pruebas de Ciclo de Dotación ===');

        // 1. Crear un ciclo de prueba
        console.log('\n1. Creando ciclo de prueba...');
        const cicloData = {
            nombre_ciclo: 'Ciclo Test Noviembre 2025',
            fecha_entrega: '2025-11-30',
            fecha_inicio_ventana: '2025-11-08',
            fecha_fin_ventana: '2025-11-30',
            id_area_produccion: 1,
            id_area_mercadista: 2,
            valor_smlv_aplicado: 1160000,
            creado_por: 1,
            observaciones: 'Ciclo de prueba automatizada'
        };

        const nuevoCiclo = await CicloDotacionModel.create(cicloData);
        console.log('Ciclo creado:', nuevoCiclo);

        // Esperar un momento para asegurar que la transacción se complete
        await delay(1000);

        // 2. Activar el ciclo
        console.log('\n2. Activando ciclo...');
        await CicloDotacionModel.updateEstado(nuevoCiclo.id_ciclo, 'activo');

        // Esperar otro momento
        await delay(1000);

        // 3. Verificar empleados procesados
        console.log('\n3. Verificando empleados procesados...');
        const cicloActivo = await CicloDotacionModel.getById(nuevoCiclo.id_ciclo);
        console.log('Total empleados procesados:', cicloActivo.procesados);

        // Esperar un momento más
        await delay(1000);

        // 4. Verificar una entrega específica
        console.log('\n4. Verificando entregas creadas...');
        const entregas = await query(`
            SELECT 
                ec.*,
                e.nombre,
                e.apellido,
                a.nombre_area
            FROM empleado_ciclo ec
            INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
            INNER JOIN area a ON e.id_area = a.id_area
            WHERE ec.id_ciclo = ?
            LIMIT 1
        `, [nuevoCiclo.id_ciclo]);

        if (entregas.length > 0) {
            console.log('Ejemplo de entrega:', entregas[0]);

            await delay(1000);

            // 5. Probar cambio de estado
            console.log('\n5. Probando cambio de estado...');
            await query(
                'UPDATE empleado_ciclo SET estado = ? WHERE id_empleado_ciclo = ?',
                ['entregado', entregas[0].id_empleado_ciclo]
            );
            console.log('Estado actualizado correctamente');
        }

        await delay(1000);

        // 6. Verificar estadísticas
        console.log('\n6. Verificando estadísticas del ciclo...');
        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'procesado' THEN 1 ELSE 0 END) as procesados,
                SUM(CASE WHEN estado = 'en proceso' THEN 1 ELSE 0 END) as en_proceso,
                SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregados
            FROM empleado_ciclo
            WHERE id_ciclo = ?
        `, [nuevoCiclo.id_ciclo]);
        console.log('Estadísticas:', stats[0]);

        console.log('\n=== Pruebas completadas exitosamente ===');
    } catch (error) {
        console.error('Error en las pruebas:', error);
    } finally {
        process.exit(0);
    }
}

testCicloDotacion();