import React from 'react';

export default function ResourceHeader({
  title,
  subtitle,
  action = null
}) {
  return (
    <div className="rounded-3xl border border-[#F1E5C3] bg-white/95 shadow-sm">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF4DA] text-[#B39237]">
            <i className="bx bx-layer text-lg" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[#2B1F0F] truncate">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-[#7A6B46]">{subtitle}</p>}
          </div>
        </div>

        {action && (
          <div className="w-full lg:w-auto flex justify-end">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
