// Script para inicializar la base de datos
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    console.log('🚀 Iniciando configuración de la base de datos SIRDS...');
    
    // Configuración de conexión (sin especificar base de datos inicialmente)
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'Ams35117'
    });
    
    try {
        // Leer el archivo SQL
        const sqlFilePath = path.join(__dirname, 'database_init.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Dividir el contenido en statements individuales
        const statements = sqlContent
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));
        
        console.log(`📄 Ejecutando ${statements.length} comandos SQL...`);
        
        // Ejecutar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.length > 0) {
                try {
                    await connection.execute(statement);
                    if (i % 10 === 0) {
                        console.log(`⏳ Progreso: ${i + 1}/${statements.length} comandos ejecutados`);
                    }
                } catch (error) {
                    console.log(`⚠️  Warning en statement ${i + 1}: ${error.message}`);
                }
            }
        }
        
        console.log('✅ Base de datos inicializada correctamente');
        console.log('📊 Datos de prueba insertados');
        console.log('🎉 SIRDS está listo para usar!');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error.message);
    } finally {
        await connection.end();
    }
}

// Ejecutar la inicialización
initializeDatabase().catch(console.error);