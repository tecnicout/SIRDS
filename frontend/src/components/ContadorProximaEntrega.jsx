import React, { useState, useEffect } from 'react';
import { getToken } from '../utils/tokenStorage';

const ContadorProximaEntrega = () => {
  const [proximaEntrega, setProximaEntrega] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProximaEntrega = async () => {
      try {
        const token = getToken();
        const response = await fetch('http://localhost:3001/api/dotaciones/proximas?limit=1', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const result = await response.json();

        // El backend puede devolver { success: true, data: [...] } o directamente un array
        const list = Array.isArray(result) ? result : (result?.data ?? []);
        if (list.length > 0) setProximaEntrega(list[0]);
      } catch (error) {
        console.error('Error al cargar próxima entrega:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProximaEntrega();
    
    // Actualizar cada minuto
    const interval = setInterval(fetchProximaEntrega, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!proximaEntrega) {
    // No mostrar nada cuando no hay entregas próximas
    return null;
  }

  const { dias_restantes, empleado_nombre, nombre_dotacion } = proximaEntrega;
  
  const getColorClass = () => {
    if (dias_restantes <= 7) return 'bg-red-50 border-red-200 text-red-700';
    if (dias_restantes <= 15) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  };

  const getIcon = () => {
    if (dias_restantes <= 7) return 'bx-error';
    if (dias_restantes <= 15) return 'bx-time';
    return 'bx-info-circle';
  };

  return (
    <div className={`border rounded-lg px-4 py-2 ${getColorClass()}`}>
      <div className="flex items-center space-x-2">
        <i className={`bx ${getIcon()} text-sm`}></i>
        <div className="text-sm">
          <span className="font-medium">
            {dias_restantes === 1 ? '1 día' : `${dias_restantes} días`}
          </span>
          <span className="mx-1">•</span>
          <span className="truncate max-w-32" title={`${empleado_nombre} - ${nombre_dotacion}`}>
            {empleado_nombre}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContadorProximaEntrega;