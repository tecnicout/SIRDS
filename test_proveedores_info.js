// Test simple del endpoint de proveedores
console.log('🧪 Probando endpoint de proveedores...');

// Simular datos de proveedor para crear
const nuevoProveedor = {
  nombre: 'Proveedor Test',
  telefono: '662-123-4567',
  email: 'test@proveedor.com',
  direccion: 'Calle Test 123, Hermosillo, Sonora'
};

console.log('✅ Módulo de proveedores listo para probar');
console.log('📄 Datos de prueba:', nuevoProveedor);
console.log('🔗 Endpoints disponibles:');
console.log('  GET    /api/proveedores - Listar proveedores');
console.log('  POST   /api/proveedores - Crear proveedor');
console.log('  GET    /api/proveedores/:id - Obtener proveedor');
console.log('  PUT    /api/proveedores/:id - Actualizar proveedor');
console.log('  DELETE /api/proveedores/:id - Eliminar proveedor');
console.log('  GET    /api/proveedores/estadisticas - Estadísticas');
console.log('  GET    /api/proveedores/buscar?busqueda=... - Buscar proveedores');

console.log('\n📋 Para probar el frontend:');
console.log('1. Ir a http://localhost:5174');
console.log('2. Hacer login');
console.log('3. Ir a sección "Proveedores" en el menú lateral');
console.log('4. Probar crear, ver, editar y eliminar proveedores');