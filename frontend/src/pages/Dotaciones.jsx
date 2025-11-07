import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import DataTableEntregas from '../components/DataTable/DataTableEntregas';
import DataTable from '../components/DataTable/DataTable';
import ModalEntrega from '../components/Modal/ModalEntrega';
import ModalNuevoCiclo from '../components/Modal/ModalNuevoCiclo';
import ModalEmpleadosCiclo from '../components/Modal/ModalEmpleadosCiclo';
import GraficoDotaciones from '../components/charts/GraficoDotaciones';
import KitManager from '../components/KitManager';
import ArticuloManager from '../components/ArticuloManager';
import ContadorProximaEntrega from '../components/ContadorProximaEntrega';
import { CICLOS_COLUMNS, CICLOS_CUSTOM_ACTIONS, ESTADOS_CICLO, getAnioOptions } from '../components/DataTable/CiclosColumnConfig.jsx';

const Dotaciones = () => {
  const [activeTab, setActiveTab] = useState('entregas');
  const [showModalEntrega, setShowModalEntrega] = useState(false);
  const [showModalNuevoCiclo, setShowModalNuevoCiclo] = useState(false);
  const [showModalEmpleadosCiclo, setShowModalEmpleadosCiclo] = useState(false);
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
    if (action === 'ver_empleados') {
      setCicloSeleccionado(row);
      setShowModalEmpleadosCiclo(true);
    } else if (action === 'cerrar_ciclo') {
      if (window.confirm(`¿Cerrar el ciclo "${row.nombre_ciclo}"? Esta acción no se puede deshacer.`)) {
        cerrarCiclo(row.id_ciclo);
      }
    }
  };

  const cerrarCiclo = async (idCiclo) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/ciclos/${idCiclo}`, {
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
        const error = await response.json();
        alert(error.message || 'Error al cerrar el ciclo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al cerrar el ciclo');
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
    <div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-full mx-auto w-full">
      {/* Header Principal */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Dotaciones</h1>
            <p className="text-gray-600 mt-2">Panel administrativo para el control integral de dotaciones</p>
          </div>
          <div className="flex items-center space-x-4">
            <ContadorProximaEntrega />
            <button 
              onClick={() => setShowModalEntrega(true)}
              className="bg-gradient-to-r from-[#B39237] to-[#D4AF37] text-white px-6 py-3 rounded-lg font-medium hover:from-[#A0812F] hover:to-[#C19B2F] transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <i className="bx bx-plus text-xl"></i>
              <span>Registrar Entrega</span>
            </button>
          </div>
        </div>
      </div>

  {/* Panel de KPIs */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="Total Dotaciones"
          value={kpis.total_dotaciones}
          icon="bx-package"
          color="from-[#B39237] to-[#D4AF37]"
        />
        <KpiCard
          title="Entregas Realizadas"
          value={kpis.total_entregas}
          icon="bx-transfer"
          color="from-green-500 to-green-600"
        />
        <KpiCard
          title="Próximas Entregas"
          value={kpis.proximas_entregas}
          icon="bx-time"
          color="from-orange-500 to-orange-600"
        />
        {/* KPI del ciclo activo */}
        {cicloActivo && (
          <KpiCard
            title="Ciclo Activo"
            value={cicloActivo.nombre_ciclo}
            icon="bx-refresh"
            color="from-blue-500 to-blue-600"
          />
        )}
      </div>

  {/* Pestañas de navegación */}
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
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
      </div>

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
      </div>
    </div>
  );
};

export default Dotaciones;