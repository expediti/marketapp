import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MapPin,
  Search,
  ShieldCheck,
  Lock,
  Layers,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Users,
  Smartphone,
  Globe,
  Radio,
  Send,
  Building2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InfiniteReelShowcase } from '@/components/marketplace/InfiniteReelShowcase';
import { SHOWCASE_REELS } from '@/lib/data/reelsData';
import { AccountDeletedBanner } from '@/components/common/AccountDeletedBanner';

export default function HomePage() {
  const distributionChannels = [
    {
      name: 'Instagram Creators',
      desc: 'Short-form video reels, app walkthroughs, story demonstrations, and visual product showcases.',
      status: 'AVAILABLE NOW',
      isLive: true,
      icon: Radio,
    },
    {
      name: 'Telegram Communities',
      desc: 'Developer forums, tech deals, productivity channels, and niche regional discussion groups.',
      status: 'COMING SOON',
      isLive: false,
      icon: Send,
    },
    {
      name: 'WhatsApp Communities',
      desc: 'Hyper-local business networks, neighborhood forums, student cohorts, and merchant groups.',
      status: 'COMING SOON',
      isLive: false,
      icon: MessageSquare,
    },
    {
      name: 'Facebook Communities',
      desc: 'Interest-based groups, regional trade communities, hobbyists, and local service networks.',
      status: 'COMING SOON',
      isLive: false,
      icon: Users,
    },
    {
      name: 'Local Communities',
      desc: 'City-specific tech meetups, regional founder networks, campus groups, and trade associations.',
      status: 'COMING SOON',
      isLive: false,
      icon: MapPin,
    },
  ];

  const popularLocations = [
    { city: 'Varanasi', state: 'Uttar Pradesh', niche: 'Food, Culture & Local Services' },
    { city: 'Bengaluru', state: 'Karnataka', niche: 'Tech, SaaS & Developer Tools' },
    { city: 'Mumbai', state: 'Maharashtra', niche: 'Finance, Lifestyle & D2C' },
    { city: 'Delhi NCR', state: 'Delhi NCR', niche: 'Fitness, EdTech & Utilities' },
    { city: 'Jaipur', state: 'Rajasthan', niche: 'Design, Commerce & Craft' },
    { city: 'Kochi', state: 'Kerala', niche: 'Travel, Consumer & Digital' },
  ];

  const steps = [
    {
      num: '01',
      title: "Tell us what you're promoting",
      desc: 'Specify your product: mobile app, web SaaS, developer tool, local business, or consumer product.',
    },
    {
      num: '02',
      title: 'Discover relevant audiences',
      desc: 'Filter by niche, city, follower size, platform reach, and transparent package pricing.',
    },
    {
      num: '03',
      title: 'Connect and discuss the promotion',
      desc: 'Send a structured request. The creator or community reviews your brief and accepts before chat opens.',
    },
    {
      num: '04',
      title: 'Pay securely',
      desc: 'Platform payment protection holds funds safely until the distribution milestone is completed.',
    },
    {
      num: '05',
      title: 'Get the promotion delivered',
      desc: 'Review the content or announcement draft, approve delivery, and reach your intended users.',
    },
  ];

  const userSegments = [
    {
      title: 'Local Developers & Indie Builders',
      desc: 'You built a utility, mobile app, or SaaS tool in your spare time. You need early users and honest feedback without paying a marketing retainer.',
      tag: 'Apps & Software',
    },
    {
      title: 'Founders & Product Creators',
      desc: 'You launched a product or platform. Instead of burning budget on impersonal broad ads, connect with voices that already hold your audience’s attention.',
      tag: 'Startups & Tools',
    },
    {
      title: 'Vendors & Small Businesses',
      desc: 'You run a local service, store, or regional brand. Find creators whose audience lives in your exact city, district, or neighborhood.',
      tag: 'Local & Regional',
    },
    {
      title: 'Distribution Partners & Creators',
      desc: 'You run a dedicated community, channel, or creator account. Receive paid, vetted promotion requests from builders with transparent pricing.',
      tag: 'Audience Partners',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      <Suspense fallback={null}>
        <AccountDeletedBanner />
      </Suspense>

      {/* SECTION 1 — HERO */}
      <section className="relative pt-12 sm:pt-16 lg:pt-20 border-b border-[#E5E5DE] dark:border-[#27272A] pb-16 sm:pb-24 lg:pb-28 bg-[#FBFBFA] dark:bg-[#09090B] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
              <span>AUDIENCE DISCOVERY & DISTRIBUTION PLATFORM</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#121214] dark:text-white leading-[1.08]">
              Built something people should know about?
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] leading-relaxed max-w-2xl">
              Find creators and communities that already reach the people you want to reach — without agency-scale marketing budgets.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/discover">
                <Button variant="primary" size="lg" className="px-6 py-3 text-base">
                  <span>Find Your Audience</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>

              <Link href="/auth/signup?role=creator">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-6 py-3 text-base border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]"
                >
                  <span>I&apos;m a Creator / Community</span>
                </Button>
              </Link>
            </div>

            {/* Core Values Summary Strip */}
            <div className="pt-6 border-t border-[#ECECE6] dark:border-[#27272A] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399]" />
                Affordable promotion
              </span>
              <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] dark:text-[#34D399]" />
                Relevant existing audiences
              </span>
              <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5416]" />
                Protected transactions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CORE USP / POSITIONING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 sm:p-12 space-y-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <span className="editorial-label text-[#FF5416]">The Core Problem</span>
              <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white leading-tight">
                &ldquo;Big agencies aren&apos;t built for everyone.&rdquo;
              </h2>
              <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                Traditional marketing agencies require massive retainer fees, confusing margins, and months of onboarding. Manual direct messaging leads to ghosting, lack of accountability, and lost payments.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] space-y-2">
                <span className="editorial-label text-[#B91C1C] dark:text-rose-400">The Problem</span>
                <p className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                  &ldquo;I built something, but I don&apos;t know where to promote it.&rdquo;
                </p>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
                  Developers and local founders spend months building great software or services, only to hit a wall when it comes to finding their first 1,000 real users.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-[#FFF2EC]/60 dark:bg-[#27140B]/60 border border-[#FFD2C1] dark:border-[#4D1F0E] space-y-2">
                <span className="editorial-label text-[#FF5416]">The Platform Answer</span>
                <p className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                  &ldquo;Find creators and communities that already have the audience you need.&rdquo;
                </p>
                <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                  Connect with curated distribution partners who already have trust, attention, and active engagement with your exact demographic.
                </p>
              </div>
            </div>
          </div>

          {/* User Segments Grid */}
          <div className="pt-6 border-t border-[#ECECE6] dark:border-[#27272A] space-y-4">
            <span className="editorial-label text-[#71717A] dark:text-[#A1A1AA]">
              Built for Practical Builders & Businesses
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {userSegments.map((segment, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF5416] bg-white dark:bg-[#121214] px-2 py-0.5 rounded border border-[#E5E5DE] dark:border-[#27272A] inline-block">
                      {segment.tag}
                    </span>
                    <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                      {segment.title}
                    </h3>
                    <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                      {segment.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — DISTRIBUTION CHANNELS AS A LARGER CONCEPT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="editorial-label text-[#FF5416]">Distribution Channels</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white">
            Discover Existing Audiences Across Multiple Channels
          </h2>
          <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            We are building a multi-channel distribution hub. Instagram creators are our first live channel, with dedicated community platforms expanding shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {distributionChannels.map((channel, idx) => {
            const IconComponent = channel.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl border transition-colors flex flex-col justify-between space-y-4 ${
                  channel.isLive
                    ? 'bg-white dark:bg-[#121214] border-[#121214] dark:border-white shadow-xs'
                    : 'bg-[#FBFBFA] dark:bg-[#141416] border-[#E5E5DE] dark:border-[#27272A]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        channel.isLive
                          ? 'bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] border-[#FFD2C1] dark:border-[#4D1F0E]'
                          : 'bg-[#F4F4F0] dark:bg-[#1F1F23] text-[#71717A] border-[#E5E5DE] dark:border-[#27272A]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${
                        channel.isLive
                          ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] dark:bg-[#064E3B]/40 dark:text-[#34D399] dark:border-[#065F46]'
                          : 'bg-[#F4F4F0] text-[#71717A] border-[#E5E5DE] dark:bg-[#1F1F23] dark:text-[#A1A1AA] dark:border-[#27272A]'
                      }`}
                    >
                      {channel.status}
                    </span>
                  </div>

                  <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                    {channel.name}
                  </h3>

                  <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                    {channel.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ECECE6] dark:border-[#27272A]">
                  {channel.isLive ? (
                    <Link
                      href="/discover"
                      className="inline-flex items-center text-xs font-mono font-bold text-[#FF5416] hover:underline"
                    >
                      <span>Explore active creators</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  ) : (
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA]">
                      Integration in active development
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS (5-STEP FLOW) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 sm:p-12 space-y-10 shadow-xs">
          <div className="max-w-2xl space-y-2">
            <span className="editorial-label text-[#FF5416]">Structured Process</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white">
              How Distribution Works on Market My App
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              A transparent, milestone-driven collaboration process that eliminates ambiguity and protects both parties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-5 rounded-xl bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold text-[#FF5416] bg-[#FFF2EC] dark:bg-[#27140B] w-7 h-7 rounded-md flex items-center justify-center border border-[#FFD2C1] dark:border-[#4D1F0E]">
                    {step.num}
                  </span>
                  <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white pt-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              Direct communication opens only after the distribution partner accepts the brief.
            </p>
            <Link href="/discover">
              <Button variant="primary" size="sm">
                <span>Find Your Audience</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5 — MOVING REEL SHOWCASE (Continuous Stream of Real Content Samples) */}
      <InfiniteReelShowcase
        reels={SHOWCASE_REELS}
        title="Authentic Demonstration Formats"
        subtitle="Explore short-form promotional samples, walkthrough demos, and localized feature reviews created by vetted partners."
        speedSeconds={32}
      />

      {/* SECTION 6 — LOCATION & NICHE DISCOVERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 sm:p-12 shadow-xs space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="editorial-label text-[#FF5416]">Targeted Regional Reach</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white">
              Discover Audiences Where Your Potential Users Live
            </h2>
            <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Every distribution partner on the platform has structured location and audience demographic data. Match with partners targeting tier-1 developer hubs or specific regional communities across India.
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
              Filter by Category, Location, Reach, and Budget simultaneously.
            </p>
            <Link href="/discover">
              <Button
                variant="outline"
                size="sm"
                className="border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]"
              >
                <Search className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                <span>Explore Full Audience Directory</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7 — TRUST, SAFETY & WORKFLOW VALUES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#047857] dark:text-[#34D399] flex items-center justify-center border border-[#A7F3D0] dark:border-[#065F46]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Protected Payments
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Your budget is held safely on the platform until the agreed distribution deliverable is submitted, verified, and accepted.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#4D1F0E]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Direct & Transparent Discussion
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              Communicate directly inside a dedicated workspace once a request is accepted. Clarify talking points, target links, and deadlines.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-[#1F1F23] text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-[#27272A]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
              Fixed & Predictable Pricing
            </h3>
            <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
              No hidden agency fees or surprise invoices. Package rates are defined clearly upfront so you know exactly what you get.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="editorial-label text-[#FF5416]">Common Inquiries</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA]">
            How audience distribution and platform protection work on Market My App.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'What types of things can I promote on Market My App?',
              a: 'You can promote mobile apps (Android/iOS), web SaaS platforms, developer tools, digital products, local services, physical goods, and regional businesses.',
            },
            {
              q: 'How is this different from a typical influencer marketing agency?',
              a: 'Agencies charge high monthly retainer fees and take high percentage margins. Market My App lets you discover existing audiences directly with fixed, transparent pricing and no agency overhead.',
            },
            {
              q: 'Can I message a creator or community leader immediately?',
              a: 'To prevent spam and keep communication organized, you first submit a structured collaboration request with your product brief and budget. Once the partner reviews and accepts, the private discussion workspace unlocks.',
            },
            {
              q: 'How does payment protection work?',
              a: 'When an order is confirmed, payment is recorded into platform protection. The creator or distribution partner completes the promotion and uploads the delivery link. Funds are released only after you review and approve.',
            },
            {
              q: 'What distribution channels are coming next?',
              a: 'In addition to active Instagram creators, we are rolling out integrations for Telegram tech and deal channels, WhatsApp local cohorts, Facebook regional groups, and local campus networks.',
            },
            {
              q: 'Are distribution partner handles kept private?',
              a: 'Yes. To shield creators and community leaders from unverified spam, direct contact handles are protected. All communication happens securely through the platform workspace.',
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

      {/* SECTION 9 — FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121214] text-white rounded-2xl p-8 sm:p-14 relative overflow-hidden border border-[#27272A]">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span className="editorial-label text-[#FF5416]">Start Today</span>
            <h2 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to find the audience that already exists for what you built?
            </h2>
            <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
              Connect directly with verified creators and communities across India without agency-scale marketing budgets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 max-w-md mx-auto text-left">
              {/* Founder / Business card */}
              <div className="bg-[#1C1C1F] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">
                    Founders & Builders
                  </span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">
                    Have something to promote?
                  </h4>
                  <p className="text-xs text-[#71717A] mt-1">
                    Discover relevant audiences and book transparent packages.
                  </p>
                </div>
                <Link href="/discover">
                  <Button variant="primary" size="sm" className="w-full">
                    <span>Find Your Audience</span>
                  </Button>
                </Link>
              </div>

              {/* Creator / Community card */}
              <div className="bg-[#1C1C1F] border border-[#27272A] p-5 rounded-xl flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider block">
                    Creators & Communities
                  </span>
                  <h4 className="font-mono text-base font-bold text-white mt-1">
                    Have an audience?
                  </h4>
                  <p className="text-xs text-[#71717A] mt-1">
                    List your rate cards and receive direct, paid collaboration briefs.
                  </p>
                </div>
                <Link href="/auth/signup?role=creator">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-white border-[#3F3F46] hover:bg-[#27272A]"
                  >
                    <span>Join as Partner</span>
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
