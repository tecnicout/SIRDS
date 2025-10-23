require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔧 Diagnóstico Completo - Error en Password Reset\n');

async function diagnosticarGmail() {
    try {
        console.log('📊 Configuración actual:');
        console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
        console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
        console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
        console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'Configurada (16 chars)' : 'NO CONFIGURADA'}`);
        console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
        
        // Test 1: Crear transportador
        console.log('\n🔧 Test 1: Creando transportador Gmail...');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: false, // false para puerto 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Test 2: Verificar conexión
        console.log('🔍 Test 2: Verificando conexión SMTP...');
        await transporter.verify();
        console.log('✅ Conexión SMTP exitosa!');

        // Test 3: Enviar email de prueba
        console.log('\n📧 Test 3: Enviando email de prueba...');
        const testEmail = {
            from: `"SIRDS - Sistema de Dotación" <${process.env.SMTP_USER}>`,
            to: 'jdurancastellanos21@gmail.com', // Email del usuario que está probando
            subject: '🧪 Test SIRDS - Restablecimiento de Contraseña',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #B39237 0%, #D4AF37 100%); color: white; padding: 30px; text-align: center;">
                        <h1>✅ Test Exitoso - SIRDS</h1>
                        <p>Gmail configurado correctamente</p>
                    </div>
                    <div style="padding: 30px; background: white;">
                        <h2>🎉 Configuración Exitosa</h2>
                        <p>El sistema de restablecimiento de contraseñas funciona correctamente.</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
                        <p><strong>Email SMTP:</strong> ${process.env.SMTP_USER}</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(testEmail);
        console.log('✅ Email enviado exitosamente!');
        console.log(`📧 Message ID: ${info.messageId}`);

        console.log('\n🎉 GMAIL FUNCIONANDO CORRECTAMENTE!');
        console.log('   ✅ Conexión exitosa');
        console.log('   ✅ Email de prueba enviado');
        console.log('   ✅ Configuración válida');

    } catch (error) {
        console.error('\n❌ ERROR ENCONTRADO:');
        console.error(`   Tipo: ${error.name || 'Error desconocido'}`);
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Código: ${error.code || 'N/A'}`);
        
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        
        if (error.message.includes('Invalid login')) {
            console.log('   1. ❌ Contraseña de aplicación incorrecta');
            console.log('   2. ✅ Genera una nueva contraseña de aplicación en Gmail');
            console.log('   3. ✅ Verifica que la verificación en 2 pasos esté habilitada');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.log('   1. ❌ Problema de conectividad');
            console.log('   2. ✅ Verifica tu conexión a internet');
            console.log('   3. ✅ Verifica que no haya firewall bloqueando');
        } else if (error.message.includes('ETIMEDOUT')) {
            console.log('   1. ❌ Timeout de conexión');
            console.log('   2. ✅ Verifica configuración de proxy/firewall');
        } else {
            console.log('   1. ❌ Error desconocido');
            console.log('   2. ✅ Revisa los logs completos');
            console.log('   3. ✅ Verifica todas las configuraciones');
        }
    }
}

// Ejecutar diagnóstico
diagnosticarGmail();