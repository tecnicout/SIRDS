import React, { useState, useEffect } from 'react';

export default function NavPrivada({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user'); // Limpiar datos corruptos
    }
  }, []);

  const getUserInitial = () => {
    if (user?.nombre_completo) {
      return user.nombre_completo.charAt(0).toUpperCase();
    }
    if (user?.nombre && typeof user.nombre === 'string') {
      return user.nombre.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (user?.nombre_completo) {
      return user.nombre_completo;
    }
    if (user?.nombre && user?.apellido) {
      return `${user.nombre} ${user.apellido}`;
    }
    if (user?.username) {
      return user.username;
    }
    return 'Usuario';
  };

  const getUserRole = () => {
    if (user?.rol_sistema) {
      return user.rol_sistema.replace('_', ' ').toUpperCase();
    }
    if (user?.cargo) {
      return user.cargo;
    }
    return '';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <button className="md:hidden text-gray-600 hover:text-gray-800 p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          Dashboard SIRDS
        </h2>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Información del usuario */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {getUserInitial()}
            </span>
          </div>
          <div className="hidden sm:block text-sm">
            <div className="font-medium text-gray-700">
              {getUserName()}
            </div>
            <div className="text-gray-500">{getUserRole() || 'Empleado'}</div>
          </div>
        </div>
        
        {/* Botón de logout */}
        <button 
          onClick={onLogout}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
