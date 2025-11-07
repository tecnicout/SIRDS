const mysql = require('mysql2/promise');

async function crearMercadistaEnAmbasDB() {
  try {
    // Conexión a SIRDS (mayúsculas)
    console.log('📝 Insertando en base de datos: SIRDS');
    const connSIRDS = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'SIRDS'
    });

    await connSIRDS.execute(
      `INSERT INTO area (nombre_area, estado) 
       SELECT 'Mercadista', 'activa' 
       WHERE NOT EXISTS (SELECT 1 FROM area WHERE nombre_area = 'Mercadista')`
    );

    const [areasSIRDS] = await connSIRDS.execute(
      `SELECT id_area, nombre_area, estado FROM area WHERE nombre_area IN ('Producción', 'Mercadista') ORDER BY nombre_area`
    );
    console.log('✅ Áreas en SIRDS:');
    console.table(areasSIRDS);
    await connSIRDS.end();

    // Conexión a sirds (minúsculas)
    console.log('\n📝 Insertando en base de datos: sirds');
    const connsirds = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'sirds'
    });

    await connsirds.execute(
      `INSERT INTO area (nombre_area, estado) 
       SELECT 'Mercadista', 'activa' 
       WHERE NOT EXISTS (SELECT 1 FROM area WHERE nombre_area = 'Mercadista')`
    );

    const [areassirds] = await connsirds.execute(
      `SELECT id_area, nombre_area, estado FROM area WHERE nombre_area IN ('Producción', 'Mercadista') ORDER BY nombre_area`
    );
    console.log('✅ Áreas en sirds:');
    console.table(areassirds);
    await connsirds.end();

    console.log('\n✅ Proceso completado en ambas bases de datos');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearMercadistaEnAmbasDB();
