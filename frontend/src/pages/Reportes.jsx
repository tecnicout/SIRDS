import React, { useEffect, useMemo, useState } from 'react';
import { downloadFile } from '../utils/download';
import ResourceHeader from '../components/UI/ResourceHeader';
import CardPanel from '../components/UI/CardPanel';
import { getToken } from '../utils/tokenStorage';

const REPORT_TYPES = [
  { key: 'dotaciones', label: 'Dotaciones', desc: 'Modelos de dotación y categorías', icon: 'bx-bar-chart', category: 'operaciones' },
  { key: 'entregas', label: 'Entregas', desc: 'Historial de entregas realizadas', icon: 'bx-package', category: 'operaciones' },
  { key: 'empleados', label: 'Empleados', desc: 'Listado de empleados por área', icon: 'bx-group', category: 'talento' },
  { key: 'ciclos', label: 'Ciclos', desc: 'Ciclos de dotación y su estado', icon: 'bx-refresh', category: 'operaciones' },
  { key: 'prendas', label: 'Prendas', desc: 'Inventario y stock por prenda', icon: 'bx-box', category: 'inventario' },
  { key: 'stock', label: 'Stock', desc: 'Stock agregado por prenda', icon: 'bx-layer', category: 'inventario' },
  { key: 'proveedores', label: 'Proveedores', desc: 'Catálogo y actividad de proveedores', icon: 'bx-store', category: 'compras' }
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'operaciones', label: 'Operaciones' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'talento', label: 'Talento' },
  { key: 'compras', label: 'Compras' }
];

const QUICK_ACTIONS = [
  { key: 'ultimo_mes', label: 'Entregas último mes', icon: 'bx-calendar', modulo: 'entregas', rango: 'last_month' },
  { key: 'stock_bajo', label: 'Stock bajo', icon: 'bx-trending-down', modulo: 'stock', rango: 'now' },
  { key: 'proveedores_activos', label: 'Proveedores activos', icon: 'bx-store', modulo: 'proveedores', rango: 'now' },
  { key: 'empleados_area', label: 'Empleados por área', icon: 'bx-group', modulo: 'empleados', rango: 'now' }
];

export default function Reportes() {
  const authHeaders = useMemo(() => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [activeType, setActiveType] = useState(REPORT_TYPES[0]);
  const [kpis, setKpis] = useState({ total_dotaciones: 0, total_entregas: 0, dotaciones_pendientes: 0, total_usuarios: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetch('/api/reportes/kpis', { headers: authHeaders })
      .then(r => r.json())
      .then(j => j.success && setKpis(j.data || {}))
      .catch(() => {});
  }, [authHeaders]);

  const filteredReportTypes = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return REPORT_TYPES.filter((rt) => {
      const matchesCategory = categoryFilter === 'all' || rt.category === categoryFilter;
      if (!matchesCategory) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        rt.label.toLowerCase().includes(term) ||
        rt.desc.toLowerCase().includes(term)
      );
    });
  }, [searchQuery, categoryFilter]);

  const handleSelectReport = (reportType) => {
    setActiveType(reportType);
    setShowModal(true);
  };

  const headerStats = [
    { icon: 'bx-bar-chart', label: 'Dotaciones', value: kpis.total_dotaciones || 0 },
    { icon: 'bx-package', label: 'Entregas', value: kpis.total_entregas || 0 },
    { icon: 'bx-group', label: 'Colaboradores', value: kpis.total_empleados || kpis.total_usuarios || 0 },
    { icon: 'bx-store', label: 'Proveedores activos', value: kpis.total_proveedores_activos || 0 }
  ];

  return (
    <div className="p-6 w-full space-y-6">
      <ResourceHeader
        title="Centro de Reportes"
        subtitle="Genera análisis operativos, de inventario y talento en segundos"
        stats={headerStats}
        action={(
          <button
            onClick={() => handleSelectReport(activeType)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#B39237] hover:from-[#B39237] hover:to-[#9C7F2F] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2BE69] focus:ring-offset-2"
          >
            <i className="bx bx-plus-circle"></i>
            Generar reporte
          </button>
        )}
      />

      <CardPanel title="Reportes disponibles" icon="bx-line-chart">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o descripción del reporte"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/40"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setCategoryFilter(filter.key)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === filter.key
                      ? 'border-[#E2BE69] bg-[#FFF8E7] text-[#6F581B]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-[#E2BE69]/60'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReportTypes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F9F4E7] text-[#B39237]">
                <i className="bx bx-search-alt text-2xl"></i>
              </div>
              <p className="text-base font-semibold text-gray-800">No encontramos reportes con los filtros actuales.</p>
              <p className="mt-1 text-sm text-gray-500">Ajusta la búsqueda o restablece la categoría.</p>
              <button
                onClick={() => { setCategoryFilter('all'); setSearchQuery(''); }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#B39237] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#9C7F2F]"
              >
                <i className="bx bx-undo"></i>
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-3xl border border-gray-100 bg-white">
              {filteredReportTypes.map((rt) => (
                <div key={rt.key} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EEF3FF] to-[#F9FBFF] text-[#2F3E6A]">
                      <i className={`bx ${rt.icon} text-xl`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{rt.label}</p>
                      <p className="text-xs text-gray-500">{rt.desc}</p>
                      <span className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[0.65rem] font-semibold text-gray-600">{rt.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleSelectReport(rt)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-gray-700 hover:border-[#B39237]"
                    >
                      <i className="bx bx-slideshow"></i>
                      Configurar filtros
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveType(rt);
                        setShowModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#B39237] px-4 py-2 text-white shadow hover:bg-[#9C7F2F]"
                    >
                      <i className="bx bx-download"></i>
                      Generar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardPanel>

      <CardPanel title="Accesos rápidos" icon="bx-bolt">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => handleSelectReport(REPORT_TYPES.find((rt) => rt.key === action.modulo) || REPORT_TYPES[0])}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#E2BE69] hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">{action.label}</span>
                <i className={`bx ${action.icon} text-lg text-[#B39237]`}></i>
              </div>
              <p className="mt-2 text-[0.7rem] text-gray-500">Preparado con filtros sugeridos</p>
            </button>
          ))}
        </div>
      </CardPanel>

      {showModal && (
        <ReportWizardModal
          type={activeType}
          onTypeChange={setActiveType}
          onClose={() => setShowModal(false)}
          authHeaders={authHeaders}
        />
      )}
    </div>
  );
}

function ReportWizardModal({ type, onTypeChange, onClose, authHeaders }) {
  const [tab, setTab] = useState('filtros');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rowsCount, setRowsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState('');
  const [estado, setEstado] = useState('');
  const [lastFilters, setLastFilters] = useState({});

  useEffect(() => {
    fetch('/api/areas', { headers: authHeaders })
      .then(r => r.json())
      .then(j => j.success && setAreas(j.data || []))
      .catch(() => {});
  }, [authHeaders]);

  useEffect(() => {
    setRowsCount(0);
    setLastFilters({});
    setTab('filtros');
  }, [type]);

  const generate = async () => {
    setLoading(true); setRowsCount(0);
    try {
      const qs = new URLSearchParams();
      qs.append('modulo', type.key);
      if (fechaInicio && fechaFin) { qs.append('fecha_inicio', fechaInicio); qs.append('fecha_fin', fechaFin); }
      if (area) qs.append('area', area);
      if (estado) qs.append('estado', estado);
      const detalleRes = await fetch(`/api/reportes/detalle?${qs.toString()}`, { headers: authHeaders });
      const detalleJson = await detalleRes.json();
      if (!detalleJson.success) {
        alert(detalleJson.message || 'No fue posible generar el reporte.');
        return;
      }
      const total = detalleJson.total ?? (detalleJson.data ? detalleJson.data.length : 0);
      setRowsCount(total);
      setLastFilters({ fechaInicio, fechaFin, area, estado });
      setTab('exportar');
    } catch (e) {
      console.error(e);
      alert('Error al generar el reporte.');
    } finally { setLoading(false); }
  };

  const performExport = async () => {
    const params = {
      modulo: type.key,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      area,
      estado,
      formato: exportFormat
    };
    const fallback = exportFormat === 'excel'
      ? `${type.key}_reporte.xlsx`
      : exportFormat === 'pdf'
        ? `${type.key}_reporte.pdf`
        : `${type.key}_reporte.csv`;
    try {
      await downloadFile('/api/reportes/exportar', params, fallback);
    } catch (error) {
      alert(error.message || 'No fue posible exportar el reporte.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-gray-200">
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><i className="bx bx-download text-[#B39237]"></i> Módulo de Reportes</h1>
            <p className="text-xs text-gray-500 mt-1">Genera reportes personalizados sobre {type.label.toLowerCase()} y más.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 text-gray-500"><i className="bx bx-x text-xl"></i></button>
        </div>
        <div className="px-5 pt-4 flex gap-3 border-b bg-gray-50">
          <TabButton active={tab==='filtros'} onClick={()=>setTab('filtros')} icon="bx-slider-alt">Filtros</TabButton>
          <TabButton active={tab==='exportar'} onClick={()=>setTab('exportar')} icon="bx-export">Exportar</TabButton>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {tab==='filtros' && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold flex items-center gap-2"><i className="bx bx-filter text-[#B39237]"></i> Tipo de Reporte</h2>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {REPORT_TYPES.map(rt => (
                    <button key={rt.key} onClick={()=>onTypeChange(rt)}
                      className={`rounded-xl border px-4 py-3 text-left text-xs transition ${rt.key===type.key? 'border-[#B39237] bg-[#FFF8E6]' : 'border-gray-200 bg-white hover:border-[#E2BE69]'}`}> 
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`bx ${rt.icon} text-sm ${rt.key===type.key? 'text-[#B39237]':'text-gray-400'}`}></i>
                        <span className="font-semibold text-gray-700">{rt.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{rt.desc}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="text-sm font-semibold flex items-center gap-2"><i className="bx bx-tune text-[#B39237]"></i> Filtros Avanzados</h2>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[11px] text-gray-600">Fecha Inicio</label>
                    <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-2" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600">Fecha Fin</label>
                    <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-2" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600">Área</label>
                    <select value={area} onChange={e=>setArea(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-2">
                      <option value="">Todas</option>
                      {areas.map(a=> <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600">Estado</label>
                    <select value={estado} onChange={e=>setEstado(e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-2">
                      <option value="">Todos</option>
                      <option value="procesado">Procesado</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="entregado">Entregado</option>
                    </select>
                  </div>
                </div>
              </section>
              <div className="flex justify-end gap-3">
                <button onClick={()=>{setFechaInicio('');setFechaFin('');setArea('');setEstado('');}} className="text-xs px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">Limpiar</button>
                <button disabled={loading} onClick={generate} className="text-xs px-5 py-2 rounded-lg bg-[#B39237] text-white font-semibold shadow hover:brightness-95 disabled:opacity-50 flex items-center gap-1"><i className="bx bx-cog"></i> {loading? 'Generando...' : 'Generar'}</button>
              </div>
            </div>
          )}
          {tab==='exportar' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold flex items-center gap-2"><i className="bx bx-download text-[#B39237]"></i> Formato de Exportación</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <ExportFormatCard label="Excel" value="excel" active={exportFormat==='excel'} onSelect={setExportFormat} icon="bx-spreadsheet" desc=".xlsx" />
                <ExportFormatCard label="CSV" value="csv" active={exportFormat==='csv'} onSelect={setExportFormat} icon="bx-file" desc="Valores separados por coma" />
                <ExportFormatCard label="PDF" value="pdf" active={exportFormat==='pdf'} onSelect={setExportFormat} icon="bx-file" desc="Documento PDF" />
              </div>
              <div className="rounded-xl border p-4 bg-white text-xs text-gray-600">
                <p className="mb-2"><span className="font-semibold">Tipo:</span> {type.label}</p>
                <p className="mb-2"><span className="font-semibold">Filas encontradas:</span> {rowsCount}</p>
                <p className="mb-2"><span className="font-semibold">Rango:</span> {lastFilters.fechaInicio || fechaInicio || '—'} / {lastFilters.fechaFin || fechaFin || '—'}</p>
                <p className="text-[10px] text-gray-400">La exportación puede incluir columnas adicionales según el tipo seleccionado.</p>
              </div>
              <div className="flex justify-between items-center">
                <button onClick={()=>setTab('filtros')} className="text-xs px-4 py-2 rounded-lg border bg-white">Volver a Filtros</button>
                <button disabled={!rowsCount} onClick={performExport} className="text-xs px-5 py-2 rounded-lg bg-[#B39237] text-white font-semibold shadow disabled:opacity-50 flex items-center gap-1"><i className="bx bx-download"></i> Exportar {exportFormat.toUpperCase()}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon }) {
  return (
    <button onClick={onClick} className={`relative px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${active? 'border-[#B39237] text-[#B39237]':'border-transparent text-gray-500 hover:text-[#8A6B29]'}`}>
      <i className={`bx ${icon} text-sm`}></i>{children}
    </button>
  );
}

function ExportFormatCard({ label, value, active, onSelect, icon, desc }) {
  return (
    <button onClick={()=>onSelect(value)} className={`rounded-xl border p-3 text-left text-[11px] transition ${active? 'border-[#B39237] bg-[#FFF8E6] shadow-sm':'border-gray-200 bg-white hover:border-[#E2BE69]'}`}>
      <div className="flex items-center gap-2 mb-1">
        <i className={`bx ${icon} text-sm ${active? 'text-[#B39237]':'text-gray-400'}`}></i>
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <p className="text-[10px] text-gray-500">{desc}</p>
    </button>
  );
}

