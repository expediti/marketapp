import React from 'react';
import { OrderBrief } from '@/types/marketplace';
import { Calendar, FileText, CheckCircle, XCircle, Info } from 'lucide-react';

interface OrderBriefViewProps {
  brief?: OrderBrief;
  packageName?: string;
  totalAmount: number;
}

export function OrderBriefView({ brief, packageName, totalAmount }: OrderBriefViewProps) {
  if (!brief) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 text-sm text-[#71717A] dark:text-zinc-400">
        No campaign brief provided.
      </div>
    );
  }

  const formattedDeadline = new Date(brief.deadline).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#ECECE6] dark:border-zinc-800">
        <div>
          <span className="editorial-label text-[#71717A] dark:text-zinc-400">Collaboration Brief</span>
          <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white mt-0.5">
            {packageName || 'Deliverable Package'}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#71717A] dark:text-zinc-400">
            <Calendar className="w-4 h-4 text-[#FF5416]" />
            <span>Deadline: <strong className="text-[#121214] dark:text-white">{formattedDeadline}</strong></span>
          </div>
          <div className="bg-[#FFF2EC] dark:bg-orange-950/40 text-[#FF5416] dark:text-orange-400 px-2.5 py-1 rounded-lg font-bold border border-[#FFD2C1] dark:border-orange-900/60">
            ₹{totalAmount.toLocaleString('en-IN')} Order Value
          </div>
        </div>
      </div>

      {/* Campaign Objective */}
      <div>
        <h4 className="editorial-label text-[#121214] dark:text-zinc-200 flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-[#FF5416]" />
          Campaign Objective
        </h4>
        <p className="text-sm text-[#27272A] dark:text-zinc-300 leading-relaxed bg-[#FBFBFA] dark:bg-zinc-950/60 p-3.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
          {brief.objective}
        </p>
      </div>

      {/* Deliverable Requirements */}
      <div>
        <h4 className="editorial-label text-[#121214] dark:text-zinc-200 mb-2">Key Requirements & Talking Points</h4>
        <p className="text-sm text-[#27272A] dark:text-zinc-300 leading-relaxed bg-[#FBFBFA] dark:bg-zinc-950/60 p-3.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 whitespace-pre-line">
          {brief.requirements}
        </p>
      </div>

      {/* Dos & Don'ts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dos */}
        <div className="bg-[#F0FDF4] dark:bg-emerald-950/30 border border-[#BBF7D0] dark:border-emerald-900/60 rounded-lg p-4">
          <h5 className="editorial-label text-[#15803D] dark:text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
            Brand Dos
          </h5>
          <p className="text-xs text-[#166534] dark:text-emerald-300 leading-relaxed whitespace-pre-line">
            {brief.dos || 'Adhere strictly to agreed aesthetic guidelines.'}
          </p>
        </div>

        {/* Don'ts */}
        <div className="bg-[#FEF2F2] dark:bg-red-950/30 border border-[#FECACA] dark:border-red-900/60 rounded-lg p-4">
          <h5 className="editorial-label text-[#B91C1C] dark:text-red-400 flex items-center gap-1.5 mb-2">
            <XCircle className="w-3.5 h-3.5 text-[#B91C1C] dark:text-red-400" />
            Brand Don&apos;ts
          </h5>
          <p className="text-xs text-[#991B1B] dark:text-red-300 leading-relaxed whitespace-pre-line">
            {brief.donts || 'Avoid comparing directly with competitors or off-brand claims.'}
          </p>
        </div>
      </div>

      {/* Additional Notes / Shipping Info */}
      {brief.additional_notes && (
        <div className="bg-[#F4F4F0] dark:bg-zinc-800/60 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-3.5 text-xs text-[#52525B] dark:text-zinc-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#71717A] dark:text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#121214] dark:text-white block mb-0.5">Fulfillment & Logistics Note:</span>
            {brief.additional_notes}
          </div>
        </div>
      )}
    </div>
  );
}
