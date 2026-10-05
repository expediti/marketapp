import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck, ArrowRight, Wallet, CheckCircle2, Zap } from 'lucide-react';

export const metadata = {
  title: 'Pricing | Market My Idea',
  description:
    'Transparent pricing with zero subscription fees. Pay only when a collaboration deal happens with Market My Idea.',
};

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Transparent Platform Economics</span>
        <h1 className="font-mono text-3xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          No Subscriptions. Pay Only When Deals Happen.
        </h1>
        <p className="text-sm sm:text-base text-[#52525B] dark:text-zinc-300">
          Market My Idea doesn&apos;t charge recurring subscription fees or upfront listing charges. You only pay when a deal happens.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* For Businesses */}
        <div className="bg-white dark:bg-[#18181B] border-2 border-[#121214] dark:border-[#FF5416] rounded-xl p-8 space-y-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="editorial-label text-[#FF5416]">For Businesses</span>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white mt-2">
                Free to Browse <span className="text-xs font-normal text-[#71717A] dark:text-zinc-400 block mt-1">+ 6% Platform Fee at Checkout</span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-3 leading-relaxed">
                Browse influencer profiles and packages for free. Pay only for the package you select with transparent fees.
              </p>
            </div>

            <ul className="space-y-3 text-xs text-[#27272A] dark:text-zinc-200 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Browse verified influencer profiles & packages for free</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Pay only for the package you select (e.g., &quot;1 Reel + 2 Stories&quot;)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Small 6% platform fee added at checkout, clearly shown before you pay</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>No hidden charges, recurring retainers, or agency overhead</span>
              </li>
            </ul>
          </div>

          <Link href="/discover" className="block pt-4">
            <Button variant="primary" size="md" className="w-full">
              <span>Find Influencers</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* For Creators */}
        <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400">For Creators</span>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white mt-2">
                Free to Join <span className="text-xs font-normal text-[#71717A] dark:text-zinc-400 block mt-1">6% Platform Fee on Completed Payouts</span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-3 leading-relaxed">
                Creating a profile and listing packages is completely free. You set your own rates and keep the vast majority of your deal earnings.
              </p>
            </div>

            <ul className="space-y-3 text-xs text-[#27272A] dark:text-zinc-200 font-mono">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Creating a profile and listing packages is 100% free</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>You set your own rates and delivery timeframes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>6% platform fee deducted only when an order completes</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[#047857] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Always see your exact net payout before accepting any deal</span>
              </li>
            </ul>
          </div>

          <Link href="/auth/signup?role=influencer" className="block pt-4">
            <Button variant="secondary" size="md" className="w-full">
              <span>Join as Creator</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* How Payment Works Section */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 space-y-6">
        <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
          <span className="editorial-label text-[#FF5416]">Transaction Architecture</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white mt-1">
            How Payment Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-mono text-xs font-bold flex items-center justify-center">
              1
            </div>
            <h4 className="font-mono text-xs font-bold text-[#121214] dark:text-white">Confirm Deal</h4>
            <p className="text-[11px] text-[#52525B] dark:text-zinc-300 leading-relaxed">
              You agree on a package, deliverable details, and price with the other party.
            </p>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-mono text-xs font-bold flex items-center justify-center">
              2
            </div>
            <h4 className="font-mono text-xs font-bold text-[#121214] dark:text-white">Pay Upfront</h4>
            <p className="text-[11px] text-[#52525B] dark:text-zinc-300 leading-relaxed">
              The business pays upfront safely through Market My Idea before creator production starts.
            </p>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-mono text-xs font-bold flex items-center justify-center">
              3
            </div>
            <h4 className="font-mono text-xs font-bold text-[#121214] dark:text-white">Protected Hold</h4>
            <p className="text-[11px] text-[#52525B] dark:text-zinc-300 leading-relaxed">
              Payment is held safely by the platform until the creator delivers and work is confirmed.
            </p>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 space-y-2">
            <div className="w-7 h-7 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-mono text-xs font-bold flex items-center justify-center">
              4
            </div>
            <h4 className="font-mono text-xs font-bold text-[#121214] dark:text-white">Direct Payout</h4>
            <p className="text-[11px] text-[#52525B] dark:text-zinc-300 leading-relaxed">
              The creator is paid out directly to their verified bank account or UPI VPA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
