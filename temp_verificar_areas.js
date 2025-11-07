const mysql = require('mysql2/promise');

async function verificarAreas() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'SIRDS'
    });

    console.log('✅ Conectado a MySQL\n');

    // Ver TODAS las áreas
    console.log('📋 TODAS LAS ÁREAS EN LA BASE DE DATOS:');
    const [todasAreas] = await conn.execute(
      `SELECT id_area, nombre_area, estado, 
              LENGTH(nombre_area) as longitud,
              HEX(nombre_area) as hex_nombre
       FROM area 
       ORDER BY id_area`
    );
    console.table(todasAreas);

    // Query específica que usa el backend
    console.log('\n🔍 QUERY DEL BACKEND (nombre exacto):');
    const [areasBackend] = await conn.execute(
      `SELECT id_area, nombre_area FROM area WHERE nombre_area IN ('Producción', 'Mercadista')`
    );
    console.table(areasBackend);

    // Query con LIKE
    console.log('\n🔍 QUERY CON LIKE:');
    const [areasLike] = await conn.execute(
      `SELECT id_area, nombre_area, estado FROM area WHERE nombre_area LIKE '%mercadista%' OR nombre_area LIKE '%Mercadista%'`
    );
    console.table(areasLike);

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarAreas();
