import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getToken } from '../utils/tokenStorage';

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
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState({});

  const fieldStyles = {
    label: 'text-xs font-semibold uppercase tracking-[0.2em] text-[#7A6B46]',
    input:
      'mt-1 w-full rounded-2xl border-2 border-[#F1E5C3] bg-white/80 px-4 py-2.5 text-sm text-[#2B1F0F] placeholder:text-[#AA9160] shadow-sm focus:border-[#B39237] focus:ring-2 focus:ring-[#E2BE69]/50 focus:outline-none transition-all',
  };

  // Form state
  const [form, setForm] = useState({
    nombre_dotacion: '',
    descripcion: '',
    talla_requerida: 0,
    unidad_medida: '',
    id_categoria: '',
    id_proveedor: '',
    precio_unitario: '',
  });

  const token = getToken();
  const authHeader = useMemo(() => (
    token ? { Authorization: `Bearer ${token}` } : {}
  ), [token]);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/dotaciones', { headers: authHeader });
      const json = await res.json();
      const payload = json?.data ?? json;
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Error listando dotaciones', error);
    }
  }, [authHeader]);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categorias');
      const json = await res.json();
      setCategorias(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error('Error cargando categorías', error);
    }
  }, []);

  const createCategoria = async () => {
    const name = newCategoriaName.trim();
    if (!name) {
      alert('Ingrese un nombre de categoría');
      return;
    }
    setCreatingCategoria(true);
    try {
      const res = await fetch('http://localhost:3001/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ nombre_categoria: name }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || 'No se pudo crear la categoría');
        return;
      }
      await fetchCategorias();
      setShowNewCategoria(false);
      setNewCategoriaName('');
    } catch (error) {
      console.error('Error creando categoría', error);
      alert('Error creando categoría');
    } finally {
      setCreatingCategoria(false);
    }
  };

  const fetchProveedores = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/proveedores', { headers: authHeader });
      const json = await res.json();
      setProveedores(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error('Error cargando proveedores', error);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchList();
    fetchCategorias();
    fetchProveedores();
  }, [fetchList, fetchCategorias, fetchProveedores]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      nombre_dotacion: '',
      descripcion: '',
      talla_requerida: 0,
      unidad_medida: '',
      id_categoria: '',
      id_proveedor: '',
      precio_unitario: '',
    });
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
        precio_unitario: Number(form.precio_unitario),
      };
      if (editingId) {
        const res = await fetch(`http://localhost:3001/api/dotaciones/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          const updated = json.data;
          setItems((prev) => prev.map((it) => (it.id_dotacion === updated.id_dotacion ? { ...it, ...updated } : it)));
          resetForm();
        } else {
          alert(json.message || 'No se pudo actualizar');
        }
      } else {
        const res = await fetch('http://localhost:3001/api/dotaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setItems((prev) => [json.data, ...prev]);
          resetForm();
        } else {
          alert(json.message || 'No se pudo crear');
        }
      }
    } catch (error) {
      console.error('Error guardando dotación', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (id) => {
    const item = items.find((x) => x.id_dotacion === id);
    if (!item) return;
    setEditingId(id);
    setForm({
      nombre_dotacion: item.nombre_dotacion || '',
      descripcion: item.descripcion || '',
      talla_requerida: item.talla_requerida ? 1 : 0,
      unidad_medida: item.unidad_medida || '',
      id_categoria: item.id_categoria || '',
      id_proveedor: item.id_proveedor || '',
      precio_unitario: item.precio_unitario || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/dotaciones/${id}`, { method: 'DELETE', headers: authHeader });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((x) => x.id_dotacion !== id));
      } else {
        alert(json.message || 'No se pudo eliminar');
      }
    } catch (error) {
      console.error('Error eliminando', error);
    }
  };

  const filtered = items.filter((x) => (x.nombre_dotacion || '').toLowerCase().includes(query.toLowerCase().trim()));

  const categorizedItems = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const key = item.id_categoria || 'sin-categoria';
      if (!map.has(key)) {
        const labelFromCatalog = categorias.find((cat) => String(cat.id_categoria) === String(item.id_categoria))?.nombre_categoria;
        map.set(key, {
          key,
          label: item.nombre_categoria || labelFromCatalog || 'Sin categoría asignada',
          items: [],
        });
      }
      map.get(key).items.push(item);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, categorias]);

  const totalCategorias = categorizedItems.length;

  const toggleCategory = (key) => {
    setCategoryOpen((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? false),
    }));
  };

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
    setDetailsCache((prev) => ({ ...prev, [id]: baseItem }));
    setViewId(id);
  };
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#F1E5C3] bg-gradient-to-br from-[#FFF9EE] via-white to-[#FFF4DA] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-inner lg:w-80">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#B39237]">Nuevo artículo</p>
            <h3 className="mt-2 text-2xl font-bold text-[#2B1F0F]">{editingId ? 'Actualizando dotación' : 'Registrar dotación'}</h3>
            <p className="mt-2 text-sm text-[#7A6B46]">Completa la ficha y vincula proveedores para habilitar el artículo en los próximos ciclos.</p>
            <ul className="mt-4 space-y-3 text-sm text-[#4B3A1F]">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-layer" /></span>
                Datos generales + categoría
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-user" /></span>
                Selecciona proveedor y precio unitario
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-ruler" /></span>
                Define si requiere talla o unidad especial
              </li>
            </ul>
            {editingId && (
              <button type="button" onClick={resetForm} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#B39237] transition hover:text-[#83631C]">
                <i className="bx bx-reset text-lg" />
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={fieldStyles.label}>Nombre comercial</label>
                <input
                  className={fieldStyles.input}
                  placeholder="Ej. Botas de seguridad"
                  value={form.nombre_dotacion}
                  onChange={(e) => setForm((f) => ({ ...f, nombre_dotacion: e.target.value }))}
                />
              </div>
              <div>
                <label className={fieldStyles.label}>Proveedor</label>
                <select
                  className={`${fieldStyles.input} appearance-none`}
                  value={form.id_proveedor}
                  onChange={(e) => setForm((f) => ({ ...f, id_proveedor: e.target.value }))}
                >
                  <option value="">Selecciona un proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={fieldStyles.label}>Categoría</label>
                <div className="flex gap-2">
                  <select
                    className={`${fieldStyles.input} appearance-none`}
                    value={form.id_categoria}
                    onChange={(e) => setForm((f) => ({ ...f, id_categoria: e.target.value }))}
                  >
                    <option value="">Selecciona la categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoria((s) => !s)}
                    className="inline-flex h-[46px] items-center justify-center rounded-2xl border-2 border-dashed border-[#E4D6A4] bg-white px-4 text-sm font-semibold text-[#B39237]"
                  >
                    {showNewCategoria ? 'Cerrar' : '+ Nueva'}
                  </button>
                </div>
                {showNewCategoria && (
                  <div className="flex gap-2">
                    <input
                      className={fieldStyles.input}
                      placeholder="Nombre de la nueva categoría"
                      value={newCategoriaName}
                      onChange={(e) => setNewCategoriaName(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={creatingCategoria}
                      onClick={createCategoria}
                      className="inline-flex min-w-[130px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B39237] px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                    >
                      {creatingCategoria ? 'Creando…' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className={fieldStyles.label}>Unidad de medida</label>
                <input
                  className={fieldStyles.input}
                  placeholder="Par, Unidad, Caja"
                  value={form.unidad_medida}
                  onChange={(e) => setForm((f) => ({ ...f, unidad_medida: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={fieldStyles.label}>Precio unitario</label>
                <input
                  type="number"
                  className={fieldStyles.input}
                  placeholder="0"
                  value={form.precio_unitario}
                  onChange={(e) => setForm((f) => ({ ...f, precio_unitario: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border-2 border-[#F1E5C3] bg-white/60 px-4 py-3">
                <input
                  id="chk_talla"
                  type="checkbox"
                  checked={!!form.talla_requerida}
                  onChange={(e) => setForm((f) => ({ ...f, talla_requerida: e.target.checked ? 1 : 0 }))}
                  className="h-5 w-5 rounded border-[#B39237] text-[#B39237] focus:ring-[#E2BE69]"
                />
                <div>
                  <label htmlFor="chk_talla" className="text-sm font-semibold text-[#2B1F0F]">Requiere talla</label>
                  <p className="text-xs text-[#7A6B46]">Actívalo para prendas que necesiten medidas específicas.</p>
                </div>
              </div>
            </div>

            <div>
              <label className={fieldStyles.label}>Descripción</label>
              <textarea
                className={`${fieldStyles.input} resize-none min-h-[110px]`}
                rows={3}
                placeholder="Incluye materiales, uso recomendado y cuidados."
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={saving}
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B39237] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-[#B39237] hover:to-[#9C7F2F] disabled:opacity-50"
              >
                <i className="bx bx-save" />
                {saving ? 'Guardando…' : editingId ? 'Actualizar artículo' : 'Registrar artículo'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#F1E5C3] px-6 py-3 text-sm font-semibold text-[#7A6B46] hover:bg-[#FFF4DA]"
              >
                <i className="bx bx-eraser" />
                Limpiar formulario
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8DBB8] bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B39237]">Catálogo</p>
            <h3 className="text-xl font-semibold text-[#2B1F0F]">Artículos por categoría</h3>
            <p className="text-xs text-[#7A6B46]">{filtered.length} artículos · {totalCategorias} categorías</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-[#B39237]" />
              <input
                className="w-full rounded-2xl border border-[#F1E5C3] bg-white/80 pl-9 pr-4 py-2 text-sm text-[#2B1F0F] placeholder:text-[#B09862] focus:border-[#B39237] focus:ring-2 focus:ring-[#E2BE69]/40"
                placeholder="Buscar artículo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7A6B46]">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F1E5C3] px-3 py-1.5">
                <i className="bx bx-purchase-tag-alt" />
                {totalCategorias} categorías
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#F1E5C3] px-3 py-1.5">
                <i className="bx bx-list-ol" />
                {filtered.length} ítems
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {categorizedItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#F1E5C3] bg-[#FFFCF4] p-8 text-center text-sm text-[#7A6B46]">
              No hay artículos registrados o no coinciden con la búsqueda.
            </div>
          )}

          {categorizedItems.map((category) => {
            const isOpen = categoryOpen[category.key] ?? false;
            return (
              <div key={category.key} className="rounded-xl border border-[#F1E5C3] bg-white/95 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B39237]">Categoría</p>
                    <h4 className="text-lg font-semibold text-[#2B1F0F]">{category.label}</h4>
                    <p className="text-xs text-[#7A6B46]">{category.items.length} {category.items.length === 1 ? 'artículo' : 'artículos'}</p>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F1E5C3] text-[#B39237]">
                    <i className={`bx ${isOpen ? 'bx-chevron-up' : 'bx-chevron-down'} text-xl`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-[#F3E6C4] border-t border-[#F1E5C3] bg-[#FFFEFB]">
                    {category.items.map((it) => (
                      <div key={it.id_dotacion} className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-1 items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4DA] text-xl font-bold text-[#B39237]">
                              {(it.nombre_dotacion || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-base font-semibold text-[#2B1F0F]">{it.nombre_dotacion}</h5>
                              <p className="text-xs text-[#7A6B46]">Proveedor: {it.proveedor_nombre || it.nombre_proveedor || it.id_proveedor || '—'}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#7A6B46]">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF9EE] px-2.5 py-0.5 font-semibold">
                                  <i className="bx bx-purchase-tag-alt text-base" />
                                  {it.unidad_medida || 'Unidad'}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF9EE] px-2.5 py-0.5 font-semibold">
                                  <i className="bx bx-ruler text-base" />
                                  {it.talla_requerida ? 'Requiere talla' : 'Sin talla'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
                            <div className="text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7A6B46]">Precio</p>
                              <p className="text-lg font-bold text-[#2B1F0F]">{formatCOP(it.precio_unitario)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleView(it.id_dotacion, it)}
                                title={viewId === it.id_dotacion ? 'Ocultar detalles' : 'Ver detalles'}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F1E5C3] bg-white text-[#B39237] transition hover:bg-[#FFF4DA]"
                              >
                                <i className={`bx ${viewId === it.id_dotacion ? 'bx-collapse' : 'bx-show'} text-xl`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(it.id_dotacion)}
                                title="Editar"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F1E5C3] bg-white text-[#B39237] transition hover:bg-[#FFF4DA]"
                              >
                                <i className="bx bx-edit text-xl" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(it.id_dotacion)}
                                title="Eliminar"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FFE4DD] bg-[#FFF5F2] text-[#D16969] transition hover:bg-[#FFE0E0]"
                              >
                                <i className="bx bx-trash text-xl" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {viewId === it.id_dotacion && (
                          <div className="mt-3 rounded-2xl border border-[#F1E5C3] bg-white/90 p-4 text-sm text-[#4B3A1F]">
                            {(() => {
                              const d = detailsCache[it.id_dotacion] || it;
                              return (
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Identificación</p>
                                    <div className="rounded-xl bg-[#FFF9EE] p-3">
                                      <p className="text-sm"><span className="font-semibold">ID:</span> #{d.id_dotacion}</p>
                                      <p className="text-sm"><span className="font-semibold">Unidad:</span> {d.unidad_medida || '—'}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Costo</p>
                                    <div className="rounded-xl bg-[#FFF9EE] p-3">
                                      <p className="text-sm"><span className="font-semibold">Precio:</span> {formatCOP(d.precio_unitario)}</p>
                                      <p className="text-sm"><span className="font-semibold">Proveedor:</span> {d.proveedor_nombre || d.nombre_proveedor || d.id_proveedor || '—'}</p>
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#B39237]">Descripción</p>
                                    <div className="mt-2 rounded-2xl border border-dashed border-[#E5D7B1] bg-[#FFFCF4] p-4">
                                      {d.descripcion || 'Sin descripción registrada'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ArticuloManager;
