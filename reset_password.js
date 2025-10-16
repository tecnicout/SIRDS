const { query } = require('./backend/config/database');
const bcrypt = require('bcryptjs');

async function resetPassword() {
    try {
        const email = 'murcia21.gmz@gmail.com';
        const newPassword = '123456'; // Contraseña temporal
        
        console.log(`🔄 Reseteando contraseña para ${email}...`);
        
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Actualizar contraseña
        const result = await query(
            'UPDATE Usuario SET password = ?, fecha_actualizacion = NOW() WHERE email = ?',
            [hashedPassword, email]
        );
        
        if (result.affectedRows > 0) {
            console.log('✅ Contraseña actualizada exitosamente');
            console.log('📧 Email: murcia21.gmz@gmail.com');
            console.log('👤 Username: fabianmurcia.gomez');
            console.log('🔑 Nueva contraseña: 123456');
            console.log('');
            console.log('⚠️  IMPORTANTE: Cambia esta contraseña después de hacer login');
        } else {
            console.log('❌ No se pudo actualizar la contraseña');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

resetPassword();