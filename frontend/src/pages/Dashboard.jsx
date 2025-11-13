import React, { useState, useEffect } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user'); // Limpiar datos corruptos
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <ResourceHeader
        title={`Bienvenido${user ? `, ${user.nombre_completo || user.nombre || user.username}` : ''}`}
        subtitle="Sistema Integrado para el Registro de Dotación Sonora - Arroz Sonora"
        stats={[
          { icon: 'bx-group', label: 'Empleados', value: 245 },
          { icon: 'bx-package', label: 'Dotaciones', value: '1,247' },
          { icon: 'bx-notepad', label: 'Pedidos', value: 34 },
          { icon: 'bx-zap', label: 'Entregas', value: 89 },
        ]}
      />

      <CardPanel title="Información de Sesión" icon="bx-id-card">
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p><span className="font-medium">Nombre Completo:</span> {user.nombre} {user.apellido}</p>
              <p><span className="font-medium">ID Empleado:</span> {user.id_empleado}</p>
              <p><span className="font-medium">Email:</span> {user.email || 'No registrado'}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Rol:</span> {user.nombre_rol || (user.id_rol ? `Rol ${user.id_rol}` : 'Usuario')}</p>
              <p><span className="font-medium">Ubicación:</span> {user.ubicacion || 'N/A'}</p>
              <p><span className="font-medium">Última conexión:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            Cargando información del usuario...
          </div>
        )}
      </CardPanel>
    </div>
  );
}
