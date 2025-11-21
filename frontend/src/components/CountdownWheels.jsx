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
    <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
      {units.map(({ key, label }) => {
        const value = timeLeft[key];
        const upperLimit = maxByUnit[key];
        const previous = upperLimit ? (value + 1) % upperLimit : value + 1;
        const next = Math.max(value - 1, 0);

        return (
          <div key={key} className="flex flex-col items-center gap-1 text-center">
            <div
              className="relative flex w-9 sm:w-10 flex-col items-center justify-between overflow-hidden rounded-[14px] border border-[#EAD9A1] bg-gradient-to-b from-white via-[#FDF6E7] to-[#E4C982] px-1.5 py-1.5 text-[11px] font-black uppercase tracking-tight text-[#111] shadow-[0_6px_14px_rgba(0,0,0,0.1)]"
              style={{
                height: '64px',
                perspective: '620px'
              }}
            >
              <span className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/60" />
              <span className="pointer-events-none absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/60 via-transparent to-[#D4AF37]/20" />
              <span className="pointer-events-none absolute inset-x-2 top-1.5 h-1 rounded-full bg-white/80 blur-md" />
              <span className="pointer-events-none absolute inset-x-2 bottom-1.5 h-1 rounded-full bg-[#D4AF37]/40 blur-lg" />

              <div className="relative flex w-full flex-col items-center text-[#B0841F]/60" style={{ transform: 'rotateX(8deg)' }}>
                <span className="text-[0.6rem] font-semibold drop-shadow-[0_3px_8px_rgba(212,175,55,0.25)]">
                  {formatValue(previous)}
                </span>
              </div>

              <div className="relative flex w-full flex-col items-center" style={{ transform: 'translateZ(10px)' }}>
                <span className="text-sm sm:text-base font-black text-[#0D0D0D] drop-shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                  {formatValue(value)}
                </span>
              </div>

              <div className="relative flex w-full flex-col items-center text-[#B0841F]/60" style={{ transform: 'rotateX(-8deg)' }}>
                <span className="text-[0.6rem] font-semibold drop-shadow-[0_-3px_8px_rgba(212,175,55,0.25)]">
                  {formatValue(next)}
                </span>
              </div>

              <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/45" />
              <span className="pointer-events-none absolute inset-x-0 bottom-1/3 h-px bg-[#D4AF37]/3" />
            </div>
            <p className="text-[0.35rem] sm:text-[0.42rem] font-semibold uppercase tracking-[0.28em] text-[#1F1F1F] opacity-80">
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default CountdownWheels;
