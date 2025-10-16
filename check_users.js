const { query } = require('./backend/config/database');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    try {
        console.log('🔍 Consultando usuarios en la base de datos...\n');
        
        const users = await query(`
            SELECT 
                u.id_usuario,
                u.username,
                u.email,
                u.password,
                u.rol_sistema,
                u.activo,
                e.nombre,
                e.apellido,
                e.email as email_empleado
            FROM Usuario u
            LEFT JOIN Empleado e ON u.id_empleado = e.id_empleado
            ORDER BY u.id_usuario
        `);

        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos');
            
            // Verificar si hay empleados
            const empleados = await query('SELECT id_empleado, nombre, apellido, email FROM Empleado WHERE estado = 1 LIMIT 5');
            console.log('\n📋 Empleados disponibles:');
            empleados.forEach(emp => {
                console.log(`- ID: ${emp.id_empleado}, ${emp.nombre} ${emp.apellido} (${emp.email})`);
            });
            
            return;
        }

        console.log(`✅ Encontrados ${users.length} usuarios:\n`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. Usuario: ${user.username || 'N/A'}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   Nombre: ${user.nombre || 'N/A'} ${user.apellido || 'N/A'}`);
            console.log(`   Rol: ${user.rol_sistema || 'N/A'}`);
            console.log(`   Activo: ${user.activo ? 'Sí' : 'No'}`);
            console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
            console.log('   ---');
        });

        // Buscar específicamente el usuario con el email que mencionaste
        const murciaSqlResult = await query(`
            SELECT 
                u.id_usuario,
                u.username,
                u.email,
                u.password,
                u.rol_sistema,
                u.activo,
                e.nombre,
                e.apellido
            FROM Usuario u
            LEFT JOIN Empleado e ON u.id_empleado = e.id_empleado
            WHERE u.email = ? OR e.email = ?
        `, ['murcia21.gmz@gmail.com', 'murcia21.gmz@gmail.com']);

        if (murciaSqlResult.length > 0) {
            console.log('\n🎯 Usuario encontrado con email murcia21.gmz@gmail.com:');
            const user = murciaSqlResult[0];
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
            console.log(`   Rol: ${user.rol_sistema}`);
            console.log(`   Activo: ${user.activo ? 'Sí' : 'No'}`);
            
            // Probar contraseñas comunes
            const commonPasswords = ['123456', 'password', 'admin', 'murcia21', 'murcia', '123', 'test'];
            console.log('\n🔐 Probando contraseñas comunes...');
            
            for (const pwd of commonPasswords) {
                const match = await bcrypt.compare(pwd, user.password);
                if (match) {
                    console.log(`✅ CONTRASEÑA ENCONTRADA: "${pwd}"`);
                    break;
                } else {
                    console.log(`❌ "${pwd}" - No coincide`);
                }
            }
        } else {
            console.log('\n❌ No se encontró usuario con email murcia21.gmz@gmail.com');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUsers();