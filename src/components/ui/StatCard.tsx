import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: string;
  trend?: string;
}

export function StatCard({ label, value, subtext, badge, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="editorial-label text-[#71717A] dark:text-[#A1A1AA]">{label}</span>
        {badge && (
          <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] dark:bg-zinc-800 text-[#52525B] dark:text-zinc-300 px-1.5 py-0.5 rounded border border-[#E5E5DE] dark:border-zinc-700">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-bold font-mono text-[#121214] dark:text-white tracking-tight">
        {value}
      </div>
      {(subtext || trend) && (
        <div className="mt-2 text-xs text-[#71717A] dark:text-zinc-400 flex items-center justify-between">
          <span>{subtext}</span>
          {trend && <span className="font-mono text-[#FF5416] font-semibold">{trend}</span>}
        </div>
      )}
    </div>
  );
}
