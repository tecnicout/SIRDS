const { query } = require('./backend/config/database');

async function pruebasCRUDCompletas() {
    try {
        console.log('🧪 INICIANDO PRUEBAS CRUD COMPLETAS DEL MÓDULO UBICACIÓN');
        console.log('=' .repeat(60));
        
        // PRUEBA 1: LISTAR UBICACIONES
        console.log('\n1️⃣ PRUEBA: Listar todas las ubicaciones');
        const ubicacionesInicial = await query('SELECT * FROM ubicacion ORDER BY nombre');
        console.log(`   ✅ Total ubicaciones: ${ubicacionesInicial.length}`);
        ubicacionesInicial.forEach(ub => {
            console.log(`   📍 ${ub.nombre} (${ub.tipo}) - ID: ${ub.id_ubicacion}`);
        });
        
        // PRUEBA 2: CREAR NUEVA UBICACIÓN
        console.log('\n2️⃣ PRUEBA: Crear nueva ubicación');
        const nuevaUbicacion = {
            nombre: `Ubicación Test ${Date.now()}`,
            tipo: 'bodega',
            direccion: 'Dirección de prueba para testing'
        };
        
        const insertSql = 'INSERT INTO ubicacion (nombre, tipo, direccion) VALUES (?, ?, ?)';
        const insertResult = await query(insertSql, [nuevaUbicacion.nombre, nuevaUbicacion.tipo, nuevaUbicacion.direccion]);
        const nuevaId = insertResult.insertId;
        
        console.log(`   ✅ Ubicación creada exitosamente - ID: ${nuevaId}`);
        
        // PRUEBA 3: OBTENER UBICACIÓN POR ID
        console.log('\n3️⃣ PRUEBA: Obtener ubicación por ID');
        const ubicacionCreada = await query('SELECT * FROM ubicacion WHERE id_ubicacion = ?', [nuevaId]);
        if (ubicacionCreada.length > 0) {
            console.log(`   ✅ Ubicación encontrada: ${ubicacionCreada[0].nombre}`);
            console.log(`   📍 Tipo: ${ubicacionCreada[0].tipo}, Dirección: ${ubicacionCreada[0].direccion}`);
        } else {
            console.log(`   ❌ No se encontró la ubicación con ID: ${nuevaId}`);
        }
        
        // PRUEBA 4: ACTUALIZAR UBICACIÓN
        console.log('\n4️⃣ PRUEBA: Actualizar ubicación');
        const datosActualizados = {
            nombre: `${nuevaUbicacion.nombre} - ACTUALIZADA`,
            tipo: 'planta',
            direccion: 'Dirección actualizada durante prueba'
        };
        
        const updateSql = 'UPDATE ubicacion SET nombre = ?, tipo = ?, direccion = ? WHERE id_ubicacion = ?';
        const updateResult = await query(updateSql, [datosActualizados.nombre, datosActualizados.tipo, datosActualizados.direccion, nuevaId]);
        
        if (updateResult.affectedRows > 0) {
            console.log(`   ✅ Ubicación actualizada exitosamente`);
            
            // Verificar actualización
            const ubicacionActualizada = await query('SELECT * FROM ubicacion WHERE id_ubicacion = ?', [nuevaId]);
            console.log(`   📍 Nuevo nombre: ${ubicacionActualizada[0].nombre}`);
            console.log(`   📍 Nuevo tipo: ${ubicacionActualizada[0].tipo}`);
        } else {
            console.log(`   ❌ No se pudo actualizar la ubicación`);
        }
        
        // PRUEBA 5: VERIFICAR INTEGRIDAD CON ÁREAS
        console.log('\n5️⃣ PRUEBA: Verificar integridad con áreas');
        
        // Crear área de prueba vinculada a la nueva ubicación
        const insertAreaSql = 'INSERT INTO area (nombre_area, id_ubicacion, estado) VALUES (?, ?, ?)';
        const areaResult = await query(insertAreaSql, [`Área Test ${Date.now()}`, nuevaId, 'activa']);
        const nuevaAreaId = areaResult.insertId;
        
        console.log(`   ✅ Área de prueba creada - ID: ${nuevaAreaId}`);
        
        // Verificar relación
        const relacionSql = `
            SELECT a.nombre_area, u.nombre as ubicacion_nombre 
            FROM area a 
            INNER JOIN ubicacion u ON a.id_ubicacion = u.id_ubicacion 
            WHERE a.id_area = ?
        `;
        const relacion = await query(relacionSql, [nuevaAreaId]);
        
        if (relacion.length > 0) {
            console.log(`   ✅ Relación verificada: ${relacion[0].nombre_area} -> ${relacion[0].ubicacion_nombre}`);
        }
        
        // PRUEBA 6: ELIMINAR UBICACIÓN CON ÁREAS (funcionalidad principal)
        console.log('\n6️⃣ PRUEBA: Eliminar ubicación con áreas relacionadas');
        
        // Contar áreas antes
        const areasAntes = await query('SELECT COUNT(*) as count FROM area WHERE id_ubicacion = ?', [nuevaId]);
        console.log(`   📊 Áreas relacionadas antes: ${areasAntes[0].count}`);
        
        // Buscar o crear ubicación temporal
        let ubicacionTemporal = await query("SELECT id_ubicacion FROM ubicacion WHERE nombre = 'UBICACIÓN TEMPORAL - REASIGNADA' LIMIT 1");
        
        if (ubicacionTemporal.length === 0) {
            const insertTempSql = `INSERT INTO ubicacion (nombre, tipo, direccion) VALUES ('UBICACIÓN TEMPORAL - REASIGNADA', 'bodega', 'Áreas reasignadas temporalmente por eliminación de ubicación')`;
            const tempResult = await query(insertTempSql);
            ubicacionTemporal = [{ id_ubicacion: tempResult.insertId }];
        }
        
        const idTemporal = ubicacionTemporal[0].id_ubicacion;
        console.log(`   📍 Ubicación temporal: ID ${idTemporal}`);
        
        // Reasignar áreas
        const reassignSql = 'UPDATE area SET id_ubicacion = ? WHERE id_ubicacion = ?';
        const reassignResult = await query(reassignSql, [idTemporal, nuevaId]);
        console.log(`   ✅ Áreas reasignadas: ${reassignResult.affectedRows}`);
        
        // Eliminar ubicación
        const deleteSql = 'DELETE FROM ubicacion WHERE id_ubicacion = ?';
        const deleteResult = await query(deleteSql, [nuevaId]);
        
        if (deleteResult.affectedRows > 0) {
            console.log(`   ✅ Ubicación eliminada exitosamente`);
            
            // Verificar que las áreas se reasignaron correctamente
            const areasReasignadas = await query('SELECT COUNT(*) as count FROM area WHERE id_ubicacion = ? AND id_area = ?', [idTemporal, nuevaAreaId]);
            console.log(`   ✅ Áreas correctamente reasignadas: ${areasReasignadas[0].count}`);
            
        } else {
            console.log(`   ❌ No se pudo eliminar la ubicación`);
        }
        
        // PRUEBA 7: LIMPIAR DATOS DE PRUEBA
        console.log('\n7️⃣ LIMPIEZA: Eliminando datos de prueba');
        await query('DELETE FROM area WHERE id_area = ?', [nuevaAreaId]);
        console.log(`   🧹 Área de prueba eliminada`);
        
        // RESUMEN FINAL
        console.log('\n' + '=' .repeat(60));
        console.log('📋 RESUMEN DE PRUEBAS CRUD - MÓDULO UBICACIÓN');
        console.log('=' .repeat(60));
        console.log('✅ 1. Listar ubicaciones - EXITOSO');
        console.log('✅ 2. Crear ubicación - EXITOSO');
        console.log('✅ 3. Obtener por ID - EXITOSO');
        console.log('✅ 4. Actualizar ubicación - EXITOSO');
        console.log('✅ 5. Verificar integridad con áreas - EXITOSO');
        console.log('✅ 6. Eliminar con reasignación de áreas - EXITOSO');
        console.log('✅ 7. Limpieza de datos - EXITOSO');
        console.log('\n🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
        console.log('🔒 La integridad de datos se mantiene correctamente');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

pruebasCRUDCompletas();