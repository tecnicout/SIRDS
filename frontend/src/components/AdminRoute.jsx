import React from 'react';
import { Navigate } from 'react-router-dom';
import useStoredUser from '../hooks/useStoredUser';
import { getToken } from '../utils/tokenStorage';

const AdminRoute = ({ children }) => {
  const [user] = useStoredUser();
  const isAuthenticated = !!getToken();
  
  // Verificar si el usuario está autenticado y es administrador (id_rol = 4)
  if (!isAuthenticated || user?.id_rol !== 4) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;