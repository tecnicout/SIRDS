import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ collapsed, onMouseEnter, onMouseLeave, onLogout }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const isActive = useCallback((path) => {
    return location.pathname === path;
  }, [location.pathname]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Cerrar menú de usuario al cambiar de ruta
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isAdmin = useMemo(() => user?.id_rol === 4, [user?.id_rol]);

  const getUserInitial = useMemo(() => {
    if (user?.nombre_completo) {
      return user.nombre_completo.charAt(0).toUpperCase();
    }
    if (user?.nombre && typeof user.nombre === 'string') {
      return user.nombre.charAt(0).toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'AD';
  }, [user?.nombre_completo, user?.nombre, user?.username]);

  const getUserName = useMemo(() => {
    if (user?.nombre_completo) {
      return user.nombre_completo;
    }
    if (user?.nombre && user?.apellido) {
      return `${user.nombre} ${user.apellido}`;
    }
    if (user?.username) {
      return user.username;
    }
    return 'Admin';
  }, [user?.nombre_completo, user?.nombre, user?.apellido, user?.username]);

  const getUserEmail = useMemo(() => {
    if (user?.email) {
      return user.email;
    }
    return 'admin@sirds.com';
  }, [user?.email]);

  const getUserRole = useMemo(() => {
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
  }, [user?.nombre_rol, user?.rol_sistema, user?.cargo]);

  const handleLogout = useCallback(() => {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Si hay función onLogout, usarla
    if (onLogout && typeof onLogout === 'function') {
      onLogout();
    } else {
      // Fallback: forzar recarga y redirección
      window.location.replace('/login');
    }
  }, [onLogout]);

  return (
    <aside 
      className={`fixed top-24 left-0 h-screen ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-500 ease-in-out flex flex-col z-10`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Navegación Principal */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/dashboard" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Dashboard' : ''}
            >
              <i className="bx bx-bar-chart-alt-2 text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/empleados" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/empleados') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Empleados' : ''}
            >
              <i className="bx bx-group text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Empleados</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/ubicaciones" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/ubicaciones') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Ubicaciones' : ''}
            >
              <i className="bx bx-map-pin text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Ubicaciones</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/areas" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/areas') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Áreas' : ''}
            >
              <i className="bx bx-buildings text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Áreas</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/proveedores" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/proveedores') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Proveedores' : ''}
            >
              <i className="bx bx-store text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Proveedores</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link 
                to="/usuarios" 
                className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                  isActive('/usuarios') 
                    ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : 'space-x-3'}`}
                title={collapsed ? 'Usuarios' : ''}
              >
                <i className="bx bx-lock-alt text-xl"></i>
                <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Usuarios</span>
              </Link>
            </li>
          )}
          <li>
            <Link 
              to="/dotaciones" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/dotaciones') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Dotaciones' : ''}
            >
              <i className="bx bx-package text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Dotaciones</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/solicitudes" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/solicitudes') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Solicitudes' : ''}
            >
              <i className="bx bx-clipboard text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Solicitudes</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/reportes" 
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive('/reportes') 
                  ? 'bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : 'space-x-3'}`}
              title={collapsed ? 'Reportes' : ''}
            >
              <i className="bx bx-file text-xl"></i>
              <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Reportes</span>
            </Link>
          </li>
          
          {/* Separador visual */}
          <li className="pt-2">
            <hr className="border-gray-200" />
          </li>
          
          {/* Usuario */}
          <li>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`w-full flex items-center px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : 'space-x-3'}`}
              >
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 border-2 border-gray-300 shadow-sm">
                  {getUserInitial}
                </div>
                <div className={`flex-1 text-left min-w-0 transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {getUserName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {getUserEmail}
                  </div>
                </div>
                <i className={`bx bx-chevron-${userMenuOpen ? 'up' : 'down'} text-lg text-gray-400 flex-shrink-0 transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}></i>
              </button>

              {/* Menú Desplegable del Usuario */}
              {userMenuOpen && !collapsed && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">Mi Cuenta</div>
                  </div>
                  
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <i className="bx bx-cog text-lg"></i>
                    <span>Configuración</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <i className="bx bx-bell text-lg"></i>
                    <span>Notificaciones</span>
                  </button>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <i className="bx bx-log-out text-lg"></i>
                      <span className={`transition-all duration-500 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default React.memo(Sidebar);
