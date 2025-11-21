import React, { useEffect, useRef, useState } from 'react';
import { getToken } from '../../utils/tokenStorage';

const ModalEntrega = ({ isOpen, onClose, onEntregaRegistrada }) => {
  const [formData, setFormData] = useState({
    documento: '',
    id_dotacion: '',
    id_kit: '',
    id_talla: '',
    cantidad: 1,
    fecha_entrega: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const [empleadoData, setEmpleadoData] = useState(null);
  const [kitData, setKitData] = useState(null);
  const [tallas, setTallas] = useState([]);
  // Mapa de tallas disponibles por ítem del kit: { [id_dotacion]: Tallas[] }
  const [tallasPorItemOptions, setTallasPorItemOptions] = useState({});
  // Selecciones del usuario por ítem del kit: { [id_dotacion]: id_talla }
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [errors, setErrors] = useState({});
  const [requiereTalla, setRequiereTalla] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const inputRef = useRef(null);

  const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Lista de dotaciones a mostrar: preferir las dotaciones del kit (kitData) para
  // asegurar que se muestren solo los elementos asociados al área. Si no hay
  // información de kit, caer a dotaciones_disponibles (calculadas por el endpoint
  // empleado). Esto fuerza la UI a mostrar únicamente los elementos del kit.
  const availableDotaciones = (kitData && Array.isArray(kitData.dotaciones) && kitData.dotaciones.length > 0)
    ? kitData.dotaciones
    : (empleadoData && Array.isArray(empleadoData.dotaciones_disponibles) ? empleadoData.dotaciones_disponibles : []);

  if (process.env.NODE_ENV !== 'production') {
    if (isOpen) console.log('[ModalEntrega] availableDotaciones (preferred from kitData) ids:', availableDotaciones.map(d => d.id_dotacion));
  }

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    // focus en input y cerrar con ESC
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Bloquear scroll de fondo mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const { body } = document;
      const prev = body.style.overflow;
      body.style.overflow = 'hidden';
      return () => { body.style.overflow = prev; };
    }
  }, [isOpen]);

  const buscarEmpleado = async () => {
    if (!formData.documento || !formData.documento.trim()) {
      setErrors(prev => ({ ...prev, documento: 'Ingresa el documento del empleado' }));
      return;
    }
    setLoadingEmpleado(true);
    setErrors(prev => ({ ...prev, documento: '' }));

    try {
      const res = await fetch('http://localhost:3001/api/dotaciones/empleado/' + encodeURIComponent(formData.documento), {
        headers: buildAuthHeaders(),
        cache: 'no-store'
      });
      const result = await res.json();
        if (result && result.success) {
        const data = result.data;
  // empleado object - anexar dotaciones_disponibles para facilitar uso en UI
  setEmpleadoData({ ...(data.empleado || {}), dotaciones_disponibles: data.dotaciones_disponibles || [] });
        setFormData(prev => ({ ...prev, id_dotacion: '', id_talla: '', observaciones: '' }));
        setRequiereTalla(false);

        const dotacionesPreferidas = Array.isArray(data.dotaciones_disponibles) ? data.dotaciones_disponibles : [];
        const kitPayload = (data.kit || dotacionesPreferidas.length > 0)
          ? { kit: data.kit || null, dotaciones: dotacionesPreferidas }
          : null;
        setKitData(kitPayload);
        if (process.env.NODE_ENV !== 'production') {
          console.log('[ModalEntrega] dotaciones asignadas al empleado:', dotacionesPreferidas.map(d => d.id_dotacion));
        }

        // Si el endpoint de empleado ya nos devolvió metadata del kit, usarla
        // para poblar inmediatamente el id_kit y evitar llamadas innecesarias.
        if (data.kit && data.kit.id_kit) {
          setFormData(prev => ({ ...prev, id_kit: data.kit.id_kit }));
        }

        // Determinar si el primer elemento requiere talla para habilitar UI.
        const firstDot = dotacionesPreferidas[0];
        setRequiereTalla(Boolean(firstDot && (firstDot.talla_requerida === 1 || firstDot.talla_requerida === '1')));

        // Reiniciar selecciones de tallas por ítem cuando se carga un empleado nuevo
        setTallasPorItemOptions({});
        setTallasSeleccionadas({});
      } else {
        setEmpleadoData(null);
        setErrors(prev => ({ ...prev, documento: result.message || 'Empleado no encontrado' }));
      }
    } catch (err) {
      console.error('Error al buscar empleado:', err);
      alert('Error de conexión al buscar empleado');
    } finally {
      setLoadingEmpleado(false);
    }
  };

  // Cargar tallas para cada dotación del kit que requiera talla
  useEffect(() => {
    const cargarTallasPorItem = async () => {
      if (!empleadoData || !Array.isArray(availableDotaciones) || availableDotaciones.length === 0) return;
      const authHeaders = buildAuthHeaders();
      const nuevasOpciones = { ...tallasPorItemOptions };
      const nuevasSelecciones = { ...tallasSeleccionadas };

      for (const d of availableDotaciones) {
        const requiere = (d.talla_requerida === 1 || d.talla_requerida === '1' || d.talla_requerida === true);
        if (!requiere) continue;
        // Evitar recargar si ya tenemos opciones para este id_dotacion
        if (Array.isArray(nuevasOpciones[d.id_dotacion]) && nuevasOpciones[d.id_dotacion].length > 0) continue;
        try {
          const resp = await fetch(`http://localhost:3001/api/dotaciones/tallas/${d.id_dotacion}/${empleadoData.id_empleado}`, {
            headers: authHeaders
          });
          const json = await resp.json();
          const opts = Array.isArray(json?.data) ? json.data : [];
          nuevasOpciones[d.id_dotacion] = opts;
          if (!nuevasSelecciones[d.id_dotacion] && opts.length > 0) {
            nuevasSelecciones[d.id_dotacion] = opts[0].id_talla;
          }
        } catch (e) {
          console.error('Error cargando tallas para dotación', d.id_dotacion, e);
          nuevasOpciones[d.id_dotacion] = [];
        }
      }
      setTallasPorItemOptions(nuevasOpciones);
      setTallasSeleccionadas(nuevasSelecciones);
    };

    cargarTallasPorItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoData, kitData]);

  const handleDocumentoKeyPress = async (e) => {
    if (e.key === 'Enter') {
      await buscarEmpleado();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'id_dotacion') {
      const selected = availableDotaciones.find(d => String(d.id_dotacion) === String(value));
      const necesita = selected && (selected.talla_requerida === 1 || selected.talla_requerida === '1' || selected.talla_requerida === true);
      setRequiereTalla(Boolean(necesita));

      if (necesita && empleadoData) {
        (async () => {
          try {
            const tallasRes = await fetch('http://localhost:3001/api/dotaciones/tallas/' + value + '/' + empleadoData.id_empleado, {
              headers: buildAuthHeaders()
            });
            const tallasJson = await tallasRes.json();
            if (tallasJson && tallasJson.success) {
              setTallas(tallasJson.data || []);
              if (tallasJson.data && tallasJson.data.length > 0) {
                setFormData(prev => ({ ...prev, id_talla: tallasJson.data[0].id_talla }));
              }
            }
          } catch (err) {
            console.error('Error fetching tallas on change:', err);
          }
        })();
      } else {
        setTallas([]);
        setFormData(prev => ({ ...prev, id_talla: '' }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!empleadoData) {
      alert('Busca primero un empleado válido');
      return;
    }

    if (!formData.id_kit) {
      alert('No hay kit seleccionado para el empleado');
      return;
    }

    setLoading(true);
    try {
      // Construir tallas_por_item obligatorias para las dotaciones que requieran talla
      const requiereTallaItems = (availableDotaciones || []).filter(d => (d.talla_requerida === 1 || d.talla_requerida === '1' || d.talla_requerida === true));
      const tallasPayload = [];
      for (const d of requiereTallaItems) {
        const sel = tallasSeleccionadas[d.id_dotacion];
        if (!sel) {
          setLoading(false);
          alert(`Selecciona una talla para: ${d.nombre || d.nombre_dotacion || 'ítem ' + d.id_dotacion}`);
          return;
        }
        tallasPayload.push({ id_dotacion: d.id_dotacion, id_talla: sel });
      }

      const payload = {
        id_empleado: empleadoData.id_empleado,
        id_kit: formData.id_kit,
        fecha_entrega: formData.fecha_entrega,
        observaciones: formData.observaciones,
        tallas_por_item: tallasPayload
      };

      const res = await fetch('http://localhost:3001/api/kits/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json && json.success) {
        alert('Entrega del kit registrada correctamente');
        // limpiar y notificar
        resetForm();
        if (onEntregaRegistrada) onEntregaRegistrada();
      } else {
        console.error('Error respuesta backend:', json);
        const extra = json && (json.error || json.sqlMessage || json.code) ? `\nDetalle: ${json.error || json.sqlMessage || json.code}` : '';
        alert('Error registrando la entrega: ' + (json.message || 'error desconocido') + extra);
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      alert('Error de conexión al enviar.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      documento: '',
      id_dotacion: '',
      id_talla: '',
      cantidad: 1,
      fecha_entrega: new Date().toISOString().split('T')[0],
      observaciones: ''
    });
    setEmpleadoData(null);
    setErrors({});
    setRequiereTalla(false);
    setLoadingEmpleado(false);
    setKitData(null);
    setTallas([]);
    setTallasPorItemOptions({});
    setTallasSeleccionadas({});
    setProcesando(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const hasEmpleado = Boolean(empleadoData);

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-entrega-title">
      <div className="bg-white always-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] overflow-hidden ring-1 ring-gray-200">
        {/* Header */}
        <div className="relative bg-[#B39237] text-white py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 id="modal-entrega-title" className="text-lg font-semibold tracking-wide">Registro de Dotación</h2>
                <p className="text-xs text-white">Proceso guiado: identificar empleado · verificar kit · confirmar entrega</p>
              </div>
            </div>
            <button onClick={handleClose} aria-label="Cerrar" className="rounded-lg p-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
          </div>

          {/* Steps */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${!hasEmpleado ? 'bg-white text-[#9C7F2F]' : 'bg-[#F7F2E0] text-[#9C7F2F] ring-1 ring-[#E4D6A4]'}`}>1. Identificación</span>
            <span className={`px-2 py-1 rounded-full ${hasEmpleado ? 'bg-white text-[#9C7F2F]' : 'bg-[#F7F2E0] text-[#9C7F2F] ring-1 ring-[#E4D6A4]'}`}>2. Kit</span>
            <span className="px-2 py-1 rounded-full  bg-[#F7F2E0] text-[#9C7F2F] ring-1 ring-[#E4D6A4]">3. Confirmación</span>
          </div>
        </div>

  {/* Form */}
  <form onSubmit={(e)=>{e.preventDefault(); handleSubmit();}} className="bg-white always-white">
  {/* Body */}
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 bg-white always-white">
          {/* Left: identificación */}
          <div className="lg:col-span-2 p-6 bg-white always-white">
            <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white always-white">
              <h3 className="text-sm font-semibold text-gray-500">Número de identificación</h3>
              <p className="text-xs text-gray-500 mb-3">Ingresa el documento y presiona Enter o haz clic en Buscar.</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="8"/></svg>
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleInputChange}
                    onKeyPress={handleDocumentoKeyPress}
                    placeholder="Ingresa el número de documento"
                    className={`w-full rounded-lg border bg-white px-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B39237] ${errors.documento ? 'border-red-300' : 'border-gray-300'}`}
                    disabled={loadingEmpleado}
                  />
                </div>
                <button
                  type="button"
                  onClick={buscarEmpleado}
                  disabled={loadingEmpleado}
                  className="inline-flex items-center justify-center rounded-lg bg-[#B39237] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#9C7F2F] transition disabled:opacity-60"
                >
                  {loadingEmpleado ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="8"/></svg>
                  )}
                  <span className="ml-2">Buscar</span>
                </button>
              </div>
              {errors.documento && <p className="mt-2 text-xs text-red-600">{errors.documento}</p>}
            </div>

            {/* Observaciones y fecha */}
            {hasEmpleado && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="rounded-2xl border border-gray-200 p-4 shadow-sm bg-white always-white">
                  <label className="block text-sm font-medium text-gray-500">Fecha de procesamiento</label>
                  <input type="date" name="fecha_entrega" value={formData.fecha_entrega} onChange={handleInputChange} className="mt-1 w-full rounded-xl border-gray-300 bg-white always-white shadow-sm focus:border-[#B39237] focus:ring-[#B39237] text-gray-500" />
                </div>
                <div className="rounded-2xl border border-gray-200 p-5 shadow-sm bg-white always-white">
                  <label className="block text-sm font-medium text-gray-500">Observaciones</label>
                  <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows={5} className="mt-1 w-full rounded-xl border-gray-300 bg-white always-white shadow-sm focus:border-[#B39237] focus:ring-[#B39237] text-gray-500" placeholder="Notas adicionales de la entrega (opcional)" />
                </div>
              </div>
            )}
          </div>

          {/* Right: info empleado y kit */}
          <div className="lg:col-span-3 p-6 border-t lg:border-t-0 lg:border-l border-gray-100 bg-white always-white">
            {!hasEmpleado ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-100">
                Espera la búsqueda para mostrar la información del empleado y su kit.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Card empleado */}
                <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white always-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">Empleado</h3>
                      <p className="text-sm text-gray-500">{empleadoData.nombre_completo || (empleadoData.nombre + ' ' + (empleadoData.apellido || ''))}</p>
                      <p className="text-xs text-gray-500">Área: {empleadoData.area_nombre || empleadoData.nombre_area || empleadoData.id_area} · {empleadoData.ubicacion || empleadoData.sede || empleadoData.nombre_ubicacion || ''}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#F7F2E0] px-2.5 py-1 text-xs font-medium text-[#9C7F2F] ring-1 ring-[#E4D6A4]">ID #{empleadoData.id_empleado}</span>
                  </div>
                </div>

                {/* Card kit */}
                <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white always-white">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-500">Kit asignado</h3>
                      <p className="text-xs text-gray-500 truncate">{(kitData && kitData.kit && (kitData.kit.nombre || kitData.kit.nombre_kit)) || `Kit del área`}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">{availableDotaciones.length || 0} ítem(s)</span>
                  </div>
                  <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                    {availableDotaciones.map(d => (
                      <li key={d.id_dotacion} className="rounded-xl border border-gray-100 px-3 py-2 bg-white always-white">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{d.nombre || d.nombre_dotacion || d.descripcion || `Dotación ${d.id_dotacion}`}</span>
                          <span className="text-xs text-gray-500">{d.cantidad_en_kit ? `${d.cantidad_en_kit} u.` : ''}</span>
                        </div>
                        {(d.talla_requerida === 1 || d.talla_requerida === '1') && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-600 mb-1">Talla</label>
                            <select
                              className="w-full rounded-xl border-gray-300 bg-white always-white shadow-sm focus:border-[#B39237] focus:ring-[#B39237] text-sm"
                              value={tallasSeleccionadas[d.id_dotacion] || ''}
                              onChange={(e) => setTallasSeleccionadas(prev => ({ ...prev, [d.id_dotacion]: e.target.value }))}
                            >
                              <option value="">Selecciona una talla</option>
                              {(tallasPorItemOptions[d.id_dotacion] || []).map(t => (
                                <option key={t.id_talla} value={t.id_talla}>{t.nombre || t.descripcion || t.talla}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </li>
                    ))}
                    {availableDotaciones.length === 0 && (
                      <li className="text-sm text-gray-500">No se encontró un kit para el área del empleado.</li>
                    )}
                  </ul>
                  {/* La selección de tallas ahora es por ítem; se elimina el selector global */}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t bg-white always-white px-6 py-4">
          <button type="button" onClick={handleClose} className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white always-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={!hasEmpleado || loading || procesando} className="inline-flex items-center justify-center rounded-xl bg-[#B39237] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#9C7F2F] disabled:opacity-60">
            {loading ? (
              <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            ) : null}
            {loading ? 'Procesando…' : (procesando ? 'En proceso' : 'Confirmar entrega')}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEntrega;
