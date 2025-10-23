const axios = require('axios');

async function testAPI() {
    try {
        console.log('🔧 Probando API...');
        
        const response = await axios.post('http://localhost:3001/api/auth/forgot-password', {
            email: 'jdurancastellanos21@gmail.com'
        });
        
        console.log('✅ Éxito!');
        console.log('📊 Status:', response.status);
        console.log('📄 Respuesta:', response.data);
        
    } catch (error) {
        console.log('❌ Error:');
        if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📄 Respuesta:', error.response.data);
        } else {
            console.log('📄 Error:', error.message);
        }
    }
}

testAPI();