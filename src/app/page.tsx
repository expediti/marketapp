import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  Smartphone,
  Globe,
  Package,
  Layers,
  TrendingUp,
  Users,
  ShieldCheck,
  Film,
  Play,
  Share2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { ReelCarousel } from '@/components/marketplace/ReelCarousel';
import { ReelCard } from '@/components/marketplace/ReelCard';
import { HeroWorkflowVisual } from '@/components/marketplace/HeroWorkflowVisual';
import { SHOWCASE_REELS } from '@/lib/data/reelsData';
import { INITIAL_CREATORS } from '@/lib/supabase/mockData';

export default function HomePage() {
  const previewInfluencers = INITIAL_CREATORS.slice(0, 3);
  const heroReel = SHOWCASE_REELS[0];

  return (
    <div className="space-y-20 md:space-y-28 pb-20">
      {/* SECTION 1 — HERO */}
      <section className="relative pt-10 sm:pt-16 lg:pt-20 border-b border-[#E5E5DE] dark:border-[#27272A] pb-16 sm:pb-24 bg-gradient-to-b from-[#FBFBFA] to-[#F4F4F0]/60 dark:from-[#09090B] dark:to-[#121214]/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
                <span>INDIAN INFLUENCER MARKETING MARKETPLACE</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#121214] dark:text-white leading-[1.08]">
                Market your app.{' '}
                <span className="text-[#FF5416] block sm:inline">
                  Reach the right audience
                </span>{' '}
                through influencers.
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] max-w-xl leading-relaxed">
                Discover Indian influencers by niche, audience, reach and budget — and find the right creators to promote your app, website or product.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/discover">
                  <Button variant="primary" size="lg" className="px-6 py-3 text-base">
                    <span>Find Influencers</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>

                <Link href="/auth/signup?role=creator">
                  <Button variant="secondary" size="lg" className="px-6 py-3 text-base dark:border-[#27272A] dark:text-white dark:bg-[#18181B] dark:hover:bg-[#27272A]">
                    <span>Join as an Influencer</span>
                  </Button>
                </Link>
              </div>

              {/* Value tags */}
              <div className="pt-6 border-t border-[#ECECE6] dark:border-[#27272A] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#FF5416]" />
                  <span>Apps & Websites</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Real Video Samples</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#FF5416]" />
                  <span>Standard Packages</span>
                </span>
              </div>
            </div>

            {/* Right Hero Visual: Looping Interactive Workflow & Autoplay Reel */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroWorkflowVisual heroReel={heroReel} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — HOMEPAGE TRUST / VALUE POINTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] space-y-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#4D1F0E]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Discover Influencers
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Search by niche, audience, location, reach and pricing.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] space-y-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-[#18181B] text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-[#27272A]">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              See Their Work
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              View reels and promotional content before contacting an influencer.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] space-y-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#4D1F0E]">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Compare Packages
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Understand exactly what an influencer provides and what it costs.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] space-y-2.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] flex items-center justify-center border border-[#A7F3D0] dark:border-[#065F46]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Build Direct Collaborations
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Connect advertisers with relevant influencers through the platform.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — REEL / CONTENT SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReelCarousel
          reels={SHOWCASE_REELS}
          title="See the kind of content influencers create."
          subtitle="Watch authentic promotional reels, app walkthroughs, and portfolio samples created on Market My App."
        />
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="editorial-label text-[#FF5416]">Clear Workflow</span>
          <h2 className="font-mono text-3xl font-bold text-[#121214] dark:text-white">
            How Market My App Works
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            A transparent 6-step collaboration system for advertisers and influencers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Advertisers */}
          <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-[#27272A] pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Step-By-Step</span>
                <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Advertisers</h3>
              </div>
              <span className="text-xs font-mono bg-[#F4F4F0] dark:bg-[#18181B] px-3 py-1 rounded text-[#71717A] dark:text-[#A1A1AA] border border-[#E5E5DE] dark:border-[#27272A]">
                Apps, Websites & Products
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { num: '01', title: 'Choose your category', desc: 'Select Technology, Gaming, AI, Finance, Fitness or other niches.' },
                { num: '02', title: 'Discover influencers', desc: 'Filter by city, audience reach, engagement rate, and platform.' },
                { num: '03', title: 'Compare audience, reach and packages', desc: 'Review real video work and predefined package rate cards.' },
                { num: '04', title: 'Select an influencer', desc: 'Pick the creator who aligns best with your app or target users.' },
                { num: '05', title: 'Submit your promotion requirements', desc: 'Share your app links, campaign brief, and key talking points.' },
                { num: '06', title: 'Collaborate and receive the promotion', desc: 'Review content drafts and get your app marketed to real users.' },
              ].map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#FF5416] bg-[#FFF2EC] dark:bg-[#27140B] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#FFD2C1] dark:border-[#4D1F0E]">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">{step.title}</h4>
                    <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <Link href="/discover" className="block">
                <Button variant="primary" size="sm" className="w-full">
                  <span>Start Finding Influencers</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* For Influencers */}
          <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-[#27272A] pb-4">
              <div>
                <span className="editorial-label text-[#121214] dark:text-[#D4D4D8]">Step-By-Step</span>
                <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Influencers</h3>
              </div>
              <span className="text-xs font-mono bg-[#F4F4F0] dark:bg-[#18181B] px-3 py-1 rounded text-[#71717A] dark:text-[#A1A1AA] border border-[#E5E5DE] dark:border-[#27272A]">
                Content Creators
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { num: '01', title: 'Create your profile', desc: 'Add your display name, location, profile photo, and bio.' },
                { num: '02', title: 'Select your niches', desc: 'Pick your categories (Tech, Gaming, AI, Lifestyle, Comedy, etc.).' },
                { num: '03', title: 'Add audience information', desc: 'List your audience locations, age demographics, and primary reach.' },
                { num: '04', title: 'Create promotion packages', desc: 'Set pricing for Reels, Story Series, Product Walkthroughs, and combos.' },
                { num: '05', title: 'Upload your work/reels', desc: 'Upload previous promotional reels or creative sample demo reels.' },
                { num: '06', title: 'Receive collaboration opportunities', desc: 'Get structured paid briefs from companies building great apps.' },
              ].map((step) => (
                <li key={step.num} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#121214] dark:text-white bg-[#F4F4F0] dark:bg-[#27272A] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#E5E5DE] dark:border-[#3F3F46]">
                    {step.num}
                  </span>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">{step.title}</h4>
                    <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="pt-2">
              <Link href="/auth/signup?role=creator" className="block">
                <Button variant="outline" size="sm" className="w-full dark:border-[#27272A] dark:text-white dark:bg-[#18181B] dark:hover:bg-[#27272A]">
                  <span>Join as an Influencer</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — INFLUENCER DISCOVERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="editorial-label text-[#FF5416]">Browse Directory</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white mt-1">
              Featured Influencers for Apps & Products
            </h2>
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1">
              Compare actual video reels, audience metrics, and fixed packages.
            </p>
          </div>

          <Link href="/discover">
            <Button variant="outline" size="sm" className="dark:border-[#27272A] dark:text-white dark:bg-[#18181B] dark:hover:bg-[#27272A]">
              <span>View All Influencers ({INITIAL_CREATORS.length})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewInfluencers.map((creator) => (
            <CreatorCard key={creator.user_id} creator={creator} />
          ))}
        </div>
      </section>

      {/* SECTION 6 — APP GROWTH NETWORK VISUALIZATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121214] dark:bg-[#121214] text-white rounded-2xl p-8 sm:p-12 border border-[#27272A] shadow-xl">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="editorial-label text-[#FF5416]">Market My App Engine</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold">
              How Apps Scale With Influencers
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              A clean distribution bridge from your product to targeted Indian users.
            </p>
          </div>

          {/* Simple Visual Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto items-center">
            {/* Step 1 */}
            <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF5416]/10 text-[#FF5416] flex items-center justify-center mx-auto border border-[#FF5416]/20">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-mono text-sm font-bold text-white">YOUR APP</h4>
              <p className="text-[11px] text-[#A1A1AA]">App, Website, SaaS, or D2C Product</p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center mx-auto border border-white/20">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-mono text-sm font-bold text-white">INFLUENCER NETWORK</h4>
              <p className="text-[11px] text-[#A1A1AA]">Niche creators across India</p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#1C1C1F] border border-[#27272A] rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#FF5416]/10 text-[#FF5416] flex items-center justify-center mx-auto border border-[#FF5416]/20">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="font-mono text-sm font-bold text-white">TARGET AUDIENCE</h4>
              <p className="text-[11px] text-[#A1A1AA]">Engaged followers in key cities</p>
            </div>

            {/* Step 4 */}
            <div className="bg-[#1C1C1F] border border-[#047857]/40 rounded-xl p-5 text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-[#047857]/20 text-[#34D399] flex items-center justify-center mx-auto border border-[#047857]/40">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-mono text-sm font-bold text-[#34D399]">MORE REACH</h4>
              <p className="text-[11px] text-[#A1A1AA]">Downloads, signups, and customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="editorial-label text-[#FF5416]">Frequently Asked Questions</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white">
            Common Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Everything you need to know about promoting apps and websites on Market My App.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'What kind of products can be marketed on Market My App?',
              a: 'You can market Android/iOS mobile apps, SaaS tools, web platforms, developer tools, fintech services, educational platforms, and physical D2C products.',
            },
            {
              q: 'Can I see an influencer’s past promotional work before contacting them?',
              a: 'Yes! Every influencer profile showcases real portfolio reels and video samples so you can evaluate production quality, tone, and storytelling before choosing a package.',
            },
            {
              q: 'How does package pricing work?',
              a: 'Influencers set clear fixed packages (e.g. 1 Instagram Reel for ₹3,000, or a Reel + 2 Stories for ₹4,500). There are no hidden retainers or confusing agency margins.',
            },
            {
              q: 'Are influencer social handles kept confidential?',
              a: 'Yes. Market My App protects creators from spam by keeping direct private handles and contact details off the public listing. All collaboration briefs are coordinated directly through the platform workspace.',
            },
            {
              q: 'Can influencers upload demo/sample reels if they are new?',
              a: 'Absolutely. Influencers can upload previous promotional reels or create their own sample demo reel demonstrating how they talk about products, without having to pretend it was a paid client brand.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] space-y-2 shadow-xs"
            >
              <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                {faq.q}
              </h4>
              <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121214] text-white rounded-2xl p-10 sm:p-14 relative overflow-hidden border border-[#27272A]">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="editorial-label text-[#FF5416]">Get Started With Market My App</span>
            <h2 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to grow your app with influencer content?
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
              Connect with vetted Indian creators who create engaging short-form video content for your target audience.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-md mx-auto text-left">
              {/* Advertiser card */}
              <div className="bg-[#1C1C1F] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">Advertisers</span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">Have an app or product?</h4>
                  <p className="text-xs text-[#71717A] mt-1 mb-4">Discover influencers with proven reach.</p>
                </div>
                <Link href="/discover">
                  <Button variant="primary" size="sm" className="w-full">
                    <span>Find Influencers</span>
                  </Button>
                </Link>
              </div>

              {/* Creator card */}
              <div className="bg-[#1C1C1F] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">Influencers</span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">Create content?</h4>
                  <p className="text-xs text-[#71717A] mt-1 mb-4">Show your work and receive paid briefs.</p>
                </div>
                <Link href="/auth/signup?role=creator">
                  <Button variant="outline" size="sm" className="w-full text-white border-[#3F3F46] hover:bg-[#27272A]">
                    <span>Join as an Influencer</span>
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
