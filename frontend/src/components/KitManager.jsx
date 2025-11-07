import React, { useEffect, useState } from 'react';

const KitManager = ({ onCreated }) => {
  const [areas, setAreas] = useState([]);
  const [dotaciones, setDotaciones] = useState([]);
  const [nombre, setNombre] = useState('');
  const [idArea, setIdArea] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [kits, setKits] = useState([]);
  const [editingKitId, setEditingKitId] = useState(null);
  const [query, setQuery] = useState('');
  const [viewKitId, setViewKitId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({}); // { [id_kit]: detalles[] }
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAreas();
    fetchDotaciones();
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/kits', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        cache: 'no-store'
      });
      const json = await res.json();
      const payload = json?.data ?? json;
      if (!Array.isArray(payload)) {
        console.warn('[KitManager] fetchKits: expected array but got', payload);
        setKits([]);
      } else {
        setKits(payload);
      }
    } catch (err) {
      console.error('Error fetching kits', err);
    }
  };

  const fetchAreas = async () => {
    try {
      // Pedir todas las áreas directamente desde /api/kits/areas (consulta tabla `area` en el servidor)
      const res = await fetch('http://localhost:3001/api/kits/areas', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      const payload = json?.data || json;
      // Normalizar: asegurar unicidad por id_area y ordenar por nombre
      const unique = (payload || []).reduce((acc, a) => {
        if (!acc.find(x => Number(x.id_area) === Number(a.id_area))) acc.push(a);
        return acc;
      }, []).sort((x, y) => String(x.nombre_area).localeCompare(String(y.nombre_area)));
      setAreas(unique);
    } catch (err) {
      console.error('Error fetching areas', err);
    }
  };

  const fetchDotaciones = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dotaciones', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      const payload = json?.data || json;
      // Normalizar para asegurar siempre un array
      const list = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.dotaciones) ? payload.dotaciones : []);
      if (!Array.isArray(payload)) {
        console.warn('[KitManager] fetchDotaciones: se esperaba array, llegó ->', payload);
      }
      setDotaciones(list);
    } catch (err) {
      console.error('Error fetching dotaciones', err);
    }
  };

  // Selección: alternar selección de una dotación
  const toggleSelect = (id) => {
    setItems(prev => prev.some(i => Number(i.id_dotacion) === Number(id))
      ? prev.filter(i => Number(i.id_dotacion) !== Number(id))
      : [...prev, { id_dotacion: Number(id), cantidad: 1 }]
    );
  };

  const clearSelection = () => setItems([]);

  const selectAllFiltered = (ids) => {
    // añade todos los ids filtrados que no estén ya seleccionados
    setItems(prev => {
      const existing = new Set(prev.map(i => Number(i.id_dotacion)));
      const merged = [...prev];
      ids.forEach(id => { if (!existing.has(Number(id))) merged.push({ id_dotacion: Number(id), cantidad: 1 }); });
      return merged;
    });
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !idArea) {
      alert('Nombre e área son requeridos');
      return;
    }

    setSaving(true);
    try {
  // Enviar id_dotacion y cantidad por ítem
  const payload = { nombre, id_area: Number(idArea), detalles: items.filter(i => i.id_dotacion).map(i => ({ id_dotacion: Number(i.id_dotacion), cantidad: Number(i.cantidad) || 1 })) };
      const url = editingKitId ? `http://localhost:3001/api/kits/${editingKitId}` : 'http://localhost:3001/api/kits/create';
      const method = editingKitId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        alert(editingKitId ? 'Kit actualizado correctamente' : 'Kit creado correctamente');
        // Actualizar estado en memoria sin recargar
        if (editingKitId) {
          const areaName = (areas.find(a => Number(a.id_area) === Number(idArea)) || {}).nombre_area;
          const itemsCount = items.filter(i => i.id_dotacion).length;
          setKits(prev => prev.map(k => Number(k.id_kit) === Number(editingKitId)
            ? { ...k, nombre, id_area: Number(idArea), nombre_area: areaName || k.nombre_area, items_count: itemsCount }
            : k
          ));
          // actualizar cache de detalles si el panel está abierto
          setDetailsCache(prev => ({ ...prev, [editingKitId]: items.map(i => ({ id_dotacion: i.id_dotacion, nombre_dotacion: (dotaciones.find(d => Number(d.id_dotacion)===Number(i.id_dotacion))||{}).nombre_dotacion, cantidad: Number(i.cantidad) || 1 })) }));
        } else {
          const newId = json?.data?.id_kit || json?.id_kit;
          const areaName = (areas.find(a => Number(a.id_area) === Number(idArea)) || {}).nombre_area;
          const itemsCount = items.filter(i => i.id_dotacion).length;
          setKits(prev => [{ id_kit: newId, nombre, id_area: Number(idArea), activo: 1, nombre_area: areaName, items_count: itemsCount }, ...prev]);
        }
        setNombre('');
        setIdArea('');
        setItems([]);
        setEditingKitId(null);
        setQuery('');
        setViewKitId(null);
        if (typeof onCreated === 'function') onCreated();
      } else {
        alert('Error: ' + (json.message || 'no se pudo crear'));
      }
    } catch (err) {
      console.error('Error creating kit', err);
      alert('Error al crear kit');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (json.success) {
        const { kit, detalles } = json.data;
        setEditingKitId(kit.id_kit);
        setNombre(kit.nombre);
        setIdArea(kit.id_area);
        setItems((detalles || []).map(d => ({ id_dotacion: d.id_dotacion, cantidad: Number(d.cantidad) || 1 })));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert('No se pudo obtener el kit');
      }
    } catch (err) {
      console.error('Error al cargar kit para edición', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Confirmar eliminación del kit? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (json.success) {
        alert('Kit eliminado');
        fetchKits();
      } else {
        alert('Error al eliminar kit: ' + (json.message || ''));
      }
    } catch (err) {
      console.error('Error al eliminar kit', err);
    }
  };

  const toggleView = async (id) => {
    if (viewKitId === id) {
      setViewKitId(null);
      return;
    }
    if (detailsCache[id]) {
      setViewKitId(id);
      return;
    }
    try {
      setLoadingDetails(true);
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const json = await res.json();
      if (json.success) {
        setDetailsCache(prev => ({ ...prev, [id]: json.data.detalles || [] }));
        setViewKitId(id);
      } else {
        alert('No se pudo cargar el detalle del kit');
      }
    } catch (err) {
      console.error('Error al cargar detalles del kit', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Lista segura + filtrada según la búsqueda
  const dotacionesSafe = Array.isArray(dotaciones) ? dotaciones : [];
  const filtered = dotacionesSafe.filter(d =>
    String(d?.nombre_dotacion || '').toLowerCase().includes(query.toLowerCase().trim())
  );

  return (
    <div>
      <div className="mb-6 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{editingKitId ? 'Editar Kit' : 'Crear nuevo Kit'}</h3>
          {editingKitId && (
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Editando #{editingKitId}</span>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Kit</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Área</label>
              <select value={idArea} onChange={e => setIdArea(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">-- Seleccionar --</option>
                {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar ítems</label>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre..." className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
          {/* Selector con checkboxes y panel de seleccionados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
                  <span>Ítems disponibles</span>
                  <div className="space-x-2">
                    <button type="button" onClick={() => selectAllFiltered(filtered.map(d => d.id_dotacion))} className="text-[#B39237] hover:text-[#9C7F2F] font-medium">Seleccionar todos</button>
                    <button type="button" onClick={clearSelection} className="text-gray-600 hover:text-gray-800">Limpiar selección</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto divide-y">
                  {filtered.map(d => {
                    const selected = items.some(it => Number(it.id_dotacion) === Number(d.id_dotacion));
                    return (
                      <label key={d.id_dotacion} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <input type="checkbox" checked={selected} onChange={() => toggleSelect(d.id_dotacion)} className="h-4 w-4 text-[#B39237] border-gray-300 rounded" />
                          <span className="text-sm text-gray-800">{d.nombre_dotacion}</span>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setItems(prev => prev.map(it => Number(it.id_dotacion)===Number(d.id_dotacion) ? { ...it, cantidad: Math.max(1, Number(it.cantidad||1) - 1) } : it))}
                              className="h-6 w-6 flex items-center justify-center rounded border text-gray-700"
                              aria-label="Decrementar"
                            >-</button>
                            <input
                              type="number"
                              min="1"
                              value={(items.find(it => Number(it.id_dotacion)===Number(d.id_dotacion))||{}).cantidad || 1}
                              onChange={(e)=> setItems(prev => prev.map(it => Number(it.id_dotacion)===Number(d.id_dotacion) ? { ...it, cantidad: Math.max(1, Number(e.target.value)||1) } : it))}
                              className="w-14 border rounded px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setItems(prev => prev.map(it => Number(it.id_dotacion)===Number(d.id_dotacion) ? { ...it, cantidad: Number(it.cantidad||1) + 1 } : it))}
                              className="h-6 w-6 flex items-center justify-center rounded border text-gray-700"
                              aria-label="Incrementar"
                            >+</button>
                          </div>
                        )}
                      </label>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-500">No hay ítems para la búsqueda.</div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="border rounded-lg p-3 bg-gray-50 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Seleccionados ({items.length})</h4>
                  <button type="button" onClick={clearSelection} className="text-xs text-gray-600 hover:underline">Limpiar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((it, idx) => {
                    const d = dotaciones.find(x => Number(x.id_dotacion) === Number(it.id_dotacion));
                    return (
                      <span key={idx} className="inline-flex items-center bg-white border rounded-full px-3 py-1 text-xs text-gray-800">
                        {d ? d.nombre_dotacion : `ID ${it.id_dotacion}`}
                        <span className="mx-2 text-gray-500">x</span>
                        <input
                          type="number"
                          min="1"
                          value={Number(it.cantidad) || 1}
                          onChange={(e)=> updateItem(idx, 'cantidad', Math.max(1, Number(e.target.value)||1))}
                          className="w-12 border rounded px-1 py-0.5 text-xs mr-2"
                        />
                        <button type="button" onClick={() => removeItem(idx)} className="ml-2 text-red-500 hover:text-red-600">✕</button>
                      </span>
                    );
                  })}
                  {items.length === 0 && (
                    <span className="text-xs text-gray-500">Aún no has seleccionado ítems.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button disabled={saving} type="submit" className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#B39237] hover:bg-[#9C7F2F] transition disabled:opacity-60">{saving ? 'Guardando...' : (editingKitId ? 'Actualizar Kit' : 'Crear Kit')}</button>
            <button type="button" onClick={() => { setNombre(''); setIdArea(''); setItems([]); setQuery(''); setEditingKitId(null); }} className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition">Limpiar</button>
          </div>
        </form>
      </div>
      
      {/* Listado de kits existentes */}
      <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kits creados</h3>
          <span className="text-xs text-gray-500">Listado total: {(Array.isArray(kits) ? kits.length : 0)}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full table-auto divide-y divide-gray-100 divide-x">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Área</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {(Array.isArray(kits) ? kits : []).map(k => (
                <React.Fragment key={k.id_kit}>
                  <tr className="hover:bg-gray-50 transition-colors align-middle">
                    <td className="px-3 py-2.5 text-sm text-gray-900">#{k.id_kit}</td>
                    <td className="px-3 py-2.5 text-sm font-medium text-gray-900 truncate" title={k.nombre}>{k.nombre}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-700 truncate" title={k.nombre_area || ''}>{k.nombre_area || ''}</td>
                    <td className="px-3 py-2.5 text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {k.items_count} ítem{k.items_count === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-sm text-gray-900 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => toggleView(k.id_kit)} className="inline-flex items-center justify-center h-9 w-24 rounded-md text-sm font-medium text-white bg-[#B39237] hover:bg-[#9C7F2F] transition">Detalles</button>
                        <button onClick={() => handleEdit(k.id_kit)} className="inline-flex items-center justify-center h-9 w-24 rounded-md text-sm font-medium text-white bg-[#B39237] hover:bg-[#9C7F2F] transition">Editar</button>
                        <button onClick={() => handleDelete(k.id_kit)} className="inline-flex items-center justify-center h-9 w-24 rounded-md text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                  {viewKitId === k.id_kit && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 bg-gray-50">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                          {/* Header del detalle */}
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <div>
                              <h4 className="text-base font-semibold text-gray-900">Kit #{k.id_kit} · {k.nombre}</h4>
                              <p className="text-xs text-gray-500">Área: {k.nombre_area || '—'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(k.activo) === 1 ? 'bg-[#F7F2E0] text-[#9C7F2F] ring-1 ring-[#E4D6A4]' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'}`}>
                                {Number(k.activo) === 1 ? 'Activo' : 'Inactivo'}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ring-1 ring-gray-200">
                                {k.items_count} ítem{k.items_count === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>

                          {/* Contenido del detalle */}
                          {loadingDetails && !detailsCache[k.id_kit] ? (
                            <div className="text-sm text-gray-500">Cargando detalles...</div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Metadatos */}
                              <div className="lg:col-span-1">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                  <dl className="divide-y divide-gray-100">
                                    <div className="py-2 grid grid-cols-3 text-sm">
                                      <dt className="text-gray-500">ID</dt>
                                      <dd className="col-span-2 text-gray-900">{k.id_kit}</dd>
                                    </div>
                                    <div className="py-2 grid grid-cols-3 text-sm">
                                      <dt className="text-gray-500">Nombre</dt>
                                      <dd className="col-span-2 text-gray-900">{k.nombre}</dd>
                                    </div>
                                    <div className="py-2 grid grid-cols-3 text-sm">
                                      <dt className="text-gray-500">Área</dt>
                                      <dd className="col-span-2 text-gray-900">{k.nombre_area || '—'}</dd>
                                    </div>
                                    <div className="py-2 grid grid-cols-3 text-sm">
                                      <dt className="text-gray-500">Estado</dt>
                                      <dd className="col-span-2 text-gray-900">{Number(k.activo) === 1 ? 'Activo' : 'Inactivo'}</dd>
                                    </div>
                                  </dl>
                                </div>
                              </div>

                              {/* Items */}
                              <div className="lg:col-span-2">
                                <div className="rounded-lg border border-gray-100 overflow-hidden">
                                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600">Ítems del kit</div>
                                  <div className="max-h-64 overflow-auto">
                                    {(detailsCache[k.id_kit] || []).length > 0 ? (
                                      <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-white">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dotación</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {(detailsCache[k.id_kit] || []).map((d, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                              <td className="px-4 py-2 text-sm text-gray-800">{d.nombre_dotacion || `ID ${d.id_dotacion}`}</td>
                                              <td className="px-4 py-2 text-sm text-gray-800">{d.cantidad ?? 1}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div className="px-4 py-6 text-sm text-gray-500">Sin ítems</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KitManager;
