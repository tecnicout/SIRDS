const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Ams35117',
  database: 'SIRDS'
};

async function checkUser() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('=== VERIFICANDO ESTRUCTURA DE ROLES ===');
    const [roles] = await connection.execute('SELECT * FROM rol ORDER BY id_rol');
    console.table(roles);
    
    console.log('\n=== VERIFICANDO USUARIO MURCIA21 ===');
    const [users] = await connection.execute(`
      SELECT u.*, r.nombre_rol 
      FROM usuario u 
      LEFT JOIN rol r ON u.id_rol = r.id_rol 
      WHERE u.email = 'murcia21.gmz@gmail.com'
    `);
    console.table(users);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUser();