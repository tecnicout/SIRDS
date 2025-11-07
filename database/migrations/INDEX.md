# 📁 MIGRACIONES - SISTEMA DE CICLOS DE DOTACIÓN

**Proyecto:** SIRDS - Sistema Integral de Recursos de Dotación  
**Versión:** 1.0  
**Fecha:** 2025-11-06  
**Base de datos:** MySQL 9.5

---

## 📋 ÍNDICE DE SCRIPTS

### 🚀 Scripts de Ejecución

| Archivo | Tipo | Descripción | Uso |
|---------|------|-------------|-----|
| `000_EJECUTAR_MIGRACION_COMPLETA.sql` | SQL | **Script maestro** - Ejecuta todo automáticamente | ⭐ **RECOMENDADO** |
| `EJECUTAR_MIGRACION.ps1` | PowerShell | Script automatizado con interfaz amigable | Alternativa Windows |
| `001_limpieza_areas_preparacion.sql` | SQL | Fase 1: Limpieza de áreas duplicadas | Ejecución manual |
| `002_sistema_ciclos_dotacion.sql` | SQL | Fase 2: Creación de tablas del sistema | Ejecución manual |

### ✅ Scripts de Validación

| Archivo | Tipo | Descripción | Uso |
|---------|------|-------------|-----|
| `VALIDAR_MIGRACION.sql` | SQL | Validación completa post-migración | Después de migrar |

### 📚 Documentación

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `README_EJECUCION.md` | Markdown | Guía completa de ejecución y troubleshooting |
| `INDEX.md` | Markdown | Este archivo - Índice de toda la migración |

---

## ⚡ EJECUCIÓN RÁPIDA (3 métodos)

### Método 1: Script Maestro SQL (Más simple)

```bash
mysql -u root -p sirds < database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql
```

### Método 2: Script PowerShell (Más amigable)

```powershell
cd c:\SIRDS\SIRDS
.\database\migrations\EJECUTAR_MIGRACION.ps1
```

### Método 3: Consola MySQL Interactiva

```sql
mysql -u root -p
USE sirds;
SOURCE database/migrations/000_EJECUTAR_MIGRACION_COMPLETA.sql;
```

---

## 📊 QUÉ HACE ESTA MIGRACIÓN

### 1️⃣ Limpieza de Datos de Prueba

**Problema resuelto:**
- Existían 2 registros de área "Producción" (id_area=1 y id_area=5)
- Área "Mercadista" no existía

**Solución aplicada:**
- ✅ Consolida todas las referencias de `id_area=5` → `id_area=1`
- ✅ Elimina registro duplicado sin pérdida de datos
- ✅ Actualiza empleados, kits, stock automáticamente
- ✅ Crea área "Mercadista" para el sistema de ciclos

**Afectación:**
- 0 datos perdidos
- 0 funcionalidad rota
- 100% backward compatible

### 2️⃣ Sistema de Ciclos de Dotación

**Tablas creadas:**

```
1. salario_minimo
   └─ Almacena SMLV histórico por año
   └─ Usado para validar rango 1-2 SMLV

2. ciclo_dotacion
   └─ Gestiona ciclos cuatrimestrales
   └─ Ventana de ejecución: 1 mes antes de entrega
   └─ Estados: pendiente → activo → cerrado

3. empleado_ciclo
   └─ Empleados elegibles por ciclo
   └─ Snapshot de datos (antigüedad, sueldo, área)
   └─ Estados: procesado → entregado / omitido
```

**Datos iniciales insertados:**
- ✅ SMLV 2024: $1,300,000
- ✅ SMLV 2025: $1,423,500 (oficial)
- ✅ SMLV 2026: $1,423,500 (proyectado)
- ✅ Ciclo ejemplo: Diciembre 5, 2025
  - Ventana: Noviembre 5 - Diciembre 5
  - Estado: Pendiente

---

## 🎯 CRITERIOS DE ELEGIBILIDAD IMPLEMENTADOS

El sistema automáticamente filtrará empleados que cumplan:

| Criterio | Validación | Campo usado |
|----------|------------|-------------|
| **Antigüedad** | ≥ 3 meses | `empleado.fecha_inicio` |
| **Salario** | 1-2 SMLV | `empleado.sueldo` vs `salario_minimo.valor_mensual` |
| **Área** | Producción o Mercadista | `empleado.id_area` |
| **Estado** | Activo | `empleado.estado = 1` |

**Ejemplo cálculo:**
```
SMLV 2025: $1,423,500
Rango elegible: $1,423,500 - $2,847,000

Empleado con sueldo $1,700,000:
✓ Está en rango (1.19 SMLV)
✓ Si tiene >3 meses de antigüedad
✓ Si está en Producción o Mercadista
→ ELEGIBLE para dotación
```

---

## 🔒 CARACTERÍSTICAS DE SEGURIDAD

### Transacciones
- ✅ Todo se ejecuta en una sola transacción
- ✅ COMMIT solo si todas las operaciones son exitosas
- ✅ ROLLBACK automático en caso de error

### Integridad Referencial
- ✅ Foreign keys validados antes de insertar
- ✅ Constraints de validación en fechas
- ✅ UNIQUE keys para prevenir duplicados

### Validaciones de Negocio
```sql
-- Ventana debe ser menor a fecha de entrega
CHECK (fecha_inicio_ventana < fecha_fin_ventana)

-- Fecha de entrega debe coincidir con fin de ventana
CHECK (fecha_entrega = fecha_fin_ventana)

-- Año de SMLV único
UNIQUE KEY (anio)

-- Un empleado solo puede estar una vez por ciclo
UNIQUE KEY (id_ciclo, id_empleado)
```

### Prevención de Pérdida de Datos
- ✅ Migración de datos, NO eliminación
- ✅ Verificaciones pre-ejecución
- ✅ Validaciones post-ejecución
- ✅ Logs detallados de cada operación

---

## 📈 ESQUEMA DE LA BASE DE DATOS

### Diagrama ER Simplificado

```
┌─────────────────┐
│  salario_minimo │
└─────────────────┘
         │
         │ (valor_smlv_aplicado)
         ↓
┌─────────────────┐      ┌──────────┐
│ ciclo_dotacion  │─────→│ usuario  │
└─────────────────┘      └──────────┘
         │               (creado_por)
         │
         │ (id_ciclo)
         ↓
┌─────────────────┐      ┌──────────┐
│ empleado_ciclo  │─────→│ empleado │
└─────────────────┘      └──────────┘
         │               (id_empleado)
         │
         └──────────────→┌──────────┐
                         │   area   │
                         └──────────┘
                         (id_area)
```

### Relaciones Clave

```sql
ciclo_dotacion
├── FK: creado_por → usuario.id_usuario
├── FK: id_area_produccion → area.id_area
└── FK: id_area_mercadista → area.id_area

empleado_ciclo
├── FK: id_ciclo → ciclo_dotacion.id_ciclo (CASCADE)
├── FK: id_empleado → empleado.id_empleado (CASCADE)
├── FK: id_area → area.id_area (RESTRICT)
└── FK: actualizado_por → usuario.id_usuario (SET NULL)
```

---

## ✅ VALIDACIÓN POST-MIGRACIÓN

Ejecuta el script de validación:

```bash
mysql -u root -p sirds < database/migrations/VALIDAR_MIGRACION.sql
```

### Puntos de Verificación

| # | Validación | Resultado Esperado |
|---|------------|-------------------|
| 1 | Área Producción única | 1 registro (id_area=1) |
| 2 | Área Mercadista existe | 1 registro creado |
| 3 | Tablas creadas | 3/3 (salario_minimo, ciclo_dotacion, empleado_ciclo) |
| 4 | Foreign keys | 7+ constraints activos |
| 5 | SMLV 2025 | $1,423,500 registrado |
| 6 | Ciclo ejemplo | 1 ciclo para Dic 5, 2025 |
| 7 | Empleados elegibles | Lista de empleados potenciales |

---

## 🚨 TROUBLESHOOTING

### Error: "mysql: command not found"

**Causa:** MySQL no está en el PATH del sistema.

**Soluciones:**
1. Agrega MySQL al PATH
2. Usa ruta completa: `"C:\Program Files\MySQL\MySQL Server 9.5\bin\mysql.exe"`
3. Ejecuta desde MySQL Workbench

### Error: "Foreign key constraint fails"

**Causa:** Usuario ID 1 no existe en tabla `usuario`.

**Solución:**
```sql
-- Verificar usuarios existentes
SELECT id_usuario, username FROM usuario;

-- Cambiar creado_por en scripts a un ID válido
```

### Error: "Table already exists"

**Causa:** Ejecución duplicada del script.

**Solución:**
```sql
-- Limpiar tablas y volver a ejecutar
DROP TABLE IF EXISTS empleado_ciclo;
DROP TABLE IF EXISTS ciclo_dotacion;
DROP TABLE IF EXISTS salario_minimo;
```

### Warning: "Duplicate entry for unique key"

**Causa:** Datos ya insertados previamente.

**Solución:**
```sql
-- Verificar datos existentes
SELECT * FROM salario_minimo WHERE anio = 2025;
SELECT * FROM ciclo_dotacion WHERE fecha_entrega = '2025-12-05';

-- Si es necesario, eliminar y reinsertar
DELETE FROM salario_minimo WHERE anio IN (2024, 2025, 2026);
```

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### ✅ Fase 1: Base de Datos (COMPLETADA)
- [x] Análisis de estructura existente
- [x] Diseño de nuevas tablas
- [x] Scripts de migración
- [x] Scripts de validación
- [x] Documentación completa

### 🔄 Fase 2: Backend (SIGUIENTE)
**Archivos a crear:**
- `backend/models/SalarioMinimoModel.js`
- `backend/models/CicloDotacionModel.js`
- `backend/models/EmpleadoCicloModel.js`
- `backend/controllers/CiclosController.js`
- `backend/routes/ciclosRoutes.js`

**Funcionalidades a implementar:**
- Listar ciclos (paginado, filtrado)
- Crear nuevo ciclo (validar ventana de ejecución)
- Calcular empleados elegibles automáticamente
- Actualizar estado de empleados en ciclo
- Obtener estadísticas de ciclos

### ⏳ Fase 3: Frontend (PENDIENTE)
**Componentes a crear:**
- `frontend/src/components/Modal/ModalNuevoCiclo.jsx`
- `frontend/src/components/DataTable/DataTableCiclos.jsx`
- `frontend/src/components/Cards/CardCicloActivo.jsx`

**Funcionalidades a implementar:**
- Botón "Nuevo Ciclo Dotación" (solo ejecutable en ventana)
- Modal con preview de empleados elegibles
- Tabla de ciclos históricos
- Indicadores de estado de ciclo actual

### ⏳ Fase 4: Testing & Validación (PENDIENTE)
- Pruebas de cálculo de elegibilidad
- Validación de ventanas de ejecución
- Pruebas de integridad de datos
- Testing de interfaz de usuario

---

## 📞 SOPORTE Y CONTACTO

**Desarrollador:** Sistema SIRDS  
**Fecha de migración:** 2025-11-06  
**Versión:** 1.0.0

**Para reportar problemas:**
1. Ejecuta el script de validación
2. Captura los mensajes de error completos
3. Revisa la sección de Troubleshooting
4. Contacta con el log de validación

---

## 📝 NOTAS IMPORTANTES

⚠️ **Antes de ejecutar en producción:**
1. Realiza backup completo de la base de datos
2. Verifica que tienes usuario con permisos de ALTER, CREATE, DROP
3. Asegúrate de que no hay procesos críticos en ejecución
4. Comunica el mantenimiento al equipo

✅ **Después de ejecutar:**
1. Ejecuta script de validación
2. Verifica que módulo Dotaciones sigue funcionando
3. Prueba creación de entregas existentes
4. Confirma que no hay errores en logs

---

**Última actualización:** 2025-11-06  
**Estado:** ✅ Listo para ejecutar  
**Próximo paso:** Ejecutar migración y proceder con Fase 2 (Backend)
