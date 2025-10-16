const fetch = require('node-fetch');

async function probarIntegridadDatos() {
    try {
        console.log('🔐 Haciendo login...');
        
        // Login
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'murcia21.gmz@gmail.com',
                password: '123456'
            })
        });
        
        const loginResult = await loginResponse.json();
        
        if (!loginResult.success) {
            throw new Error('Login falló: ' + loginResult.message);
        }
        
        const token = loginResult.data.token;
        console.log('✅ Login exitoso');
        
        console.log('\n📊 Verificando relaciones ubicación-área...');
        
        // Obtener ubicaciones con áreas
        const ubicacionesResponse = await fetch('http://localhost:3001/api/ubicaciones', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const ubicacionesResult = await ubicacionesResponse.json();
        
        if (!ubicacionesResult.success) {
            throw new Error('Error al obtener ubicaciones');
        }
        
        console.log(`📍 Ubicaciones encontradas: ${ubicacionesResult.data.length}`);
        
        // Buscar una ubicación que tenga áreas relacionadas
        const ubicacionConAreas = ubicacionesResult.data.find(ub => ub.id_ubicacion === 1); // Planta Principal Bogotá
        
        if (!ubicacionConAreas) {
            console.log('❌ No se encontró la ubicación de prueba (ID: 1)');
            return;
        }
        
        console.log(`🔍 Probando con ubicación: ${ubicacionConAreas.nombre} (ID: ${ubicacionConAreas.id_ubicacion})`);
        
        // Verificar áreas relacionadas ANTES de eliminar
        console.log('\n📊 Consultando áreas relacionadas antes de eliminar...');
        const areasResponse = await fetch('http://localhost:3001/api/areas', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const areasResult = await areasResponse.json();
        const areasRelacionadas = areasResult.data ? 
            areasResult.data.filter(area => area.id_ubicacion === ubicacionConAreas.id_ubicacion) : [];
        
        console.log(`🔗 Áreas relacionadas encontradas: ${areasRelacionadas.length}`);
        areasRelacionadas.forEach(area => {
            console.log(`   - ${area.nombre_area} (ID: ${area.id_area})`);
        });
        
        if (areasRelacionadas.length === 0) {
            console.log('⚠️ Esta ubicación no tiene áreas relacionadas. Creando área de prueba...');
            
            // Crear área de prueba vinculada a esta ubicación
            const createAreaResponse = await fetch('http://localhost:3001/api/areas', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre_area: `Área Test ${Date.now()}`,
                    id_ubicacion: ubicacionConAreas.id_ubicacion
                })
            });
            
            const createAreaResult = await createAreaResponse.json();
            
            if (createAreaResult.success) {
                console.log(`✅ Área de prueba creada: ID ${createAreaResult.data.id}`);
            } else {
                console.log(`❌ Error al crear área: ${createAreaResult.message}`);
            }
        }
        
        console.log('\n🗑️ Probando eliminación de ubicación con áreas relacionadas...');
        
        // Intentar eliminar la ubicación
        const deleteResponse = await fetch(`http://localhost:3001/api/ubicaciones/${ubicacionConAreas.id_ubicacion}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const deleteResult = await deleteResponse.json();
        
        console.log(`\n📋 Resultado de eliminación:`);
        console.log(`Status: ${deleteResponse.status}`);
        console.log(`Success: ${deleteResult.success}`);
        console.log(`Message: ${deleteResult.message}`);
        
        if (deleteResult.data) {
            console.log(`Áreas desvinculadas: ${deleteResult.data.areasDesvinculadas}`);
        }
        
        if (deleteResult.success) {
            console.log('✅ ÉXITO: Ubicación eliminada correctamente respetando integridad');
            
            // Verificar que la ubicación se eliminó
            const verifyResponse = await fetch(`http://localhost:3001/api/ubicaciones/${ubicacionConAreas.id_ubicacion}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (verifyResponse.status === 404) {
                console.log('✅ Confirmado: Ubicación efectivamente eliminada');
            }
            
            // Verificar que las áreas se desvincularon correctamente
            if (areasRelacionadas.length > 0) {
                console.log('\n🔍 Verificando desvinculación de áreas...');
                
                const areasAfterResponse = await fetch('http://localhost:3001/api/areas', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const areasAfterResult = await areasAfterResponse.json();
                const areasDespues = areasAfterResult.data ? 
                    areasAfterResult.data.filter(area => 
                        areasRelacionadas.some(ar => ar.id_area === area.id_area)
                    ) : [];
                
                const areasDesvinculadasCorrectamente = areasDespues.filter(area => area.id_ubicacion === null);
                
                console.log(`✅ Áreas desvinculadas correctamente: ${areasDesvinculadasCorrectamente.length}/${areasRelacionadas.length}`);
            }
            
        } else {
            console.log('❌ FALLO: Error al eliminar ubicación');
            console.log('   Esto puede indicar un problema de integridad referencial');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

probarIntegridadDatos();