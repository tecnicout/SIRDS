const { pool } = require('./backend/config/database');

async function checkConstraints() {
  try {
    console.log('=== Verificando restricciones de ciclo_dotacion ===\n');
    
    const [constraints] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME, 
        CHECK_CLAUSE 
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'ciclo_dotacion'
    `);

    console.log('Restricciones encontradas:', constraints);

  } catch (error) {
    console.error('Error al verificar restricciones:', error);
  } finally {
    pool.end();
  }
}

checkConstraints();