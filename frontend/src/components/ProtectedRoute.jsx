import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return children;
}
