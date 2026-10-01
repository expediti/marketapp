import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Transparent Platform Economics</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
          Simple 5% Platform Fee. Zero Retainers.
        </h1>
        <p className="text-sm text-[#71717A]">
          No monthly subscription charges or hidden agency markups. We charge a flat fee per successful platform collaboration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Businesses */}
        <div className="bg-white border-2 border-[#121214] rounded-xl p-8 space-y-6 shadow-sm">
          <div>
            <span className="editorial-label text-[#FF5416]">For Businesses & Brands</span>
            <div className="font-mono text-4xl font-extrabold text-[#121214] mt-2">
              5% <span className="text-sm font-normal text-[#71717A]">per collaboration</span>
            </div>
            <p className="text-xs text-[#52525B] mt-2">
              Added directly to the package checkout at payment time.
            </p>
          </div>

          <ul className="space-y-3 text-xs text-[#27272A] font-mono">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Protected Collaboration Workflow</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Verified Creator Demographics & Engagement</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Structured Briefs & Order-Specific Chat</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Dispute Mediation Service</span>
            </li>
          </ul>

          <Link href="/discover" className="block pt-2">
            <Button variant="primary" size="md" className="w-full">
              <span>Find Creators</span>
            </Button>
          </Link>
        </div>

        {/* Creators */}
        <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-xl p-8 space-y-6">
          <div>
            <span className="editorial-label text-[#71717A]">For Creators</span>
            <div className="font-mono text-4xl font-extrabold text-[#121214] mt-2">
              5% <span className="text-sm font-normal text-[#71717A]">payout settlement</span>
            </div>
            <p className="text-xs text-[#52525B] mt-2">
              Deducted automatically when collaboration funds are settled to your bank.
            </p>
          </div>

          <ul className="space-y-3 text-xs text-[#27272A] font-mono">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Zero Upfront Listing Fees</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Committed Client Orders</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Direct Bank UPI Disbursements</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#047857]" />
              <span>Instagram Handle Confidentiality</span>
            </li>
          </ul>

          <Link href="/auth/signup" className="block pt-2">
            <Button variant="secondary" size="md" className="w-full">
              <span>Join as Creator</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-[#71717A] max-w-xl mx-auto leading-relaxed">
        Note: Exact processing gateways and applicable payment settlement charges may vary depending on the production payment provider (Razorpay / Cashfree / Bank IMPS).
      </div>
    </div>
  );
}
