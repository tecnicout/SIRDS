import React, { useState, useEffect, useCallback } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CountdownWheels from '../components/CountdownWheels';
import DashboardStatsCharts, { createEmptyStats } from '../components/charts/DashboardStatsCharts';
import useStoredUser from '../hooks/useStoredUser';
import { getToken } from '../utils/tokenStorage';

export default function Dashboard() {
  const [user] = useStoredUser();
  const [nextDelivery, setNextDelivery] = useState({ loading: true, data: null, error: null });
  const [dashboardStats, setDashboardStats] = useState(createEmptyStats());
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

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

  const loadDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const token = getToken();
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error('No se pudieron obtener las estadísticas');
      }
      const result = await response.json();
      setDashboardStats((prev) => ({ ...prev, ...(result.data || {}) }));
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setStatsError(error.message || 'Error desconocido');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const formatDeliveryDate = () => {
    if (!nextDelivery.data?.fecha_entrega_iso) return '';
    return new Date(nextDelivery.data.fecha_entrega_iso).toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short'
    });
  };

  const targetDate = nextDelivery.data?.fecha_entrega_iso;
  const handleStatsRefresh = loadDashboardStats;

  const renderNextDelivery = () => {
    if (nextDelivery.loading) {
      return (
        <div className="rounded-lg border border-[#F1E5C3] bg-white/70 px-4 py-3 text-sm text-[#6F581B] shadow-sm">
          Consultando próxima entrega...
        </div>
      );
    }
    if (!nextDelivery.data) {
      return (
        <div className="rounded-lg border border-[#F1E5C3] bg-white/70 px-4 py-3 text-sm text-[#6F581B] shadow-sm">
          {nextDelivery.error || 'Sin programación de entrega.'}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-[#F1E5C3] bg-white/85 px-4 py-3 text-[#2B1F0F] shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#6F581B]">Próxima entrega</p>
          <p className="text-sm font-semibold text-[#2B1F0F] leading-snug">{formatDeliveryDate()}</p>
          <p className="text-[12px] text-[#7A6B46]">Ciclo: {nextDelivery.data.nombre_ciclo}</p>
        </div>
        <div className="w-full sm:w-auto">
          <CountdownWheels targetDate={targetDate} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ResourceHeader
        title={`Bienvenido${user ? `, ${user.nombre_completo || user.nombre || user.username}` : ''}`}
        subtitle="Sistema Integrado para el Registro de Dotación Sonora - Arroz Sonora"
        action={renderNextDelivery()}
      />

      <DashboardStatsCharts
        stats={dashboardStats}
        loading={statsLoading}
        error={statsError}
        onRefresh={handleStatsRefresh}
      />
    </div>
  );
}
