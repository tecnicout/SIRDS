import React, { useState, useEffect } from 'react';
import DataTableEntregas from '../components/DataTable/DataTableEntregas';
import DataTable from '../components/DataTable/DataTable';
import ModalEntrega from '../components/Modal/ModalEntrega';
import Modal from '../components/Modal/Modal';
import ModalNuevoCiclo from '../components/Modal/ModalNuevoCiclo';
import ModalEmpleadosCiclo from '../components/Modal/ModalEmpleadosCiclo';
import GraficoDotaciones from '../components/charts/GraficoDotaciones';
import KitManager from '../components/KitManager';
import ArticuloManager from '../components/ArticuloManager';
import ContadorProximaEntrega from '../components/ContadorProximaEntrega';
import { CICLOS_COLUMNS, CICLOS_CUSTOM_ACTIONS, ESTADOS_CICLO, getAnioOptions } from '../components/DataTable/CiclosColumnConfig.jsx';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';

const Dotaciones = () => {
  const [activeTab, setActiveTab] = useState('entregas');
  const [showModalEntrega, setShowModalEntrega] = useState(false);
  const [showModalNuevoCiclo, setShowModalNuevoCiclo] = useState(false);
  const [showModalEmpleadosCiclo, setShowModalEmpleadosCiclo] = useState(false);
  // Modales para acciones estándar de la tabla de ciclos
  const [showViewCiclo, setShowViewCiclo] = useState(false);
  const [showEditCiclo, setShowEditCiclo] = useState(false);
  const [cicloEnVista, setCicloEnVista] = useState(null);
  const [cicloEnEdicion, setCicloEnEdicion] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [cicloSeleccionado, setCicloSeleccionado] = useState(null);
  
  const [kpis, setKpis] = useState({
    total_dotaciones: 0,
    total_entregas: 0,
    proximas_entregas: 0,
    stock_total: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Estados para ciclos
  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(false);
  const [cicloActivo, setCicloActivo] = useState(null);
  const [estadisticasCiclos, setEstadisticasCiclos] = useState(null);
  const [filtrosCiclos, setFiltrosCiclos] = useState({
    estado: '',
    anio: ''
  });
  const [paginacionCiclos, setPaginacionCiclos] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });

  // Cargar KPIs al montar el componente
  useEffect(() => {
    const fetchKpis = async () => {
      try {
  const response = await fetch('http://localhost:3001/api/dotaciones/kpis', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const result = await response.json();
        const payload = (Array.isArray(result) ? result : (result?.data ?? result)) || {};
        setKpis(payload);
      } catch (error) {
        console.error('Error al cargar KPIs:', error);
      }
    };

    fetchKpis();
  }, [refreshTrigger]);

  // Cargar ciclo activo y estadísticas
  useEffect(() => {
    const cargarDatosCiclos = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Ciclo activo
        const respActivo = await fetch('http://localhost:3001/api/ciclos/activo', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (respActivo.ok) {
          const dataActivo = await respActivo.json();
          setCicloActivo(dataActivo.data || null);
        }

        // Estadísticas
        const respStats = await fetch('http://localhost:3001/api/ciclos/estadisticas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (respStats.ok) {
          const dataStats = await respStats.json();
          setEstadisticasCiclos(dataStats.data || null);
        }
      } catch (error) {
        console.error('Error al cargar datos de ciclos:', error);
      }
    };

    cargarDatosCiclos();
  }, [refreshTrigger]);

  // Cargar lista de ciclos cuando se selecciona el tab
  useEffect(() => {
    if (activeTab === 'ciclos') {
      cargarCiclos();
    }
  }, [activeTab, filtrosCiclos, paginacionCiclos.page, refreshTrigger]);

  const cargarCiclos = async () => {
    setLoadingCiclos(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: paginacionCiclos.page,
        limit: paginacionCiclos.pageSize,
        ...(filtrosCiclos.estado && { estado: filtrosCiclos.estado }),
        ...(filtrosCiclos.anio && { anio: filtrosCiclos.anio })
      });

      const response = await fetch(`http://localhost:3001/api/ciclos?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCiclos(data.data?.ciclos || data.ciclos || []);
        setPaginacionCiclos(prev => ({
          ...prev,
          total: data.data?.total || data.total || 0
        }));
      }
    } catch (error) {
      console.error('Error al cargar ciclos:', error);
    } finally {
      setLoadingCiclos(false);
    }
  };

  const handleEntregaRegistrada = () => {
    setShowModalEntrega(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCicloCreado = () => {
    setShowModalNuevoCiclo(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCicloActualizado = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRowAction = (action, row) => {
    switch (action) {
      case 'view':
        setCicloEnVista(row);
        setShowViewCiclo(true);
        break;
      case 'edit':
        setCicloEnEdicion({ id_ciclo: row.id_ciclo, estado: row.estado });
        setShowEditCiclo(true);
        break;
      case 'delete':
        if (row.estado === 'activo') {
          alert('No se puede eliminar un ciclo activo. Ciérralo primero.');
          return;
        }
        const entregados = row.entregados || 0;
        const omitidos = row.omitidos || 0;
        let force = false;
        if (entregados > 0 || omitidos > 0) {
          if (!window.confirm(`Este ciclo tiene registros de entregas u omisiones (Entregados: ${entregados}, Omitidos: ${omitidos}).\n\n¿Deseas eliminarlo de todas formas? Se perderá el historial asociado. Esta acción es irreversible.`)) {
            return;
          }
          force = true;
        } else {
          if (!window.confirm(`¿Eliminar el ciclo "${row.nombre_ciclo}"? Esta acción no se puede deshacer.`)) {
            return;
          }
        }
        eliminarCiclo(row.id_ciclo, force);
        break;
      case 'ver_empleados':
        setCicloSeleccionado(row);
        setShowModalEmpleadosCiclo(true);
        break;
      case 'cerrar_ciclo':
        if (window.confirm(`¿Cerrar el ciclo "${row.nombre_ciclo}"? Esta acción no se puede deshacer.`)) {
          cerrarCiclo(row.id_ciclo);
        }
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  };

  const cerrarCiclo = async (idCiclo) => {
    try {
      const token = localStorage.getItem('token');
      // Endpoint correcto según rutas: PUT /api/ciclos/:id/estado
      const response = await fetch(`http://localhost:3001/api/ciclos/${idCiclo}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'cerrado' })
      });

      if (response.ok) {
        alert('Ciclo cerrado exitosamente');
        setRefreshTrigger(prev => prev + 1);
      } else {
        let msg = 'Error al cerrar el ciclo';
        try { const json = await response.json(); msg = json.message || msg; } catch(_) {}
        alert(msg + ` (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al cerrar el ciclo');
    }
  };

  const eliminarCiclo = async (idCiclo, force = false) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:3001/api/ciclos/${idCiclo}${force ? '?force=true' : ''}`;
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        alert('Ciclo eliminado correctamente');
        setRefreshTrigger(prev => prev + 1);
      } else {
        let msg = 'No se pudo eliminar el ciclo';
        try { const j = await resp.json(); msg = j.message || msg; } catch(_) {}
        alert(`${msg} (HTTP ${resp.status})`);
      }
    } catch (err) {
      console.error('Error eliminando ciclo:', err);
      alert('Error de conexión al eliminar el ciclo');
    }
  };

  const tabs = [
    { id: 'entregas', label: 'Entregas', icon: 'bx-transfer' },
    { id: 'stock', label: 'Stock', icon: 'bx-package' },
    { id: 'kits', label: 'Kits', icon: 'bx-archive' },
    { id: 'ciclos', label: 'Ciclos', icon: 'bx-refresh' },
    { id: 'nuevo_articulo', label: 'Nuevo artículo', icon: 'bx-plus-circle' }
  ];

  return (
    <div className="p-6 w-full overflow-x-hidden">
      <div className="max-w-full mx-auto w-full">
        {/* Encabezado con métricas unificadas */}
        <ResourceHeader
          title="Gestión de Dotaciones"
          subtitle="Panel administrativo para el control integral de dotaciones"
          stats={[
            { icon: 'bx-package', label: 'Total Dotaciones', value: kpis.total_dotaciones },
            { icon: 'bx-transfer', label: 'Entregas Realizadas', value: kpis.total_entregas },
            { icon: 'bx-time', label: 'Próximas Entregas', value: kpis.proximas_entregas },
            { icon: 'bx-refresh', label: 'Ciclo Activo', value: cicloActivo?.nombre_ciclo || '—' }
          ]}
          action={(
            <div className="flex items-center gap-3">
              <ContadorProximaEntrega />
              <button
                onClick={() => setShowModalEntrega(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
              >
                <i className="bx bx-plus"></i>
                Registrar Entrega
              </button>
            </div>
          )}
        />

        {/* Pestañas de navegación */}
        <CardPanel title="Módulos de Dotación" icon="bx-grid-alt" padded={false}>
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#B39237] text-[#B39237]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`bx ${tab.icon} text-lg`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de las pestañas */}
          <div className="p-6">
            {activeTab === 'entregas' && (
              <DataTableEntregas 
                refreshTrigger={refreshTrigger} 
                onChanged={() => setRefreshTrigger(prev => prev + 1)}
              />
            )}
            
            {activeTab === 'stock' && (
              <GraficoDotaciones />
            )}
            
            {activeTab === 'kits' && (
              <KitManager onCreated={() => setRefreshTrigger(prev => prev + 1)} />
            )}

            {activeTab === 'ciclos' && (
              <div className="space-y-6">
                {/* Header del tab con botón Nuevo Ciclo */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ciclos de Dotación</h2>
                    <p className="text-sm text-gray-600 mt-1">Gestiona los ciclos cuatrimestrales de entrega de dotaciones</p>
                  </div>
                  <button
                    onClick={() => setShowModalNuevoCiclo(true)}
                    className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white px-6 py-3 rounded-lg font-medium hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <i className="bx bx-plus text-xl"></i>
                    <span>Nuevo Ciclo</span>
                  </button>
                </div>
                

              {/* Estadísticas del ciclo activo */}
              {cicloActivo && (
                <div className="bg-gradient-to-br from-[#F7F2E0] to-white border-2 border-[#E4D6A4] rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-[#B39237] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-md">
                        <i className='bx bx-refresh text-white text-3xl'></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{cicloActivo.nombre_ciclo}</h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <i className='bx bx-calendar'></i>
                            Entrega: {new Date(cicloActivo.fecha_entrega).toLocaleDateString('es-ES')}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <i className='bx bx-play-circle text-sm mr-1.5'></i>
                            Activo
                          </span>
                        </div>
                        {cicloActivo.observaciones && (
                          <p className="text-sm text-gray-600 mt-2">{cicloActivo.observaciones}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Progreso visual */}
                    <div className="grid grid-cols-3 gap-4 ml-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{cicloActivo.procesados || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Procesados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{cicloActivo.entregados || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Entregados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600">{cicloActivo.omitidos || 0}</p>
                        <p className="text-xs text-gray-600 mt-1">Omitidos</p>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {cicloActivo.total_empleados > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Progreso de entregas</span>
                        <span className="font-semibold">
                          {Math.round(((cicloActivo.entregados || 0) / cicloActivo.total_empleados) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.round(((cicloActivo.entregados || 0) / cicloActivo.total_empleados) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Filtros */}
              <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
                <label className="text-sm font-semibold text-gray-700">Filtros:</label>
                <select
                  value={filtrosCiclos.estado}
                  onChange={(e) => setFiltrosCiclos(prev => ({ ...prev, estado: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none text-sm"
                >
                  {ESTADOS_CICLO.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={filtrosCiclos.anio}
                  onChange={(e) => setFiltrosCiclos(prev => ({ ...prev, anio: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237] focus:outline-none text-sm"
                >
                  {getAnioOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setFiltrosCiclos({ estado: '', anio: '' })}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  <i className='bx bx-x mr-1'></i>
                  Limpiar
                </button>
              </div>

              {/* Tabla de ciclos usando DataTable reutilizable */}
              <DataTable
                columns={CICLOS_COLUMNS}
                data={ciclos}
                loading={loadingCiclos}
                rowKey="id_ciclo"
                pagination={paginacionCiclos}
                onPageChange={(page, pageSize) => setPaginacionCiclos(prev => ({ ...prev, page, pageSize }))}
                showPagination={true}
                showSearch={false}
                showToolbar={false}
                rowActions={['view','edit','delete']}
                getDisabledActions={(row)=>{
                  const disabled = [];
                  // Solo restringimos si el ciclo está activo.
                  if (row.estado === 'activo') disabled.push('delete');
                  return disabled;
                }}
                customRowActions={CICLOS_CUSTOM_ACTIONS}
                onRowAction={handleRowAction}
                emptyState={
                  <div className="p-12 text-center">
                    <i className='bx bx-calendar-x text-6xl text-gray-300 mb-4'></i>
                    <p className="text-gray-600 font-semibold text-lg">No hay ciclos registrados</p>
                    <p className="text-sm text-gray-500 mt-2">Crea el primer ciclo de dotación para comenzar</p>
                    <button
                      onClick={() => setShowModalNuevoCiclo(true)}
                      className="mt-4 px-5 py-2.5 bg-[#B39237] text-white rounded-lg hover:bg-[#9C7F2F] transition-all font-medium"
                    >
                      <i className='bx bx-plus mr-2'></i>
                      Crear Primer Ciclo
                    </button>
                  </div>
                }
              />
            </div>
          )}
          
            {activeTab === 'nuevo_articulo' && (
              <ArticuloManager />
            )}
          </div>
        </CardPanel>

      {/* Modal para registrar entrega */}
      {showModalEntrega && (
        <ModalEntrega
          isOpen={showModalEntrega}
          onClose={() => setShowModalEntrega(false)}
          onEntregaRegistrada={handleEntregaRegistrada}
        />
      )}

      {/* Modal para nuevo ciclo */}
      {showModalNuevoCiclo && (
        <ModalNuevoCiclo
          isOpen={showModalNuevoCiclo}
          onClose={() => setShowModalNuevoCiclo(false)}
          onCicloCreado={handleCicloCreado}
        />
      )}

      {/* Modal para empleados del ciclo */}
      {showModalEmpleadosCiclo && cicloSeleccionado && (
        <ModalEmpleadosCiclo
          isOpen={showModalEmpleadosCiclo}
          onClose={() => {
            setShowModalEmpleadosCiclo(false);
            setCicloSeleccionado(null);
          }}
          ciclo={cicloSeleccionado}
          onActualizado={handleCicloActualizado}
        />
      )}

      {/* Modal Ver Ciclo */}
      {showViewCiclo && cicloEnVista && (
        <Modal
          isOpen={showViewCiclo}
          onClose={() => { setShowViewCiclo(false); setCicloEnVista(null); }}
          title="Detalles del Ciclo"
          size="md"
          footer={
            <button
              type="button"
              onClick={() => { setShowViewCiclo(false); setCicloEnVista(null); }}
              className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Cerrar
            </button>
          }
        >
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-center gap-2"><i className="bx bx-bookmark text-[#B39237]"></i><span className="font-semibold">Nombre:</span> {cicloEnVista.nombre_ciclo}</div>
            <div className="flex items-center gap-2"><i className="bx bx-calendar text-[#B39237]"></i><span className="font-semibold">Entrega:</span> {new Date(cicloEnVista.fecha_entrega).toLocaleDateString('es-ES')}</div>
            <div className="flex items-center gap-2"><i className="bx bx-info-circle text-[#B39237]"></i><span className="font-semibold">Estado:</span> {cicloEnVista.estado}</div>
            <div className="flex items-center gap-2"><i className="bx bx-group text-[#B39237]"></i><span className="font-semibold">Total empleados:</span> {cicloEnVista.total_empleados || 0}</div>
            {cicloEnVista.observaciones && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Observaciones</div>
                <div className="p-3 rounded-lg bg-gray-50 border">{cicloEnVista.observaciones}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Editar Ciclo (solo estado disponible desde backend) */}
      {showEditCiclo && cicloEnEdicion && (
        <Modal
          isOpen={showEditCiclo}
          onClose={() => { if(!editSubmitting){ setShowEditCiclo(false); setCicloEnEdicion(null);} }}
          title="Editar Ciclo"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => { setShowEditCiclo(false); setCicloEnEdicion(null);} }
                disabled={editSubmitting}
                className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async ()=>{
                  try {
                    setEditSubmitting(true);
                    const token = localStorage.getItem('token');
                    const resp = await fetch(`http://localhost:3001/api/ciclos/${cicloEnEdicion.id_ciclo}/estado`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ estado: cicloEnEdicion.estado })
                    });
                    const json = await resp.json().catch(()=>({}));
                    if(resp.ok && json.success){
                      setShowEditCiclo(false);
                      setCicloEnEdicion(null);
                      setRefreshTrigger(prev=>prev+1);
                    } else {
                      alert(json.message || 'No se pudo actualizar el ciclo');
                    }
                  } catch(err){
                    console.error('Error actualizando ciclo:', err);
                    alert('Error de conexión al actualizar el ciclo');
                  } finally {
                    setEditSubmitting(false);
                  }
                }}
                disabled={editSubmitting}
                className="px-5 py-2.5 bg-[#B39237] text-white rounded-xl text-sm font-bold hover:bg-[#9C7F2F] transition-all disabled:opacity-50"
              >
                {editSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del ciclo</label>
              <select
                value={cicloEnEdicion.estado}
                onChange={(e)=> setCicloEnEdicion(prev=>({...prev, estado: e.target.value}))}
                className="w-full px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-[#B39237]/30 focus:border-[#B39237]"
                disabled={editSubmitting}
              >
                <option value="activo">Activo</option>
                <option value="cerrado">Cerrado</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">Por ahora solo es posible actualizar el estado del ciclo.</p>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
};

export default Dotaciones;