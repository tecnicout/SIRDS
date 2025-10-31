import React, { useState, useEffect } from 'react';
import KpiCard from '../components/KpiCard';
import DataTableEntregas from '../components/DataTable/DataTableEntregas';
import ModalEntrega from '../components/Modal/ModalEntrega';
import GraficoDotaciones from '../components/charts/GraficoDotaciones';
import ReporteDotaciones from '../components/ReporteDotaciones';
import ContadorProximaEntrega from '../components/ContadorProximaEntrega';

const Dotaciones = () => {
  const [activeTab, setActiveTab] = useState('entregas');
  const [showModalEntrega, setShowModalEntrega] = useState(false);
  const [kpis, setKpis] = useState({
    total_dotaciones: 0,
    total_entregas: 0,
    proximas_entregas: 0,
    stock_total: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handleEntregaRegistrada = () => {
    setShowModalEntrega(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'entregas', label: 'Entregas', icon: 'bx-transfer' },
    { id: 'stock', label: 'Stock', icon: 'bx-package' },
    { id: 'reportes', label: 'Reportes', icon: 'bx-bar-chart-alt' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
        <KpiCard
          title="Stock Total"
          value={kpis.stock_total || 0}
          icon="bx-box"
          color="from-blue-500 to-blue-600"
        />
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
                        <DataTableEntregas refreshTrigger={refreshTrigger} />
          )}
          
          {activeTab === 'stock' && (
            <GraficoDotaciones />
          )}
          
          {activeTab === 'reportes' && (
            <ReporteDotaciones />
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
    </div>
  );
};

export default Dotaciones;