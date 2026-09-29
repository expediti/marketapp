import React from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Sparkles, CheckCircle2, Shield, Video, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { ReelCarousel } from '@/components/marketplace/ReelCarousel';
import { SHOWCASE_REELS } from '@/lib/data/reelsData';
import { INITIAL_CREATORS } from '@/lib/supabase/mockData';

export default function HomePage() {
  const previewCreators = INITIAL_CREATORS.slice(0, 3);

  return (
    <div className="space-y-20 md:space-y-28 pb-20">
      {/* SECTION 1 — HERO */}
      <section className="relative pt-12 md:pt-20 border-b border-[#E5E5DE] pb-20 bg-gradient-to-b from-[#FBFBFA] to-[#F4F4F0]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] border border-[#FFD2C1] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
              <span>CREATOR COLLABORATIONS</span>
            </div>

            {/* Headline */}
            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#121214] leading-[1.1]">
              Find creators to promote your business.
            </h1>

            {/* Supporting text */}
            <p className="text-base sm:text-xl text-[#52525B] max-w-2xl leading-relaxed">
              Discover creators, see their work, choose a collaboration package, and manage the campaign in one place.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/discover">
                <Button variant="primary" size="lg" className="px-6 py-3.5 text-base">
                  <span>Find Creators</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              <Link href="/auth/signup?role=creator">
                <Button variant="secondary" size="lg" className="px-6 py-3.5 text-base">
                  <span>I'm a Creator</span>
                </Button>
              </Link>
            </div>

            {/* Clarification badges */}
            <div className="pt-6 border-t border-[#ECECE6] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-[#71717A]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>Verified portfolios</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>Standardized pricing</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>Structured delivery</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — REEL SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReelCarousel
          reels={SHOWCASE_REELS}
          title="See the kind of content creators make."
          subtitle="Watch authentic promotional reels, client campaigns, and portfolio work created by creators on Marketur."
        />
      </section>

      {/* SECTION 3 — THE PROBLEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-[#E5E5DE] rounded-2xl bg-white p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="editorial-label text-[#FF5416]">Clear Collaboration</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] mt-1">
              Why Marketur exists
            </h2>
            <p className="text-sm text-[#71717A] mt-2">
              Direct messages and vague pricing make creator partnerships difficult. Marketur replaces them with structure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Businesses */}
            <div className="p-6 rounded-xl bg-[#FBFBFA] border border-[#E5E5DE] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] block font-bold">
                For Businesses
              </span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">
                Finding the right creator is difficult.
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Vague follower numbers don't show creator quality. Reaching out through Instagram DMs leads to ignored messages, unpredictable pricing, and delayed deliverables.
              </p>
            </div>

            {/* Creators */}
            <div className="p-6 rounded-xl bg-[#FBFBFA] border border-[#E5E5DE] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A] block font-bold">
                For Creators
              </span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">
                Getting consistent paid collaborations is difficult.
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Creators spend hours pitching brands, negotiating terms, and chasing delayed invoices instead of focusing on producing great content for their audience.
              </p>
            </div>

            {/* Marketur */}
            <div className="p-6 rounded-xl bg-[#121214] text-white border border-[#27272A] space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF5416] block font-bold">
                Marketur
              </span>
              <h3 className="font-mono text-lg font-bold text-white">
                One place to discover, compare, book, and manage.
              </h3>
              <p className="text-xs sm:text-sm text-[#D4D4D8] leading-relaxed">
                Businesses discover creators, review their actual work, and choose fixed packages. Both sides collaborate with clear briefs, protected workflow, and predictable outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="editorial-label text-[#FF5416]">Simple Process</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] mt-1">
            How it works
          </h2>
          <p className="text-sm text-[#71717A] mt-2">
            A transparent 5-step collaboration workflow for both sides.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For businesses */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF5416] font-bold">
                  Workflow
                </span>
                <h3 className="font-mono text-xl font-bold text-[#121214]">For Businesses</h3>
              </div>
              <span className="text-xs font-mono bg-[#F4F4F0] px-3 py-1 rounded-md text-[#71717A] border border-[#E5E5DE]">
                Brands & Local Shops
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { step: '01', title: 'Find a creator', desc: 'Browse creators by category, city, and creative style.' },
                { step: '02', title: 'View their work', desc: 'Watch real portfolio reels and past promotional content before deciding.' },
                { step: '03', title: 'Choose a package', desc: 'Pick fixed-scope packages with transparent pricing and delivery days.' },
                { step: '04', title: 'Send collaboration brief', desc: 'Submit requirements, product details, and brand guidelines in one place.' },
                { step: '05', title: 'Manage the collaboration', desc: 'Review submitted content drafts, request revisions, and approve final delivery.' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#FF5416] bg-[#FFF2EC] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#FFD2C1]">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214]">{item.title}</h4>
                    <p className="text-xs text-[#52525B] mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <Link href="/discover" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  <span>Browse Creator Marketplace</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* For creators */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#121214] font-bold">
                  Workflow
                </span>
                <h3 className="font-mono text-xl font-bold text-[#121214]">For Creators</h3>
              </div>
              <span className="text-xs font-mono bg-[#F4F4F0] px-3 py-1 rounded-md text-[#71717A] border border-[#E5E5DE]">
                Content Creators
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { step: '01', title: 'Create your profile', desc: 'Set up your bio, location, and audience details.' },
                { step: '02', title: 'Upload your work', desc: 'Showcase promotional client reels or your own sample demo reels.' },
                { step: '03', title: 'Set your packages', desc: 'Define your collaboration packages, scope, and pricing.' },
                { step: '04', title: 'Receive collaboration requests', desc: 'Get structured briefs with committed terms from genuine businesses.' },
                { step: '05', title: 'Deliver the work', desc: 'Upload drafts, incorporate feedback, and get paid promptly.' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#121214] bg-[#F4F4F0] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#E5E5DE]">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214]">{item.title}</h4>
                    <p className="text-xs text-[#52525B] mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <Link href="/auth/signup?role=creator" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  <span>Create Your Creator Profile</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CREATOR DISCOVERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="editorial-label text-[#FF5416]">Discovery Preview</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] mt-1">
              Featured Creators
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] mt-1">
              Browse creator work samples and fixed packages before reaching out.
            </p>
          </div>

          <Link href="/discover">
            <Button variant="outline" size="sm">
              <span>View All Creators ({INITIAL_CREATORS.length})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewCreators.map((creator) => (
            <CreatorCard key={creator.user_id} creator={creator} />
          ))}
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121214] text-white rounded-2xl p-10 sm:p-14 relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="editorial-label text-[#FF5416]">Start Collaborating</span>
            <h2 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to grow together?
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
              Whether you need authentic promotion for your business or want paid collaborations as a creator, Marketur provides the platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-md mx-auto text-left">
              {/* Business card */}
              <div className="bg-[#1C1C1E] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">Businesses</span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">Need promotion?</h4>
                  <p className="text-xs text-[#71717A] mt-1 mb-4">Find vetted creators with proven portfolios.</p>
                </div>
                <Link href="/discover">
                  <Button variant="primary" size="sm" className="w-full">
                    <span>Find a creator</span>
                  </Button>
                </Link>
              </div>

              {/* Creator card */}
              <div className="bg-[#1C1C1E] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">Creators</span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">Have an audience?</h4>
                  <p className="text-xs text-[#71717A] mt-1 mb-4">Show your work and receive paid briefs.</p>
                </div>
                <Link href="/auth/signup?role=creator">
                  <Button variant="outline" size="sm" className="w-full text-white border-[#3F3F46] hover:bg-[#27272A]">
                    <span>Create your profile</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
