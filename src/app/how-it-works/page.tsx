import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Search, ShieldCheck, CheckCircle2, DollarSign, Send, Users, Building, Megaphone, Film } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Simple Collaboration</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
          How Marketur Works
        </h1>
        <p className="text-sm text-[#71717A]">
          A clear, structured workflow connecting businesses that need promotion with creators who produce great content.
        </p>
      </div>

      {/* 2 Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. For Businesses */}
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214]">For Businesses</h3>
              <p className="text-xs text-[#71717A]">Brands & Local Stores</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Find a creator', desc: 'Browse creators by category, city, and audience style.' },
              { num: '02', title: 'View their work', desc: 'Watch vertical video reels and past promotional campaigns before deciding.' },
              { num: '03', title: 'Choose a package', desc: 'Pick fixed-price collaboration packages with clear deliverables.' },
              { num: '04', title: 'Send collaboration brief', desc: 'Submit requirements, talking points, and brand guidelines in one place.' },
              { num: '05', title: 'Manage the collaboration', desc: 'Review drafts, request changes, and approve final delivery with confidence.' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#FF5416] bg-[#FFF2EC] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#FFD2C1]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] block font-mono text-sm">{s.title}</strong>
                  <span className="text-[#52525B] mt-0.5 block">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/discover" className="block pt-2">
            <Button variant="primary" size="sm" className="w-full">
              <span>Find Creators Now</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* 2. For Creators */}
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] text-[#121214] flex items-center justify-center border border-[#E5E5DE]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214]">For Creators</h3>
              <p className="text-xs text-[#71717A]">Content Creators</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', title: 'Create your profile', desc: 'Set up your bio, location, and audience details.' },
              { num: '02', title: 'Upload your work', desc: 'Showcase promotional client reels or your own sample demo reels.' },
              { num: '03', title: 'Set your packages', desc: 'Define your collaboration packages, delivery turnaround, and pricing.' },
              { num: '04', title: 'Receive collaboration requests', desc: 'Get structured briefs with committed terms from genuine businesses.' },
              { num: '05', title: 'Deliver the work', desc: 'Upload drafts, incorporate feedback, and receive direct bank payouts.' },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#121214] bg-[#F4F4F0] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#E5E5DE]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] block font-mono text-sm">{s.title}</strong>
                  <span className="text-[#52525B] mt-0.5 block">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup?role=creator" className="block pt-2">
            <Button variant="outline" size="sm" className="w-full">
              <span>Join as a Creator</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
