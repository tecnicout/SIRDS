import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { getToken } from '../../utils/tokenStorage';

const ModalEmpleadosCiclo = ({ isOpen, onClose, ciclo, onActualizado }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);
  const [mostrarPanelManual, setMostrarPanelManual] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoCandidatos, setBuscandoCandidatos] = useState(false);
  const [seleccionManual, setSeleccionManual] = useState(null);
  const [motivoManual, setMotivoManual] = useState('');
  const [agregandoManual, setAgregandoManual] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState('');

  const cargarEmpleados = useCallback(async () => {
    if (!ciclo || !ciclo.id_ciclo) return;
    
    setLoading(true);
    try {
      const token = getToken();
      const queryParams = new URLSearchParams({
        page: 1,
        limit: 100
      });
      
      if (filtroEstado) {
        queryParams.append('estado', filtroEstado);
      }

      const response = await fetch(`http://localhost:3001/api/ciclos/${ciclo.id_ciclo}/empleados?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // El backend retorna: { success: true, data: [...], total, page, limit }
        const empleadosData = data.data || [];
        setEmpleados(empleadosData);
      } else {
        console.error('Error al cargar empleados del ciclo');
        setEmpleados([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  }, [ciclo, filtroEstado]);

  useEffect(() => {
    if (isOpen && ciclo) {
      cargarEmpleados();
    }
  }, [isOpen, ciclo, filtroEstado, cargarEmpleados]);

  const abrirPanelManual = () => {
    setMostrarPanelManual(true);
    setResultadosBusqueda([]);
    setSeleccionManual(null);
    setMotivoManual('');
    setMensajeBusqueda('');
  };

  const cerrarPanelManual = () => {
    setMostrarPanelManual(false);
    setResultadosBusqueda([]);
    setSeleccionManual(null);
    setMotivoManual('');
    setMensajeBusqueda('');
    setTerminoBusqueda('');
  };

  const buscarCandidatos = async (event) => {
    if (event) event.preventDefault();
    if (!ciclo?.id_ciclo) return;

    if (!terminoBusqueda.trim()) {
      setMensajeBusqueda('Ingresa un nombre o documento para buscar.');
      setResultadosBusqueda([]);
      return;
    }

    setBuscandoCandidatos(true);
    setMensajeBusqueda('');
    setSeleccionManual(null);

    try {
      const token = getToken();
      const params = new URLSearchParams({
        q: terminoBusqueda.trim(),
        limit: 10
      });

      const response = await fetch(`http://localhost:3001/api/ciclos/${ciclo.id_ciclo}/candidatos?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo buscar candidatos');
      }
      const lista = Array.isArray(data.data) ? data.data : [];
      setResultadosBusqueda(lista);
      if (lista.length === 0) {
        setMensajeBusqueda('No se encontraron candidatos con ese criterio.');
      }
    } catch (error) {
      console.error('Error al buscar candidatos:', error);
      setResultadosBusqueda([]);
      setMensajeBusqueda(error.message || 'Error al buscar candidatos');
    } finally {
      setBuscandoCandidatos(false);
    }
  };

  const agregarEmpleadoManual = async () => {
    if (!seleccionManual) {
      setMensajeBusqueda('Selecciona un empleado de la lista.');
      return;
    }
    if (!motivoManual.trim()) {
      setMensajeBusqueda('Ingresa el motivo para la inclusión manual.');
      return;
    }

    setAgregandoManual(true);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3001/api/ciclos/${ciclo.id_ciclo}/empleados-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_empleado: seleccionManual.id_empleado,
          motivo_manual: motivoManual.trim()
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo agregar al empleado');
      }

      cerrarPanelManual();
      await cargarEmpleados();
      if (onActualizado) onActualizado();
      alert('Empleado agregado manualmente al ciclo.');
    } catch (error) {
      console.error('Error al agregar empleado manual:', error);
      alert(error.message || 'No se pudo agregar el empleado');
    } finally {
      setAgregandoManual(false);
    }
  };

  const eliminarEmpleado = async (empleado) => {
    setActualizandoId(empleado.id_empleado_ciclo);
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3001/api/ciclos/empleados/${empleado.id_empleado_ciclo}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo eliminar al empleado');
      }

      await cargarEmpleados();
      if (onActualizado) onActualizado();
    } catch (error) {
      console.error('Error al eliminar empleado del ciclo:', error);
      alert(error.message || 'No se pudo eliminar al empleado');
    } finally {
      setActualizandoId(null);
    }
  };

  const confirmarExclusion = (empleado) => {
    const nombre = empleado.nombre_completo || empleado.nombre;
    if (window.confirm(`¿Eliminar a ${nombre} del ciclo? Este empleado no recibirá dotación.`)) {
      eliminarEmpleado(empleado);
    }
  };

  const actualizarEstadoEmpleado = async (idEmpleadoCiclo, nuevoEstado) => {
    setActualizandoId(idEmpleadoCiclo);
    try {
      const token = getToken();
      const payload = { estado: nuevoEstado };

      const response = await fetch(`http://localhost:3001/api/ciclos/empleados/${idEmpleadoCiclo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await cargarEmpleados();
        if (onActualizado) onActualizado();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al actualizar el estado del empleado');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al actualizar el estado');
    } finally {
      setActualizandoId(null);
    }
  };

  const confirmarCambioEstado = (empleado, nuevoEstado) => {
    const mensajes = {
      'entregado': `¿Marcar como ENTREGADO a ${empleado.nombre_completo || empleado.nombre}?`,
      'omitido': `¿Marcar como OMITIDO a ${empleado.nombre_completo || empleado.nombre}? Esta acción indica que el empleado no recibirá dotación en este ciclo.`,
      'procesado': `¿Volver a PROCESADO a ${empleado.nombre_completo || empleado.nombre}?`
    };

    if (window.confirm(mensajes[nuevoEstado])) {
      actualizarEstadoEmpleado(empleado.id_empleado_ciclo, nuevoEstado);
    }
  };

  const getEstadoBadge = (estado) => {
    const config = {
      'procesado': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: 'bx-loader-circle'
      },
      'entregado': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: 'bx-check-circle'
      },
      'omitido': {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: 'bx-x-circle'
      }
    };

    const { bg, text, icon } = config[estado] || config['procesado'];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <i className={`bx ${icon} text-sm mr-1.5`}></i>
        {estado}
      </span>
    );
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resumen = {
    total: empleados.length,
    procesados: empleados.filter(e => e.estado === 'procesado').length,
    entregados: empleados.filter(e => e.estado === 'entregado').length,
    omitidos: empleados.filter(e => e.estado === 'omitido').length
  };

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
    >
      Cerrar
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Empleados del Ciclo: ${ciclo?.nombre_ciclo || ''}`}
      size="xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Header con información del ciclo */}
        <div className="bg-gradient-to-br from-[#F7F2E0] to-white border border-[#E4D6A4] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{ciclo?.nombre_ciclo}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <i className='bx bx-calendar'></i>
                  Entrega: {formatearFecha(ciclo?.fecha_entrega)}
                </span>
                <span className="flex items-center gap-1">
                  {getEstadoBadge(ciclo?.estado)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#B39237]">{resumen.total}</p>
              <p className="text-xs text-gray-600">Empleados totales</p>
            </div>
          </div>
        </div>

        {/* Resumen de estados */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Procesados</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{resumen.procesados}</p>
              </div>
              <i className='bx bx-loader-circle text-3xl text-blue-400'></i>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Entregados</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{resumen.entregados}</p>
              </div>
              <i className='bx bx-check-circle text-3xl text-green-400'></i>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Omitidos</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">{resumen.omitidos}</p>
              </div>
              <i className='bx bx-x-circle text-3xl text-gray-400'></i>
            </div>
          </div>
        </div>

        {/* Filtro por estado + botón de inclusión manual */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Filtrar por estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none text-sm font-medium text-gray-700"
            >
              <option value="">Todos</option>
              <option value="procesado">Procesados</option>
              <option value="entregado">Entregados</option>
              <option value="omitido">Omitidos</option>
            </select>
          </div>

          {ciclo?.estado !== 'cerrado' && (
            <button
              type="button"
              onClick={() => (mostrarPanelManual ? cerrarPanelManual() : abrirPanelManual())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-[#B39237] text-[#B39237] hover:bg-[#B39237] hover:text-white transition-colors"
            >
              <i className="bx bx-user-plus text-base"></i>
              {mostrarPanelManual ? 'Cerrar panel manual' : 'Agregar empleado manual'}
            </button>
          )}
        </div>

        {mostrarPanelManual && ciclo?.estado !== 'cerrado' && (
          <div className="border border-dashed border-[#B39237] rounded-xl p-4 space-y-4 bg-[#FFFCF5]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#B39237] tracking-wide uppercase">Incluir empleado manualmente</p>
                <p className="text-xs text-gray-600">Busca empleados activos y agrégalos aun si no cumplen los criterios automáticos.</p>
              </div>
              <button
                type="button"
                onClick={cerrarPanelManual}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={buscarCandidatos} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] items-end">
              <div>
                <label className="text-xs font-semibold text-gray-700">Buscar empleado (nombre o documento)</label>
                <input
                  type="text"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237]/40 focus:border-[#B39237] text-sm"
                  placeholder="Ej: 123 o Ana Pérez"
                />
              </div>
              <button
                type="submit"
                disabled={buscandoCandidatos}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#B39237] text-white text-sm font-semibold shadow hover:bg-[#9C7F2F] transition-colors disabled:opacity-60"
              >
                {buscandoCandidatos && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                Buscar
              </button>
            </form>

            {mensajeBusqueda && (
              <p className="text-xs text-gray-600">{mensajeBusqueda}</p>
            )}

            {buscandoCandidatos ? (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <svg className="animate-spin h-5 w-5 text-[#B39237]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Buscando candidatos...
              </div>
            ) : resultadosBusqueda.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Empleado</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Área</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">Criterios</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {resultadosBusqueda.map((cand) => (
                      <tr key={cand.id_empleado} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <p className="font-semibold text-gray-900">{cand.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{cand.documento}</p>
                        </td>
                        <td className="px-4 py-2">
                          <p className="text-gray-800">{cand.nombre_area}</p>
                          <p className="text-xs text-gray-500">
                            ${Number(cand.sueldo ?? 0).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${cand.cumple_antiguedad ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              Antigüedad {cand.cumple_antiguedad ? 'OK' : 'Pendiente'}
                            </span>
                            {typeof cand.cumple_sueldo === 'number' && (
                              <span className={`px-2 py-0.5 rounded-full ${cand.cumple_sueldo ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                Sueldo {cand.cumple_sueldo ? '≤ 2 SMLV' : '> 2 SMLV'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSeleccionManual(cand)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border ${seleccionManual?.id_empleado === cand.id_empleado ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                          >
                            {seleccionManual?.id_empleado === cand.id_empleado ? 'Seleccionado' : 'Seleccionar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {seleccionManual && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{seleccionManual.nombre_completo}</p>
                  <p className="text-xs text-gray-500 mb-2">{seleccionManual.documento}</p>
                  <p className="text-xs text-gray-600">Área: {seleccionManual.nombre_area}</p>
                  <p className="text-xs text-gray-600">Antigüedad: {seleccionManual.antiguedad_meses} meses</p>
                  <p className="text-xs text-gray-600">
                    Salario: ${Number(seleccionManual.sueldo ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">Motivo de inclusión manual</label>
                  <textarea
                    rows="3"
                    value={motivoManual}
                    onChange={(e) => setMotivoManual(e.target.value.slice(0, 255))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237]/40 focus:border-[#B39237] text-sm"
                    placeholder="Describe la razón por la cual recibirá la dotación."
                  />
                  <button
                    type="button"
                    onClick={agregarEmpleadoManual}
                    disabled={agregandoManual}
                    className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {agregandoManual && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    Confirmar inclusión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de empleados */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <svg className="animate-spin h-12 w-12 mx-auto text-[#B39237]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <p className="text-gray-600 mt-4">Cargando empleados...</p>
            </div>
          ) : empleados.length === 0 ? (
            <div className="p-12 text-center">
              <i className='bx bx-user-x text-6xl text-gray-300'></i>
              <p className="text-gray-600 font-semibold mt-4">No hay empleados</p>
              <p className="text-sm text-gray-500 mt-1">
                {filtroEstado ? 'No se encontraron empleados con el filtro seleccionado' : 'No hay empleados asignados a este ciclo'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Área
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Antigüedad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Salario
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empleados.map((emp) => (
                    <tr key={emp.id_empleado_ciclo} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {(emp.nombre_completo || emp.nombre)?.charAt(0)?.toUpperCase() || 'E'}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-semibold text-gray-900">
                              {emp.nombre_completo || emp.nombre}
                            </p>
                            <p className="text-xs text-gray-500">{emp.documento}</p>
                            {emp.inclusion_manual && (
                              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                Manual
                              </span>
                            )}
                            {emp.motivo_manual && (
                              <p className="text-[11px] text-amber-700 mt-1">
                                Motivo: {emp.motivo_manual}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{emp.nombre_area}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{emp.antiguedad_meses || 0} meses</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          ${(emp.sueldo_al_momento || 0).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(emp.estado)}
                        {emp.fecha_entrega_real && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatearFecha(emp.fecha_entrega_real)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {emp.estado !== 'entregado' && (
                            <button
                              onClick={() => confirmarCambioEstado(emp, 'entregado')}
                              disabled={actualizandoId === emp.id_empleado_ciclo}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Marcar como entregado"
                            >
                              {actualizandoId === emp.id_empleado_ciclo ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                              ) : (
                                <i className='bx bx-check text-lg'></i>
                              )}
                            </button>
                          )}
                          
                          {emp.estado !== 'omitido' && (
                            <button
                              onClick={() => confirmarCambioEstado(emp, 'omitido')}
                              disabled={actualizandoId === emp.id_empleado_ciclo}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Marcar como omitido"
                            >
                              {actualizandoId === emp.id_empleado_ciclo ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                              ) : (
                                <i className='bx bx-x text-lg'></i>
                              )}
                            </button>
                          )}

                          {emp.estado !== 'procesado' && (
                            <button
                              onClick={() => confirmarCambioEstado(emp, 'procesado')}
                              disabled={actualizandoId === emp.id_empleado_ciclo}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Volver a procesado"
                            >
                              {actualizandoId === emp.id_empleado_ciclo ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                                </svg>
                              ) : (
                                <i className='bx bx-refresh text-lg'></i>
                              )}
                            </button>
                          )}

                          {emp.estado === 'procesado' && (
                            <button
                              onClick={() => confirmarExclusion(emp)}
                              disabled={actualizandoId === emp.id_empleado_ciclo}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar del ciclo"
                            >
                              {actualizandoId === emp.id_empleado_ciclo ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              ) : (
                                <i className="bx bx-trash text-lg"></i>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ModalEmpleadosCiclo;
