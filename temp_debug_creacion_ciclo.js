const { query, getConnection } = require('./backend/config/database');
const EmpleadoCicloModel = require('./backend/models/EmpleadoCicloModel');

async function debugCreacionCiclo() {
  try {
    console.log('\n🔍 DEBUG: PRUEBA DE CREACIÓN DE EMPLEADOS EN CICLO\n');
    
    // 1. Verificar que hay un ciclo
    const ciclos = await query('SELECT id_ciclo, nombre_ciclo FROM ciclo_dotacion LIMIT 1');
    console.log('1. Ciclo encontrado:', ciclos[0]);
    
    if (!ciclos[0]) {
      console.log('❌ No hay ciclos para probar');
      process.exit(1);
    }
    
    const id_ciclo = ciclos[0].id_ciclo;
    
    // 2. Obtener empleados elegibles
    const empleados = await query(
      `SELECT id_empleado, nombre, apellido, sueldo, id_area,
              TIMESTAMPDIFF(MONTH, fecha_inicio, CURDATE()) as antiguedad_meses
       FROM empleado 
       WHERE estado = 1 AND id_area IN (1, 22)
       LIMIT 3`
    );
    
    console.log('\n2. Empleados elegibles encontrados:', empleados.length);
    console.table(empleados);
    
    if (empleados.length === 0) {
      console.log('❌ No hay empleados para probar');
      process.exit(1);
    }
    
    // 3. Preparar datos para batch
    const empleadosParaCiclo = empleados.map(emp => ({
      id_empleado: emp.id_empleado,
      antiguedad_meses: emp.antiguedad_meses,
      sueldo_al_momento: emp.sueldo,
      id_area: emp.id_area
    }));
    
    console.log('\n3. Datos preparados para createBatch:');
    console.table(empleadosParaCiclo);
    
    // 4. Intentar insertar
    console.log('\n4. Ejecutando createBatch...');
    const resultado = await EmpleadoCicloModel.createBatch(id_ciclo, empleadosParaCiclo);
    
    console.log('\n✅ Resultado de createBatch:');
    console.log(resultado);
    
    // 5. Verificar en base de datos
    const verificacion = await query(
      `SELECT ec.*, CONCAT(e.nombre, ' ', e.apellido) as empleado
       FROM empleado_ciclo ec
       INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
       WHERE ec.id_ciclo = ?`,
      [id_ciclo]
    );
    
    console.log('\n6. Verificación en base de datos:');
    console.table(verificacion);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

debugCreacionCiclo();
