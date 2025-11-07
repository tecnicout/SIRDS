import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const ModalEmpleadosCiclo = ({ isOpen, onClose, ciclo, onActualizado }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    if (isOpen && ciclo) {
      cargarEmpleados();
    }
  }, [isOpen, ciclo, filtroEstado]);

  const cargarEmpleados = async () => {
    if (!ciclo || !ciclo.id_ciclo) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
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
  };

  const actualizarEstadoEmpleado = async (idEmpleadoCiclo, nuevoEstado) => {
    setActualizandoId(idEmpleadoCiclo);
    try {
      const token = localStorage.getItem('token');
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

        {/* Filtro por estado */}
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
