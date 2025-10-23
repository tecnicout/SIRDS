const axios = require('axios');

async function testLogin() {
  try {
    console.log('=== PROBANDO LOGIN CON USUARIO ADMINISTRADOR ===');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'murcia21.gmz@gmail.com',
      password: 'murcia21'
    });
    
    console.log('✅ Login exitoso!');
    console.log('Token:', response.data.token ? 'Generado correctamente' : 'NO GENERADO');
    console.log('Usuario:', response.data.user);
    console.log('Rol ID:', response.data.user.id_rol);
    console.log('Nombre Rol:', response.data.user.nombre_rol);
    
    // Probar endpoint protegido de usuarios
    console.log('\n=== PROBANDO ACCESO A USUARIOS ===');
    const usersResponse = await axios.get('http://localhost:3001/api/usuarios', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Acceso a usuarios exitoso!');
    console.log('Total usuarios:', usersResponse.data.data.length);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testLogin();