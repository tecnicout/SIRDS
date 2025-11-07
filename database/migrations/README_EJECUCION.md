# 🎯 GUÍA DE EJECUCIÓN - MIGRACIÓN SISTEMA DE CICLOS DE DOTACIÓN

**Fecha:** 2025-11-06  
**Versión:** 1.0  
**Base de datos:** SIRDS (MySQL 9.5)

---

## 📋 RESUMEN DE LA MIGRACIÓN

Esta migración realiza dos operaciones principales:

1. **Limpieza de datos de prueba:**
   - ✅ Consolida área "Producción" duplicada (id_area=5 → id_area=1)
   - ✅ Elimina registro duplicado sin perder datos
   - ✅ Agrega área "Mercadista" para el sistema de ciclos

2. **Implementación sistema de ciclos:**
   - ✅ Crea tabla `salario_minimo` (SMLV histórico)
   - ✅ Crea tabla `ciclo_dotacion` (ciclos cuatrimestrales)
   - ✅ Crea tabla `empleado_ciclo` (empleados elegibles por ciclo)
   - ✅ Inserta datos iniciales (SMLV 2025: $1,423,500)

---

## ⚡ MÉTODO RÁPIDO (RECOMENDADO)

### Ejecutar script maestro completo:

```bash
# Desde PowerShell en el directorio del proyecto
mysql -u root -p sirds < database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql
```

> **Nota:** Ingresa tu contraseña de MySQL cuando te lo solicite.

El script maestro ejecuta todo automáticamente en el orden correcto y muestra un reporte de validación al finalizar.

---

## 🔧 MÉTODO PASO A PASO (AVANZADO)

Si prefieres ejecutar cada fase individualmente para mayor control:

### Paso 1: Limpieza de áreas duplicadas

```bash
mysql -u root -p sirds < database/migrations/001_limpieza_areas_preparacion.sql
```

**Qué hace:**
- Migra todos los registros de `id_area=5` a `id_area=1`
- Elimina el registro duplicado de área "Producción"
- Agrega área "Mercadista" si no existe
- Muestra resumen de validación

### Paso 2: Crear sistema de ciclos

```bash
mysql -u root -p sirds < database/migrations/002_sistema_ciclos_dotacion.sql
```

**Qué hace:**
- Crea las 3 nuevas tablas con todas sus constraints
- Inserta SMLV histórico (2024, 2025, 2026)
- Crea ciclo de ejemplo para Diciembre 5, 2025
- Muestra reporte de validación completo

---

## ✅ VALIDACIÓN POST-MIGRACIÓN

Después de ejecutar la migración, verifica que todo esté correcto:

### 1. Verificar áreas consolidadas

```sql
SELECT id_area, nombre_area, estado,
       (SELECT COUNT(*) FROM empleado WHERE id_area = a.id_area) as total_empleados
FROM area
WHERE nombre_area IN ('Producción', 'Mercadista');
```

**Resultado esperado:**
- ✅ Solo 1 registro de "Producción" (id_area=1)
- ✅ 1 registro de "Mercadista"
- ✅ Empleados consolidados en Producción

### 2. Verificar tablas creadas

```sql
SHOW TABLES LIKE '%ciclo%' OR LIKE 'salario_minimo';
```

**Resultado esperado:**
- ✅ `salario_minimo`
- ✅ `ciclo_dotacion`
- ✅ `empleado_ciclo`

### 3. Verificar datos iniciales

```sql
-- Salarios mínimos
SELECT * FROM salario_minimo ORDER BY anio;

-- Ciclos registrados
SELECT id_ciclo, nombre_ciclo, fecha_entrega, estado 
FROM ciclo_dotacion;
```

**Resultado esperado:**
- ✅ 3 registros en `salario_minimo` (2024, 2025, 2026)
- ✅ 1 ciclo en `ciclo_dotacion` (Ciclo Q4 2025)

### 4. Verificar integridad referencial

```sql
-- Verificar foreign keys
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

**Resultado esperado:**
- ✅ Todas las foreign keys apuntan a tablas existentes
- ✅ No hay errores de integridad

---

## 🔒 CARACTERÍSTICAS DE SEGURIDAD

✅ **Transacciones:** Todo se ejecuta dentro de una transacción (COMMIT solo si todo es exitoso)  
✅ **Foreign Keys:** Temporalmente deshabilitados durante consolidación, luego reactivados  
✅ **Validaciones:** Múltiples checks de integridad en cada fase  
✅ **Rollback automático:** Si algo falla, todos los cambios se revierten  
✅ **Sin pérdida de datos:** Migración de datos, no eliminación

---

## 📊 ESTRUCTURA FINAL DE LA BASE DE DATOS

### Nuevas tablas:

```
salario_minimo
├── id_salario (PK)
├── anio (UNIQUE)
├── valor_mensual
└── creado_por (FK → usuario)

ciclo_dotacion
├── id_ciclo (PK)
├── nombre_ciclo
├── fecha_entrega (UNIQUE)
├── fecha_inicio_ventana
├── fecha_fin_ventana
├── estado (pendiente/activo/cerrado)
├── id_area_produccion (FK → area)
├── id_area_mercadista (FK → area)
├── valor_smlv_aplicado
└── creado_por (FK → usuario)

empleado_ciclo
├── id_empleado_ciclo (PK)
├── id_ciclo (FK → ciclo_dotacion)
├── id_empleado (FK → empleado)
├── estado (procesado/entregado/omitido)
├── antiguedad_meses (snapshot)
├── sueldo_al_momento (snapshot)
├── id_area (snapshot)
└── fecha_entrega_real
```

---

## 🎯 CRITERIOS DE ELEGIBILIDAD IMPLEMENTADOS

El sistema aplicará automáticamente estos criterios al crear un nuevo ciclo:

1. **Antigüedad:** ≥ 3 meses (calculado desde `empleado.fecha_inicio`)
2. **Rango salarial:** 1-2 SMLV (usando `salario_minimo.valor_mensual` del año actual)
3. **Áreas elegibles:** Producción y Mercadista
4. **Estado del empleado:** Solo empleados activos (`estado = 1`)

---

## 🚨 TROUBLESHOOTING

### Error: "Foreign key constraint fails"
**Solución:** Asegúrate de que el usuario ID 1 existe en la tabla `usuario`.

```sql
SELECT id_usuario, username FROM usuario WHERE id_usuario = 1;
```

### Error: "Table already exists"
**Solución:** Las tablas se eliminarán automáticamente con `DROP TABLE IF EXISTS`. Si persiste el error, ejecuta manualmente:

```sql
DROP TABLE IF EXISTS empleado_ciclo;
DROP TABLE IF EXISTS ciclo_dotacion;
DROP TABLE IF EXISTS salario_minimo;
```

### Error: "Duplicate entry for key 'unique_anio'"
**Solución:** Ya existe un registro para ese año. Elimina registros antiguos:

```sql
DELETE FROM salario_minimo WHERE anio IN (2024, 2025, 2026);
```

---

## 📞 SOPORTE

Si encuentras algún problema durante la migración:

1. **Revisa los logs de MySQL** para mensajes de error específicos
2. **Verifica permisos** del usuario de base de datos
3. **Ejecuta el método paso a paso** para identificar en qué fase ocurre el error
4. **Contacta al desarrollador** con el mensaje de error completo

---

## ✨ SIGUIENTE FASE

Una vez completada la migración exitosamente, el siguiente paso es:

**FASE 2: Implementación Backend**
- Crear modelos: `CicloDotacionModel.js`, `SalarioMinimoModel.js`
- Crear controlador: `CiclosController.js`
- Crear rutas: `/api/ciclos/*`
- Implementar lógica de elegibilidad
- Implementar botón "Nuevo Ciclo Dotación"

**FASE 3: Implementación Frontend**
- Crear componente `ModalNuevoCiclo.jsx`
- Crear tabla `DataTableCiclos.jsx`
- Integrar con página `Dotaciones.jsx`
- Implementar validación de ventana de ejecución

---

**Fecha de creación:** 2025-11-06  
**Creado por:** Sistema SIRDS - Gestión de Dotaciones  
**Versión de migración:** 1.0
