require('dotenv').config();

console.log('🔧 Probando API /forgot-password directamente\n');

async function probarAPIForgotPassword() {
    try {
        const email = 'jdurancastellanos21@gmail.com';
        
        console.log('📧 Probando con email:', email);
        console.log('🌐 URL del servidor:', 'http://localhost:3001/api/auth/forgot-password');
        
        const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        console.log('📊 Status de respuesta:', response.status);
        console.log('📊 Status text:', response.statusText);
        
        const result = await response.text(); // Usar text() primero para ver la respuesta cruda
        console.log('📄 Respuesta cruda:', result);
        
        try {
            const jsonResult = JSON.parse(result);
            console.log('📄 Respuesta JSON:', JSON.stringify(jsonResult, null, 2));
        } catch (parseError) {
            console.log('❌ Error parseando JSON:', parseError.message);
            console.log('📄 La respuesta no es JSON válido');
        }
        
    } catch (error) {
        console.error('❌ Error en la petición:');
        console.error('   Tipo:', error.name);
        console.error('   Mensaje:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 SOLUCIÓN:');
            console.log('   El servidor no está corriendo en el puerto 3001');
            console.log('   Ejecuta: npm run dev');
        } else if (error.message.includes('fetch is not defined')) {
            console.log('\n💡 SOLUCIÓN:');
            console.log('   Necesitas Node.js 18+ o instalar node-fetch');
        }
    }
}

probarAPIForgotPassword();