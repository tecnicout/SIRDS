const mysql = require('mysql2/promise');

async function crearSMLV2025EnAmbasDB() {
  try {
    // SIRDS (mayúsculas)
    console.log('📝 Verificando/Insertando en base de datos: SIRDS');
    const connSIRDS = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'SIRDS'
    });

    const [existenteSIRDS] = await connSIRDS.execute(
      `SELECT * FROM salario_minimo WHERE anio = 2025`
    );

    if (existenteSIRDS.length === 0) {
      await connSIRDS.execute(
        `INSERT INTO salario_minimo (anio, valor_mensual, creado_por) 
         VALUES (2025, 1423500, 1)`
      );
      console.log('✅ SMLV 2025 creado en SIRDS');
    } else {
      console.log('✅ SMLV 2025 ya existe en SIRDS');
    }

    const [todosSIRDS] = await connSIRDS.execute(
      `SELECT id_salario, anio, valor_mensual FROM salario_minimo WHERE anio = 2025`
    );
    console.table(todosSIRDS);
    await connSIRDS.end();

    // sirds (minúsculas)
    console.log('\n📝 Verificando/Insertando en base de datos: sirds');
    const connsirds = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'sirds'
    });

    const [existentesirds] = await connsirds.execute(
      `SELECT * FROM salario_minimo WHERE anio = 2025`
    );

    if (existentesirds.length === 0) {
      await connsirds.execute(
        `INSERT INTO salario_minimo (anio, valor_mensual, creado_por) 
         VALUES (2025, 1423500, 1)`
      );
      console.log('✅ SMLV 2025 creado en sirds');
    } else {
      console.log('✅ SMLV 2025 ya existe en sirds');
    }

    const [todossirds] = await connsirds.execute(
      `SELECT id_salario, anio, valor_mensual FROM salario_minimo WHERE anio = 2025`
    );
    console.table(todossirds);
    await connsirds.end();

    console.log('\n✅ Proceso completado en ambas bases de datos');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearSMLV2025EnAmbasDB();
