import React from 'react';

const dotacionData = [
  { id: '13', name: 'Bata desechable', category: 'Elementos de Protección', price: 0 },
  { id: '11', name: 'Botas Punta de Acero', category: 'Calzado de Seguridad', price: 130000 },
  { id: '1', name: 'Camisa Polo Empresa', category: 'Uniformes', price: 35000 },
  { id: '9', name: 'Camisón Térmico', category: 'Uniformes', price: 40000 },
  { id: '4', name: 'Casco de Seguridad', category: 'Elementos de Protección', price: 25000 },
  { id: '6', name: 'Chaleco Reflectivo', category: 'Elementos de Protección', price: 18000 },
  { id: '7', name: 'Gafas de Seguridad', category: 'Elementos de Protección', price: 12000 },
  { id: '5', name: 'Guantes de Seguridad', category: 'Elementos de Protección', price: 8000 },
  { id: '8', name: 'Overol Industrial', category: 'Uniformes', price: 85000 },
  { id: '10', name: 'Pantalón Jean Industrial', category: 'Uniformes', price: 65000 },
  { id: '10', name: 'Pantalón Térmico', category: 'Uniformes', price: 45000 },
  { id: '14', name: 'sfgstery', category: 'Accesorios', price: 0 },
  { id: '12', name: 'Tapabocas', category: 'Elementos de Protección', price: 2000 },
  { id: '3', name: 'Zapatos de Seguridad', category: 'Calzado de Seguridad', price: 120000 }
];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2
});

const DotacionReportShowcase = () => {
  const subtotal = dotacionData.reduce((acc, item) => acc + item.price, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <section className="bg-[#F5F7FB] py-16 px-4">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-slate-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#5D7DAA]">Documento maestro</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-tight text-[#1D3C6A]">REPORTE DE DOTACIÓN EMPRESARIAL</h2>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              Consolidado de dotaciones entregadas por categoría para seguimiento presupuestal. Completa los campos de
              verificación y utiliza la tabla para validar cantidades, valores unitarios y responsables de entrega.
            </p>
          </div>
          <div className="flex h-24 w-40 items-center justify-center rounded-2xl border border-dashed border-[#9CB9DF] text-xs font-semibold uppercase text-slate-500">
            Espacio para logotipo
          </div>
        </div>

        <div className="mt-8 grid gap-6 rounded-3xl border border-[#D9E5F5] bg-[#F9FCFF] p-6 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6A86B5]">Coordinador</p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900">
              ________________________
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6A86B5]">Área solicitante</p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900">
              ________________________
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[#6A86B5]">Fecha de corte</p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900">
              ____ / ____ / ______
            </div>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-[#D9E5F5]">
          <div className="grid grid-cols-12 bg-[#E6F0FB] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-[#175186]">
            <div className="col-span-2 px-4 py-4">ID Dotación</div>
            <div className="col-span-4 px-4 py-4">Nombre Dotación</div>
            <div className="col-span-4 px-4 py-4">Categoría</div>
            <div className="col-span-2 px-4 py-4 text-right">Precio Unitario</div>
          </div>
          <div className="divide-y divide-[#EEF3FB] bg-white">
            {dotacionData.map((item, index) => (
              <div key={`${item.id}-${index}`} className="grid grid-cols-12 text-sm text-slate-600">
                <div className="col-span-2 px-4 py-4 font-semibold text-slate-900">{item.id}</div>
                <div className="col-span-4 px-4 py-4 text-slate-700">{item.name}</div>
                <div className="col-span-4 px-4 py-4 text-slate-500">{item.category}</div>
                <div className="col-span-2 px-4 py-4 text-right font-semibold text-[#1F4D7A]">
                  {currencyFormatter.format(item.price)}
                </div>
              </div>
            ))}
            {/* Líneas en blanco para nuevas dotaciones */}
            {[...Array(4)].map((_, index) => (
              <div key={`blank-${index}`} className="grid grid-cols-12 text-sm text-slate-400">
                <div className="col-span-2 px-4 py-4">—</div>
                <div className="col-span-4 px-4 py-4">—</div>
                <div className="col-span-4 px-4 py-4">—</div>
                <div className="col-span-2 px-4 py-4 text-right">—</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 md:flex-row">
          <div className="flex-1 rounded-[28px] border border-[#D9E5F5] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EDF4FF] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6A86B5]">Observaciones Generales</p>
            <div className="mt-3 h-28 rounded-2xl border border-dashed border-[#C8D8F0] bg-white/80" />
          </div>
          <div className="w-full md:w-80">
            <div className="rounded-[28px] border border-[#D9E5F5] bg-white p-6 shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6A86B5] text-right">Totales</p>
              <dl className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <dt>Subtotal dotación</dt>
                  <dd className="font-semibold text-[#1F4D7A]">{currencyFormatter.format(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <dt>Impuestos estimados (16%)</dt>
                  <dd className="font-semibold text-[#1F4D7A]">{currencyFormatter.format(iva)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-[#D9E5F5] pt-4 text-base font-black text-[#1D3C6A]">
                  <dt>Total dotación</dt>
                  <dd>{currencyFormatter.format(total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DotacionReportShowcase;
