import React, { useEffect, useState } from 'react';

const ModalEntrega = ({ isOpen, onClose, onEntregaRegistrada }) => {
  const [formData, setFormData] = useState({
    documento: '',
    id_dotacion: '',
    id_talla: '',
    cantidad: 1,
    fecha_entrega: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const [empleadoData, setEmpleadoData] = useState(null);
  const [kitData, setKitData] = useState(null);
  const [tallas, setTallas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpleado, setLoadingEmpleado] = useState(false);
  const [errors, setErrors] = useState({});
  const [requiereTalla, setRequiereTalla] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (isOpen) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
      });
      const result = await res.json();
      if (result && result.success) {
        const data = result.data;
        // empleado object
        setEmpleadoData(data.empleado);
        setFormData(prev => ({ ...prev, id_dotacion: '', id_talla: '', observaciones: '' }));
        setRequiereTalla(false);

        // fetch kit for the employee's area
        try {
          const kitRes = await fetch('http://localhost:3001/api/kits/area/' + (data.empleado.id_area || ''), {
            headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
          });
          const kitJson = await kitRes.json();
          if (kitJson && kitJson.success && kitJson.data) {
            setKitData(kitJson.data);
            if (kitJson.data.dotaciones && kitJson.data.dotaciones.length > 0) {
              const firstDot = kitJson.data.dotaciones[0];
              setFormData(prev => ({ ...prev, id_dotacion: firstDot.id_dotacion }));
              setRequiereTalla(Boolean(firstDot.talla_requerida === 1 || firstDot.talla_requerida === '1'));

              // fetch tallas available
              try {
                const tallasRes = await fetch('http://localhost:3001/api/dotaciones/tallas/' + firstDot.id_dotacion + '/' + data.empleado.id_empleado, {
                  headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
                });
                const tallasJson = await tallasRes.json();
                if (tallasJson && tallasJson.success) {
                  setTallas(tallasJson.data || []);
                  if (tallasJson.data && tallasJson.data.length > 0) {
                    setFormData(prev => ({ ...prev, id_talla: tallasJson.data[0].id_talla }));
                  }
                }
              } catch (tErr) {
                console.error('Error tallas:', tErr);
              }
            }
          }
        } catch (kitErr) {
          console.error('Error kit:', kitErr);
          setKitData(null);
        }

      } else {
        setEmpleadoData(null);
        setKitData(null);
        setTallas([]);
        setErrors(prev => ({ ...prev, documento: (result && result.message) || 'Empleado no encontrado' }));
      }
    } catch (err) {
      console.error('Error al buscar empleado:', err);
      setEmpleadoData(null);
      setErrors(prev => ({ ...prev, documento: 'Error al buscar empleado' }));
    } finally {
      setLoadingEmpleado(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'id_dotacion') {
      const dot = (kitData && kitData.dotaciones ? kitData.dotaciones : []).find(d => String(d.id_dotacion) === String(value));
      const necesita = Boolean(dot && Number(dot.talla_requerida) === 1 || dot && String(dot.talla_requerida) === '1');
      setRequiereTalla(necesita);

      // fetch tallas for selected dotacion and empleado
      if (necesita && empleadoData) {
        (async () => {
          try {
            const tallasRes = await fetch('http://localhost:3001/api/dotaciones/tallas/' + value + '/' + empleadoData.id_empleado, {
              headers: { Authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
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

  const handleDocumentoKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarEmpleado();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.documento) newErrors.documento = 'Ingresa el documento del empleado';
    if (!empleadoData) newErrors.empleado = 'Busca y selecciona un empleado válido';
    if (!formData.id_dotacion) newErrors.id_dotacion = 'Selecciona una dotación';
    if (requiereTalla && !formData.id_talla) newErrors.id_talla = 'Selecciona una talla';
    if (!formData.cantidad || Number(formData.cantidad) < 1) newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    if (!formData.fecha_entrega) newErrors.fecha_entrega = 'Selecciona una fecha';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/dotaciones/entregar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
        },
        body: JSON.stringify({
          id_empleado: empleadoData.id_empleado,
          id_dotacion: formData.id_dotacion,
          id_talla: requiereTalla ? formData.id_talla : null,
          cantidad: formData.cantidad,
          fecha_entrega: formData.fecha_entrega,
          observaciones: formData.observaciones
        })
      });
      const result = await res.json();
      if (result && result.success) {
        // mark as procesando in UI
        setProcesando(true);
        onEntregaRegistrada();
        resetForm();
        alert('Entrega registrada correctamente');
      } else {
        alert((result && result.message) || 'Error al registrar la entrega');
      }
    } catch (err) {
      console.error('Error al registrar entrega:', err);
      alert('Error de conexión al registrar la entrega');
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
    setProcesando(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white opacity-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-[#B39237]" style={{ backgroundColor: '#ffffff' }}>
        {/* Header - gold banner */}
  <div className="w-full bg-[#B39237] text-white p-4 flex items-center justify-center relative">
          <h2 className="text-lg font-semibold text-center">REGISTRO DOTACION SONORA</h2>
          <button onClick={handleClose} aria-label="Cerrar" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:opacity-90">
            <i className="bx bx-x text-2xl" />
          </button>
        </div>

        <div className="p-6 flex justify-center" style={{ backgroundColor: '#ffffff' }}>
          <div
            className="w-full max-w-2xl bg-white rounded-b-xl p-6 shadow flex flex-col h-full"
            style={{ backgroundColor: '#ffffff', opacity: 1, WebkitBackgroundClip: 'padding-box', backgroundClip: 'padding-box' }}
          >
            <div className="flex flex-col items-center w-full">
              <label className="text-base font-semibold text-gray-700 mb-3">Número de Identificación</label>
              <input
                type="text"
                name="documento"
                value={formData.documento}
                onChange={handleInputChange}
                onKeyPress={handleDocumentoKeyPress}
                placeholder="Ingresa el número de documento"
                className={"mx-auto block text-center px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-[#B39237] bg-white" + (errors.documento ? ' border-red-300' : ' border-[#B39237]')}
                style={{ backgroundColor: '#ffffff', borderColor: (errors.documento ? '#FCA5A5' : '#B39237'), maxWidth: '320px', width: '100%' }}
              />
              <button
                type="button"
                onClick={buscarEmpleado}
                disabled={loadingEmpleado}
                className="mt-4 px-4 py-2 text-sm bg-[#B39237] text-white rounded-lg hover:bg-[#A0812F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                style={{ minWidth: '160px' }}
              >
                {loadingEmpleado ? <i className="bx bx-loader-alt animate-spin" /> : <i className="bx bx-search" />}
                <span>Buscar</span>
              </button>
              {errors.documento && <p className="mt-2 text-sm text-red-600 text-center">{errors.documento}</p>}
            </div>
            {empleadoData && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Información del empleado</h3>
                <p className="text-sm text-gray-700"><strong>Nombre:</strong> {empleadoData.nombre_completo || (empleadoData.nombre + ' ' + (empleadoData.apellido || ''))}</p>
                <p className="text-sm text-gray-700"><strong>Área:</strong> {empleadoData.area_nombre || empleadoData.nombre_area || empleadoData.id_area}</p>
                <p className="text-sm text-gray-700 mb-4"><strong>Ubicación:</strong> {empleadoData.ubicacion || empleadoData.sede || empleadoData.nombre_ubicacion || ''}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dotación (kit)</label>
                    {kitData && kitData.dotaciones && kitData.dotaciones.length > 0 ? (
                      <select name="id_dotacion" value={formData.id_dotacion} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-2 border-[#B39237] shadow-sm bg-white" style={{ backgroundColor: '#ffffff', borderColor: '#B39237' }}>
                        {kitData.dotaciones.map(d => (
                          <option key={d.id_dotacion} value={d.id_dotacion}>{d.nombre || d.nombre_dotacion || d.descripcion || `Dotación ${d.id_dotacion}`}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500">No se encontró un kit para el área del empleado.</p>
                    )}
                    {errors.id_dotacion && <p className="text-sm text-red-600">{errors.id_dotacion}</p>}
                  </div>

                  {requiereTalla && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Talla</label>
                      <select name="id_talla" value={formData.id_talla} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-2 border-[#B39237] shadow-sm bg-white" style={{ backgroundColor: '#ffffff', borderColor: '#B39237' }}>
                        <option value="">Selecciona una talla</option>
                        {tallas && tallas.length > 0 ? tallas.map(t => (
                          <option key={t.id_talla} value={t.id_talla}>{t.nombre || t.descripcion || t.talla}</option>
                        )) : <option disabled>No hay tallas disponibles</option>}
                      </select>
                      {errors.id_talla && <p className="text-sm text-red-600">{errors.id_talla}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input type="number" name="cantidad" min="1" value={formData.cantidad} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-2 border-[#B39237] shadow-sm bg-white" style={{ backgroundColor: '#ffffff', borderColor: '#B39237' }} />
                    {errors.cantidad && <p className="text-sm text-red-600">{errors.cantidad}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de procesamiento</label>
                    <input type="date" name="fecha_entrega" value={formData.fecha_entrega} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-2 border-[#B39237] shadow-sm bg-white" style={{ backgroundColor: '#ffffff', borderColor: '#B39237' }} />
                    {errors.fecha_entrega && <p className="text-sm text-red-600">{errors.fecha_entrega}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-2 border-[#B39237] shadow-sm bg-white" rows={3} style={{ backgroundColor: '#ffffff', borderColor: '#B39237' }} />
                  </div>

                  <div className="flex justify-center mt-6">
                    <button onClick={handleSubmit} disabled={loading || procesando} className="px-6 py-3 bg-[#B39237] text-white rounded hover:bg-[#A0812F] disabled:opacity-50 text-lg font-medium">
                      {loading ? 'Procesando...' : (procesando ? 'En proceso' : 'Procesar dotación')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalEntrega;
