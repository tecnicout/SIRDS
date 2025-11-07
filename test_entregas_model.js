require('dotenv').config();
const EntregaCicloModel = require('./backend/models/EntregaCicloModel');

async function testEntregasModel() {
    try {
        console.log('🧪 Iniciando pruebas del modelo EntregaCicloModel...\n');

        // Test 1: Obtener entregas del ciclo activo
        console.log('Test 1: Obtener entregas del ciclo activo');
        const resultadoBase = await EntregaCicloModel.getEntregas();
        console.log(`✓ Registros encontrados: ${resultadoBase.total}`);
        console.log(`✓ Página actual: ${resultadoBase.page} de ${resultadoBase.totalPages}`);
        console.log('✓ Muestra de datos:');
        if (resultadoBase.data.length > 0) {
            const muestra = resultadoBase.data[0];
            console.log(`  - Empleado: ${muestra.nombre} ${muestra.apellido}`);
            console.log(`  - Identificación: ${muestra.identificacion}`);
            console.log(`  - Área: ${muestra.nombre_area}`);
            console.log(`  - Estado: ${muestra.estado}`);
        }
        console.log('\n-------------------\n');

        // Test 2: Filtrar por estado
        console.log('Test 2: Filtrar por estado "pendiente"');
        const resultadoFiltrado = await EntregaCicloModel.getEntregas(1, 10, { estado: 'pendiente' });
        console.log(`✓ Registros pendientes: ${resultadoFiltrado.total}`);
        console.log('\n-------------------\n');

        // Test 3: Búsqueda por término
        console.log('Test 3: Búsqueda por término');
        const terminoBusqueda = resultadoBase.data[0]?.apellido || 'González';
        const resultadoBusqueda = await EntregaCicloModel.getEntregas(1, 10, { 
            busqueda: terminoBusqueda 
        });
        console.log(`✓ Búsqueda por "${terminoBusqueda}": ${resultadoBusqueda.total} resultados`);
        console.log('\n-------------------\n');

        // Test 4: Filtrar por área
        if (resultadoBase.data[0]?.id_area) {
            console.log('Test 4: Filtrar por área específica');
            const resultadoArea = await EntregaCicloModel.getEntregas(1, 10, { 
                id_area: resultadoBase.data[0].id_area 
            });
            console.log(`✓ Registros en área: ${resultadoArea.total}`);
            console.log('\n-------------------\n');
        }

        // Test 5: Obtener estadísticas
        console.log('Test 5: Estadísticas del ciclo');
        const estadisticas = await EntregaCicloModel.getEstadisticas(resultadoBase.data[0]?.id_ciclo);
        console.log('✓ Estadísticas por estado:');
        estadisticas.forEach(stat => {
            console.log(`  - ${stat.estado}: ${stat.total}`);
        });
        console.log('\n-------------------\n');

        // Test 6: Actualizar estado
        if (resultadoBase.data[0]?.id_empleado_ciclo) {
            console.log('Test 6: Actualizar estado de una entrega');
            const idPrueba = resultadoBase.data[0].id_empleado_ciclo;
            const estadoOriginal = resultadoBase.data[0].estado;
            const nuevoEstado = estadoOriginal === 'entregado' ? 'pendiente' : 'entregado';
            
            await EntregaCicloModel.updateEstado(idPrueba, nuevoEstado, 1); // 1 = ID usuario de prueba
            console.log(`✓ Estado actualizado: ${estadoOriginal} -> ${nuevoEstado}`);
            
            // Verificar el cambio
            const resultadoVerificacion = await EntregaCicloModel.getEntregas(1, 1, { 
                id_empleado_ciclo: idPrueba 
            });
            console.log('✓ Cambio verificado:', resultadoVerificacion.data[0]?.estado === nuevoEstado);
            
            // Revertir al estado original
            await EntregaCicloModel.updateEstado(idPrueba, estadoOriginal, 1);
            console.log('✓ Estado revertido al original');
        }

        console.log('\n✅ Todas las pruebas completadas con éxito!');

    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error);
        process.exit(1);
    }
}

testEntregasModel();