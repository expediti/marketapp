import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Search, ShieldCheck, CheckCircle2, DollarSign, Send, Users, Building, Megaphone } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Step-By-Step Mechanics</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
          How Marketur Works
        </h1>
        <p className="text-sm text-[#71717A]">
          Clear, accountable workflows designed for businesses, independent creators, and marketing agencies.
        </p>
      </div>

      {/* 3 Columns / Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. For Businesses */}
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] pb-4">
            <div className="w-10 h-10 rounded-md bg-[#FFF2EC] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-lg font-bold text-[#121214]">For Businesses</h3>
              <p className="text-[11px] text-[#71717A]">D2C Brands & Local Stores</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Discover & Filter', desc: 'Find creators by city, niche, and engagement.' },
              { num: '02', title: 'Select Rate Card', desc: 'Choose fixed packages like Reels or Stories.' },
              { num: '03', title: 'Submit Brief & Fund', desc: 'Specify Dos, Don’ts, and deposit into Escrow.' },
              { num: '04', title: 'Inspect Delivery', desc: 'Review video draft proof in the order workspace.' },
              { num: '05', title: 'Approve Payment', desc: 'Funds release only when you confirm satisfaction.' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3 text-xs">
                <span className="font-mono font-bold text-[#FF5416] bg-[#FFF2EC] px-1.5 py-0.5 rounded border border-[#FFD2C1]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] block font-mono">{s.title}</strong>
                  <span className="text-[#52525B]">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/discover" className="block pt-2">
            <Button variant="primary" size="sm" className="w-full">
              <span>Find Creators Now</span>
            </Button>
          </Link>
        </div>

        {/* 2. For Creators */}
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] pb-4">
            <div className="w-10 h-10 rounded-md bg-[#F4F4F0] text-[#121214] flex items-center justify-center border border-[#E5E5DE]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-lg font-bold text-[#121214]">For Creators</h3>
              <p className="text-[11px] text-[#71717A]">Verified Influencers</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Connect Account', desc: 'Sync verified metrics. Social handles stay private.' },
              { num: '02', title: 'Build Rate Cards', desc: 'Set pricing, delivery turnaround, and revisions.' },
              { num: '03', title: 'Accept Funded Orders', desc: 'Work only with clients who pre-fund escrow.' },
              { num: '04', title: 'Upload Deliverables', desc: 'Submit proofs directly inside the workspace chat.' },
              { num: '05', title: 'Direct UPI Payout', desc: 'Automatic payment to your bank upon approval.' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3 text-xs">
                <span className="font-mono font-bold text-[#121214] bg-[#F4F4F0] px-1.5 py-0.5 rounded border border-[#E5E5DE]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] block font-mono">{s.title}</strong>
                  <span className="text-[#52525B]">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              <span>Join as Creator</span>
            </Button>
          </Link>
        </div>

        {/* 3. For Promoters / Agencies */}
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] pb-4">
            <div className="w-10 h-10 rounded-md bg-[#ECFDF5] text-[#047857] flex items-center justify-center border border-[#A7F3D0]">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-lg font-bold text-[#121214]">For Agencies</h3>
              <p className="text-[11px] text-[#71717A]">Marketing & Media Planners</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Multi-Creator Rosters', desc: 'Deploy budgets across multiple regional creators.' },
              { num: '02', title: 'Unified Invoicing', desc: 'One GST invoice with 5% transparent fee.' },
              { num: '03', title: 'Escrow Risk Shield', desc: 'Eliminate creator non-delivery risk across campaigns.' },
              { num: '04', title: 'Standardized Assets', desc: 'Consistent vertical video assets formatted to specs.' },
              { num: '05', title: 'Mediation Protection', desc: 'Admin dispute team handles brief deviations.' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3 text-xs">
                <span className="font-mono font-bold text-[#047857] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] block font-mono">{s.title}</strong>
                  <span className="text-[#52525B]">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup" className="block pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              <span>Register Agency</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
