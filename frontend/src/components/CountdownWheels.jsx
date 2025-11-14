import React, { useEffect, useState } from 'react';

const units = [
  { key: 'days', label: 'Días' },
  { key: 'hours', label: 'Horas' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'seconds', label: 'Segundos' }
];

const maxByUnit = {
  hours: 24,
  minutes: 60,
  seconds: 60
};

const CountdownWheels = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return undefined;
    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(target - now, 0);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) return null;

  const formatValue = (value) => String(value).padStart(2, '0');

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-center gap-6">
        {units.map(({ key, label }) => {
          const value = timeLeft[key];
          const upperLimit = maxByUnit[key];
          const previous = upperLimit ? (value + 1) % upperLimit : value + 1;
          const next = Math.max(value - 1, 0);

          return (
            <div key={key} className="flex flex-col items-center gap-4 text-center">
              <div
                className="relative flex w-24 sm:w-28 max-w-[140px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-yellow-200/30 bg-gradient-to-b from-orange-200/30 via-zinc-800 to-zinc-950 px-4 py-10 text-3xl font-black uppercase tracking-tight text-orange-100 shadow-[0_25px_55px_rgba(0,0,0,0.65)] sm:py-12"
                style={{
                  height: '220px',
                  perspective: '1200px'
                }}
              >
                <span className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/5" />
                <span className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-yellow-500/5 via-transparent to-yellow-700/70" />
                <span className="pointer-events-none absolute inset-x-4 top-3 h-1 rounded-full bg-white/35 blur-md opacity-70" />
                <span className="pointer-events-none absolute inset-x-4 bottom-3 h-1 rounded-full bg-yellow-700 blur-lg opacity-80" />

                <div className="relative flex w-full flex-col items-center text-orange-100/40" style={{ transform: 'rotateX(8deg)' }}>
                  <span className="text-3xl font-bold drop-shadow-[0_8px_15px_rgba(255,150,0,0.25)]">
                    {formatValue(previous)}
                  </span>
                </div>

                <div className="relative flex w-full flex-col items-center" style={{ transform: 'translateZ(18px)' }}>
                  <span className="text-5xl font-black text-orange-50 drop-shadow-[0_0_28px_rgba(255,176,59,0.85)]">
                    {formatValue(value)}
                  </span>
                </div>

                <div className="relative flex w-full flex-col items-center text-orange-100/40" style={{ transform: 'rotateX(-8deg)' }}>
                  <span className="text-3xl font-bold drop-shadow-[0_-8px_15px_rgba(255,150,0,0.25)]">
                    {formatValue(next)}
                  </span>
                </div>

                <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/10" />
                <span className="pointer-events-none absolute inset-x-0 bottom-1/3 h-px bg-black/30" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.5em] text-black">
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CountdownWheels;
