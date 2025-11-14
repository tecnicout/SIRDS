import React, { useState, useEffect } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import CountdownWheels from '../components/CountdownWheels';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [nextDelivery, setNextDelivery] = useState({ loading: true, data: null, error: null });

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

  useEffect(() => {
    const controller = new AbortController();
    const fetchDelivery = async () => {
      try {
        const response = await fetch('/api/public/proxima-entrega', {
          signal: controller.signal
        });
        const json = await response.json();
        if (json.success && json.data) {
          setNextDelivery({ loading: false, data: json.data, error: null });
        } else {
          setNextDelivery({ loading: false, data: null, error: json.message || 'Aún no hay fecha de entrega programada' });
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        setNextDelivery({ loading: false, data: null, error: 'No se pudo obtener la próxima entrega' });
      }
    };
    fetchDelivery();
    return () => controller.abort();
  }, []);

  const formatDeliveryDate = () => {
    if (!nextDelivery.data?.fecha_entrega_iso) return '';
    return new Date(nextDelivery.data.fecha_entrega_iso).toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
  };

  const targetDate = nextDelivery.data?.fecha_entrega_iso;

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

      <CardPanel title="Próxima entrega de dotación" icon="bx-time">
        {nextDelivery.loading ? (
          <p className="text-gray-500">Consultando ciclo activo...</p>
        ) : nextDelivery.data ? (
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">Fecha programada</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatDeliveryDate()}</p>
              <p className="text-sm text-gray-500 mt-1">Ciclo: {nextDelivery.data.nombre_ciclo}</p>
            </div>
            <div className="w-full md:max-w-xl">
              <CountdownWheels targetDate={targetDate} />
            </div>
          </div>
        ) : (
          <div className="text-gray-500">{nextDelivery.error || 'Aún no hay fecha de entrega programada'}</div>
        )}
      </CardPanel>

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
