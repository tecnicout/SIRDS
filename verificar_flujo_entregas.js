require('dotenv').config();
const { query } = require('./backend/config/database');
const CicloDotacionModel = require('./backend/models/CicloDotacionModel');
const EntregaCicloModel = require('./backend/models/EntregaCicloModel');

async function verificarFlujoCompleto() {
    try {
        console.log('🔄 Iniciando verificación del flujo completo de entregas...\n');

        // 1. Crear un ciclo de dotación
        console.log('1. Creando ciclo de dotación...');
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 30); // 30 días de duración

        const nuevoCiclo = {
            fecha_inicio_ventana: fechaInicio,
            fecha_fin_ventana: fechaFin,
            fecha_entrega: fechaInicio,
            estado: 'activo',
            observaciones: 'Ciclo de prueba para verificación'
        };

        const [resultCiclo] = await query(
            `INSERT INTO ciclo_dotacion 
             (fecha_inicio_ventana, fecha_fin_ventana, fecha_entrega, estado, observaciones)
             VALUES (?, ?, ?, ?, ?)`,
            [
                nuevoCiclo.fecha_inicio_ventana,
                nuevoCiclo.fecha_fin_ventana,
                nuevoCiclo.fecha_entrega,
                nuevoCiclo.estado,
                nuevoCiclo.observaciones
            ]
        );

        const id_ciclo = resultCiclo.insertId;
        console.log(`✅ Ciclo creado con ID: ${id_ciclo}\n`);

        // 2. Obtener empleados elegibles
        console.log('2. Verificando empleados elegibles...');
        const [empleados] = await query(
            `SELECT e.*, a.id_area 
             FROM empleado e
             INNER JOIN area a ON e.id_area = a.id_area
             WHERE e.estado = 'activo'
             LIMIT 5`
        );

        console.log(`✅ Encontrados ${empleados.length} empleados elegibles\n`);

        // 3. Crear entradas en empleado_ciclo
        console.log('3. Creando entradas en empleado_ciclo...');
        for (const empleado of empleados) {
            await query(
                `INSERT INTO empleado_ciclo 
                 (id_empleado, id_ciclo, id_area, estado, fecha_creacion)
                 VALUES (?, ?, ?, 'pendiente', CURRENT_TIMESTAMP)`,
                [empleado.id_empleado, id_ciclo, empleado.id_area]
            );
        }
        console.log('✅ Entradas creadas correctamente\n');

        // 4. Verificar listado de entregas
        console.log('4. Verificando listado de entregas...');
        const resultadoEntregas = await EntregaCicloModel.getEntregas(1, 10, { id_ciclo });
        console.log(`✅ Total de entregas: ${resultadoEntregas.total}`);
        console.log('Muestra de datos:');
        if (resultadoEntregas.data.length > 0) {
            const muestra = resultadoEntregas.data[0];
            console.log(`  - Empleado: ${muestra.nombre} ${muestra.apellido}`);
            console.log(`  - Identificación: ${muestra.identificacion}`);
            console.log(`  - Área: ${muestra.nombre_area}`);
            console.log(`  - Estado: ${muestra.estado}\n`);
        }

        // 5. Probar actualización de estado
        console.log('5. Probando actualización de estado...');
        if (resultadoEntregas.data.length > 0) {
            const primeraEntrega = resultadoEntregas.data[0];
            await EntregaCicloModel.updateEstado(
                primeraEntrega.id_empleado_ciclo,
                'entregado',
                'Entrega realizada correctamente',
                1 // ID usuario de prueba
            );
            console.log('✅ Estado actualizado correctamente\n');
        }

        // 6. Verificar estadísticas
        console.log('6. Verificando estadísticas del ciclo...');
        const estadisticas = await EntregaCicloModel.getEstadisticas(id_ciclo);
        console.log('Estadísticas por estado:');
        estadisticas.forEach(stat => {
            console.log(`  - ${stat.estado}: ${stat.total}`);
        });

        // 7. Limpiar datos de prueba
        console.log('\n7. Limpiando datos de prueba...');
        await query('DELETE FROM empleado_ciclo WHERE id_ciclo = ?', [id_ciclo]);
        await query('DELETE FROM ciclo_dotacion WHERE id_ciclo = ?', [id_ciclo]);
        console.log('✅ Datos de prueba eliminados\n');

        console.log('✅ Verificación del flujo completada con éxito!');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error);
        throw error;
    }
}

verificarFlujoCompleto().catch(console.error);