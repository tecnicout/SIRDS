const fetch = require('node-fetch');

async function pruebaRapidaEliminacion() {
    try {
        // Crear ubicación de prueba primero
        console.log('🔐 Haciendo login...');
        
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'murcia21.gmz@gmail.com', password: '123456' })
        });
        
        const loginResult = await loginResponse.json();
        if (!loginResult.success) throw new Error('Login falló');
        
        const token = loginResult.data.token;
        console.log('✅ Login exitoso');
        
        // Crear ubicación de prueba
        console.log('\n➕ Creando ubicación de prueba...');
        const createResponse = await fetch('http://localhost:3001/api/ubicaciones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: `Test Eliminación ${Date.now()}`,
                tipo: 'bodega',
                direccion: 'Ubicación de prueba para eliminar'
            })
        });
        
        const createResult = await createResponse.json();
        if (!createResult.success) throw new Error('Error crear ubicación');
        
        const nuevaUbicacionId = createResult.data.id;
        console.log(`✅ Ubicación creada: ID ${nuevaUbicacionId}`);
        
        // Intentar eliminar inmediatamente
        console.log('\n🗑️ Eliminando ubicación de prueba...');
        const deleteResponse = await fetch(`http://localhost:3001/api/ubicaciones/${nuevaUbicacionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const deleteResult = await deleteResponse.json();
        console.log(`Status: ${deleteResponse.status}`);
        console.log(`Success: ${deleteResult.success}`);
        console.log(`Message: ${deleteResult.message}`);
        
        if (deleteResult.success) {
            console.log('✅ ÉXITO: Funcionalidad de eliminación funcionando');
        } else {
            console.log('❌ ERROR:', deleteResult);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

pruebaRapidaEliminacion();