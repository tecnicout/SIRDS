# SIRDS - Sistema Integrado para el Registro de Dotación Sonora

Sistema web para la gestión integral de dotación a nivel nacional, desarrollado con Node.js/Express y frontend vanilla JavaScript.

## Características principales

- 🏢 Gestión de ubicaciones (plantas y bodegas)
- 👥 Administración de empleados y roles
- 📦 Control de inventario y stock
- 🎯 Kits de dotación por área y rol
- 📋 Solicitudes y entregas de dotación
- 🛒 Gestión de pedidos de compra
- 📊 Reportes y auditoría

## Estructura del proyecto

```
sirds/
├── backend/
│   ├── config/          # Configuración de BD y servidor
│   ├── controllers/     # Controladores de negocio
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de API
│   ├── middleware/      # Middlewares personalizados
│   └── utils/           # Utilidades
├── frontend/
│   ├── assets/          # CSS, JS, imágenes
│   ├── pages/           # Páginas HTML
│   └── components/      # Componentes reutilizables
└── docs/                # Documentación
```

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`
4. Ejecutar la aplicación: `npm run dev`

## Base de datos

El sistema utiliza MySQL con las siguientes entidades principales:
- Ubicaciones y áreas
- Empleados, géneros y roles
- Dotación y categorías
- Stock y tallas
- Kits de dotación
- Solicitudes y entregas
- Pedidos de compra
- Historial de movimientos