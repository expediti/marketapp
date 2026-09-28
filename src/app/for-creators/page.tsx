import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, DollarSign, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ForCreatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Instagram Creators</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] tracking-tight leading-tight">
          Turn your audience into guaranteed paid collaborations.
        </h1>
        <p className="text-base text-[#52525B]">
          No more chasing invoices, unpaid client revisions, or awkward fee negotiations in your DMs.
        </p>
        <div className="pt-2">
          <Link href="/auth/onboarding/creator">
            <Button variant="primary" size="lg">
              <span>Connect Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">100% Pre-Funded Escrow</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            Brands must deposit the complete collaboration package into Marketur escrow before you start filming.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#FFF2EC] border border-[#FFD2C1] text-[#FF5416] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">Total Handle Privacy</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            Your personal Instagram handle is protected. Brands evaluate you on your verified analytics and work samples.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#F4F4F0] border border-[#E5E5DE] text-[#121214] flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">Instant UPI Payouts</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            The moment the business approves your delivery proof, funds settle directly to your Indian bank VPA.
          </p>
        </div>
      </div>
    </div>
  );
}
