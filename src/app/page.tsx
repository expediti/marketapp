import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InfiniteReelShowcase } from '@/components/marketplace/InfiniteReelShowcase';
import { SHOWCASE_REELS } from '@/lib/data/reelsData';

export default function HomePage() {
  const popularLocations = [
    { city: 'Varanasi', state: 'Uttar Pradesh', niche: 'Food & Culture' },
    { city: 'Bengaluru', state: 'Karnataka', niche: 'Tech & SaaS' },
    { city: 'Mumbai', state: 'Maharashtra', niche: 'Fashion & D2C' },
    { city: 'Delhi NCR', state: 'Delhi NCR', niche: 'Fitness & Apps' },
    { city: 'Jaipur', state: 'Rajasthan', niche: 'Design & Heritage' },
    { city: 'Kochi', state: 'Kerala', niche: 'Travel & Lifestyle' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* SECTION 1 — HERO */}
      <section className="relative pt-12 sm:pt-16 lg:pt-24 border-b border-[#E5E5DE] dark:border-[#27272A] pb-20 sm:pb-28 lg:pb-32 bg-gradient-to-b from-[#FBFBFA] to-[#F4F4F0]/60 dark:from-[#09090B] dark:to-[#121214]/60 transition-colors">
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
                Discover Indian influencers by niche, location, reach and budget — and find the right creators to promote your app, website or product.
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
                <span>Apps, Websites & Software</span>
                <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
                <span>Authentic Video Samples</span>
                <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
                <span>Clear Fixed Packages</span>
              </div>
            </div>

            {/* Right side: Intentional clean whitespace on desktop, collapsed on mobile */}
            <div className="hidden lg:block lg:col-span-5" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* SECTION 2 — MOVING REEL SHOWCASE (Infinite Right -> Left Continuous Marquee) */}
      <InfiniteReelShowcase
        reels={SHOWCASE_REELS}
        title="Influencer content, built for reach."
        subtitle="Watch authentic short-form reels, app demonstrations, and promotional campaigns created by creators across India."
        speedSeconds={32}
      />

      {/* SECTION 3 — HOW MARKET MY APP WORKS */}
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
                { num: '02', title: 'Filter by location & reach', desc: 'Search creators by city, state, audience demographics, and budget.' },
                { num: '03', title: 'Review real video work', desc: 'Watch vertical video samples and compare predefined package rate cards.' },
                { num: '04', title: 'Select an influencer', desc: 'Pick the creator who aligns best with your app or target users.' },
                { num: '05', title: 'Submit your promotion brief', desc: 'Share your app links, campaign brief, and key talking points.' },
                { num: '06', title: 'Review and publish', desc: 'Review content drafts and get your app marketed to targeted users.' },
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
                { num: '01', title: 'Create your profile', desc: 'Add your handle, country, state, city, and creator bio.' },
                { num: '02', title: 'Select your niches', desc: 'Pick your categories (Tech, Gaming, AI, Lifestyle, Fitness, etc.).' },
                { num: '03', title: 'Add audience metrics', desc: 'Highlight where your followers live, top age tiers, and avg reach.' },
                { num: '04', title: 'Create promotion rate cards', desc: 'Set fixed pricing for Reels, Story Series, and product walkthroughs.' },
                { num: '05', title: 'Upload sample reels (up to 19 MB)', desc: 'Upload previous brand campaigns or sample demo walkthroughs.' },
                { num: '06', title: 'Receive collaboration briefs', desc: 'Get direct paid briefs from founders building high-growth apps.' },
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

      {/* SECTION 4 — LOCATION + NICHE DISCOVERY EXPLANATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="max-w-2xl">
            <span className="editorial-label text-[#FF5416]">Hyper-Local & Demographic Matching</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white mt-1">
              Find creators where your audience lives.
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] mt-2 leading-relaxed">
              Every creator on Market My App has verified structured location data (Country, State, City). Whether you are an app founder targeting tier-1 tech hubs or a brand looking for deep regional reach in Uttar Pradesh or Maharashtra, combine category and location filters for pinpoint marketing.
            </p>
          </div>

          {/* Location Explorer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularLocations.map((item) => (
              <Link
                key={item.city}
                href={`/discover?city=${encodeURIComponent(item.city)}&state=${encodeURIComponent(item.state)}`}
                className="group p-4 rounded-xl bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] hover:border-[#FF5416] transition-colors flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5416]" />
                    <span className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                      {item.city}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                    {item.state} • <span className="text-[#FF5416]">{item.niche}</span>
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-[#FF5416] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#ECECE6] dark:border-[#27272A]">
            <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Combine Category + Location + Reach + Budget simultaneously in the discovery directory.
            </p>
            <Link href="/discover">
              <Button variant="outline" size="sm" className="dark:border-[#27272A] dark:text-white dark:bg-[#18181B] dark:hover:bg-[#27272A]">
                <Search className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                <span>Explore Full Directory</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="editorial-label text-[#FF5416]">Frequently Asked Questions</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white">
            Common Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            Everything you need to know about promoting apps, websites and products on Market My App.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'What kind of products can be marketed on Market My App?',
              a: 'You can market Android/iOS mobile apps, SaaS tools, web platforms, developer tools, fintech services, educational platforms, and physical consumer products.',
            },
            {
              q: 'Can I see an influencer’s past promotional work before contacting them?',
              a: 'Yes. Every influencer profile features sample reels and video work so you can evaluate production quality, on-camera delivery, and format before choosing a package.',
            },
            {
              q: 'How does package pricing work?',
              a: 'Influencers set clear fixed packages (e.g. 1 Instagram Reel for ₹3,000, or a Reel + 2 Stories for ₹4,500). There are no hidden retainers or confusing agency margins.',
            },
            {
              q: 'How does location filtering work for regional campaigns?',
              a: 'Creators specify their Country, State, and City. You can filter for creators located in specific cities like Varanasi, Mumbai, or Bengaluru, or filter by creators who have significant follower reach in those markets.',
            },
            {
              q: 'What are the reel upload requirements for creators?',
              a: 'Creators can upload short 9:16 vertical sample reels up to 19 MB. Supported formats include MP4, WebM, and MOV, and videos are delivered via high-performance streaming storage.',
            },
            {
              q: 'Are influencer social handles kept confidential?',
              a: 'Yes. Market My App protects creators from spam by keeping direct private handles off the public listing. All collaboration briefs are coordinated directly through the secure platform workspace.',
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

      {/* SECTION 6 — FINAL CTA */}
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
