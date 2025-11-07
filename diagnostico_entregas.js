const { pool, query } = require('./backend/config/database');

async function diagnosticoEntregas() {
    try {
        console.log('🔍 Iniciando diagnóstico de entregas...\n');

        // 1. Verificar ciclo activo
        console.log('1. Verificando ciclo activo:');
        const [cicloActivo] = await query(`
            SELECT * FROM ciclo_dotacion 
            WHERE estado = 'activo' 
            AND CURDATE() BETWEEN fecha_inicio_ventana AND fecha_fin_ventana
        `);
        
        if (!cicloActivo) {
            console.log('❌ No hay ciclo activo');
            return;
        }
        console.log('✅ Ciclo activo encontrado:', {
            id_ciclo: cicloActivo.id_ciclo,
            nombre_ciclo: cicloActivo.nombre_ciclo,
            fecha_entrega: cicloActivo.fecha_entrega
        });

        // 2. Verificar empleados elegibles
        console.log('\n2. Verificando empleados elegibles:');
        const [empleadosElegibles] = await query(`
            SELECT e.*, a.nombre_area,
            TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses,
            e.sueldo / (SELECT valor_mensual FROM salario_minimo WHERE anio = YEAR(CURDATE()) LIMIT 1) as multiplo_smlv
            FROM empleado e
            INNER JOIN area a ON e.id_area = a.id_area
            WHERE e.estado = 1
            AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 4
            AND e.sueldo <= (SELECT valor_mensual * 2 FROM salario_minimo WHERE anio = YEAR(CURDATE()) LIMIT 1)
        `);
        console.log(`✅ Empleados elegibles encontrados: ${empleadosElegibles.length}`);

        // 3. Verificar empleados en ciclo actual
        console.log('\n3. Verificando empleados en ciclo actual:');
        const [empleadosCiclo] = await query(`
            SELECT ec.*, e.nombre, e.apellido, e.identificacion, e.sueldo,
            k.nombre_kit, a.nombre_area
            FROM empleado_ciclo ec
            INNER JOIN empleado e ON ec.id_empleado = e.id_empleado
            INNER JOIN area a ON e.id_area = a.id_area
            LEFT JOIN kitdotacion k ON ec.id_kit = k.id_kit
            WHERE ec.id_ciclo = ?
        `, [cicloActivo.id_ciclo]);
        
        console.log(`✅ Empleados en ciclo actual: ${empleadosCiclo.length}`);
        
        // 4. Identificar discrepancias
        console.log('\n4. Analizando discrepancias:');
        const empleadosElegiblesIds = new Set(empleadosElegibles.map(e => e.id_empleado));
        const empleadosCicloIds = new Set(empleadosCiclo.map(e => e.id_empleado));
        
        const faltantes = empleadosElegibles.filter(e => !empleadosCicloIds.has(e.id_empleado));
        console.log(`- Empleados elegibles que no están en el ciclo: ${faltantes.length}`);
        if (faltantes.length > 0) {
            console.log('Detalle de empleados faltantes:');
            faltantes.forEach(e => {
                console.log(`  - ${e.nombre} ${e.apellido} (${e.identificacion})`);
                console.log(`    Área: ${e.nombre_area}`);
                console.log(`    Antigüedad: ${e.antiguedad_meses} meses`);
                console.log(`    Múltiplo SMLV: ${e.multiplo_smlv}`);
            });
        }

        // 5. Verificar estructura de datos
        console.log('\n5. Verificando estructura de empleado_ciclo:');
        const [estructura] = await query('DESCRIBE empleado_ciclo');
        console.log('Columnas en empleado_ciclo:');
        estructura.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type}`);
        });

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    } finally {
        pool.end();
    }
}

diagnosticoEntregas();