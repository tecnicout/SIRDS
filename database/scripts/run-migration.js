// Simple runner to execute a .sql migration file against your MySQL instance
// Usage: node database/scripts/run-migration.js <path-to-sql>
// Reads DB credentials from .env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Uso: node database/scripts/run-migration.js <ruta-del-sql>');
    process.exit(1);
  }

  const sqlPath = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error('No se encontró el archivo SQL:', sqlPath);
    process.exit(1);
  }

  const DB_HOST = process.env.DB_HOST || process.env.DB_HOSTNAME || '127.0.0.1';
  const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const DB_USER = process.env.DB_USER || process.env.DB_USERNAME || 'root';
  const DB_PASSWORD = process.env.DB_PASSWORD || process.env.DB_PASS || '';
  const DB_NAME = process.env.DB_NAME || process.env.DB_DATABASE || 'sirds';

  console.log('🔧 Ejecutando migración:' , path.basename(sqlPath));
  console.log('   Host:', DB_HOST, 'DB:', DB_NAME);

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: false
  });

  try {
    // Leer y preparar SQL
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Reemplazo amigable: si el archivo contiene "USE sirds;", lo adaptamos a la DB actual
    const useRegex = /USE\s+`?sirds`?\s*;/i;
    if (useRegex.test(sqlContent) && DB_NAME) {
      sqlContent = sqlContent.replace(useRegex, `USE \`${DB_NAME}\`;`);
    }

    // Dividir en sentencias por ; (ignorando líneas vacías y comentarios --)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Sentencias a ejecutar: ${statements.length}`);

    // Ejecutar cada sentencia de forma secuencial
    let okCount = 0; let warnCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.execute(stmt);
        okCount++;
      } catch (err) {
        // Permitir que commands como SHOW fallen sin detener el proceso
        warnCount++;
        console.log(`⚠️  Advertencia en sentencia ${i + 1}: ${err.message}`);
      }
    }

    console.log(`✅ Migración finalizada. Éxitos: ${okCount}, Advertencias: ${warnCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando la migración:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
