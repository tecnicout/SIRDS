import React from 'react';

export default function CardPanel({ title, icon = 'bx-folder', actions = null, children, padded = true }) {
  return (
    <section className="bg-white rounded-2xl shadow-md ring-1 ring-[#E2BE69]/30 overflow-hidden">
      {(title || actions) && (
        <header className="px-5 py-4 border-b border-[#F0E3B5] flex items-center justify-between bg-white/80">
          <h2 className="flex items-center gap-2 text-[#6F581B] font-semibold">
            <i className={`bx ${icon} text-[#B39237] text-xl`}></i>
            {title}
          </h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}
