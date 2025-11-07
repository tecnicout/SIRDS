const { query } = require('./backend/config/database');

async function checkTable() {
  try {
    console.log('=== Verificando estructura de empleado_ciclo ===\n');
    
    const [columns] = await query(`
      SHOW COLUMNS FROM empleado_ciclo
    `);

    console.log('Columnas:', columns);

  } catch (error) {
    console.error('Error al verificar tabla:', error);
    process.exit(1);
  }
}

checkTable();