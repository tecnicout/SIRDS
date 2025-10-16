const { query } = require('./backend/config/database');

async function verificarEstructuraArea() {
    try {
        console.log('🔍 Verificando estructura de la tabla area...\n');
        
        const estructura = await query('DESCRIBE area');
        console.log('📋 Estructura de la tabla area:');
        estructura.forEach(campo => {
            console.log(`   ${campo.Field}: ${campo.Type} ${campo.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${campo.Key ? `[${campo.Key}]` : ''} ${campo.Default !== null ? `Default: ${campo.Default}` : ''}`);
        });
        
        // Verificar restricciones de clave foránea
        console.log('\n🔗 Verificando restricciones de clave foránea...');
        const constraints = await query(`
            SELECT 
                CONSTRAINT_NAME,
                COLUMN_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME,
                DELETE_RULE,
                UPDATE_RULE
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'area' 
            AND CONSTRAINT_NAME != 'PRIMARY' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        constraints.forEach(constraint => {
            console.log(`   ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
            console.log(`     DELETE: ${constraint.DELETE_RULE}, UPDATE: ${constraint.UPDATE_RULE}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

verificarEstructuraArea();