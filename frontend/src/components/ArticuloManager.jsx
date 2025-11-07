import React, { useEffect, useState } from 'react';

const ArticuloManager = () => {
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showNewCategoria, setShowNewCategoria] = useState(false);
  const [newCategoriaName, setNewCategoriaName] = useState('');
  const [creatingCategoria, setCreatingCategoria] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nombre_dotacion: '',
    descripcion: '',
    talla_requerida: 0,
    unidad_medida: '',
    id_categoria: '',
    id_proveedor: '',
    precio_unitario: ''
  });

  const authHeader = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  useEffect(() => {
    fetchList();
    fetchCategorias();
    fetchProveedores();
  }, []);

  const fetchList = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dotaciones', { headers: authHeader });
      const json = await res.json();
      const payload = json?.data ?? json;
      setItems(Array.isArray(payload) ? payload : []);
    } catch (e) { console.error('Error listando dotaciones', e); }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categorias');
      const json = await res.json();
      setCategorias(Array.isArray(json?.data) ? json.data : []);
    } catch (e) { console.error('Error cargando categorías', e); }
  };
  const createCategoria = async () => {
    const name = newCategoriaName.trim();
    if (!name) { alert('Ingrese un nombre de categoría'); return; }
    setCreatingCategoria(true);
    try {
      const res = await fetch('http://localhost:3001/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ nombre_categoria: name })
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || 'No se pudo crear la categoría');
        return;
      }
      // Actualizar lista y seleccionar la nueva
  await fetchCategorias();
  // No seleccionar automáticamente la nueva categoría: mantener la selección previa
      setShowNewCategoria(false);
      setNewCategoriaName('');
    } catch (e) {
      console.error('Error creando categoría', e);
      alert('Error creando categoría');
    } finally {
      setCreatingCategoria(false);
    }
  };
  const fetchProveedores = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proveedores', { headers: authHeader });
      const json = await res.json();
      setProveedores(Array.isArray(json?.data) ? json.data : []);
    } catch (e) { console.error('Error cargando proveedores', e); }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ nombre_dotacion: '', descripcion: '', talla_requerida: 0, unidad_medida: '', id_categoria: '', id_proveedor: '', precio_unitario: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre_dotacion || !form.id_categoria || !form.id_proveedor || form.precio_unitario === '') {
      alert('Complete los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        talla_requerida: form.talla_requerida ? 1 : 0,
        id_categoria: Number(form.id_categoria),
        id_proveedor: Number(form.id_proveedor),
        precio_unitario: Number(form.precio_unitario)
      };
      if (editingId) {
        const res = await fetch(`http://localhost:3001/api/dotaciones/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          const updated = json.data;
          setItems(prev => prev.map(it => it.id_dotacion === updated.id_dotacion ? { ...it, ...updated } : it));
          resetForm();
        } else { alert(json.message || 'No se pudo actualizar'); }
      } else {
        const res = await fetch('http://localhost:3001/api/dotaciones', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          setItems(prev => [json.data, ...prev]);
          resetForm();
        } else { alert(json.message || 'No se pudo crear'); }
      }
    } catch (e) {
      console.error('Error guardando dotación', e);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id) => {
    const item = items.find(x => x.id_dotacion === id);
    if (!item) return;
    setEditingId(id);
    setForm({
      nombre_dotacion: item.nombre_dotacion || '',
      descripcion: item.descripcion || '',
      talla_requerida: item.talla_requerida ? 1 : 0,
      unidad_medida: item.unidad_medida || '',
      id_categoria: item.id_categoria || '',
      id_proveedor: item.id_proveedor || '',
      precio_unitario: item.precio_unitario || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/dotaciones/${id}`, { method: 'DELETE', headers: authHeader });
      const json = await res.json();
      if (json.success) {
        setItems(prev => prev.filter(x => x.id_dotacion !== id));
      } else { alert(json.message || 'No se pudo eliminar'); }
    } catch (e) {
      console.error('Error eliminando', e);
    }
  };

  const filtered = items.filter(x => (x.nombre_dotacion || '').toLowerCase().includes(query.toLowerCase().trim()));

  const formatCOP = (value) => {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);
    } catch {
      return `$${Number(value || 0).toLocaleString()}`;
    }
  };

  const toggleView = (id, baseItem) => {
    if (viewId === id) { setViewId(null); return; }
    // No llamar a ninguna API: utilizar los datos que ya tenemos en memoria
    setDetailsCache(prev => ({ ...prev, [id]: baseItem }));
    setViewId(id);
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          {editingId && <button onClick={resetForm} className="text-sm text-gray-600 hover:underline">Cancelar edición</button>}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input className="w-full border rounded px-3 py-2" value={form.nombre_dotacion} onChange={e=>setForm(f=>({...f,nombre_dotacion:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <div className="flex gap-2">
              <select className="w-full border rounded px-3 py-2" value={form.id_categoria} onChange={e=>setForm(f=>({...f,id_categoria:e.target.value}))}>
                <option value="">-- Seleccionar --</option>
                {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>)}
              </select>
              <button type="button" onClick={()=>{ setShowNewCategoria(s=>!s); }} className="whitespace-nowrap border px-3 py-2 rounded text-sm">
                {showNewCategoria ? 'Cancelar' : 'Nueva'}
              </button>
            </div>
            {showNewCategoria && (
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Nombre de la nueva categoría"
                  value={newCategoriaName}
                  onChange={e=>setNewCategoriaName(e.target.value)}
                />
                <button type="button" disabled={creatingCategoria} onClick={createCategoria} className="bg-[#B39237] hover:bg-[#9C7F2F] text-white px-4 py-2 rounded">
                  {creatingCategoria ? 'Creando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select className="w-full border rounded px-3 py-2" value={form.id_proveedor} onChange={e=>setForm(f=>({...f,id_proveedor:e.target.value}))}>
              <option value="">-- Seleccionar --</option>
              {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea className="w-full border rounded px-3 py-2" rows={2} value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
            <input className="w-full border rounded px-3 py-2" value={form.unidad_medida} onChange={e=>setForm(f=>({...f,unidad_medida:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={form.precio_unitario} onChange={e=>setForm(f=>({...f,precio_unitario:e.target.value}))} />
          </div>
          <div className="flex items-center gap-2">
            <input id="chk_talla" type="checkbox" checked={!!form.talla_requerida} onChange={e=>setForm(f=>({...f,talla_requerida:e.target.checked?1:0}))} />
            <label htmlFor="chk_talla" className="text-sm text-gray-700">Requiere talla</label>
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-3">
            <button disabled={saving} type="submit" className="bg-[#B39237] hover:bg-[#9C7F2F] text-white px-4 py-2 rounded">
              {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
            </button>
            <button type="button" onClick={resetForm} className="border px-4 py-2 rounded">Limpiar</button>
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Artículos de dotación</h3>
          <input placeholder="Buscar..." value={query} onChange={e=>setQuery(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Talla</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(it => (
                <React.Fragment key={it.id_dotacion}>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm">#{it.id_dotacion}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{it.nombre_dotacion}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{it.nombre_categoria || it.id_categoria}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{it.proveedor_nombre || it.nombre_proveedor || it.id_proveedor}</td>
                  <td className="px-5 py-3 text-sm">{formatCOP(it.precio_unitario)}</td>
                  <td className="px-5 py-3 text-sm">{it.talla_requerida ? 'Sí' : 'No'}</td>
                  <td className="px-5 py-3 text-sm">
                    <div className="flex flex-wrap gap-3">
                      <button onClick={()=>toggleView(it.id_dotacion, it)} className="inline-flex items-center justify-center w-28 px-4 py-2 rounded-md text-white bg-[#B39237] hover:bg-[#9C7F2F] transition">
                        {viewId === it.id_dotacion ? 'Ocultar' : 'Detalles'}
                      </button>
                      <button onClick={()=>handleEdit(it.id_dotacion)} className="inline-flex items-center justify-center w-28 px-4 py-2 rounded-md text-white bg-[#B39237] hover:bg-[#9C7F2F] transition">Editar</button>
                      <button onClick={()=>handleDelete(it.id_dotacion)} className="inline-flex items-center justify-center w-28 px-4 py-2 rounded-md text-gray-900 bg-gray-100 hover:bg-gray-200 transition">Eliminar</button>
                    </div>
                  </td>
                </tr>
                {viewId === it.id_dotacion && (
                  <tr>
                    <td colSpan={7} className="px-5 py-4 bg-gray-50">
                      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        {
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(() => { const d = detailsCache[it.id_dotacion] || it; return (
                              <>
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                  <dl className="divide-y divide-gray-100">
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">ID</dt><dd className="col-span-2 text-gray-900">{d.id_dotacion}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Nombre</dt><dd className="col-span-2 text-gray-900">{d.nombre_dotacion}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Categoría</dt><dd className="col-span-2 text-gray-900">{d.nombre_categoria || d.id_categoria}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Proveedor</dt><dd className="col-span-2 text-gray-900">{d.proveedor_nombre || d.nombre_proveedor || d.id_proveedor}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Precio</dt><dd className="col-span-2 text-gray-900">{formatCOP(d.precio_unitario)}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Talla requerida</dt><dd className="col-span-2 text-gray-900">{d.talla_requerida ? 'Sí' : 'No'}</dd></div>
                                    <div className="py-2 grid grid-cols-3 text-sm"><dt className="text-gray-500">Unidad</dt><dd className="col-span-2 text-gray-900">{d.unidad_medida || '—'}</dd></div>
                                  </dl>
                                </div>
                                <div className="md:col-span-2">
                                  <div className="rounded-lg border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600">Descripción</div>
                                    <div className="p-4 text-sm text-gray-800 min-h-[48px]">{d.descripcion || 'Sin descripción'}</div>
                                  </div>
                                </div>
                              </>
                            ); })()}
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-sm text-gray-500">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ArticuloManager;
