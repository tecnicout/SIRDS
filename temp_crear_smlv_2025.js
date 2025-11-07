const mysql = require('mysql2/promise');

async function crearSMLV2025() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Ams35117',
      database: 'SIRDS'
    });

    console.log('✅ Conectado a MySQL\n');

    // Verificar si ya existe SMLV 2025
    const [existente] = await conn.execute(
      `SELECT * FROM salario_minimo WHERE anio = 2025`
    );

    if (existente.length > 0) {
      console.log('ℹ️  SMLV 2025 ya existe:');
      console.table(existente);
    } else {
      console.log('📝 Insertando SMLV 2025: $1,423,500');
      
      // Obtener un usuario administrador para el campo creado_por
      const [usuarios] = await conn.execute(
        `SELECT id_usuario FROM usuario WHERE id_rol = 1 LIMIT 1`
      );
      
      const id_usuario = usuarios.length > 0 ? usuarios[0].id_usuario : 1;

      await conn.execute(
        `INSERT INTO salario_minimo (anio, valor_mensual, creado_por) 
         VALUES (2025, 1423500, ?)`,
        [id_usuario]
      );

      console.log('✅ SMLV 2025 creado exitosamente');
    }

    // Mostrar todos los SMLV registrados
    const [todos] = await conn.execute(
      `SELECT id_salario, anio, valor_mensual, creado_por, fecha_creacion 
       FROM salario_minimo 
       ORDER BY anio DESC`
    );

    console.log('\n📋 Todos los SMLV registrados:');
    console.table(todos);

    await conn.end();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearSMLV2025();
