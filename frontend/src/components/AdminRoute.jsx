import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');
  
  // Verificar si el usuario está autenticado y es administrador
  if (!isAuthenticated || user.rol_sistema !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;