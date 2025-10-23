const fs = require('fs');
const path = require('path');

console.log('🔧 Diagnosticando problema con .env...\n');

// Verificar que el archivo existe
const envPath = path.resolve('.env');
console.log('📍 Ruta del .env:', envPath);
console.log('📂 Existe el archivo:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    // Leer contenido raw
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('\n📄 Contenido del archivo (.env):');
    console.log('---');
    console.log(content);
    console.log('---');
    console.log('📏 Tamaño:', content.length, 'caracteres');
    
    // Intentar cargar con dotenv
    console.log('\n🔧 Probando dotenv...');
    require('dotenv').config();
    
    console.log('📊 Variables cargadas:');
    console.log('   PORT:', process.env.PORT);
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   JWT_SECRET:', process.env.JWT_SECRET);
    console.log('   SMTP_HOST:', process.env.SMTP_HOST);
    console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
} else {
    console.log('❌ El archivo .env no existe');
}