import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Zap, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      {/* Editorial Header */}
      <div className="space-y-4">
        <span className="editorial-label text-[#FF5416]">Marketplace Manifesto</span>
        <h1 className="font-mono text-4xl sm:text-5xl font-extrabold text-[#121214] tracking-tight leading-tight">
          Collaborations shouldn&apos;t run on spreadsheets, DMs and guesswork.
        </h1>
        <p className="text-base text-[#52525B] leading-relaxed max-w-2xl">
          Marketur is built around clear creator profiles, defined fixed packages, and protected collaboration escrow.
        </p>
      </div>

      {/* The Problem & The Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="editorial-label text-[#B91C1C]">The Problem</span>
          <h3 className="font-mono text-xl font-bold text-[#121214]">The Influencer Chaos</h3>
          <p className="text-xs text-[#52525B] leading-relaxed">
            In India, brands waste weeks reaching out through unanswered Instagram direct messages. Creators deal with delayed payments, ambiguous campaign expectations, and unpaid revision demands.
          </p>
          <p className="text-xs text-[#52525B] leading-relaxed">
            Brands frequently get burned by manipulated screenshots of analytics and ghosting after sending advance payments.
          </p>
        </div>

        <div className="bg-[#121214] text-white rounded-xl p-8 space-y-4">
          <span className="editorial-label text-[#FF5416]">The Solution</span>
          <h3 className="font-mono text-xl font-bold text-white">The Marketur Architecture</h3>
          <p className="text-xs text-[#D4D4D8] leading-relaxed">
            We transformed influencer marketing into a structured e-commerce transaction marketplace.
          </p>
          <ul className="text-xs text-[#A1A1AA] space-y-2 font-mono">
            <li>• Standardized rate cards and clear deliverables.</li>
            <li>• 100% pre-funded escrow payments held until content approval.</li>
            <li>• Direct API-verified audience reach and demographics.</li>
            <li>• Structured dispute mediation for accountability.</li>
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#F4F4F0] border border-[#E5E5DE] rounded-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-mono text-lg font-bold text-[#121214]">Ready to run your next collaboration?</h3>
          <p className="text-xs text-[#71717A]">Discover creators across Varanasi, Bengaluru, Jaipur, and Mumbai.</p>
        </div>
        <Link href="/discover">
          <Button variant="primary" size="md">
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
