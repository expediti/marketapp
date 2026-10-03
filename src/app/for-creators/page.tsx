import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, DollarSign, Lock, Sparkles, CheckCircle2, Film } from 'lucide-react';

export default function ForCreatorsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Indian Influencers & Creators</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Turn your short-form content into paid app promotions.
        </h1>
        <p className="text-base text-[#52525B] dark:text-zinc-300">
          Show your portfolio reels, define your audience, set transparent package pricing, and work with genuine applications, websites, and products.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/auth/signup?role=creator">
            <Button variant="primary" size="lg">
              <span>Join as Influencer</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/onboarding/creator">
            <Button variant="outline" size="lg">
              <span>Complete Influencer Onboarding</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#FFF2EC] dark:bg-[#FF5416]/10 border border-[#FFD2C1] dark:border-[#FF5416]/30 text-[#FF5416] flex items-center justify-center">
            <Film className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Showcase Your Reels</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Upload short video reels (up to 19 MB) demonstrating your app demo format, presentation quality, and on-camera storytelling.
          </p>
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-800 text-[#047857] dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Clear Requirements & Briefs</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Advertisers submit explicit campaign goals, app download links, and deadlines before you start filming. No unpaid scope creep.
          </p>
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#F4F4F0] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 text-[#121214] dark:text-white flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Direct Indian Payouts</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Upon content delivery and advertiser approval, funds settle securely to your Indian bank account or UPI ID without chasing invoices.
          </p>
        </div>
      </div>
    </div>
  );
}
