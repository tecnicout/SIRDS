import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

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

  const isAdmin = user?.rol_sistema === 'administrador';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">SIRDS</h3>
        <p className="text-sm text-gray-500">Panel Administrativo</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link 
              to="/dashboard" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/empleados" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/empleados') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>👥</span>
              <span>Empleados</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/ubicaciones" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/ubicaciones') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>📍</span>
              <span>Ubicaciones</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/areas" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/areas') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>🏢</span>
              <span>Áreas</span>
            </Link>
          </li>
          {isAdmin && (
            <li>
              <Link 
                to="/usuarios" 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/usuarios') 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>🔐</span>
                <span>Usuarios</span>
              </Link>
            </li>
          )}
          <li>
            <Link 
              to="/dotaciones" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/dotaciones') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>📦</span>
              <span>Dotaciones</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/solicitudes" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/solicitudes') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>📋</span>
              <span>Solicitudes</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/reportes" 
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive('/reportes') 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>📊</span>
              <span>Reportes</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
