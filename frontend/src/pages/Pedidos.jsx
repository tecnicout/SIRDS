import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

const formatMoney = (value) => moneyFormatter.format(Number(value) || 0);
const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  try {
    return new Date(value).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
  } catch (_) {
    return value;
  }
};

const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

export default function Pedidos() {
  const [stats, setStats] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [metaDetalle, setMetaDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [warnings, setWarnings] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingFaltantes, setExportingFaltantes] = useState(false);

  const cargarStats = useCallback(async () => {
    try {
      const resp = await fetchWithAuth('/api/pedidos/stats');
      const data = await resp.json();
      if (resp.ok && data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.warn('Error cargando stats de pedidos', err);
    }
  }, []);

  const normalizarDetalles = (items = []) => (items || []).map((det) => ({
    ...det,
    cantidad_solicitada: det.cantidad_solicitada ?? det.cantidad ?? 0,
    subtotal: det.subtotal ?? ((det.cantidad ?? det.cantidad_solicitada ?? 0) * (det.precio_unitario ?? 0))
  }));

  const actualizarMetaDetalle = (pedidoData, detallesData) => {
    const totalItems = detallesData.reduce((sum, det) => sum + Number(det.cantidad_solicitada || 0), 0);
    setMetaDetalle({
      totalItems,
      totalLineas: detallesData.length,
      totalPedido: pedidoData?.total_pedido ?? detallesData.reduce((sum, det) => sum + Number(det.subtotal || 0), 0)
    });
  };

  const cargarDetallePedido = useCallback(async (id_pedido) => {
    if (!id_pedido) return;
    setDetailLoading(true);
    setError('');
    setWarnings(null);
    try {
      const resp = await fetchWithAuth(`/api/pedidos/${id_pedido}`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        const pedidoData = data.data?.pedido || null;
        const detalleNormalizado = normalizarDetalles(data.data?.detalles || []);
        setSelectedPedido(pedidoData);
        setDetalles(detalleNormalizado);
        actualizarMetaDetalle(pedidoData, detalleNormalizado);
      } else {
        setError(data.message || 'Error cargando detalle del pedido');
      }
    } catch (err) {
      console.error('Detalle pedido error', err);
      setError('Error de conexión al cargar el detalle del pedido');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const cargarPedidos = useCallback(async (autoSelect = false) => {
    try {
      const resp = await fetchWithAuth('/api/pedidos');
      const data = await resp.json();
      if (resp.ok && data.success) {
        const listado = Array.isArray(data.data) ? data.data : [];
        setPedidos(listado);
        if (autoSelect) {
          if (listado.length) {
            await cargarDetallePedido(listado[0].id_pedido);
          } else {
            setSelectedPedido(null);
            setDetalles([]);
            setMetaDetalle(null);
          }
        }
        return listado;
      }
      setError(data.message || 'Error cargando pedidos');
    } catch (err) {
      console.error('Listado pedidos error', err);
      setError('Error de conexión al cargar pedidos');
    }
    return [];
  }, [cargarDetallePedido]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([cargarStats(), cargarPedidos(true)]);
      setIsLoading(false);
    })();
  }, [cargarStats, cargarPedidos]);

  const generarPedido = useCallback(async () => {
    if (generating) return;
    const confirmacion = window.confirm('¿Deseas generar un nuevo pedido para el ciclo activo?');
    if (!confirmacion) return;

    setGenerating(true);
    setError('');
    setInfo('');
    setWarnings(null);

    try {
      const resp = await fetchWithAuth('/api/pedidos/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        const pedidoData = data.data?.pedido || null;
        const detalleNormalizado = normalizarDetalles(data.data?.detalles || []);
        if (pedidoData) {
          setSelectedPedido(pedidoData);
        }
        setDetalles(detalleNormalizado);
        actualizarMetaDetalle(pedidoData, detalleNormalizado);
        setInfo('Pedido generado correctamente.');
        await Promise.all([cargarStats(), cargarPedidos()]);
      } else {
        setError(data.message || 'No fue posible generar el pedido.');
        if (data.details) {
          setWarnings(data.details);
        }
      }
    } catch (err) {
      console.error('Generar pedido error', err);
      setError('Error de conexión al generar el pedido');
    } finally {
      setGenerating(false);
    }
  }, [generating, cargarStats, cargarPedidos]);

  const exportarPedido = useCallback(async () => {
    if (!selectedPedido || exporting) return;
    setExporting(true);
    setError('');
    try {
      const resp = await fetchWithAuth(`/api/pedidos/${selectedPedido.id_pedido}/export`);
      if (!resp.ok) {
        throw new Error('Exportación fallida');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Pedido_${selectedPedido.id_pedido}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Exportar pedido error', err);
      setError('No fue posible exportar el pedido.');
    } finally {
      setExporting(false);
    }
  }, [selectedPedido, exporting]);

  const exportarFaltantes = useCallback(async () => {
    if (exportingFaltantes) return;
    setExportingFaltantes(true);
    setError('');
    try {
      const resp = await fetchWithAuth('/api/pedidos/faltantes/export');
      if (resp.status === 204) {
        setInfo('No hay faltantes de talla para exportar.');
        return;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.message || 'Exportación fallida');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Faltantes_tallas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Exportar faltantes error', err);
      setError(err.message || 'No fue posible exportar el listado de faltantes.');
    } finally {
      setExportingFaltantes(false);
    }
  }, [exportingFaltantes]);

  const statsArray = stats ? [
    { icon: 'bx-layer', label: 'Pedidos generados', value: stats.total || 0 },
    { icon: 'bx-send', label: 'Enviados', value: stats.enviados || 0 },
    { icon: 'bx-check-circle', label: 'Recibidos completos', value: stats.recibidos_completos || 0 },
    { icon: 'bx-package', label: 'Artículos solicitados', value: stats.articulos_solicitados || 0 }
  ] : [];

  const detalleResumen = useMemo(() => ({
    totalLineas: detalles.length,
    totalArticulos: detalles.reduce((sum, det) => sum + Number(det.cantidad_solicitada || 0), 0)
  }), [detalles]);

  const detallesAgrupados = useMemo(() => {
    if (!detalles.length) return [];
    const agrupado = detalles.reduce((acc, det) => {
      const categoria = (det.categoria && det.categoria.trim()) || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          items: [],
          totalCantidad: 0,
          totalSubtotal: 0
        };
      }
      acc[categoria].items.push(det);
      acc[categoria].totalCantidad += Number(det.cantidad_solicitada || 0);
      acc[categoria].totalSubtotal += Number(det.subtotal || 0);
      return acc;
    }, {});
    return Object.values(agrupado).sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [detalles]);

  return (
    <div className="space-y-6 p-6">
      <ResourceHeader
        title="Gestión de Pedidos"
        subtitle="Genera pedidos brutos por ciclo activo y consolida cantidades por artículo y talla"
        stats={statsArray}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {info && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">{info}</div>
      )}

      {warnings?.faltantes && warnings.faltantes.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">Faltan tallas para los siguientes empleados:</p>
            <button
              type="button"
              onClick={exportarFaltantes}
              disabled={exportingFaltantes}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${exportingFaltantes ? 'text-amber-400 border-amber-200 cursor-not-allowed' : 'text-amber-900 border-amber-400 hover:bg-amber-100'}`}
            >
              {exportingFaltantes ? 'Exportando...' : 'Exportar Excel'}
            </button>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {warnings.faltantes.map((item) => (
              <li key={`${item.id_empleado}-${item.id_dotacion}`}>
                {item.empleado} · {item.dotacion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings?.empleados && warnings.empleados.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-xl text-sm">
          <p className="font-semibold mb-2">Hay empleados sin kit asignado:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {warnings.empleados.map((item) => (
              <li key={item.id_empleado}>{item.nombre}</li>
            ))}
          </ul>
        </div>
      )}

      <CardPanel
        title="Pedidos generados"
        icon="bx-list-ul"
        actions={
          <button
            onClick={generarPedido}
            disabled={generating}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F]'}`}
          >
            {generating ? 'Generando...' : 'Nuevo Pedido'}
          </button>
        }
      >
        {isLoading ? (
          <div className="py-10 text-center text-gray-500">Cargando...</div>
        ) : pedidos.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm">No hay pedidos registrados.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pedidos.map((pedido) => {
              const isSelected = selectedPedido?.id_pedido === pedido.id_pedido;
              return (
                <li key={pedido.id_pedido}>
                  <button
                    type="button"
                    onClick={() => cargarDetallePedido(pedido.id_pedido)}
                    className={`w-full flex items-center justify-between gap-4 px-3 py-3 text-left transition ${isSelected ? 'bg-[#F9F4E7]' : 'hover:bg-gray-50'}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Pedido #{pedido.id_pedido}</p>
                      <p className="text-xs text-gray-500">{formatDate(pedido.fecha)} · {pedido.nombre_ciclo || 'Ciclo no asociado'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{pedido.estado}</span>
                      <span className="text-sm font-semibold text-gray-700">{formatMoney(pedido.total_pedido)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardPanel>

      <CardPanel
        title="Detalle consolidado"
        icon="bx-table"
        actions={
          <button
            onClick={exportarPedido}
            disabled={!selectedPedido || exporting}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${!selectedPedido || exporting ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-[#6F581B] border-[#E2BE69] hover:bg-[#F9F4E7]'}`}
          >
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        }
      >
        {!selectedPedido ? (
          <div className="py-10 text-center text-gray-500 text-sm">Selecciona un pedido para ver su consolidado.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs uppercase tracking-wide text-gray-500">Pedido</p>
                <p className="text-gray-800 font-semibold">#{selectedPedido.id_pedido}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs uppercase tracking-wide text-gray-500">Fecha</p>
                <p className="text-gray-800 font-semibold">{formatDate(selectedPedido.fecha)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                <p className="text-gray-800 font-semibold">{formatMoney(selectedPedido.total_pedido)}</p>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-gray-500">Cargando detalle...</div>
            ) : detalles.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">El pedido no contiene artículos.</div>
            ) : (
              <div className="space-y-6">
                {detallesAgrupados.map((grupo) => (
                  <div key={grupo.categoria} className="border border-gray-100 rounded-2xl bg-white/60 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-50 bg-gray-50/60 rounded-t-2xl">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{grupo.categoria}</p>
                        <p className="text-xs text-gray-500">
                          {grupo.items.length} líneas · {grupo.totalCantidad} unidades
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {formatMoney(grupo.totalSubtotal)}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 uppercase text-xs">
                            <th className="py-2 pr-4">Artículo</th>
                            <th className="py-2 pr-4">Talla</th>
                            <th className="py-2 pr-4">Cantidad</th>
                            <th className="py-2 pr-4">Precio unitario</th>
                            <th className="py-2 pr-4">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {grupo.items.map((item) => (
                            <tr key={`${grupo.categoria}-${item.id_dotacion}-${item.id_talla || item.talla}`}>
                              <td className="py-2 pr-4 text-gray-800">{item.nombre_dotacion}</td>
                              <td className="py-2 pr-4 text-gray-600">{item.talla || 'SIN_TALLA'}</td>
                              <td className="py-2 pr-4 text-gray-800 font-semibold">{item.cantidad_solicitada}</td>
                              <td className="py-2 pr-4 text-gray-700">{formatMoney(item.precio_unitario)}</td>
                              <td className="py-2 pr-4 text-gray-900 font-semibold">{formatMoney(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {metaDetalle && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
                <div className="p-3 rounded-xl bg-white border border-gray-100">
                  <p className="uppercase tracking-wide text-gray-400">Líneas</p>
                  <p className="text-lg font-semibold text-gray-800">{metaDetalle.totalLineas || detalleResumen.totalLineas}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100">
                  <p className="uppercase tracking-wide text-gray-400">Artículos</p>
                  <p className="text-lg font-semibold text-gray-800">{metaDetalle.totalItems || detalleResumen.totalArticulos}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-gray-100">
                  <p className="uppercase tracking-wide text-gray-400">Total consolidado</p>
                  <p className="text-lg font-semibold text-gray-800">{formatMoney(metaDetalle.totalPedido ?? selectedPedido.total_pedido)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardPanel>
    </div>
  );
}
