const mysql = require('mysql2/promise');

async function crearAreaMercadista() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'SIRDS'
    });

    console.log('✅ Conectado a MySQL');

    // Insertar área Mercadista si no existe
    await conn.execute(
      `INSERT INTO area (nombre_area, estado) 
       SELECT 'Mercadista', 'activa' 
       WHERE NOT EXISTS (SELECT 1 FROM area WHERE nombre_area = 'Mercadista')`
    );

    console.log('✅ Área Mercadista creada/verificada');

    // Verificar áreas existentes
    const [rows] = await conn.execute(
      `SELECT id_area, nombre_area, estado FROM area WHERE nombre_area IN ('Producción', 'Mercadista')`
    );

    console.log('\n📋 Áreas disponibles para ciclos:');
    console.table(rows);

    await conn.end();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

crearAreaMercadista();
