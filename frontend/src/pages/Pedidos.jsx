import React, { useEffect, useState, useCallback } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

// Página básica de Pedidos para iniciar desarrollo
export default function Pedidos() {
  const [stats, setStats] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarStats = useCallback(async () => {
    try {
      const r = await fetch('/api/pedidos/stats');
      const j = await r.json();
      if (j.success) setStats(j.data); else setStats(null);
    } catch (e) { console.warn('Stats pedidos error', e); }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      const r = await fetch('/api/pedidos');
      const j = await r.json();
      if (j.success) {
        setPedidos(Array.isArray(j.data) ? j.data : []);
        setError('');
      } else {
        setError(j.message || 'Error cargando pedidos');
      }
    } catch (e) {
      console.error(e);
      setError('Error de conexión al cargar pedidos');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([cargarStats(), cargarPedidos()]);
      setIsLoading(false);
    })();
  }, [cargarStats, cargarPedidos]);

  const statsArray = stats ? [
    { icon: 'bx-notepad', label: 'Total', value: stats.total || 0 },
    { icon: 'bx-time-five', label: 'Pendientes', value: stats.pendientes || 0 },
    { icon: 'bx-check-circle', label: 'Completados', value: stats.completados || 0 },
    { icon: 'bx-error', label: 'Cancelados', value: stats.cancelados || 0 }
  ] : [];

  return (
    <div className="space-y-6 p-6">
      <ResourceHeader
        title="Gestión de Pedidos"
        subtitle="Módulo inicial para la administración de pedidos"
        stats={statsArray}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <CardPanel title="Listado de Pedidos" icon="bx-list-ul">
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">Cargando...</div>
        ) : pedidos.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No hay pedidos todavía. Comience creando uno nuevo.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pedidos.map(p => (
              <li key={p.id_pedido || p.id || Math.random()} className="py-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Pedido:</span> {p.descripcion || p.referencia || p.id_pedido}
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{p.estado || 'desconocido'}</span>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>

      <CardPanel title="Acciones Rápidas" icon="bx-bolt">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-3 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B39237] text-white text-sm font-semibold shadow hover:from-[#B39237] hover:to-[#9C7F2F]">Nuevo Pedido</button>
          <button className="px-4 py-3 rounded-lg bg-white border border-gray-300 text-sm font-semibold shadow hover:bg-gray-50">Importar CSV</button>
          <button className="px-4 py-3 rounded-lg bg-white border border-gray-300 text-sm font-semibold shadow hover:bg-gray-50">Exportar</button>
        </div>
      </CardPanel>
    </div>
  );
}
