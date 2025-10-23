const mysql = require('mysql2');
require('dotenv').config();

console.log('🔧 Configurando Base de Datos para Sistema de Password Reset - SIRDS\n');

// Conexión como root para crear la base de datos si no existe
const adminConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: 'root',
  password: process.env.DB_PASSWORD
});

adminConnection.connect((err) => {
  if (err) {
    console.log('❌ Error conectando como administrador:', err.message);
    return;
  }
  
  console.log('✅ Conexión como administrador exitosa');
  
  // Crear base de datos si no existe
  adminConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.log('❌ Error creando base de datos:', err.message);
      return;
    }
    
    console.log('✅ Base de datos SIRDS creada/verificada');
    
    // Usar la base de datos
    adminConnection.query(`USE ${process.env.DB_NAME}`, (err) => {
      if (err) {
        console.log('❌ Error usando base de datos:', err.message);
        return;
      }
      
      // Verificar si la tabla Usuario existe
      adminConnection.query('SHOW TABLES LIKE "Usuario"', (err, results) => {
        if (err) {
          console.log('❌ Error verificando tablas:', err.message);
          return;
        }
        
        if (results.length === 0) {
          console.log('📋 Creando tabla Usuario...');
          
          const createUserTable = `
            CREATE TABLE Usuario (
              id_usuario INT PRIMARY KEY AUTO_INCREMENT,
              id_empleado INT,
              username VARCHAR(50) UNIQUE NOT NULL,
              email VARCHAR(100) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              rol_sistema ENUM('Admin', 'Usuario', 'Supervisor') DEFAULT 'Usuario',
              activo BOOLEAN DEFAULT TRUE,
              fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              reset_token VARCHAR(255) NULL,
              reset_token_expiration DATETIME NULL,
              INDEX idx_reset_token (reset_token),
              INDEX idx_email (email),
              INDEX idx_username (username)
            )
          `;
          
          adminConnection.query(createUserTable, (err) => {
            if (err) {
              console.log('❌ Error creando tabla Usuario:', err.message);
              return;
            }
            
            console.log('✅ Tabla Usuario creada exitosamente');
            createTestUser();
          });
        } else {
          console.log('✅ Tabla Usuario ya existe');
          
          // Verificar si tiene los campos de password reset
          adminConnection.query('DESCRIBE Usuario', (err, results) => {
            if (err) {
              console.log('❌ Error describiendo tabla:', err.message);
              return;
            }
            
            const hasResetToken = results.some(col => col.Field === 'reset_token');
            const hasResetTokenExpiration = results.some(col => col.Field === 'reset_token_expiration');
            
            if (!hasResetToken || !hasResetTokenExpiration) {
              console.log('📋 Agregando campos para password reset...');
              
              const queries = [];
              if (!hasResetToken) {
                queries.push('ALTER TABLE Usuario ADD COLUMN reset_token VARCHAR(255) NULL');
              }
              if (!hasResetTokenExpiration) {
                queries.push('ALTER TABLE Usuario ADD COLUMN reset_token_expiration DATETIME NULL');
              }
              
              let completed = 0;
              queries.forEach(query => {
                adminConnection.query(query, (err) => {
                  if (err) {
                    console.log('❌ Error agregando campo:', err.message);
                  } else {
                    completed++;
                    if (completed === queries.length) {
                      console.log('✅ Campos de password reset agregados');
                      checkTestUser();
                    }
                  }
                });
              });
            } else {
              console.log('✅ Campos de password reset ya existen');
              checkTestUser();
            }
          });
        }
      });
    });
  });
});

function createTestUser() {
  console.log('\n👤 Creando usuario de prueba...');
  
  const bcrypt = require('bcryptjs');
  const testPassword = bcrypt.hashSync('123456', 10);
  
  const insertUser = `
    INSERT INTO Usuario (username, email, password, rol_sistema) 
    VALUES ('admin', 'admin@molinosonora.com', ?, 'Admin')
  `;
  
  adminConnection.query(insertUser, [testPassword], (err) => {
    if (err) {
      console.log('❌ Error creando usuario de prueba:', err.message);
    } else {
      console.log('✅ Usuario de prueba creado (admin / 123456)');
    }
    
    finishSetup();
  });
}

function checkTestUser() {
  console.log('\n👤 Verificando usuario de prueba...');
  
  adminConnection.query('SELECT * FROM Usuario WHERE username = "admin"', (err, results) => {
    if (err) {
      console.log('❌ Error verificando usuario:', err.message);
    } else if (results.length === 0) {
      createTestUser();
      return;
    } else {
      console.log('✅ Usuario de prueba ya existe');
    }
    
    finishSetup();
  });
}

function finishSetup() {
  console.log('\n🎉 ¡Configuración de Base de Datos Completada!');
  console.log('===============================================');
  console.log('📊 Base de datos: SIRDS');
  console.log('👤 Usuario de prueba: admin@molinosonora.com / 123456');
  console.log('🔑 Campos de password reset: Configurados');
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Configurar credenciales SMTP en .env');
  console.log('   2. Ejecutar: npm run dev');
  console.log('   3. Probar password reset en el frontend');
  
  adminConnection.end();
}