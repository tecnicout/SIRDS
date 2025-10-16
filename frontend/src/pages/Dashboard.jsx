import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user'); // Limpiar datos corruptos
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ¡Bienvenido{user ? `, ${user.nombre_completo || user.nombre || user.username}` : ''}!
        </h1>
        <p className="text-gray-600 mb-2">
          Sistema Integrado para el Registro de Dotación Sonora - Arroz Sonora
        </p>
        {user && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {user.cargo && <span>🏢 {user.cargo}</span>}
            {user.area && <span>📍 {user.area}</span>}
            {user.rol_sistema && <span>👤 {user.rol_sistema.replace('_', ' ').toUpperCase()}</span>}
            {user.ubicacion && <span>🌎 {user.ubicacion}</span>}
          </div>
        )}
      </div>

      {/* Cards de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Empleados</p>
              <p className="text-2xl font-semibold text-gray-900">245</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dotaciones</p>
              <p className="text-2xl font-semibold text-gray-900">1,247</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-2xl">
              📋
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solicitudes</p>
              <p className="text-2xl font-semibold text-gray-900">34</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entregas</p>
              <p className="text-2xl font-semibold text-gray-900">89</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información del usuario actual */}
      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Información de Sesión</h3>
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p><span className="font-medium">Nombre Completo:</span> {user.nombre} {user.apellido}</p>
              <p><span className="font-medium">ID Empleado:</span> {user.id_empleado}</p>
              <p><span className="font-medium">Email:</span> {user.email || 'No registrado'}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Rol:</span> {user.id_rol ? `Rol ${user.id_rol}` : 'Usuario'}</p>
              <p><span className="font-medium">Estado:</span> <span className="bg-green-400 px-2 py-1 rounded text-sm font-medium">Activo</span></p>
              <p><span className="font-medium">Última conexión:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-white/80">Cargando información del usuario...</p>
          </div>
        )}
      </div>
    </div>
  );
}
