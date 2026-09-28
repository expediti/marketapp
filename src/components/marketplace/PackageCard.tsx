import React from 'react';
import Link from 'next/link';
import { CreatorPackage } from '@/types/marketplace';
import { Clock, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';

interface PackageCardProps {
  pkg: CreatorPackage;
  creatorId: string;
}

export function PackageCard({ pkg, creatorId }: PackageCardProps) {
  return (
    <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 flex flex-col justify-between hover:border-[#121214]/40 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="font-mono text-lg font-bold text-[#121214] tracking-tight">
            {pkg.name}
          </h4>
          <span className="font-mono text-xl font-bold text-[#FF5416]">
            ₹{pkg.price.toLocaleString('en-IN')}
          </span>
        </div>

        <p className="text-xs text-[#52525B] leading-relaxed mb-6">
          {pkg.description}
        </p>

        <div className="space-y-2 py-4 border-t border-[#ECECE6] text-xs font-mono text-[#71717A]">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#121214]" />
            <span>Delivery: {pkg.delivery_days} days</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-[#121214]" />
            <span>{pkg.revision_count} {pkg.revision_count === 1 ? 'Revision' : 'Revisions'} included</span>
          </div>
          <div className="flex items-center gap-2 text-[#047857]">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Escrow payment protected</span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Link
          href={`/creators/${creatorId}/buy?packageId=${pkg.id}`}
          className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#FF5416] hover:bg-[#E8460A] py-2.5 px-4 rounded-md shadow-sm transition-colors cursor-pointer"
        >
          <span>Buy Package</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
