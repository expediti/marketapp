'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Building2, Megaphone } from 'lucide-react';

export default function RoleSelectionPage() {
  const roles = [
    {
      id: 'creator',
      title: 'Creator',
      subtitle: 'Turn your audience into paid collaborations.',
      badge: 'Instagram Influencers',
      href: '/auth/onboarding/creator',
      icon: Sparkles,
      color: 'border-[#121214]',
    },
    {
      id: 'business',
      title: 'Business',
      subtitle: 'Find creators who already speak to your customers.',
      badge: 'D2C & Local Brands',
      href: '/auth/onboarding/business',
      icon: Building2,
      color: 'border-[#FF5416]',
    },
    {
      id: 'promoter',
      title: 'Promoter / Agency',
      subtitle: 'Manage creator campaigns for brands and clients.',
      badge: 'Marketing Agencies',
      href: '/auth/onboarding/business?role=promoter',
      icon: Megaphone,
      color: 'border-[#121214]',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      <div className="text-center space-y-3">
        <span className="editorial-label text-[#FF5416]">Join Marketur</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
          What brings you here?
        </h1>
        <p className="text-sm text-[#71717A] max-w-md mx-auto">
          Select your primary role to configure your collaboration workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.id}
              href={r.href}
              className="retro-card group bg-white border-2 border-[#E5E5DE] hover:border-[#121214] rounded-xl p-6 sm:p-7 flex flex-col justify-between transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-md bg-[#F4F4F0] border border-[#E5E5DE] flex items-center justify-center text-[#FF5416] group-hover:bg-[#FF5416] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#F4F4F0] text-[#71717A] px-2 py-0.5 rounded border border-[#E5E5DE]">
                    {r.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-mono text-xl font-bold text-[#121214] group-hover:text-[#FF5416] transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-[#52525B] mt-2 leading-relaxed">
                    {r.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#ECECE6] flex items-center justify-between text-xs font-mono font-semibold text-[#121214] group-hover:text-[#FF5416]">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center text-xs font-mono text-[#71717A]">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#121214] font-bold underline">
          Log In
        </Link>
      </div>
    </div>
  );
}
