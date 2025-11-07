const { query } = require('./backend/config/database');

async function verificarEmpleadosCiclo() {
  try {
    console.log('\n📋 VERIFICANDO EMPLEADOS EN CICLOS\n');
    
    // Ver ciclos creados
    const ciclos = await query(
      `SELECT id_ciclo, nombre_ciclo, fecha_entrega, estado, total_empleados_elegibles 
       FROM ciclo_dotacion 
       ORDER BY id_ciclo DESC 
       LIMIT 5`
    );
    
    console.log('=== CICLOS CREADOS ===');
    console.table(ciclos);
    
    // Ver empleados asignados
    const empleadosCiclo = await query(
      `SELECT 
        ec.id_empleado_ciclo,
        ec.id_ciclo,
        cd.nombre_ciclo,
        ec.id_empleado,
        CONCAT(e.nombre, ' ', e.apellido) as empleado,
        ec.estado,
        ec.antiguedad_meses,
        ec.sueldo_al_momento,
        a.nombre_area,
        ec.fecha_asignacion
      FROM empleado_ciclo ec
      INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
      INNER JOIN area a ON ec.id_area = a.id_area
      INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
      ORDER BY ec.id_empleado_ciclo DESC
      LIMIT 20`
    );
    
    console.log('\n=== EMPLEADOS ASIGNADOS A CICLOS ===');
    if (empleadosCiclo.length === 0) {
      console.log('❌ NO HAY EMPLEADOS ASIGNADOS A CICLOS');
    } else {
      console.table(empleadosCiclo);
    }
    
    // Resumen por estado
    const resumen = await query(
      `SELECT 
        cd.nombre_ciclo,
        ec.estado,
        COUNT(*) as total
      FROM empleado_ciclo ec
      INNER JOIN ciclo_dotacion cd ON ec.id_ciclo = cd.id_ciclo
      GROUP BY cd.nombre_ciclo, ec.estado
      ORDER BY cd.id_ciclo DESC, ec.estado`
    );
    
    console.log('\n=== RESUMEN POR ESTADO ===');
    console.table(resumen);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarEmpleadosCiclo();
