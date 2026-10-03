import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Smartphone,
  Globe,
  TrendingUp,
  Package,
} from 'lucide-react';

export default function ForBusinessesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Apps, Websites & Products</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Market your app. Reach the right audience through influencers.
        </h1>
        <p className="text-base text-[#52525B] dark:text-zinc-300">
          Discover Indian influencers by niche, audience, reach and budget — and find the right creators to promote your app, website or product.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/discover">
            <Button variant="primary" size="lg">
              <span>Find Influencers</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/signup?role=business">
            <Button variant="outline" size="lg">
              <span>Join as Owner</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#FFF2EC] dark:bg-[#FF5416]/10 border border-[#FFD2C1] dark:border-[#FF5416]/30 text-[#FF5416] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Built for Apps & Software</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Whether launching an Android app on Play Store, an iOS product, or a web SaaS, match with creators whose viewers actively install apps.
          </p>
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-800 text-[#047857] dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">See Real Content First</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Watch short video reels and past promotional campaigns before contacting. Know the video storytelling quality upfront.
          </p>
        </div>

        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded bg-[#F4F4F0] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 text-[#121214] dark:text-white flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Transparent Fixed Packages</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
            Clear pricing starting from ₹1,000. Fixed deliverables, defined turnaround timelines, and revision guarantees without endless DMs.
          </p>
        </div>
      </div>
    </div>
  );
}
