import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, DollarSign, Radio, Film, Users, MessageSquare } from 'lucide-react';

export default function ForCreatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Creators & Community Leaders</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Monetize your audience with direct, paid promotion briefs.
        </h1>
        <p className="text-base text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
          Showcase your content samples, define your audience reach, set fixed package pricing, and receive verified promotion briefs from genuine developers, founders, and businesses.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/auth/signup?role=creator">
            <Button variant="primary" size="lg">
              <span>Join as Distribution Partner</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/onboarding/creator">
            <Button
              variant="outline"
              size="lg"
              className="border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]"
            >
              <span>Complete Partner Onboarding</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-[#FF5416] flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Showcase Your Content & Reach
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Upload sample video reels or community highlights demonstrating your presentation style, audience demographics, and format.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46] text-[#047857] dark:text-[#34D399] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Explicit Briefs & No Scope Creep
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Businesses submit explicit campaign goals, product links, and talking points before you start. Chat unlocks only after you accept.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-[#1F1F23] border border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Direct & Protected Payouts
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Upon content delivery and business approval, funds settle securely to your Indian bank account or UPI ID without chasing invoices.
          </p>
        </div>
      </div>
    </div>
  );
}
