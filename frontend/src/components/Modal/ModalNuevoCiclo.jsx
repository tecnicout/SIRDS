import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { getToken } from '../../utils/tokenStorage';

const ModalNuevoCiclo = ({ isOpen, onClose, onCicloCreado }) => {
  const [formData, setFormData] = useState({
    nombre_ciclo: '',
    fecha_entrega: '',
    observaciones: ''
  });
  
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errors, setErrors] = useState({});
  const [mostrarPreview, setMostrarPreview] = useState(false);
  
  const nombreInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Generar nombre sugerido basado en la fecha actual
      const ahora = new Date();
      const trimestre = Math.ceil((ahora.getMonth() + 1) / 3);
      const sugerencia = `Ciclo Q${trimestre} ${ahora.getFullYear()}`;
      setFormData(prev => ({
        ...prev,
        nombre_ciclo: sugerencia
      }));
      setTimeout(() => nombreInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      nombre_ciclo: '',
      fecha_entrega: '',
      observaciones: ''
    });
    setPreviewData(null);
    setMostrarPreview(false);
    setErrors({});
    setLoadingPreview(false);
    setCreando(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrors = {};
    
    if (!formData.nombre_ciclo.trim()) {
      nuevosErrors.nombre_ciclo = 'El nombre del ciclo es requerido';
    }
    
    if (!formData.fecha_entrega) {
      nuevosErrors.fecha_entrega = 'La fecha de entrega es requerida';
    } else {
      const fecha = new Date(formData.fecha_entrega);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fecha < hoy) {
        nuevosErrors.fecha_entrega = 'La fecha de entrega no puede ser anterior a hoy';
      }
    }
    
    setErrors(nuevosErrors);
    return Object.keys(nuevosErrors).length === 0;
  };

  const cargarPreview = async () => {
    if (!validarFormulario()) return;
    
    setLoadingPreview(true);
    try {
      const token = getToken();
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
      const queryParams = new URLSearchParams({
        fecha_entrega: formData.fecha_entrega
      });

      const response = await fetch(`http://localhost:3001/api/ciclos/preview-elegibles?${queryParams}`, {
        headers: authHeaders
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.data || data);
        setMostrarPreview(true);
      } else {
        // Manejo guiado cuando falta el SMLV del año solicitado
        let error = {};
        try { error = await response.json(); } catch (_) {}
        const msg = String(error.message || '');
        if (response.status === 400 && /salario\s+m[ií]nimo/i.test(msg)) {
          const anio = new Date(formData.fecha_entrega).getFullYear();
          const valor = window.prompt(`No hay salario mínimo registrado para el año ${anio}.\nIngresa el valor mensual del SMLV para ${anio}:`, '');
          const valorNum = Number(valor);
          if (Number.isFinite(valorNum) && valorNum > 0) {
            // Registrar SMLV y reintentar preview
            const resSmlv = await fetch('http://localhost:3001/api/ciclos/smlv', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders
              },
              body: JSON.stringify({ anio, valor_mensual: valorNum, observaciones: 'Registrado desde ModalNuevoCiclo' })
            });
            const smlvJson = await resSmlv.json().catch(() => ({}));
            if (resSmlv.ok && smlvJson.success) {
              alert('SMLV guardado. Reintentando vista previa…');
              // Reintentar después de un breve respiro para evitar interbloqueo de UI
              setTimeout(() => cargarPreview(), 100);
              return; // salir para no ejecutar el alert genérico
            } else {
              alert(smlvJson.message || 'No se pudo guardar el SMLV');
            }
          } else {
            alert('Operación cancelada o valor inválido para SMLV');
          }
        } else {
          alert(msg || 'Error al cargar preview de empleados');
        }
      }
    } catch (error) {
      console.error('Error al cargar preview:', error);
      alert('Error de conexión al cargar preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCrearCiclo = async () => {
    if (!validarFormulario()) return;
    
    setCreando(true);
    try {
      const token = getToken();
      const payload = {
        nombre_ciclo: formData.nombre_ciclo.trim(),
        fecha_entrega: formData.fecha_entrega,
        observaciones: formData.observaciones.trim()
      };

      const response = await fetch('http://localhost:3001/api/ciclos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        const asignados = result.data?.empleados_asignados || 0;
        const elegibles = result.data?.total_elegibles || result.data?.elegibles_detectados || asignados;
        const diferencia = result.data?.diferencia_elegibles;
        let msg = `Ciclo creado exitosamente. Elegibles detectados: ${elegibles}. Insertados: ${asignados}.`;
        if (diferencia && diferencia > 0) {
          msg += ` (Faltan ${diferencia} por falta de kit activo en su área)\nUse el botón "Reasignar kits" en Entregas si ya creó los kits.`;
        }
        alert(msg);
        resetForm();
        if (onCicloCreado) onCicloCreado();
        onClose();
      } else {
        alert(result.message || 'Error al crear el ciclo');
      }
    } catch (error) {
      console.error('Error al crear ciclo:', error);
      alert('Error de conexión al crear el ciclo');
    } finally {
      setCreando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={creando || loadingPreview}
        className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancelar
      </button>
      {!mostrarPreview ? (
        <button
          type="button"
          onClick={cargarPreview}
          disabled={loadingPreview}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loadingPreview && (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          )}
          <i className='bx bx-search-alt-2'></i>
          {loadingPreview ? 'Cargando...' : 'Vista Previa'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCrearCiclo}
          disabled={creando}
          className="px-5 py-2.5 bg-[#B39237] text-white rounded-xl text-sm font-bold hover:bg-[#9C7F2F] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          {creando && (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
          )}
          <i className='bx bx-check-circle'></i>
          {creando ? 'Creando...' : 'Crear Ciclo'}
        </button>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Ciclo de Dotación"
      size="lg"
      footer={footer}
      closeOnBackdropClick={!creando && !loadingPreview}
      closeOnEsc={!creando && !loadingPreview}
    >
      <div className="space-y-6">
        {/* Información importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <i className='bx bx-info-circle text-2xl text-blue-600 flex-shrink-0'></i>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Ciclos de Dotación</p>
              <p>Los ciclos se ejecutan cada 4 meses. Se asignarán automáticamente los empleados elegibles (antigüedad ≥3 meses, salario 1-2 SMLV, áreas: Producción/Mercadista).</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-5">
          {/* Nombre del ciclo */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-bookmark text-lg mr-2 text-[#B39237]'></i>
              Nombre del ciclo
            </label>
            <input
              ref={nombreInputRef}
              type="text"
              name="nombre_ciclo"
              value={formData.nombre_ciclo}
              onChange={handleInputChange}
              placeholder="Ej: Ciclo Q4 2025"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:outline-none transition-all text-gray-900 ${
                errors.nombre_ciclo ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#B39237]'
              }`}
              disabled={creando || loadingPreview}
            />
            {errors.nombre_ciclo && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <i className='bx bx-error-circle'></i>
                {errors.nombre_ciclo}
              </p>
            )}
          </div>

          {/* Fecha de entrega */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-calendar text-lg mr-2 text-[#B39237]'></i>
              Fecha de entrega programada
            </label>
            <input
              type="date"
              name="fecha_entrega"
              value={formData.fecha_entrega}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:outline-none transition-all text-gray-900 ${
                errors.fecha_entrega ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#B39237]'
              }`}
              disabled={creando || loadingPreview}
            />
            {errors.fecha_entrega && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <i className='bx bx-error-circle'></i>
                {errors.fecha_entrega}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              <i className='bx bx-info-circle text-sm mr-1'></i>
              La ventana de ejecución será 2 meses antes de esta fecha
            </p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <i className='bx bx-message-square-detail text-lg mr-2 text-[#B39237]'></i>
              Observaciones <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows="3"
              placeholder="Notas o comentarios adicionales sobre este ciclo..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
              disabled={creando || loadingPreview}
            />
          </div>
        </div>

        {/* Vista previa de empleados elegibles */}
        {mostrarPreview && previewData && (
          <div className="mt-6 border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className='bx bx-group text-2xl text-[#B39237]'></i>
              Vista Previa de Empleados Elegibles
            </h3>

            {/* Validación de ventana */}
            {previewData.validacion_ventana && (
              <div className={`mb-4 p-4 rounded-xl border-2 ${
                previewData.validacion_ventana.en_ventana 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  <i className={`bx ${previewData.validacion_ventana.en_ventana ? 'bx-check-circle' : 'bx-error-circle'} text-2xl ${
                    previewData.validacion_ventana.en_ventana ? 'text-green-600' : 'text-yellow-600'
                  } flex-shrink-0`}></i>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      previewData.validacion_ventana.en_ventana ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {previewData.validacion_ventana.en_ventana ? 'Dentro de ventana de ejecución' : 'Fuera de ventana de ejecución'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      previewData.validacion_ventana.en_ventana ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      Ventana: {formatearFecha(previewData.validacion_ventana.ventana_inicio)} - {formatearFecha(previewData.validacion_ventana.ventana_fin)}
                    </p>
                    {!previewData.validacion_ventana.en_ventana && (
                      <p className="text-sm mt-1 text-yellow-700">
                        ⚠️ Puedes crear el ciclo, pero se recomienda hacerlo dentro de la ventana de ejecución
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-br from-[#F7F2E0] to-white border border-[#E4D6A4] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Elegibles</p>
                    <p className="text-3xl font-bold text-[#B39237] mt-1">
                      {previewData.total_elegibles || previewData.total_empleados || 0}
                    </p>
                  </div>
                  <i className='bx bx-user-check text-4xl text-[#B39237]'></i>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">SMLV Aplicable</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {previewData.smlv_aplicable ? `$${previewData.smlv_aplicable.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  <i className='bx bx-dollar-circle text-4xl text-gray-400'></i>
                </div>
              </div>
            </div>

            {/* Desglose por área */}
            {previewData.empleados_por_area && previewData.empleados_por_area.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Desglose por área:</p>
                {previewData.empleados_por_area.map((area) => (
                  <div key={area.id_area || area.nombre_area} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <i className='bx bx-buildings text-xl text-gray-600'></i>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{area.nombre_area}</p>
                        <p className="text-xs text-gray-500">{area.total} {area.total === 1 ? 'empleado' : 'empleados'} elegible{area.total === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F7F2E0] text-[#B39237] font-bold text-sm">
                      {area.total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Listado de no elegibles */}
            {Array.isArray(previewData.no_elegibles) && previewData.no_elegibles.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                  <i className='bx bx-user-x'></i>
                  No elegibles ({previewData.total_no_elegibles || previewData.no_elegibles.length})
                </h4>
                <div className="max-h-56 overflow-auto border border-red-200 rounded-xl bg-red-50 p-3">
                  <ul className="space-y-2 text-sm">
                    {previewData.no_elegibles.map(emp => (
                      <li key={emp.id_empleado} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-800">
                          <i className='bx bx-block'></i>
                          <span className="font-semibold">{emp.nombre_completo}</span>
                          <span className="text-red-700">• {emp.nombre_area}</span>
                        </div>
                        <span className="text-xs text-red-700">{emp.motivo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Mensaje si no hay empleados elegibles */}
            {(previewData.total_elegibles ?? previewData.total_empleados) === 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <i className='bx bx-user-x text-5xl text-gray-400 mb-2'></i>
                <p className="text-gray-600 font-semibold">No hay empleados elegibles para este ciclo</p>
                <p className="text-sm text-gray-500 mt-1">Verifica los criterios de elegibilidad y la fecha de entrega</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalNuevoCiclo;
