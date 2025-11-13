import React, { useEffect, useMemo, useState } from 'react';
import { downloadCsv } from '../utils/download';

const REPORT_TYPES = [
  { key: 'dotaciones', label: 'Dotaciones', desc: 'Modelos de dotación y categorías', icon: 'bx-bar-chart' },
  { key: 'entregas', label: 'Entregas', desc: 'Historial de entregas realizadas', icon: 'bx-package' },
  { key: 'empleados', label: 'Empleados', desc: 'Listado de empleados por área', icon: 'bx-group' },
  { key: 'ciclos', label: 'Ciclos', desc: 'Ciclos de dotación y su estado', icon: 'bx-refresh' },
  { key: 'prendas', label: 'Prendas', desc: 'Inventario y stock por prenda', icon: 'bx-box' },
  { key: 'stock', label: 'Stock', desc: 'Stock agregado por prenda', icon: 'bx-layer' },
  { key: 'proveedores', label: 'Proveedores', desc: 'Catálogo y actividad de proveedores', icon: 'bx-store' }
];

export default function Reportes() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const [showModal, setShowModal] = useState(false);
  const [activeType, setActiveType] = useState(REPORT_TYPES[0]);
  const [kpis, setKpis] = useState({ total_dotaciones: 0, total_entregas: 0, dotaciones_pendientes: 0, total_usuarios: 0 });

  useEffect(() => {
    fetch('/api/reportes/kpis', { headers: authHeaders })
      .then(r => r.json())
      .then(j => j.success && setKpis(j.data || {}))
      .catch(() => {});
  }, [authHeaders]);

  return (
    <div className="p-6 space-y-8">
      <HeaderKpis kpis={kpis} />
      <section>
        <h2 className="text-xl font-bold tracking-tight mb-2">Reportes Disponibles</h2>
        <p className="text-sm text-gray-600 mb-6">Selecciona un tipo de reporte para generar análisis detallados.</p>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {REPORT_TYPES.map(rt => (
            <button
              key={rt.key}
              onClick={() => { setActiveType(rt); setShowModal(true); }}
              className="group relative text-left rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-white shadow-sm hover:shadow-md transition hover:border-[#E2BE69] focus:outline-none focus:ring-2 focus:ring-[#E2BE69]/40"
            >
              <div className="h-20 w-full rounded-t-2xl bg-gradient-to-r from-[#EEF3FF] to-[#F9FBFF] flex items-center px-5">
                <i className={`bx ${rt.icon} text-2xl text-[#2F3E6A]`}></i>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 group-hover:text-[#8A6B29]">{rt.label}</h3>
                  <i className="bx bx-right-arrow-alt text-xl text-gray-400 group-hover:text-[#B39237]"></i>
                </div>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{rt.desc}</p>
              </div>
              <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition">
                <div className="absolute -inset-px rounded-2xl ring-2 ring-[#E2BE69]/40"></div>
              </div>
            </button>
          ))}
        </div>
      </section>
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

function HeaderKpis({ kpis }) {
  const items = [
    { label: 'Dotaciones', value: kpis.total_dotaciones || 0, icon: 'bx-box' },
    { label: 'Entregas', value: kpis.total_entregas || 0, icon: 'bx-package' },
    { label: 'Empleados', value: kpis.total_empleados || 0, icon: 'bx-group' },
    { label: 'Ciclos', value: kpis.total_ciclos || 0, icon: 'bx-refresh' },
    { label: 'Proveedores Activos', value: kpis.total_proveedores_activos || 0, icon: 'bx-store' }
  ].slice(0,4); // mostrar solo 4 más relevantes
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl bg-white/80 backdrop-blur ring-1 ring-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFF3CC] to-[#FDE8B0] flex items-center justify-center shadow-inner">
            <i className={`bx ${it.icon} text-xl text-[#B39237]`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">{it.label}</p>
            <p className="text-lg font-bold text-gray-800">{it.value}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-[#E2BE69]/10 text-[#8A6B29] font-semibold">+0%</span>
        </div>
      ))}
    </div>
  );
}

function ReportWizardModal({ type, onTypeChange, onClose, authHeaders }) {
  const [tab, setTab] = useState('filtros');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    fetch('/api/areas', { headers: authHeaders })
      .then(r => r.json())
      .then(j => j.success && setAreas(j.data || []))
      .catch(() => {});
  }, [authHeaders]);

  const generate = async () => {
    setLoading(true); setPreview([]);
    try {
      const qs = new URLSearchParams();
      qs.append('modulo', type.key);
      if (fechaInicio && fechaFin) { qs.append('fecha_inicio', fechaInicio); qs.append('fecha_fin', fechaFin); }
      if (area) qs.append('area', area);
      if (estado) qs.append('estado', estado);
      const detalleRes = await fetch(`/api/reportes/detalle?${qs.toString()}`, { headers: authHeaders });
      const detalleJson = await detalleRes.json();
      if (detalleJson.success) setPreview(detalleJson.data || []);
      setTab('vista');
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const performExport = async () => {
    const params = { modulo: type.key, fecha_inicio: fechaInicio, fecha_fin: fechaFin, area, estado };
    if (exportFormat === 'excel') {
      await downloadCsv('/api/reportes/exportar', params);
    } else if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(preview, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = `${type.key}_reporte.json`; link.click();
    } else if (exportFormat === 'pdf') {
      alert('Exportar a PDF: pendiente de implementación (pdfmake/jsPDF).');
    } else if (exportFormat === 'email') {
      alert('Enviar por Email: servicio pendiente de integración.');
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
          <TabButton active={tab==='vista'} onClick={()=>setTab('vista')} icon="bx-show-alt">Vista Previa</TabButton>
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
          {tab==='vista' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2"><i className="bx bx-show-alt text-[#B39237]"></i> Vista Previa de {type.label}</h2>
                <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold">{preview.length} filas</span>
              </div>
              <div className="rounded-xl border bg-white overflow-auto max-h-60">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      {preview.length ? Object.keys(preview[0]).slice(0,6).map(k=> <th key={k} className="text-left px-3 py-2 font-medium">{k}</th>) : <th className="px-3 py-4 text-left">Sin datos</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0,25).map((row,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.keys(row).slice(0,6).map(col=>(
                          <td key={col} className="px-3 py-1 whitespace-nowrap">{String(row[col]).substring(0,40)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={()=>setTab('filtros')} className="text-xs px-4 py-2 rounded-lg border bg-white">Volver</button>
                <button onClick={()=>setTab('exportar')} className="text-xs px-5 py-2 rounded-lg bg-[#B39237] text-white font-semibold shadow flex items-center gap-1"><i className="bx bx-export"></i> Continuar a Exportar</button>
              </div>
            </div>
          )}
          {tab==='exportar' && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold flex items-center gap-2"><i className="bx bx-download text-[#B39237]"></i> Formato de Exportación</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <ExportFormatCard label="Excel" value="excel" active={exportFormat==='excel'} onSelect={setExportFormat} icon="bx-spreadsheet" desc=".xlsx (usa CSV por ahora)" />
                <ExportFormatCard label="PDF" value="pdf" active={exportFormat==='pdf'} onSelect={setExportFormat} icon="bx-file" desc="Documento PDF" />
                <ExportFormatCard label="JSON" value="json" active={exportFormat==='json'} onSelect={setExportFormat} icon="bx-code-alt" desc="Integración" />
                <ExportFormatCard label="Email" value="email" active={exportFormat==='email'} onSelect={setExportFormat} icon="bx-envelope" desc="Enviar directo" />
              </div>
              <div className="rounded-xl border p-4 bg-white text-xs text-gray-600">
                <p className="mb-2"><span className="font-semibold">Tipo:</span> {type.label}</p>
                <p className="mb-2"><span className="font-semibold">Filas en vista previa:</span> {preview.length}</p>
                <p className="mb-2"><span className="font-semibold">Rango:</span> {fechaInicio || '—'} / {fechaFin || '—'}</p>
                <p className="text-[10px] text-gray-400">La exportación puede incluir más columnas internas según el tipo.</p>
              </div>
              <div className="flex justify-between items-center">
                <button onClick={()=>setTab('vista')} className="text-xs px-4 py-2 rounded-lg border bg-white">Volver a Vista</button>
                <button disabled={!preview.length} onClick={performExport} className="text-xs px-5 py-2 rounded-lg bg-[#B39237] text-white font-semibold shadow disabled:opacity-50 flex items-center gap-1"><i className="bx bx-download"></i> Exportar {exportFormat.toUpperCase()}</button>
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

