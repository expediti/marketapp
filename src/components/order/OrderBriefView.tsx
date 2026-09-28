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
      <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 text-sm text-[#71717A]">
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
    <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#ECECE6]">
        <div>
          <span className="editorial-label text-[#71717A]">Collaboration Brief</span>
          <h3 className="font-mono text-lg font-bold text-[#121214] mt-0.5">
            {packageName || 'Deliverable Package'}
          </h3>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#71717A]">
            <Calendar className="w-4 h-4 text-[#FF5416]" />
            <span>Deadline: <strong className="text-[#121214]">{formattedDeadline}</strong></span>
          </div>
          <div className="bg-[#FFF2EC] text-[#FF5416] px-2.5 py-1 rounded font-bold border border-[#FFD2C1]">
            ₹{totalAmount.toLocaleString('en-IN')} Escrow Funded
          </div>
        </div>
      </div>

      {/* Campaign Objective */}
      <div>
        <h4 className="editorial-label text-[#121214] flex items-center gap-1.5 mb-2">
          <FileText className="w-3.5 h-3.5 text-[#FF5416]" />
          Campaign Objective
        </h4>
        <p className="text-sm text-[#27272A] leading-relaxed bg-[#FBFBFA] p-3.5 rounded border border-[#E5E5DE]">
          {brief.objective}
        </p>
      </div>

      {/* Deliverable Requirements */}
      <div>
        <h4 className="editorial-label text-[#121214] mb-2">Key Requirements & Talking Points</h4>
        <p className="text-sm text-[#27272A] leading-relaxed bg-[#FBFBFA] p-3.5 rounded border border-[#E5E5DE] whitespace-pre-line">
          {brief.requirements}
        </p>
      </div>

      {/* Dos & Don'ts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dos */}
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded p-4">
          <h5 className="editorial-label text-[#15803D] flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-[#15803D]" />
            Brand Dos
          </h5>
          <p className="text-xs text-[#166534] leading-relaxed whitespace-pre-line">
            {brief.dos || 'Adhere strictly to agreed aesthetic guidelines.'}
          </p>
        </div>

        {/* Don'ts */}
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded p-4">
          <h5 className="editorial-label text-[#B91C1C] flex items-center gap-1.5 mb-2">
            <XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />
            Brand Don&apos;ts
          </h5>
          <p className="text-xs text-[#991B1B] leading-relaxed whitespace-pre-line">
            {brief.donts || 'Avoid comparing directly with competitors or off-brand claims.'}
          </p>
        </div>
      </div>

      {/* Additional Notes / Shipping Info */}
      {brief.additional_notes && (
        <div className="bg-[#F4F4F0] border border-[#E5E5DE] rounded p-3.5 text-xs text-[#52525B] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#71717A] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#121214] block mb-0.5">Fulfillment & Logistics Note:</span>
            {brief.additional_notes}
          </div>
        </div>
      )}
    </div>
  );
}
