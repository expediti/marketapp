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
  Radio,
  Users,
  Building,
} from 'lucide-react';

export default function ForBusinessesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="space-y-4 max-w-2xl">
        <span className="editorial-label text-[#FF5416]">For Developers, Founders & Businesses</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Find the audience that already exists for what you built.
        </h1>
        <p className="text-base text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
          Big agencies aren&apos;t built for everyone. Discover verified creators and communities by niche, location, reach and fixed budget — without agency-scale marketing budgets.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/discover">
            <Button variant="primary" size="lg">
              <span>Find Your Audience</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/signup?role=business">
            <Button
              variant="outline"
              size="lg"
              className="border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]"
            >
              <span>Join as Business / Founder</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-[#FF5416] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Built for Apps, SaaS & Local Businesses
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Whether launching an Android/iOS app, a web product, or a local service, match with partners whose viewers and members fit your target demographic.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46] text-[#047857] dark:text-[#34D399] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Protected Milestone Payments
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Funds are held safely by the platform and released only when you review and approve the submitted distribution delivery.
          </p>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-[#1F1F23] border border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Transparent Fixed Packages
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Clear pricing, defined turnaround timelines, and revision guarantees without endless DMs or hidden retainers.
          </p>
        </div>
      </div>
    </div>
  );
}
