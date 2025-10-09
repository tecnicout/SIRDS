# Guía de Instalación y Configuración - SIRDS

## Prerrequisitos

### 1. Instalar Node.js
1. Descargar Node.js desde: https://nodejs.org/
2. Instalar la versión LTS (recomendada)
3. Verificar la instalación:
   ```bash
   node --version
   npm --version
   ```

### 2. Instalar MySQL
1. Descargar MySQL desde: https://dev.mysql.com/downloads/mysql/
2. Instalar MySQL Server y MySQL Workbench
3. Crear una base de datos llamada `sirds_db`
4. Ejecutar el script de base de datos proporcionado

## Instalación del Proyecto

### 1. Clonar o descargar el proyecto
```bash
cd C:\ProyectoDotacion
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
1. Copiar el archivo `.env.example` a `.env`:
   ```bash
   copy .env.example .env
   ```
2. Editar el archivo `.env` con tus credenciales de base de datos:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=sirds_db
   ```

### 4. Crear la base de datos
Ejecutar el script SQL proporcionado en MySQL:

```sql
-- Usar el script de creación de tablas proporcionado en los requerimientos
CREATE DATABASE sirds_db;
USE sirds_db;

-- Copiar aquí todo el script de creación de tablas...
```

### 5. Insertar datos de prueba (opcional)
```sql
-- Géneros
INSERT INTO Genero (nombre) VALUES ('Masculino'), ('Femenino');

-- Ubicaciones de ejemplo
INSERT INTO Ubicacion (nombre, tipo, direccion) VALUES 
('Planta Principal', 'planta', 'Av. Principal 123, Bogotá'),
('Bodega Norte', 'bodega', 'Carrera 45 # 67-89, Medellín');

-- Áreas de ejemplo
INSERT INTO Area (nombre_area, id_ubicacion) VALUES 
('Producción', 1),
('Administración', 1),
('Almacén', 2);

-- Roles de ejemplo
INSERT INTO Rol (nombre_rol) VALUES 
('Operario'),
('Supervisor'),
('Administrador');
```

## Ejecutar el Proyecto

### Modo de desarrollo
```bash
npm run dev
```

### Modo de producción
```bash
npm start
```

## Acceder al Sistema

Una vez iniciado el servidor, abrir el navegador en:
```
http://localhost:3000
```

## Estructura del Proyecto

```
sirds/
├── backend/
│   ├── config/          # Configuración de BD
│   ├── controllers/     # Lógica de negocio
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de API
│   └── middleware/      # Middlewares
├── frontend/
│   ├── assets/
│   │   ├── css/         # Estilos
│   │   └── js/          # JavaScript
│   ├── pages/           # Páginas adicionales
│   └── index.html       # Página principal
├── server.js            # Servidor principal
├── package.json         # Dependencias
└── README.md           # Documentación
```

## Funcionalidades Implementadas

### ✅ Completado
- [x] Estructura base del proyecto
- [x] Servidor Express configurado
- [x] Conexión a base de datos MySQL
- [x] Modelos básicos (Ubicación, Empleado, Dotación)
- [x] Controladores principales
- [x] Rutas de API REST
- [x] Interfaz de usuario responsive
- [x] Dashboard principal con estadísticas
- [x] Sistema de navegación
- [x] Diseño con colores especificados (#E2BE69)

### 🚧 En Desarrollo
- [ ] Módulos completos de gestión
- [ ] Autenticación y autorización
- [ ] Reportes y analytics
- [ ] Gestión completa de kits
- [ ] Sistema de notificaciones
- [ ] Importación/exportación de datos

## API Endpoints Disponibles

### Ubicaciones
- `GET /api/ubicaciones` - Listar ubicaciones
- `GET /api/ubicaciones/:id` - Obtener ubicación por ID
- `POST /api/ubicaciones` - Crear ubicación
- `PUT /api/ubicaciones/:id` - Actualizar ubicación
- `DELETE /api/ubicaciones/:id` - Eliminar ubicación

### Empleados
- `GET /api/empleados` - Listar empleados
- `GET /api/empleados/:id` - Obtener empleado por ID
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `PATCH /api/empleados/:id/estado` - Cambiar estado

### Otros Endpoints
- Géneros: `/api/generos`
- Roles: `/api/roles`
- Proveedores: `/api/proveedores`
- Dotaciones: `/api/dotaciones`
- Stock: `/api/stock`
- Solicitudes: `/api/solicitudes`
- Entregas: `/api/entregas`
- Pedidos: `/api/pedidos`

## Solución de Problemas

### Error de conexión a la base de datos
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en el archivo `.env`
3. Asegurarse de que la base de datos `sirds_db` exista

### Puerto en uso
Si el puerto 3000 está ocupado, cambiar el puerto en `.env`:
```
PORT=3001
```

### Problemas con dependencias
Limpiar cache de npm y reinstalar:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

## Contacto y Soporte

Para preguntas o problemas con la instalación:
- Revisar la documentación
- Verificar los logs del servidor
- Comprobar la configuración de la base de datos

## Próximos Pasos

1. Instalar Node.js y MySQL
2. Ejecutar el proyecto siguiendo esta guía
3. Probar la funcionalidad básica
4. Comenzar el desarrollo de módulos específicos
5. Personalizar según necesidades particulares