import React from 'react';

// Mapa simple de colores de acento basado en la paleta dorada del proyecto
const colorTone = {
  primary: {
    ring: 'ring-[#E2BE69]/40',
    bg: 'from-[#FFF8E6] via-white to-[#FFF2CC]',
    text: 'text-[#6F581B]',
    icon: 'text-[#B39237]'
  },
  secondary: {
    ring: 'ring-[#B39237]/30',
    bg: 'from-white via-[#FCF7EA] to-white',
    text: 'text-[#7A6B46]',
    icon: 'text-[#D4AF37]'
  }
};

export default function ResourceHeader({
  title,
  subtitle,
  stats = [],
  action = null,
  tone = 'primary'
}) {
  const t = colorTone[tone] || colorTone.primary;
  return (
    // min-h fija para que todos los banners ocupen el mismo alto en los módulos
    <div className={`relative overflow-hidden rounded-2xl shadow-md ring-1 ${t.ring} bg-gradient-to-br ${t.bg} mb-6 min-h-[170px]`}>
      {/* Decoración sutil */}
      <div className="absolute -top-8 -left-8 w-40 h-40 bg-[#E2BE69]/20 rounded-full blur-2xl"/>
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-[#B39237]/10 rounded-full blur-2xl"/>

      <div className="relative p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <h1 className={`flex items-center gap-2 text-2xl font-bold tracking-tight ${t.text}`}>
              <i className={`bx bx-layer ${t.icon} text-2xl`}></i>
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-[#6F581B]/70">{subtitle}</p>
            )}
          </div>

          {/* Acciones */}
          {action && (
            <div className="ml-auto">{action}</div>
          )}
        </div>

        {/* Métricas */}
        {stats.length > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-xs rounded-xl ring-1 ring-[#E2BE69]/30 px-4 py-3 shadow-sm flex items-center gap-3 min-h-[56px]">
                <div className="w-10 h-10 rounded-lg bg-[#FFF3CC] text-[#B39237] flex items-center justify-center shadow-inner">
                  <i className={`bx ${s.icon || 'bx-data'} text-xl`}></i>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#7A6B46] truncate">{s.label}</div>
                  <div className="text-lg font-extrabold text-[#6F581B]">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
