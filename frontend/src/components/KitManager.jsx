import React, { useEffect, useMemo, useState } from 'react';
import { getToken } from '../utils/tokenStorage';

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

  const fieldStyles = {
    label: 'text-[11px] font-semibold uppercase tracking-[0.35em] text-[#7A6B46] flex items-center gap-1',
    input:
      'mt-1 w-full rounded-2xl border-2 border-[#F1E5C3] bg-white/90 px-4 py-2 text-sm text-[#2B1F0F] placeholder:text-[#B09862] shadow-sm focus:border-[#B39237] focus:ring-2 focus:ring-[#E2BE69]/50 transition-all',
  };

  const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchAreas();
    fetchDotaciones();
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/kits', {
        headers: buildAuthHeaders(),
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
        headers: buildAuthHeaders()
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
        headers: buildAuthHeaders()
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

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !idArea) {
      alert('Nombre y área son requeridos');
      return;
    }

    const detalles = items
      .filter(i => i.id_dotacion)
      .map(i => ({ id_dotacion: Number(i.id_dotacion), cantidad: Math.max(1, Number(i.cantidad) || 1) }));

    const payload = {
      nombre,
      id_area: Number(idArea),
      detalles,
    };

    setSaving(true);
    try {
      const url = editingKitId ? `http://localhost:3001/api/kits/${editingKitId}` : 'http://localhost:3001/api/kits/create';
      const method = editingKitId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        alert('Error: ' + (json.message || 'no se pudo crear'));
        return;
      }

      alert(editingKitId ? 'Kit actualizado correctamente' : 'Kit creado correctamente');
      const areaName = (areas.find(a => Number(a.id_area) === Number(idArea)) || {}).nombre_area;
      const itemsCount = detalles.length;

      if (editingKitId) {
        setKits(prev => prev.map(k =>
          Number(k.id_kit) === Number(editingKitId)
            ? { ...k, nombre, id_area: Number(idArea), nombre_area: areaName || k.nombre_area, items_count: itemsCount }
            : k
        ));
        setDetailsCache(prev => ({
          ...prev,
          [editingKitId]: detalles.map(d => ({
            ...d,
            nombre_dotacion: (dotaciones.find(item => Number(item.id_dotacion) === Number(d.id_dotacion)) || {}).nombre_dotacion,
          })),
        }));
      } else {
        const newId = json?.data?.id_kit || json?.id_kit;
        setKits(prev => [{
          id_kit: newId,
          nombre,
          id_area: Number(idArea),
          activo: 1,
          nombre_area: areaName,
          items_count: itemsCount,
        }, ...prev]);
      }

      setNombre('');
      setIdArea('');
      setItems([]);
      setEditingKitId(null);
      setQuery('');
      setViewKitId(null);
      if (typeof onCreated === 'function') onCreated();
    } catch (err) {
      console.error('Error creating kit', err);
      alert('Error al crear kit');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { headers: buildAuthHeaders() });
      const json = await res.json();
      if (json.success) {
        const { kit, detalles } = json.data;
        setEditingKitId(kit.id_kit);
        setNombre(kit.nombre);
        setIdArea(String(kit.id_area ?? ''));
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
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { method: 'DELETE', headers: buildAuthHeaders() });
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
      const res = await fetch(`http://localhost:3001/api/kits/${id}`, { headers: buildAuthHeaders() });
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
  const totalKits = Array.isArray(kits) ? kits.length : 0;
  const activeKits = useMemo(() => (Array.isArray(kits) ? kits.filter(k => Number(k.activo) === 1).length : 0), [kits]);
  const selectedCount = items.length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#F1E5C3] bg-gradient-to-br from-[#FFF9EE] via-white to-[#FFF4DA] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="rounded-2xl border border-white/60 bg-white/85 p-5 shadow-inner lg:w-80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B39237]">Kit maestro</p>
            <h3 className="mt-2 text-2xl font-bold text-[#2B1F0F]">{editingKitId ? 'Actualiza el kit' : 'Compón un kit estratégico'}</h3>
            <p className="mt-2 text-sm text-[#7A6B46]">Combina dotaciones clave por área laboral y define cantidades mínimas.</p>
            <ul className="mt-4 space-y-3 text-sm text-[#4B3A1F]">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-grid"></i></span>
                Selecciona dotaciones disponibles y ajusta cantidades desde un solo panel.
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-target-lock"></i></span>
                Asigna el kit a un área para controlar a quién está dirigido.
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]"><i className="bx bx-trophy"></i></span>
                Cada kit queda listo para integrarse en ciclos y entregas especiales.
              </li>
            </ul>
            {editingKitId && (
              <button
                type="button"
                onClick={() => {
                  setNombre('');
                  setIdArea('');
                  setItems([]);
                  setQuery('');
                  setEditingKitId(null);
                  setViewKitId(null);
                }}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#B39237] transition hover:text-[#83631C]"
              >
                <i className="bx bx-reset"></i>
                Salir de modo edición
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={fieldStyles.label}>Nombre del kit</label>
                <input
                  className={fieldStyles.input}
                  placeholder="Ej. Kit seguridad planta norte"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className={fieldStyles.label}>Área</label>
                <select
                  className={`${fieldStyles.input} appearance-none`}
                  value={idArea}
                  onChange={e => setIdArea(e.target.value)}
                >
                  <option value="">Selecciona un área</option>
                  {areas.map(a => (
                    <option key={a.id_area} value={a.id_area}>{a.nombre_area}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={fieldStyles.label}>Buscar dotaciones</label>
                <div className="relative">
                  <i className="bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-[#B39237]" />
                  <input
                    className={`${fieldStyles.input} pl-10`}
                    placeholder="Escribe el nombre de la dotación..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
              <div className="rounded-2xl border border-[#E8DBB8] bg-white/90 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1E5C3] px-4 py-3 text-xs font-semibold text-[#7A6B46]">
                  <span className="flex items-center gap-2">
                    <i className="bx bx-layer"></i>
                    Inventario disponible
                  </span>
                  <div className="flex items-center gap-4 text-[11px]">
                    <button type="button" onClick={() => selectAllFiltered(filtered.map(d => d.id_dotacion))} className="text-[#B39237] hover:text-[#83631C]">Seleccionar todo</button>
                    <button type="button" onClick={clearSelection} className="text-[#7A6B46] hover:text-[#4a3a26]">Limpiar selección</button>
                  </div>
                </div>
                <div className="max-h-72 divide-y divide-[#F3E6C4] overflow-auto">
                  {filtered.map(d => {
                    const selected = items.some(it => Number(it.id_dotacion) === Number(d.id_dotacion));
                    const currentItem = items.find(it => Number(it.id_dotacion) === Number(d.id_dotacion));
                    return (
                      <label key={d.id_dotacion} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#FFF9EE]">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(d.id_dotacion)}
                            className="h-4 w-4 rounded border-[#B39237] text-[#B39237] focus:ring-[#E2BE69]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#2B1F0F]">{d.nombre_dotacion}</p>
                            <p className="text-[11px] text-[#7A6B46]">#{d.id_dotacion}</p>
                          </div>
                        </div>
                        {selected && (
                          <div className="flex items-center gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => setItems(prev => prev.map(it => Number(it.id_dotacion) === Number(d.id_dotacion) ? { ...it, cantidad: Math.max(1, Number(it.cantidad || 1) - 1) } : it))}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#F1E5C3] text-[#2B1F0F]"
                              aria-label="Restar"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={currentItem?.cantidad || 1}
                              onChange={e => setItems(prev => prev.map(it => Number(it.id_dotacion) === Number(d.id_dotacion) ? { ...it, cantidad: Math.max(1, Number(e.target.value) || 1) } : it))}
                              className="w-14 rounded-2xl border border-[#E8DBB8] px-3 py-1 text-center text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setItems(prev => prev.map(it => Number(it.id_dotacion) === Number(d.id_dotacion) ? { ...it, cantidad: Number(it.cantidad || 1) + 1 } : it))}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#F1E5C3] text-[#2B1F0F]"
                              aria-label="Sumar"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </label>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-[#7A6B46]">No hay ítems que coincidan con la búsqueda.</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-[#E5D7B1] bg-white/80 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-[#7A6B46]">
                  <span>Kit compuesto</span>
                  <button type="button" onClick={clearSelection} className="text-[#B39237] hover:text-[#83631C]">Limpiar</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {items.map((it, idx) => {
                    const d = dotaciones.find(x => Number(x.id_dotacion) === Number(it.id_dotacion));
                    return (
                      <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-[#F1E5C3] bg-white px-3 py-1 text-xs text-[#2B1F0F] shadow-sm">
                        {d ? d.nombre_dotacion : `ID ${it.id_dotacion}`}
                        <span className="rounded-full bg-[#FFF4DA] px-2 py-0.5 font-semibold text-[#B39237]">x{it.cantidad || 1}</span>
                        <button type="button" onClick={() => removeItem(idx)} className="text-[#D16969] hover:text-[#a44b4b]">
                          <i className="bx bx-x"></i>
                        </button>
                      </span>
                    );
                  })}
                  {selectedCount === 0 && (
                    <span className="text-xs text-[#7A6B46]">Aún no seleccionas dotaciones para este kit.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={saving}
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B39237] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-[#B39237] hover:to-[#9C7F2F] disabled:opacity-60"
              >
                <i className="bx bx-save" />
                {saving ? 'Guardando…' : editingKitId ? 'Actualizar kit' : 'Registrar kit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNombre('');
                  setIdArea('');
                  setItems([]);
                  setQuery('');
                  setEditingKitId(null);
                  setViewKitId(null);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#F1E5C3] px-6 py-3 text-sm font-semibold text-[#7A6B46] hover:bg-[#FFF4DA]"
              >
                <i className="bx bx-eraser" />
                Limpiar formulario
              </button>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F1E5C3] px-3 py-2 text-xs text-[#7A6B46]">
                <i className="bx bx-cube"></i>
                {selectedCount} ítem{selectedCount === 1 ? '' : 's'} listos
              </span>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-[#F1E5C3] bg-white/95 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B39237]">Catálogo de kits</p>
            <h3 className="text-xl font-semibold text-[#2B1F0F]">{totalKits} kits registrados</h3>
            <p className="text-xs text-[#7A6B46]">Administra su estado y revisa sus componentes.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7A6B46]">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F1E5C3] px-3 py-1.5">
              <i className="bx bx-layer"></i>
              {totalKits} kits
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F1E5C3] px-3 py-1.5">
              <i className="bx bx-check-shield"></i>
              {activeKits} activos
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {(Array.isArray(kits) ? kits : []).map(k => {
            const isOpen = viewKitId === k.id_kit;
            return (
              <div key={k.id_kit} className="rounded-2xl border border-[#F1E5C3] bg-white shadow-sm">
                <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#B39237]">
                      <span>Kit #{k.id_kit}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4DA] px-2 py-0.5 text-[#7A6B46]">
                        <i className="bx bx-buildings" />
                        {k.nombre_area || 'Área sin asignar'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-[#2B1F0F]">{k.nombre}</h4>
                    <p className="text-xs text-[#7A6B46]">{k.items_count} ítem{k.items_count === 1 ? '' : 's'} configurados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleView(k.id_kit)}
                      title={isOpen ? 'Ocultar detalles' : 'Ver detalles'}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F1E5C3] text-[#B39237] hover:bg-[#FFF4DA]"
                    >
                      <i className={`bx ${isOpen ? 'bx-collapse' : 'bx-show'} text-xl`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(k.id_kit)}
                      title="Editar"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F1E5C3] text-[#B39237] hover:bg-[#FFF4DA]"
                    >
                      <i className="bx bx-edit text-xl" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id_kit)}
                      title="Eliminar"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FFE4DD] bg-[#FFF5F2] text-[#D16969] hover:bg-[#FFE0E0]"
                    >
                      <i className="bx bx-trash text-xl" />
                    </button>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${Number(k.activo) === 1 ? 'bg-[#F7F2E0] text-[#9C7F2F]' : 'bg-gray-100 text-gray-600'}`}>
                      <i className={`bx ${Number(k.activo) === 1 ? 'bx-run' : 'bx-pause'}`} />
                      {Number(k.activo) === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#F1E5C3] bg-[#FFFEFB] px-4 py-4">
                    {loadingDetails && !detailsCache[k.id_kit] ? (
                      <div className="py-6 text-center text-sm text-[#7A6B46]">Cargando detalles…</div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-[#F1E5C3] bg-white/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#B39237]">Metadatos</p>
                          <dl className="mt-3 space-y-2 text-sm text-[#4B3A1F]">
                            <div className="flex items-center justify-between">
                              <dt>ID</dt>
                              <dd className="font-semibold text-[#2B1F0F]">#{k.id_kit}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt>Área</dt>
                              <dd className="font-semibold text-[#2B1F0F]">{k.nombre_area || '—'}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                              <dt>Estado</dt>
                              <dd className="font-semibold text-[#2B1F0F]">{Number(k.activo) === 1 ? 'Activo' : 'Inactivo'}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="lg:col-span-2 rounded-2xl border border-[#F1E5C3] bg-white/80">
                          <div className="border-b border-[#F1E5C3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#B39237]">Dotaciones incluidas</div>
                          <div className="max-h-64 overflow-auto divide-y divide-[#F3E6C4]">
                            {(detailsCache[k.id_kit] || []).length > 0 ? (
                              (detailsCache[k.id_kit] || []).map((d, idx) => (
                                <div key={idx} className="flex items-center justify-between px-4 py-2 text-sm text-[#2B1F0F]">
                                  <span>{d.nombre_dotacion || `ID ${d.id_dotacion}`}</span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4DA] px-3 py-0.5 text-xs font-semibold text-[#B39237]">
                                    <i className="bx bx-box" />
                                    {d.cantidad ?? 1}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-6 text-center text-sm text-[#7A6B46]">Sin ítems registrados</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {totalKits === 0 && (
            <div className="rounded-2xl border border-dashed border-[#F1E5C3] bg-[#FFFCF4] p-8 text-center text-sm text-[#7A6B46]">
              No hay kits registrados todavía. Utiliza el formulario superior para crear el primero.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default KitManager;
