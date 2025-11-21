import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import Modal from '../components/Modal/Modal';
import { getToken } from '../utils/tokenStorage';

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
const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  try {
    return new Date(value).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  } catch (_) {
    return value;
  }
};

const statusVariants = {
  generado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  enviado: 'bg-amber-50 text-amber-700 border border-amber-200',
  recibido: 'bg-green-50 text-green-700 border border-green-200',
  pendiente: 'bg-slate-50 text-slate-600 border border-slate-200'
};

const fetchWithAuth = (url, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

const matchesScope = (item, scope) => {
  if (!scope) return true;
  if (scope.dotacionId && Number(item.id_dotacion) !== Number(scope.dotacionId)) {
    return false;
  }
  if (scope.proveedorId && Number(item.id_proveedor || 0) !== Number(scope.proveedorId)) {
    return false;
  }
  return true;
};

export default function Pedidos() {
  const [stats, setStats] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [metaDetalle, setMetaDetalle] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [warnings, setWarnings] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingFaltantes, setExportingFaltantes] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [recepciones, setRecepciones] = useState([]);
  const [recepcionesLoading, setRecepcionesLoading] = useState(false);
  const [pendientes, setPendientes] = useState([]);
  const [pendientesAgrupados, setPendientesAgrupados] = useState([]);
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);
  const [recepcionSaving, setRecepcionSaving] = useState(false);
  const [recepcionMode, setRecepcionMode] = useState('agrupado');
  const [recepcionScope, setRecepcionScope] = useState(null);
  const [recepcionForm, setRecepcionForm] = useState({
    proveedorNombre: '',
    proveedorId: '',
    documentoReferencia: '',
    fechaRecepcion: '',
    observaciones: '',
    lineas: []
  });
  const [recepcionErrors, setRecepcionErrors] = useState({ general: '', lineas: {} });
  const [lineSavingIndex, setLineSavingIndex] = useState(null);

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

  const cargarRecepciones = useCallback(async (id_pedido) => {
    if (!id_pedido) return;
    setRecepcionesLoading(true);
    try {
      const resp = await fetchWithAuth(`/api/pedidos/${id_pedido}/recepciones`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        setRecepciones(data.data?.recepciones || []);
        setPendientes(data.data?.pendientes || []);
        setPendientesAgrupados(data.data?.pendientesAgrupados || []);
      } else {
        setError(data.message || 'No fue posible cargar las recepciones del pedido');
        setRecepciones([]);
        setPendientes([]);
        setPendientesAgrupados([]);
      }
    } catch (err) {
      console.error('Error cargando recepciones', err);
      setError('Error al cargar las recepciones del pedido');
      setRecepciones([]);
      setPendientes([]);
      setPendientesAgrupados([]);
    } finally {
      setRecepcionesLoading(false);
    }
  }, [setError]);

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
        await cargarRecepciones(id_pedido);
      } else {
        setError(data.message || 'Error cargando detalle del pedido');
      }
    } catch (err) {
      console.error('Detalle pedido error', err);
      setError('Error de conexión al cargar el detalle del pedido');
    } finally {
      setDetailLoading(false);
    }
  }, [cargarRecepciones]);

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

  const eliminarPedido = useCallback(async () => {
    if (!selectedPedido || removing) return;
    const confirmed = window.confirm(`¿Deseas eliminar el pedido #${selectedPedido.id_pedido}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setRemoving(true);
    setError('');
    setInfo('');

    try {
      const resp = await fetchWithAuth(`/api/pedidos/${selectedPedido.id_pedido}`, {
        method: 'DELETE'
      });
      let data = null;
      try {
        data = await resp.json();
      } catch (_) {
        data = null;
      }

      if (!resp.ok || !data?.success) {
        setError(data?.message || 'No fue posible eliminar el pedido.');
        return;
      }

      setInfo(data.message || 'Pedido eliminado correctamente.');
      setSelectedPedido(null);
      setDetalles([]);
      setMetaDetalle(null);
      setWarnings(null);
      await Promise.all([cargarStats(), cargarPedidos(true)]);
    } catch (err) {
      console.error('Eliminar pedido error', err);
      setError('Error de conexión al eliminar el pedido');
    } finally {
      setRemoving(false);
    }
  }, [selectedPedido, removing, cargarStats, cargarPedidos]);

  const resetRecepcionForm = useCallback(() => {
    setRecepcionForm({
      proveedorNombre: '',
      proveedorId: '',
      documentoReferencia: '',
      fechaRecepcion: new Date().toISOString().slice(0, 10),
      observaciones: '',
      lineas: []
    });
    setRecepcionErrors({ general: '', lineas: {} });
  }, []);

  const pendingLineItems = useMemo(
    () => pendientes.filter((line) => Number(line.pendiente) > 0),
    [pendientes]
  );
  const pendingGroupedItems = useMemo(
    () => (pendientesAgrupados || []).filter((group) => Number(group.total_pendiente) > 0),
    [pendientesAgrupados]
  );
  const pendienteTotal = useMemo(
    () => pendingLineItems.reduce((sum, line) => sum + Number(line.pendiente || 0), 0),
    [pendingLineItems]
  );
  const puedeRegistrarRecepcion = useMemo(() => {
    if (!selectedPedido) return false;
    const estado = (selectedPedido.estado || '').toLowerCase();
    return ['enviado', 'recibido_parcial'].includes(estado) && (pendingLineItems.length > 0 || pendingGroupedItems.length > 0);
  }, [selectedPedido, pendingLineItems, pendingGroupedItems]);
  const recepcionStats = useMemo(() => {
    const totalLineas = recepcionForm.lineas.length;
    const totalPendienteModal = recepcionForm.lineas.reduce((sum, linea) => sum + Number(linea.pendiente || 0), 0);
    const totalRegistrar = recepcionForm.lineas.reduce((sum, linea) => sum + Number(linea.cantidad || 0), 0);
    return {
      totalLineas,
      totalPendiente: totalPendienteModal,
      totalRegistrar
    };
  }, [recepcionForm.lineas]);

  const pendingSupplierGroups = useMemo(() => {
    if (!pendingGroupedItems.length) return [];
    const map = pendingGroupedItems.reduce((acc, group) => {
      const key = String(group.id_proveedor ?? 'SIN_PROVEEDOR');
      if (!acc.has(key)) {
        acc.set(key, {
          id_proveedor: group.id_proveedor || null,
          nombre_proveedor: group.nombre_proveedor || 'Proveedor sin asignar',
          totalPendiente: 0,
          totalDotaciones: 0,
          articulos: []
        });
      }
      const entry = acc.get(key);
      entry.totalPendiente += Number(group.total_pendiente || 0);
      entry.totalDotaciones += 1;
      entry.articulos.push({
        id_dotacion: group.id_dotacion,
        nombre_dotacion: group.nombre_dotacion,
        pendiente: Number(group.total_pendiente || 0)
      });
      return acc;
    }, new Map());
    return Array.from(map.values()).sort((a, b) => (
      (a.nombre_proveedor || '').localeCompare(b.nombre_proveedor || '')
    ));
  }, [pendingGroupedItems]);

  const groupedLinesAvailable = useMemo(() => {
    if (!recepcionScope) return pendingGroupedItems.length;
    return pendingGroupedItems.filter((group) => matchesScope(group, recepcionScope)).length;
  }, [pendingGroupedItems, recepcionScope]);

  const recepcionScopeLabel = useMemo(() => {
    if (!recepcionScope) return null;
    if (recepcionScope.label) return recepcionScope.label;
    if (recepcionScope.proveedorNombre) {
      return `Proveedor: ${recepcionScope.proveedorNombre}`;
    }
    if (recepcionScope.dotacionNombre) {
      return `Artículo: ${recepcionScope.dotacionNombre}`;
    }
    return 'Grupo filtrado';
  }, [recepcionScope]);

  const buildRecepcionLineas = useCallback((mode, scope = null) => {
    if (mode === 'agrupado' && pendingGroupedItems.length) {
      return pendingGroupedItems
        .filter((group) => matchesScope(group, scope))
        .map((group) => ({
          tipo: 'agrupado',
          id_dotacion: group.id_dotacion,
          id_proveedor: group.id_proveedor,
          nombre_dotacion: group.nombre_dotacion,
          pendiente: Number(group.total_pendiente || 0),
          cantidad: Number(group.total_pendiente || 0),
          tallas: group.tallas || []
        }))
        .filter((linea) => linea.pendiente > 0);
    }

    return pendingLineItems
      .filter((line) => matchesScope(line, scope))
      .map((line) => ({
        tipo: 'detalle',
        id_detalle_pedido: line.id_detalle,
        id_dotacion: line.id_dotacion,
        id_proveedor: line.id_proveedor,
        nombre_dotacion: line.nombre_dotacion,
        talla: line.talla || 'SIN_TALLA',
        pendiente: Number(line.pendiente || 0),
        cantidad: Number(line.pendiente || 0)
      }))
      .filter((linea) => linea.pendiente > 0);
  }, [pendingGroupedItems, pendingLineItems]);

  const handleRecepcionFieldChange = (field, value) => {
    setRecepcionErrors((prev) => ({ ...prev, general: '' }));
    setRecepcionForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwitchRecepcionMode = useCallback((mode) => {
    if (mode === recepcionMode) return;
    if (mode === 'agrupado' && !groupedLinesAvailable) return;
    const nuevasLineas = buildRecepcionLineas(mode, recepcionScope);
    if (!nuevasLineas.length) {
      setRecepcionErrors({ general: 'El grupo seleccionado ya no tiene pendientes.', lineas: {} });
      return;
    }
    setRecepcionMode(mode);
    setRecepcionForm((prev) => ({
      ...prev,
      lineas: nuevasLineas
    }));
    setRecepcionErrors({ general: '', lineas: {} });
  }, [recepcionMode, groupedLinesAvailable, buildRecepcionLineas, recepcionScope]);

  const handleRecepcionLineaChange = (index, value) => {
    setRecepcionErrors((prev) => {
      if (!prev.lineas?.[index]) return prev;
      const nextLineErrors = { ...prev.lineas };
      const current = { ...(nextLineErrors[index] || {}) };
      delete current.cantidad;
      if (Object.keys(current).length) {
        nextLineErrors[index] = current;
      } else {
        delete nextLineErrors[index];
      }
      return { ...prev, lineas: nextLineErrors };
    });
    setRecepcionForm((prev) => {
      const lineas = [...prev.lineas];
      if (!lineas[index]) return prev;
      const sanitized = Math.max(0, Number(value) || 0);
      lineas[index] = { ...lineas[index], cantidad: sanitized };
      return { ...prev, lineas };
    });
  };

  const handleCerrarRecepcionModal = () => {
    setShowRecepcionModal(false);
    resetRecepcionForm();
    setRecepcionErrors({ general: '', lineas: {} });
    setRecepcionMode('agrupado');
    setRecepcionScope(null);
    setLineSavingIndex(null);
  };

  const validarRecepcionForm = useCallback(() => {
    const result = { general: '', lineas: {} };
    let tieneCantidad = false;

    if (!recepcionForm.fechaRecepcion) {
      result.general = 'Selecciona la fecha de recepción.';
    }

    recepcionForm.lineas.forEach((linea, index) => {
      const cantidad = Number(linea.cantidad || 0);
      if (cantidad <= 0) {
        return;
      }
      tieneCantidad = true;
    });

    if (!tieneCantidad) {
      result.general = result.general || 'Debes registrar cantidades en al menos una línea.';
    }

    result.hasErrors = Boolean(result.general);
    return result;
  }, [recepcionForm]);

  const handleRegistrarRecepcion = async () => {
    if (!selectedPedido) return;
    const validation = validarRecepcionForm();
    if (validation.hasErrors) {
      setRecepcionErrors(validation);
      return;
    }

    const lineasValidas = recepcionForm.lineas.filter((linea) => Number(linea.cantidad) > 0);

    setRecepcionSaving(true);
    setError('');
    setInfo('');
    setRecepcionErrors({ general: '', lineas: {} });

    try {
      const payload = {
        proveedorNombre: recepcionForm.proveedorNombre || null,
        documentoReferencia: recepcionForm.documentoReferencia || null,
        fechaRecepcion: recepcionForm.fechaRecepcion || null,
        observaciones: recepcionForm.observaciones || null,
        items: lineasValidas.map((linea) => (
          linea.tipo === 'agrupado'
            ? {
                cantidad: Number(linea.cantidad),
                id_dotacion: linea.id_dotacion
              }
            : {
                cantidad: Number(linea.cantidad),
                id_detalle_pedido: linea.id_detalle_pedido
              }
        ))
      };

      const resp = await fetchWithAuth(`/api/pedidos/${selectedPedido.id_pedido}/recepciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        setError(data.message || 'No fue posible registrar la recepción.');
        return;
      }

      setInfo(data.message || 'Recepción registrada correctamente.');
      setShowRecepcionModal(false);
      resetRecepcionForm();
      setRecepcionErrors({ general: '', lineas: {} });
      setRecepcionScope(null);
      await cargarDetallePedido(selectedPedido.id_pedido);
      await Promise.all([cargarStats(), cargarPedidos()]);
    } catch (err) {
      console.error('Registrar recepción error', err);
      setError('Error de conexión al registrar la recepción');
    } finally {
      setRecepcionSaving(false);
    }
  };

  const handleRegistrarLineaIndividual = async (index, linea) => {
    if (!selectedPedido || !linea || linea.tipo !== 'agrupado') return;
    const cantidad = Number(linea.cantidad || 0);
    if (cantidad <= 0) {
      setRecepcionErrors((prev) => ({
        ...prev,
        general: prev.general,
        lineas: {
          ...prev.lineas,
          [index]: {
            ...(prev.lineas?.[index] || {}),
            cantidad: 'Ingresa una cantidad mayor a 0.'
          }
        }
      }));
      return;
    }
    if (!recepcionForm.fechaRecepcion) {
      setRecepcionErrors((prev) => ({
        ...prev,
        general: 'Selecciona la fecha de recepción.'
      }));
      return;
    }

    setLineSavingIndex(index);
    setError('');
    setInfo('');

    try {
      const payload = {
        proveedorNombre: recepcionForm.proveedorNombre || null,
        documentoReferencia: recepcionForm.documentoReferencia || null,
        fechaRecepcion: recepcionForm.fechaRecepcion || null,
        observaciones: recepcionForm.observaciones || null,
        items: [{
          cantidad,
          id_dotacion: linea.id_dotacion
        }]
      };

      const resp = await fetchWithAuth(`/api/pedidos/${selectedPedido.id_pedido}/recepciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (!resp.ok || !data.success) {
        setError(data.message || 'No fue posible registrar este artículo.');
        return;
      }

      setInfo(data.message || 'Artículo registrado correctamente.');
      setRecepcionErrors({ general: '', lineas: {} });
      await cargarDetallePedido(selectedPedido.id_pedido);
      await Promise.all([cargarStats(), cargarPedidos()]);
    } catch (err) {
      console.error('Registrar línea individual error', err);
      setError('Error de conexión al registrar este artículo.');
    } finally {
      setLineSavingIndex(null);
    }
  };

  const statsArray = stats ? [
    { icon: 'bx-layer', label: 'Pedidos generados', value: stats.total || 0 },
    { icon: 'bx-send', label: 'Enviados', value: stats.enviados || 0 },
    { icon: 'bx-check-circle', label: 'Recibidos completos', value: stats.recibidos_completos || 0 },
    { icon: 'bx-package', label: 'Artículos solicitados', value: stats.articulos_solicitados || 0 }
  ] : [];

  const detalleResumen = useMemo(() => {
    const totalArticulos = detalles.reduce((sum, det) => sum + Number(det.cantidad_solicitada || 0), 0);
    const totalRecibidos = detalles.reduce((sum, det) => sum + Number(det.cantidad_recibida || 0), 0);
    return {
      totalLineas: detalles.length,
      totalArticulos,
      totalRecibidos,
      totalPendiente: Math.max(totalArticulos - totalRecibidos, 0)
    };
  }, [detalles]);

  const detallesAgrupados = useMemo(() => {
    if (!detalles.length) return [];
    const agrupado = detalles.reduce((acc, det) => {
      const categoria = (det.categoria && det.categoria.trim()) || 'Sin categoría';
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          items: [],
          totalCantidad: 0,
          totalRecibido: 0,
          totalPendiente: 0,
          totalSubtotal: 0
        };
      }
      acc[categoria].items.push(det);
      const solicitado = Number(det.cantidad_solicitada || 0);
      const recibido = Number(det.cantidad_recibida || 0);
      acc[categoria].totalCantidad += solicitado;
      acc[categoria].totalRecibido += recibido;
      acc[categoria].totalPendiente += Math.max(solicitado - recibido, 0);
      acc[categoria].totalSubtotal += Number(det.subtotal || 0);
      return acc;
    }, {});
    return Object.values(agrupado).sort((a, b) => a.categoria.localeCompare(b.categoria));
  }, [detalles]);


  const handleOpenRecepcionModal = useCallback((scope = null) => {
    if (!selectedPedido) return;
    const groupedLineas = buildRecepcionLineas('agrupado', scope);
    const detailedLineas = buildRecepcionLineas('detalle', scope);
    const defaultMode = groupedLineas.length ? 'agrupado' : 'detalle';
    const lineas = defaultMode === 'agrupado' ? groupedLineas : detailedLineas;
    if (!lineas.length) {
      setError(scope ? 'El grupo seleccionado ya no tiene unidades pendientes.' : 'El pedido no tiene unidades pendientes para recibir.');
      return;
    }
    resetRecepcionForm();
    setRecepcionScope(scope);
    setRecepcionMode(defaultMode);
    const hoy = new Date().toISOString().slice(0, 10);
    setRecepcionForm((prev) => ({
      ...prev,
      fechaRecepcion: hoy,
      proveedorNombre: scope?.proveedorNombre || prev.proveedorNombre || '',
      lineas
    }));
    setRecepcionErrors({ general: '', lineas: {} });
    setShowRecepcionModal(true);
  }, [selectedPedido, buildRecepcionLineas, resetRecepcionForm]);

  useEffect(() => {
    if (!showRecepcionModal) return;
    const nuevasLineas = buildRecepcionLineas(recepcionMode, recepcionScope);
    setRecepcionForm((prev) => {
      if (!nuevasLineas.length && !prev.lineas.length) {
        return prev;
      }
      const sameStructure = prev.lineas.length === nuevasLineas.length && prev.lineas.every((linea, idx) => {
        const nueva = nuevasLineas[idx];
        if (!nueva) return false;
        if (linea.tipo !== nueva.tipo) return false;
        if ((linea.id_detalle_pedido || null) !== (nueva.id_detalle_pedido || null)) return false;
        if ((linea.id_dotacion || null) !== (nueva.id_dotacion || null)) return false;
        if (Number(linea.pendiente || 0) !== Number(nueva.pendiente || 0)) return false;
        return true;
      });
      if (sameStructure) {
        return prev;
      }
      return {
        ...prev,
        lineas: nuevasLineas
      };
    });
  }, [showRecepcionModal, buildRecepcionLineas, recepcionMode, recepcionScope]);

  useEffect(() => {
    if (!detallesAgrupados.length) {
      setExpandedGroups({});
      return;
    }
    setExpandedGroups((prev) => {
      const next = {};
      detallesAgrupados.forEach((grupo, index) => {
        next[grupo.categoria] = prev[grupo.categoria] ?? index === 0;
      });
      return next;
    });
  }, [detallesAgrupados]);

  const toggleGrupo = useCallback((categoria) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  }, []);

  const statusBadge = (estado) => {
    if (!estado) return 'bg-slate-50 text-slate-500 border border-slate-100';
    const normalized = estado.toLowerCase();
    return statusVariants[normalized] || 'bg-slate-50 text-slate-600 border border-slate-200';
  };

  return (
    <>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
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
            <div className="space-y-3">
              {pedidos.map((pedido) => {
                const isSelected = selectedPedido?.id_pedido === pedido.id_pedido;
                return (
                  <button
                    key={pedido.id_pedido}
                    type="button"
                    onClick={() => cargarDetallePedido(pedido.id_pedido)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${isSelected ? 'border-[#E2BE69] bg-[#FFFDF4] shadow-sm' : 'border-gray-100 hover:border-[#E2BE69]/70 hover:bg-white'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Pedido #{pedido.id_pedido}</p>
                        <p className="text-xs text-gray-500">{formatDate(pedido.fecha)}</p>
                      </div>
                      <span className={`px-2 py-1 text-[0.65rem] font-semibold rounded-full capitalize ${statusBadge(pedido.estado)}`}>
                        {pedido.estado || 'Sin estado'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>{pedido.nombre_ciclo || 'Ciclo no asociado'}</span>
                      <span className="text-sm font-semibold text-gray-800">{formatMoney(pedido.total_pedido)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardPanel>

        <CardPanel
          title="Detalle consolidado"
          icon="bx-table"
          actions={
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportarPedido}
                disabled={!selectedPedido || exporting}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${!selectedPedido || exporting ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-[#6F581B] border-[#E2BE69] hover:bg-[#F9F4E7]'}`}
              >
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </button>
              <button
                onClick={eliminarPedido}
                disabled={!selectedPedido || removing}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${!selectedPedido || removing ? 'text-red-300 border-red-100 cursor-not-allowed' : 'text-red-700 border-red-200 hover:bg-red-50'}`}
              >
                {removing ? 'Eliminando...' : 'Eliminar Pedido'}
              </button>
              <button
                onClick={handleOpenRecepcionModal}
                disabled={!puedeRegistrarRecepcion}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${!puedeRegistrarRecepcion ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
              >
                Registrar recepción
              </button>
            </div>
          }
        >
          {!selectedPedido ? (
            <div className="py-10 text-center text-gray-500 text-sm">Selecciona un pedido para ver su consolidado.</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[{
                  label: 'Pedido',
                  value: `#${selectedPedido.id_pedido}`
                }, {
                  label: 'Fecha',
                  value: formatDate(selectedPedido.fecha)
                }, {
                  label: 'Ciclo',
                  value: selectedPedido.nombre_ciclo || 'No asignado'
                }, {
                  label: 'Estado',
                  value: selectedPedido.estado,
                  isBadge: true
                }].map(({ label, value, isBadge }) => (
                  <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                    {isBadge ? (
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadge(value)}`}>
                        {value || 'Sin estado'}
                      </span>
                    ) : (
                      <p className="text-gray-900 font-semibold">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {metaDetalle && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[{
                      label: 'Líneas',
                      value: metaDetalle.totalLineas || detalleResumen.totalLineas
                    }, {
                      label: 'Solicitado (uds)',
                      value: metaDetalle.totalItems || detalleResumen.totalArticulos
                    }, {
                      label: 'Recibido (uds)',
                      value: detalleResumen.totalRecibidos
                    }, {
                      label: 'Pendiente (uds)',
                      value: pendienteTotal
                    }].map(({ label, value }) => (
                      <div key={label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                        <p className="text-xl font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Total consolidado</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatMoney(metaDetalle.totalPedido ?? selectedPedido.total_pedido)}</p>
                  </div>
                </>
              )}

              {detailLoading ? (
                <div className="py-10 text-center text-gray-500">Cargando detalle...</div>
              ) : detalles.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">El pedido no contiene artículos.</div>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Pendientes por recibir</p>
                          <p className="text-xs text-gray-500">{pendingLineItems.length} líneas · {pendienteTotal} unidades</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${pendienteTotal ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {pendienteTotal ? 'En proceso' : 'Completado'}
                        </span>
                      </div>
                      {pendingLineItems.length ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-500 uppercase">
                                <th className="py-2 px-4">Artículo</th>
                                <th className="py-2 px-4">Talla</th>
                                <th className="py-2 px-4">Pendiente</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {pendingLineItems.map((linea) => (
                                <tr key={linea.id_detalle}>
                                  <td className="py-2 px-4 text-gray-800">{linea.nombre_dotacion}</td>
                                  <td className="py-2 px-4 text-gray-600">{linea.talla || 'SIN_TALLA'}</td>
                                  <td className="py-2 px-4 text-gray-900 font-semibold">{linea.pendiente}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="px-4 py-6 text-sm text-gray-500">Todo el pedido fue recibido.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Recepciones registradas</p>
                          <p className="text-xs text-gray-500">Historial de ingresos parciales</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenRecepcionModal}
                          disabled={!puedeRegistrarRecepcion}
                          className={`text-xs font-semibold rounded-full px-3 py-1 border ${!puedeRegistrarRecepcion ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                        >
                          + Registrar
                        </button>
                      </div>
                      {recepcionesLoading ? (
                        <p className="px-4 py-6 text-sm text-gray-500">Cargando recepciones...</p>
                      ) : recepciones.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500">Aún no se ha registrado ninguna recepción.</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {recepciones.map((recepcion) => {
                            const totalLineas = recepcion.detalles?.length || 0;
                            const totalCantidad = (recepcion.detalles || []).reduce((sum, det) => sum + Number(det.cantidad_recibida || 0), 0);
                            return (
                              <div key={recepcion.id_recepcion} className="px-4 py-3 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">Recepción #{recepcion.id_recepcion}</p>
                                    <p className="text-xs text-gray-500">{formatDateTime(recepcion.fecha_recepcion)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-emerald-700">{totalCantidad} uds</p>
                                    <p className="text-xs text-gray-500">{totalLineas} líneas</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                  {recepcion.proveedor_resumen && (
                                    <p><span className="font-semibold">Proveedor:</span> {recepcion.proveedor_resumen}</p>
                                  )}
                                  {recepcion.documento_referencia && (
                                    <p><span className="font-semibold">Documento:</span> {recepcion.documento_referencia}</p>
                                  )}
                                  <p><span className="font-semibold">Registrado por:</span> {recepcion.usuario_registro || '—'}</p>
                                  {recepcion.observaciones && (
                                    <p className="text-gray-500">{recepcion.observaciones}</p>
                                  )}
                                </div>
                                {recepcion.detalles?.length ? (
                                  <div className="overflow-x-auto border border-gray-50 rounded-xl">
                                    <table className="min-w-full text-xs">
                                      <thead className="bg-gray-50 text-gray-500 uppercase">
                                        <tr>
                                          <th className="py-2 px-3 text-left">Artículo</th>
                                          <th className="py-2 px-3 text-left">Talla</th>
                                          <th className="py-2 px-3 text-left">Cantidad</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {recepcion.detalles.map((det) => (
                                          <tr key={`${recepcion.id_recepcion}-${det.id_recepcion_detalle}`}>
                                            <td className="py-2 px-3 text-gray-800">{det.nombre_dotacion}</td>
                                            <td className="py-2 px-3 text-gray-600">{det.talla || 'SIN_TALLA'}</td>
                                            <td className="py-2 px-3 text-gray-900 font-semibold">{det.cantidad_recibida}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {pendingSupplierGroups.length > 0 && (
                    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Grupos por proveedor</p>
                          <p className="text-xs text-gray-500">{pendingSupplierGroups.length} proveedores con pendientes</p>
                        </div>
                        <p className="text-xs text-gray-500">Registra entregas parciales según cada proveedor</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {pendingSupplierGroups.map((proveedor) => {
                          const resumenArticulos = proveedor.articulos
                            .slice(0, 2)
                            .map((item) => `${item.nombre_dotacion} (${item.pendiente})`)
                            .join(' · ');
                          const label = proveedor.nombre_proveedor || 'Proveedor sin asignar';
                          return (
                            <div key={`${proveedor.id_proveedor ?? 'SIN'}-${label}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{label}</p>
                                <p className="text-xs text-gray-500">{proveedor.totalDotaciones} artículos · {proveedor.totalPendiente} uds pendientes</p>
                                {resumenArticulos && (
                                  <p className="mt-1 text-xs text-gray-400">{resumenArticulos}{proveedor.articulos.length > 2 ? '…' : ''}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenRecepcionModal({
                                  proveedorId: proveedor.id_proveedor,
                                  proveedorNombre: label,
                                  label: `Proveedor: ${label}`
                                })}
                                disabled={!puedeRegistrarRecepcion}
                                className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${!puedeRegistrarRecepcion ? 'text-gray-300 border-gray-100 cursor-not-allowed' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                              >
                                Registrar grupo
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {detallesAgrupados.map((grupo) => {
                      const expanded = expandedGroups[grupo.categoria];
                      return (
                        <div key={grupo.categoria} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => toggleGrupo(grupo.categoria)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{grupo.categoria}</p>
                              <p className="text-xs text-gray-500">{grupo.items.length} líneas · {grupo.totalCantidad} solicitadas · {grupo.totalRecibido} recibidas</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-900">{formatMoney(grupo.totalSubtotal)}</span>
                              <i className={`bx bx-chevron-${expanded ? 'up' : 'down'} text-xl text-gray-500`}></i>
                            </div>
                          </button>
                          {expanded && (
                            <div className="border-t border-gray-50 overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="text-left text-gray-500 uppercase text-xs">
                                    <th className="py-2 pr-4">Artículo</th>
                                    <th className="py-2 pr-4">Talla</th>
                                    <th className="py-2 pr-4">Solicitado</th>
                                    <th className="py-2 pr-4">Recibido</th>
                                    <th className="py-2 pr-4">Pendiente</th>
                                    <th className="py-2 pr-4">Precio unitario</th>
                                    <th className="py-2 pr-4">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {grupo.items.map((item) => {
                                    const solicitado = Number(item.cantidad_solicitada || 0);
                                    const recibido = Number(item.cantidad_recibida || 0);
                                    const pendiente = Math.max(solicitado - recibido, 0);
                                    return (
                                      <tr key={`${grupo.categoria}-${item.id_dotacion}-${item.id_talla || item.talla}`}>
                                        <td className="py-2 pr-4 text-gray-800">{item.nombre_dotacion}</td>
                                        <td className="py-2 pr-4 text-gray-600">{item.talla || 'SIN_TALLA'}</td>
                                        <td className="py-2 pr-4 text-gray-800 font-semibold">{solicitado}</td>
                                        <td className="py-2 pr-4 text-emerald-700 font-semibold">{recibido}</td>
                                        <td className={`py-2 pr-4 font-semibold ${pendiente ? 'text-amber-700' : 'text-gray-500'}`}>{pendiente}</td>
                                        <td className="py-2 pr-4 text-gray-700">{formatMoney(item.precio_unitario)}</td>
                                        <td className="py-2 pr-4 text-gray-900 font-semibold">{formatMoney(item.subtotal)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </CardPanel>
      </div>
    </div>
      <Modal
        isOpen={showRecepcionModal}
        onClose={handleCerrarRecepcionModal}
        title={`Registrar recepción${selectedPedido ? ` · Pedido #${selectedPedido.id_pedido}` : ''}`}
        size="xl"
        footer={[
          <button
            key="cancel"
            type="button"
            onClick={handleCerrarRecepcionModal}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>,
          <button
            key="save"
            type="button"
            onClick={handleRegistrarRecepcion}
            disabled={recepcionSaving || lineSavingIndex !== null}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white shadow ${(recepcionSaving || lineSavingIndex !== null)
              ? 'bg-emerald-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'}`}
          >
            {recepcionSaving ? 'Registrando...' : 'Registrar recepción'}
          </button>
        ]}
      >
        <div className="space-y-6">
          {recepcionErrors.general && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
              {recepcionErrors.general}
            </div>
          )}

          {recepcionScopeLabel && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs text-emerald-800">
              Registrando únicamente líneas de {recepcionScopeLabel}.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Proveedor</label>
              <input
                type="text"
                value={recepcionForm.proveedorNombre}
                onChange={(e) => handleRecepcionFieldChange('proveedorNombre', e.target.value)}
                placeholder="Nombre del proveedor"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Identificación</label>
              <input
                type="text"
                value={recepcionForm.proveedorId}
                onChange={(e) => handleRecepcionFieldChange('proveedorId', e.target.value)}
                placeholder="NIT / Cédula"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Documento de referencia</label>
              <input
                type="text"
                value={recepcionForm.documentoReferencia}
                onChange={(e) => handleRecepcionFieldChange('documentoReferencia', e.target.value)}
                placeholder="Factura, remisión, etc."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-gray-500">Fecha de recepción</label>
              <input
                type="date"
                value={recepcionForm.fechaRecepcion}
                onChange={(e) => handleRecepcionFieldChange('fechaRecepcion', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[{
              label: 'Líneas pendientes',
              value: recepcionStats.totalLineas
            }, {
              label: 'Unidades pendientes',
              value: recepcionStats.totalPendiente
            }, {
              label: 'A registrar ahora',
              value: recepcionStats.totalRegistrar
            }].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-gray-400">{metric.label}</p>
                <p className="text-xl font-semibold text-gray-900">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-2xl bg-gray-100 p-1 text-xs font-semibold text-gray-500">
              <button
                type="button"
                onClick={() => handleSwitchRecepcionMode('agrupado')}
                disabled={!groupedLinesAvailable}
                className={`px-4 py-2 rounded-2xl transition ${recepcionMode === 'agrupado' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'} ${!groupedLinesAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Agrupar por artículo
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRecepcionMode('detalle')}
                className={`px-4 py-2 rounded-2xl transition ${recepcionMode === 'detalle' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}
              >
                Detalle por talla
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {recepcionMode === 'agrupado'
                ? 'Distribuiremos automáticamente las cantidades entre las tallas con pendiente.'
                : 'Define cantidades por cada talla pendiente.'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white/80">
            {recepcionForm.lineas.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No hay líneas pendientes en este pedido.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500">
                      <th className="px-3 py-2">Artículo</th>
                      <th className="px-3 py-2">Talla</th>
                      <th className="px-3 py-2">Pendiente</th>
                      <th className="px-3 py-2">Recibir ahora</th>
                      {recepcionMode === 'agrupado' && (
                        <th className="px-3 py-2 text-right">Acción</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recepcionForm.lineas.map((linea, index) => {
                      const resumenTallas = Array.isArray(linea.tallas)
                        ? linea.tallas.slice(0, 3).map((tallaData) => `${tallaData.talla || 'SIN_TALLA'} (${tallaData.pendiente})`).join(' · ')
                        : null;
                      const rowKey = linea.tipo === 'agrupado'
                        ? `agrupado-${linea.id_dotacion}-${index}`
                        : `detalle-${linea.id_detalle_pedido}-${index}`;
                      return (
                        <tr key={rowKey}>
                          <td className="px-3 py-3 text-gray-900">
                            <p className="text-sm font-semibold">{linea.nombre_dotacion}</p>
                            {linea.tipo === 'agrupado' ? (
                              <p className="mt-0.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-700">
                                Modo agrupado
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500">ID detalle #{linea.id_detalle_pedido}</p>
                            )}
                            {resumenTallas && (
                              <p className="mt-1 text-xs text-gray-500">Pendientes: {resumenTallas}{linea.tallas.length > 3 ? '…' : ''}</p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            {linea.tipo === 'agrupado'
                              ? `${linea.tallas?.length || 0} tallas`
                              : (linea.talla || 'SIN_TALLA')}
                          </td>
                          <td className="px-3 py-3 text-gray-900 font-semibold">{linea.pendiente}</td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              value={linea.cantidad}
                              onChange={(e) => handleRecepcionLineaChange(index, e.target.value)}
                              className="w-28 rounded-xl border border-gray-200 px-2 py-1 text-sm text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                            {recepcionErrors.lineas?.[index]?.cantidad && (
                              <p className="mt-1 text-xs text-red-600">{recepcionErrors.lineas[index].cantidad}</p>
                            )}
                          </td>
                          {recepcionMode === 'agrupado' && (
                            <td className="px-3 py-3 text-right">
                              {linea.tipo === 'agrupado' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRegistrarLineaIndividual(index, linea)}
                                  disabled={lineSavingIndex !== null || recepcionSaving || Number(linea.cantidad || 0) <= 0}
                                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${lineSavingIndex !== null || recepcionSaving || Number(linea.cantidad || 0) <= 0
                                    ? 'text-gray-300 border-gray-100 cursor-not-allowed'
                                    : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
                                >
                                  {lineSavingIndex === index ? 'Registrando...' : 'Registrar artículo'}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">Solo disponible por artículo</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Notas adicionales</label>
            <textarea
              value={recepcionForm.observaciones}
              onChange={(e) => handleRecepcionFieldChange('observaciones', e.target.value)}
              rows={3}
              placeholder="Anota novedades logísticas, empaques pendientes, etc."
              className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Modal>

    </>
  );
}
