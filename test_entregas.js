const { query } = require('./backend/config/database');
const EntregaDotacionModel = require('./backend/models/EntregaDotacionModel');

async function testEntregas() {
    try {
        console.log('=== Iniciando pruebas de Entregas de Dotación ===\n');

        // 0. Asegurar que hay un ciclo activo
        console.log('0. Activando ciclo si no hay uno activo...');
        const ciclos = await query('SELECT * FROM ciclo_dotacion WHERE estado = "activo" LIMIT 1');
        if (ciclos.length === 0) {
            console.log('No hay ciclo activo, activando el último ciclo creado...');
            await query('UPDATE ciclo_dotacion SET estado = "activo" WHERE id_ciclo = (SELECT MAX(id_ciclo) FROM ciclo_dotacion)');
            console.log('Ciclo activado');
        }

        // 1. Obtener entregas del ciclo activo
        console.log('1. Consultando entregas del ciclo activo...');
        const entregas = await EntregaDotacionModel.getEntregasCicloActivo();
        console.log(`Total entregas encontradas: ${entregas.total}`);
        
        if (entregas.entregas.length > 0) {
            console.log('Ejemplo de entrega:', entregas.entregas[0]);
            
            // 2. Actualizar estado de una entrega
            console.log('\n2. Actualizando estado de la primera entrega...');
            const idEntrega = entregas.entregas[0].id_empleado_ciclo;
            await EntregaDotacionModel.updateEstado(
                idEntrega,
                'entregado',
                1,
                'Entrega realizada en pruebas'
            );
            console.log('Estado actualizado correctamente');

            // 3. Verificar estadísticas
            console.log('\n3. Verificando estadísticas del ciclo...');
            const stats = await EntregaDotacionModel.getEstadisticasCiclo(
                entregas.entregas[0].id_ciclo
            );
            console.log('Estadísticas:', stats);
        } else {
            console.log('No se encontraron entregas para probar');
        }

        console.log('\n=== Pruebas completadas exitosamente ===');
    } catch (error) {
        console.error('Error en las pruebas:', error);
    } finally {
        process.exit(0);
    }
}

testEntregas();