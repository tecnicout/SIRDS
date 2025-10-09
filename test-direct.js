// Prueba de conexión directa
const mysql = require('mysql2/promise');

async function testDirectConnection() {
    console.log('🔍 Probando conexión directa a MySQL...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'Ams35117',
            database: 'SIRDS'
        });
        
        console.log('✅ Conexión directa exitosa!');
        
        // Probar una consulta simple
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM Empleado');
        console.log(`📊 Empleados en la base de datos: ${rows[0].total}`);
        
        await connection.end();
        console.log('🎉 Todo funcionando correctamente!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDirectConnection();