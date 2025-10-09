// Archivo para probar la conexión a la base de datos
const { testConnection } = require('./backend/config/database');

async function main() {
    console.log('🔍 Probando conexión a la base de datos...');
    
    const isConnected = await testConnection();
    
    if (isConnected) {
        console.log('🎉 ¡Conexión exitosa! La base de datos está funcionando correctamente.');
    } else {
        console.log('❌ Error de conexión. Verifica las credenciales en el archivo .env');
    }
    
    process.exit(0);
}

main().catch(console.error);
