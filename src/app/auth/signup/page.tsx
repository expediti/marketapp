'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Smartphone, Film, Sparkles } from 'lucide-react';

export default function RoleSelectionPage() {
  const roles = [
    {
      id: 'advertiser',
      title: 'Application / Advertiser',
      subtitle: 'Market your mobile app, website, SaaS or product through relevant Indian influencers.',
      badge: 'Apps & Businesses',
      href: '/auth/onboarding/business',
      icon: Smartphone,
      cta: 'Find Influencers',
    },
    {
      id: 'influencer',
      title: 'Influencer / Creator',
      subtitle: 'Showcase your reels, define your audience, create packages, and earn from paid app promotions.',
      badge: 'Creators & Streamers',
      href: '/auth/onboarding/creator',
      icon: Film,
      cta: 'Join as an Influencer',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="text-center space-y-3">
        <span className="editorial-label text-[#FF5416]">Join Market My App</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          What is your goal?
        </h1>
        <p className="text-sm text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
          Market My App connects products needing promotion with creators who produce high-converting short content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.id}
              href={r.href}
              className="group bg-white dark:bg-[#18181B] border-2 border-[#E5E5DE] dark:border-zinc-800 hover:border-[#FF5416] dark:hover:border-[#FF5416] rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-lg bg-[#F4F4F0] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center text-[#FF5416] group-hover:bg-[#FF5416] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 px-2.5 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700">
                    {r.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white group-hover:text-[#FF5416] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-[#52525B] dark:text-zinc-400 mt-2 leading-relaxed">
                    {r.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-xs font-mono font-semibold text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                <span>{r.cta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center text-xs font-mono text-[#71717A] dark:text-zinc-400">
        Already registered?{' '}
        <Link href="/auth/login" className="text-[#FF5416] font-bold hover:underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
