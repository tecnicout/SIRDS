import React from 'react';
import useStoredUser from '../hooks/useStoredUser';
import { clearStoredUser } from '../utils/userStorage';

export default function NavPrivada({ onLogout }) {
  const [user] = useStoredUser();

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
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      localStorage.removeItem('token');
      clearStoredUser();
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
