const http = require('http');

const data = JSON.stringify({
    email: 'jdurancastellanos21@gmail.com'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🔧 Probando API /forgot-password...');

const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📊 Headers:`, res.headers);

    let responseBody = '';
    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('📄 Respuesta:', responseBody);
        try {
            const jsonResponse = JSON.parse(responseBody);
            console.log('📄 JSON:', JSON.stringify(jsonResponse, null, 2));
        } catch (e) {
            console.log('❌ No es JSON válido');
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
});

req.write(data);
req.end();