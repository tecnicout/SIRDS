// Script para agregar la columna actualizado_por a la tabla Usuario
const { query } = require('./backend/config/database');

async function agregarColumnaActualizadoPor() {
  try {
    console.log('🔧 Agregando columna actualizado_por a la tabla Usuario...');
    
    // Verificar si la columna ya existe
    const checkSql = `
      SELECT COUNT(*) as existe 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'sirds' 
      AND TABLE_NAME = 'Usuario' 
      AND COLUMN_NAME = 'actualizado_por'
    `;
    
    const check = await query(checkSql);
    
    if (check[0].existe > 0) {
      console.log('✅ La columna actualizado_por ya existe');
      return;
    }
    
    // Agregar la columna
    const alterSql = `
      ALTER TABLE Usuario 
      ADD COLUMN actualizado_por INT NULL AFTER creado_por
    `;
    
    await query(alterSql);
    console.log('✅ Columna actualizado_por agregada exitosamente');
    
    // Verificar la estructura de la tabla
    const describeSql = `DESCRIBE Usuario`;
    const structure = await query(describeSql);
    
    console.log('📋 Estructura actualizada de la tabla Usuario:');
    structure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Extra}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Ejecutar
agregarColumnaActualizadoPor();