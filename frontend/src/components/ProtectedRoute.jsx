import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../utils/tokenStorage';

export default function ProtectedRoute({ children }) {
  const token = getToken();
  const location = useLocation();
  
  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}
