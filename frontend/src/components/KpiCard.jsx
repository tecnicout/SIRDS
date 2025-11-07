import React, { useEffect, useRef, useState } from 'react';

const formatNumber = (n) => {
  if (typeof n !== 'number' || isNaN(n)) return n;
  try { return n.toLocaleString(); } catch { return String(n); }
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const KpiCard = ({ title, value, icon, color, duration = 1800 }) => {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof value !== 'number') { setDisplay(value); return; }
    // Reiniciar a 0 y animar hasta el valor actual
    const start = performance.now();
    const from = 0;
    const to = value;
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? formatNumber(display) : display}
          </p>
          <p className="text-gray-600 text-sm mt-1">
            {title}
          </p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center shadow-lg`}>
          <i className={`bx ${icon} text-white text-2xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;