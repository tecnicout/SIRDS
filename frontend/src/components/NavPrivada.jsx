import React, { useState, useEffect } from 'react';

export default function NavPrivada({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        console.log('User data loaded:', parsed); // Debug
        setUser(parsed);
      } else {
        console.log('No user data found in localStorage'); // Debug
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user'); // Limpiar datos corruptos
    }
  }, []);

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
    if (user?.nombre_rol) {
      return user.nombre_rol.toUpperCase();
    }
    if (user?.rol_sistema) {
      return user.rol_sistema.replace('_', ' ').toUpperCase();
    }
    if (user?.cargo) {
      return user.cargo.toUpperCase();
    }
    return 'EMPLEADO';
  };

  const handleLogout = () => {
    console.log('Logout button clicked'); // Debug
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      console.error('onLogout function not provided or not a function');
      // Fallback: hacer logout manualmente
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 shadow-lg border-b w-full z-20" style={{backgroundColor: '#B39237', borderBottomColor: '#B39237'}}>
      <div className="w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center h-24">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo Arroz Sonora" className="w-25 h-16" />
            </div>
            
            {/* Línea separadora */}
            <div className="w-px h-12 bg-primary-300"></div>
            
            <div>
              <h1 className="text-3xl font-bold text-white">
                SIRDS
              </h1>
              <p className="text-sm text-primary-100 font-medium">
                Sistema Integrado para el Registro de Dotación Sonora
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
