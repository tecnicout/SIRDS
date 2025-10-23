import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');
  
  // Verificar si el usuario está autenticado y es administrador (id_rol = 4)
  if (!isAuthenticated || user.id_rol !== 4) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;