# ⚡ COMANDOS RÁPIDOS - SISTEMA DE CICLOS DE DOTACIÓN

## 🚀 EJECUCIÓN DE LA MIGRACIÓN

### Opción 1: Script Maestro (Recomendado)
```bash
cd c:\SIRDS\SIRDS
mysql -u root -p sirds < database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql
```

### Opción 2: PowerShell
```powershell
cd c:\SIRDS\SIRDS
.\database\migrations\EJECUTAR_MIGRACION.ps1
```

### Opción 3: Consola MySQL Interactiva
```sql
mysql -u root -p
USE sirds;
SOURCE c:/SIRDS/SIRDS/database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql;
```

---

## ✅ VALIDACIÓN

### Ejecutar validación completa
```bash
mysql -u root -p sirds < database/migrations/VALIDAR_MIGRACION.sql
```

### Validaciones rápidas individuales

#### 1. Verificar áreas consolidadas
```sql
SELECT id_area, nombre_area, estado,
       (SELECT COUNT(*) FROM empleado WHERE id_area = a.id_area) as total
FROM area
WHERE nombre_area IN ('Producción', 'Mercadista');
```

#### 2. Verificar tablas creadas
```sql
SHOW TABLES LIKE '%ciclo%';
SHOW TABLES LIKE 'salario_minimo';
```

#### 3. Verificar SMLV 2025
```sql
SELECT anio, valor_mensual FROM salario_minimo WHERE anio = 2025;
-- Debe retornar: 2025 | 1423500.00
```

#### 4. Verificar ciclo ejemplo
```sql
SELECT * FROM ciclo_dotacion WHERE nombre_ciclo = 'Ciclo Q4 2025';
```

#### 5. Verificar empleados potencialmente elegibles
```sql
SET @smlv = (SELECT valor_mensual FROM salario_minimo WHERE anio = 2025);
SET @id_prod = (SELECT id_area FROM area WHERE nombre_area = 'Producción' LIMIT 1);

SELECT COUNT(*) as total_elegibles
FROM empleado
WHERE estado = 1
  AND id_area = @id_prod
  AND sueldo BETWEEN @smlv AND (@smlv * 2)
  AND TIMESTAMPDIFF(MONTH, fecha_inicio, CURDATE()) >= 3;
```

---

## 🔧 TROUBLESHOOTING

### Problema: MySQL no encontrado
```powershell
# Agregar MySQL al PATH temporalmente
$env:Path += ";C:\Program Files\MySQL\MySQL Server 9.5\bin"

# Verificar
mysql --version
```

### Problema: Error de permisos
```sql
-- Verificar permisos del usuario
SHOW GRANTS FOR 'root'@'localhost';

-- Otorgar permisos si es necesario
GRANT ALL PRIVILEGES ON sirds.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Problema: Tablas ya existen
```sql
-- Eliminar tablas manualmente
DROP TABLE IF EXISTS empleado_ciclo;
DROP TABLE IF EXISTS ciclo_dotacion;
DROP TABLE IF EXISTS salario_minimo;

-- Volver a ejecutar migración
SOURCE database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql;
```

### Problema: Foreign key constraint fails
```sql
-- Verificar que usuario ID 1 existe
SELECT id_usuario, username FROM usuario WHERE id_usuario = 1;

-- Si no existe, crear o usar otro ID válido
```

---

## 📊 CONSULTAS ÚTILES

### Ver estructura de tabla
```sql
DESCRIBE salario_minimo;
DESCRIBE ciclo_dotacion;
DESCRIBE empleado_ciclo;
```

### Ver foreign keys
```sql
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Ver índices
```sql
SHOW INDEX FROM ciclo_dotacion;
SHOW INDEX FROM empleado_ciclo;
```

### Estadísticas de tablas
```sql
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  DATA_LENGTH,
  INDEX_LENGTH,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024, 2) as size_kb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sirds'
  AND TABLE_NAME IN ('salario_minimo', 'ciclo_dotacion', 'empleado_ciclo');
```

---

## 🧪 TESTING

### Simular cálculo de elegibilidad
```sql
SET @smlv_2025 = 1423500.00;
SET @id_prod = 1;

-- Empleados que califican por sueldo
SELECT 
  Identificacion,
  CONCAT(nombre, ' ', apellido) as nombre,
  sueldo,
  ROUND(sueldo / @smlv_2025, 2) as multiplo_smlv
FROM empleado
WHERE sueldo BETWEEN @smlv_2025 AND (@smlv_2025 * 2)
  AND estado = 1;

-- Empleados que califican por antigüedad
SELECT 
  Identificacion,
  CONCAT(nombre, ' ', apellido) as nombre,
  fecha_inicio,
  TIMESTAMPDIFF(MONTH, fecha_inicio, CURDATE()) as meses_antiguedad
FROM empleado
WHERE TIMESTAMPDIFF(MONTH, fecha_inicio, CURDATE()) >= 3
  AND estado = 1;

-- Empleados que califican por área
SELECT 
  e.Identificacion,
  CONCAT(e.nombre, ' ', e.apellido) as nombre,
  a.nombre_area
FROM empleado e
JOIN area a ON e.id_area = a.id_area
WHERE a.nombre_area IN ('Producción', 'Mercadista')
  AND e.estado = 1;
```

### Simular creación de ciclo (solo SELECT, no INSERT)
```sql
SET @smlv = (SELECT valor_mensual FROM salario_minimo WHERE anio = 2025);
SET @id_prod = (SELECT id_area FROM area WHERE nombre_area = 'Producción' LIMIT 1);
SET @id_merc = (SELECT id_area FROM area WHERE nombre_area = 'Mercadista' LIMIT 1);

-- Empleados que serían elegibles
SELECT 
  e.id_empleado,
  e.Identificacion,
  CONCAT(e.nombre, ' ', e.apellido) as nombre_completo,
  a.nombre_area,
  e.sueldo,
  TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) as antiguedad_meses,
  CASE 
    WHEN e.sueldo >= @smlv AND e.sueldo <= (@smlv * 2) THEN '✓ Sueldo OK'
    ELSE '✗ Fuera de rango'
  END as validacion_sueldo,
  CASE 
    WHEN TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3 THEN '✓ Antigüedad OK'
    ELSE '✗ Falta antigüedad'
  END as validacion_antiguedad
FROM empleado e
JOIN area a ON e.id_area = a.id_area
WHERE e.estado = 1
  AND e.id_area IN (@id_prod, @id_merc)
  AND e.sueldo > 0
ORDER BY 
  CASE 
    WHEN e.sueldo >= @smlv 
     AND e.sueldo <= (@smlv * 2)
     AND TIMESTAMPDIFF(MONTH, e.fecha_inicio, CURDATE()) >= 3
    THEN 0 ELSE 1 
  END,
  a.nombre_area,
  e.nombre;
```

---

## 🔄 ROLLBACK (Solo si es necesario)

### Deshacer migración completamente
```sql
USE sirds;

-- Eliminar datos insertados
DELETE FROM empleado_ciclo;
DELETE FROM ciclo_dotacion;
DELETE FROM salario_minimo WHERE anio IN (2024, 2025, 2026);

-- Eliminar tablas
DROP TABLE IF EXISTS empleado_ciclo;
DROP TABLE IF EXISTS ciclo_dotacion;
DROP TABLE IF EXISTS salario_minimo;

-- Restaurar área Producción duplicada (si es necesario)
-- NOTA: Solo si tienes backup de los IDs originales
-- INSERT INTO area VALUES (5, 'Producción', 'activa');
-- UPDATE empleado SET id_area = 5 WHERE id_empleado IN (...);
```

---

## 📋 BACKUP Y RESTORE

### Crear backup antes de migrar
```bash
# Backup completo de la base de datos
mysqldump -u root -p sirds > backup_sirds_pre_migracion_2025-11-06.sql

# Backup solo de tablas específicas
mysqldump -u root -p sirds empleado area kitdotacion stockdotacion > backup_areas_2025-11-06.sql
```

### Restaurar desde backup
```bash
# Restaurar base de datos completa
mysql -u root -p sirds < backup_sirds_pre_migracion_2025-11-06.sql
```

---

## 🎯 DESPUÉS DE LA MIGRACIÓN

### 1. Verificar módulo Dotaciones existente
```bash
# Iniciar servidor backend
cd backend
npm start

# En otra terminal, iniciar frontend
cd frontend
npm run dev
```

### 2. Probar funcionalidad existente
- [ ] Crear nueva entrega de dotación
- [ ] Editar entrega existente
- [ ] Ver listado de entregas
- [ ] Ver stock disponible
- [ ] Gestionar kits

### 3. Preparar para Fase 2 (Backend)
```bash
# Crear archivos de modelos
touch backend/models/SalarioMinimoModel.js
touch backend/models/CicloDotacionModel.js
touch backend/models/EmpleadoCicloModel.js

# Crear controlador
touch backend/controllers/CiclosController.js

# Crear rutas
touch backend/routes/ciclosRoutes.js
```

---

## 📚 REFERENCIAS RÁPIDAS

### Valores importantes
```
SMLV 2025:           $1,423,500
Rango elegible:      $1,423,500 - $2,847,000
Antigüedad mínima:   3 meses
Frecuencia ciclos:   Cada 4 meses
Ventana ejecución:   30 días (1 mes antes)

Áreas elegibles:
- Producción (id_area=1)
- Mercadista (id_area=nuevo)

Estados de ciclo:
- pendiente: Creado pero no activado
- activo: En proceso de entregas
- cerrado: Finalizado

Estados de empleado en ciclo:
- procesado: Asignado al ciclo
- entregado: Dotación entregada
- omitido: No recibió dotación
```

### Estructura de datos
```sql
-- Insertar nuevo SMLV
INSERT INTO salario_minimo (anio, valor_mensual, creado_por, observaciones)
VALUES (2027, 1500000.00, 1, 'SMLV 2027 proyectado');

-- Consultar empleados de un ciclo
SELECT e.*, ec.estado, ec.fecha_asignacion
FROM empleado_ciclo ec
JOIN empleado e ON ec.id_empleado = e.id_empleado
WHERE ec.id_ciclo = 1;

-- Actualizar estado de empleado en ciclo
UPDATE empleado_ciclo
SET estado = 'entregado',
    fecha_entrega_real = CURDATE(),
    actualizado_por = 1
WHERE id_empleado_ciclo = 1;
```

---

**Última actualización:** 2025-11-06  
**Proyecto:** SIRDS - Sistema de Ciclos de Dotación  
**Para más información:** Consulta INDEX.md o README_EJECUCION.md
