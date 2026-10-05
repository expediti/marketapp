import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2, HeartHandshake } from 'lucide-react';

export const metadata = {
  title: 'About Us | Market My Idea',
  description:
    'Market My Idea connects small businesses, app founders, and local shops with verified Instagram creators for transparent, structured influencer promotion.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      {/* Editorial Header */}
      <div className="space-y-4">
        <span className="editorial-label text-[#FF5416]">About Us</span>
        <h1 className="font-mono text-3xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Built for founders and creators who want real promotion without the chaos.
        </h1>
        <p className="text-base sm:text-lg text-[#52525B] dark:text-zinc-300 leading-relaxed max-w-2xl">
          Market My Idea solves one specific problem: small businesses, app founders, and local shops want real influencer promotion, but the existing options don&apos;t fit them.
        </p>
      </div>

      {/* Core Mission Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 space-y-4 shadow-sm">
          <span className="editorial-label text-[#B91C1C] dark:text-rose-400">The Problem</span>
          <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">Agencies Are Too Expensive, DMs Are Unreliable</h3>
          <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
            Marketing agencies are expensive and built for big brands with massive budgets. Manually DMing influencers on Instagram means no structure, no guarantees, and no accountability if something goes wrong.
          </p>
          <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
            Brands waste hours chasing responses and worrying about ghosting, while creators deal with delayed payments and ambiguous expectations.
          </p>
        </div>

        <div className="bg-[#121214] dark:bg-[#121214] text-white border border-[#27272A] rounded-xl p-8 space-y-4 shadow-sm">
          <span className="editorial-label text-[#FF5416]">The Solution</span>
          <h3 className="font-mono text-xl font-bold text-white">Market My Idea Fixes That</h3>
          <p className="text-xs text-[#D4D4D8] leading-relaxed">
            Businesses can browse verified Instagram creators by location, audience, and niche, agree on clear deliverables and pricing, and get their promotion delivered, tracked, and paid for, all in one place.
          </p>
          <ul className="text-xs text-[#A1A1AA] space-y-2 font-mono">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Browse creators by niche, reach & city</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Agree on clear deliverables & pricing upfront</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Steady stream of real deal opportunities for creators</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Protected milestone flow that protects both sides</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Our Philosophy */}
      <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-[#FF5416]" />
          <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Our Promise</h3>
        </div>
        <p className="text-xs sm:text-sm text-[#52525B] dark:text-zinc-300 leading-relaxed">
          We&apos;re a small, India-based team, and we&apos;re building this platform the way we&apos;d want to use it ourselves: transparent pricing, no hidden fees, and a process that protects both sides of every deal.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-[#F4F4F0] dark:bg-[#1C1C1F] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Ready to explore creators or get deals?</h3>
          <p className="text-xs text-[#71717A] dark:text-zinc-400">Discover top creators across India or join as an influencer today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/discover">
            <Button variant="primary" size="md">
              <span>Browse Creators</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="md">
              <span>Contact Us</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
