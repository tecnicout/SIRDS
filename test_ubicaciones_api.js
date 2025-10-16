const fetch = require('node-fetch');

async function probarUbicaciones() {
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
        
        console.log('\n📍 Probando API de ubicaciones...');
        
        // Obtener todas las ubicaciones
        const ubicacionesResponse = await fetch('http://localhost:3001/api/ubicaciones', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const ubicacionesResult = await ubicacionesResponse.json();
        
        console.log('\n📋 Resultado API ubicaciones:');
        console.log(`Status: ${ubicacionesResponse.status}`);
        console.log(`Success: ${ubicacionesResult.success}`);
        console.log(`Message: ${ubicacionesResult.message}`);
        
        if (ubicacionesResult.success && ubicacionesResult.data) {
            console.log(`Total ubicaciones: ${ubicacionesResult.data.length}`);
            console.log('\n🏭 Ubicaciones encontradas:');
            ubicacionesResult.data.forEach((ub, index) => {
                console.log(`${index + 1}. ${ub.nombre} (${ub.tipo}) - ${ub.direccion || 'Sin dirección'}`);
            });
        }
        
        // Probar crear ubicación
        console.log('\n➕ Probando crear nueva ubicación...');
        const nuevaUbicacion = {
            nombre: 'Test Ubicación ' + Date.now(),
            tipo: 'bodega',
            direccion: 'Dirección de prueba 123'
        };
        
        const createResponse = await fetch('http://localhost:3001/api/ubicaciones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevaUbicacion)
        });
        
        const createResult = await createResponse.json();
        console.log(`Create Status: ${createResponse.status}`);
        console.log(`Create Success: ${createResult.success}`);
        console.log(`Create Message: ${createResult.message}`);
        
        if (createResult.success) {
            const nuevaId = createResult.data.id;
            console.log(`✅ Ubicación creada con ID: ${nuevaId}`);
            
            // Probar eliminar la ubicación creada
            console.log('\n🗑️ Probando eliminar ubicación...');
            const deleteResponse = await fetch(`http://localhost:3001/api/ubicaciones/${nuevaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const deleteResult = await deleteResponse.json();
            console.log(`Delete Status: ${deleteResponse.status}`);
            console.log(`Delete Success: ${deleteResult.success}`);
            console.log(`Delete Message: ${deleteResult.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

probarUbicaciones();