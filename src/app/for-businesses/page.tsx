import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, MapPin, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function ForBusinessesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Brands & Local Businesses</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] tracking-tight leading-tight">
          Find creators who already speak to your actual customers.
        </h1>
        <p className="text-base text-[#52525B]">
          Filter by regional city, audience percentage, and verified portfolio work. Collaborate with transparent packages and protected workflows.
        </p>
        <div className="pt-2">
          <Link href="/discover">
            <Button variant="primary" size="lg">
              <span>Find Creators</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#FFF2EC] border border-[#FFD2C1] text-[#FF5416] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">Targeted Regional Reach</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            Ensure your budget reaches real prospective customers. Discover creators whose audiences actually live in your target city.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">Protected Collaboration</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            Clear campaign briefs, agreed delivery milestones, and structured review processes protect both your time and investment.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#F4F4F0] border border-[#E5E5DE] text-[#121214] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214]">Clear Fixed Packages</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            No negotiation friction. Choose predefined packages with explicit deliverables, turnaround times, and revisions.
          </p>
        </div>
      </div>
    </div>
  );
}
