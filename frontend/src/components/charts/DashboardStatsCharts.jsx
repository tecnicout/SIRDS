import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getToken } from '../../utils/tokenStorage';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register the chart primitives once.
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, ArcElement, PointElement, Tooltip, Legend, Filler);

const palette = {
  base: '#B39237',
  baseLight: '#E2BE69',
  baseDark: '#6F581B',
  emerald: '#34D399',
  blue: '#60A5FA',
  red: '#F87171',
  purple: '#C084FC',
  neutral: '#1F2937',
  grid: '#E5E7EB',
};

export const createEmptyStats = () => ({
  totalEmployees: 0,
  registeredUsers: 0,
  averageDelivery: [],
  deliveryLabels: [],
  totalItems: 0,
  stockAvailable: 0,
  pedidosPorPeriodo: [],
  pedidosLabels: [],
  dotacionByCategory: [],
  dotacionCategoryLabels: [],
});

export default function DashboardStatsCharts({
  fetchUrl = '/api/admin/dashboard/stats',
  initialData,
  stats: externalStats,
  loading: externalLoading,
  error: externalError,
  onRefresh,
}) {
  const [stats, setStats] = useState(() => ({ ...createEmptyStats(), ...(initialData || {}) }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const useExternalData = typeof externalStats !== 'undefined';
  const effectiveStats = useExternalData ? externalStats : stats;
  const effectiveLoading = useExternalData ? Boolean(externalLoading) : loading;
  const effectiveError = useExternalData ? externalError : error;

  // Fetch latest stats from API using stored token if available.
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch(fetchUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('No se pudieron obtener las estadísticas');
      }

      const result = await response.json();
      setStats((prev) => ({ ...prev, ...(result.data || {}) }));
    } catch (err) {
      console.error('Dashboard stats error:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    if (!useExternalData) {
      loadStats();
    }
  }, [loadStats, useExternalData]);

  const summaryCards = useMemo(
    () => [
      { label: 'Total de empleados', value: effectiveStats.totalEmployees },
      { label: 'Usuarios registrados', value: effectiveStats.registeredUsers },
      { label: 'Ítems de dotación', value: effectiveStats.totalItems },
      { label: 'Stock disponible', value: effectiveStats.stockAvailable },
    ],
    [effectiveStats]
  );

  const barData = useMemo(
    () => ({
      labels: summaryCards.map((card) => card.label),
      datasets: [
        {
          label: 'Cantidad',
          data: summaryCards.map((card) => card.value || 0),
          backgroundColor: [palette.base, palette.baseLight, palette.blue, palette.emerald],
          borderRadius: 16,
        },
      ],
    }),
    [summaryCards]
  );

  const averageDeliveryData = useMemo(
    () => ({
      labels: effectiveStats.deliveryLabels,
      datasets: [
        {
          label: 'Promedio de entrega (%)',
          data: effectiveStats.averageDelivery,
          borderColor: palette.base,
          backgroundColor: 'rgba(179,146,55,0.15)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: palette.base,
        },
      ],
    }),
    [effectiveStats]
  );

  const pedidosData = useMemo(
    () => ({
      labels: effectiveStats.pedidosLabels,
      datasets: [
        {
          label: 'Pedidos por periodo',
          data: effectiveStats.pedidosPorPeriodo,
          borderColor: palette.blue,
          backgroundColor: 'rgba(96,165,250,0.25)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: palette.blue,
        },
      ],
    }),
    [effectiveStats]
  );

  const dotacionPieData = useMemo(
    () => ({
      labels: effectiveStats.dotacionCategoryLabels,
      datasets: [
        {
          data: effectiveStats.dotacionByCategory,
          backgroundColor: [palette.base, palette.blue, palette.emerald, palette.red, palette.purple, palette.baseLight],
          borderWidth: 0,
        },
      ],
    }),
    [effectiveStats]
  );

  const sharedOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: palette.neutral,
            font: { family: 'Inter, sans-serif', size: 11 },
          },
        },
        tooltip: {
          backgroundColor: palette.neutral,
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 12,
        },
      },
      scales: {
        x: {
          ticks: { color: palette.neutral },
          grid: { display: false },
        },
        y: {
          ticks: { color: palette.neutral },
          grid: { color: palette.grid },
        },
      },
    }),
    []
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#F1E5C3] bg-gradient-to-r from-[#FFF9EE] via-white to-[#FFF7DF] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#6F581B]">Panel administrativo</p>
          <h2 className="text-2xl font-semibold text-[#2B1F0F]">Estadísticas de dotación</h2>
          <p className="text-sm text-[#7A6B46]">Datos obtenidos directamente desde el backend</p>
        </div>
        <div className="flex items-center gap-3">
          {effectiveError && <span className="text-xs font-semibold text-red-500">{effectiveError}</span>}
          <button
            type="button"
            onClick={useExternalData ? onRefresh : loadStats}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B39237] px-4 py-2 text-xs font-semibold text-white shadow hover:from-[#B39237] hover:to-[#9C7F2F]"
          >
            <i className="bx bx-refresh" />
            {effectiveLoading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-[#F1E5C3] bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6F581B]">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#2B1F0F]">{card.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#F1E5C3] bg-white/95 p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2B1F0F]"> Inventario general </h3>
            {effectiveLoading && <span className="text-xs text-[#B39237]">Sincronizando…</span>}
          </header>
          <div className="h-64">
            <Bar data={barData} options={sharedOptions} />
          </div>
        </article>

        <article className="rounded-3xl border border-[#F1E5C3] bg-white/95 p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2B1F0F]">Promedio de entrega por ciclo</h3>
          </header>
          <div className="h-64">
            <Line data={averageDeliveryData} options={sharedOptions} />
          </div>
        </article>

        <article className="rounded-3xl border border-[#F1E5C3] bg-white/95 p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2B1F0F]">Pedidos de dotación</h3>
          </header>
          <div className="h-64">
            <Line data={pedidosData} options={sharedOptions} />
          </div>
        </article>

        <article className="rounded-3xl border border-[#F1E5C3] bg-white/95 p-5 shadow-sm">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#2B1F0F]">Dotación por categoría</h3>
          </header>
          <div className="h-64">
            <Doughnut data={dotacionPieData} options={{ ...sharedOptions, scales: undefined }} />
          </div>
        </article>
      </div>
    </section>
  );
}
