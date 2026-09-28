import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, MapPin, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { INITIAL_CREATORS } from '@/lib/supabase/mockData';

export default function HomePage() {
  const featuredCreators = INITIAL_CREATORS.slice(0, 3);
  const heroFeaturedCreator = INITIAL_CREATORS[0]; // Creator 042

  return (
    <div className="space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 md:pt-20 border-b border-[#E5E5DE] pb-20 bg-gradient-to-b from-[#FBFBFA] to-[#F4F4F0]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] border border-[#FFD2C1] text-xs font-mono text-[#FF5416]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
                <span>INDIA CREATOR MARKETPLACE • ESCROW PROTECTED</span>
              </div>

              <h1 className="font-mono text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#121214] leading-[1.08]">
                Creators meet <br />
                <span className="text-[#FF5416] underline decoration-4 underline-offset-8">
                  businesses.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#52525B] max-w-xl leading-relaxed">
                Find the right audience. Book the right creator. Run collaborations without the usual back-and-forth.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/discover">
                  <Button variant="primary" size="lg">
                    <span>Find Creators</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link href="/auth/signup">
                  <Button variant="secondary" size="lg">
                    <span>Become a Creator</span>
                  </Button>
                </Link>
              </div>

              {/* Quick Persona Links */}
              <div className="flex items-center gap-6 pt-4 text-xs font-mono text-[#71717A]">
                <Link
                  href="/for-businesses"
                  className="hover:text-[#121214] flex items-center gap-1 group"
                >
                  <span className="text-[#121214] font-semibold underline underline-offset-4">For Businesses</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <span className="text-[#D4D4D0]">•</span>
                <Link
                  href="/for-creators"
                  className="hover:text-[#121214] flex items-center gap-1 group"
                >
                  <span className="text-[#121214] font-semibold underline underline-offset-4">For Creators</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Hero: Creator Marketplace Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Background decorative offset card */}
                <div className="absolute -inset-1 bg-[#121214] rounded-lg rotate-1 opacity-5 hidden sm:block" />

                <div className="relative bg-white border-2 border-[#121214] rounded-lg p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-[#ECECE6] pb-3">
                    <span className="editorial-label text-[#FF5416]">Marketplace Spotlight</span>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified metrics ✓</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-mono text-2xl font-bold text-[#121214]">
                      {heroFeaturedCreator.profile?.display_name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] mt-1">
                      <span>{heroFeaturedCreator.niche}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FF5416]" />
                        {heroFeaturedCreator.profile?.city}
                      </span>
                    </div>
                  </div>

                  {/* Highlight stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded p-3 text-center">
                    <div>
                      <div className="font-mono font-bold text-base text-[#121214]">
                        {(heroFeaturedCreator.follower_count / 1000).toFixed(1)}K
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] uppercase">Followers</div>
                    </div>
                    <div className="border-x border-[#E5E5DE]">
                      <div className="font-mono font-bold text-base text-[#121214]">
                        {heroFeaturedCreator.engagement_rate}%
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] uppercase">Engagement</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-base text-[#121214]">
                        {heroFeaturedCreator.local_reach_percentage}%
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] uppercase">Local Reach</div>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#71717A] block">Package starting at</span>
                      <span className="font-mono text-xl font-bold text-[#121214]">
                        ₹{heroFeaturedCreator.starting_price?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <Link href={`/creators/${heroFeaturedCreator.user_id}`}>
                      <Button variant="primary" size="sm">
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="editorial-label text-[#FF5416]">Transaction Architecture</span>
          <h2 className="font-mono text-3xl font-bold text-[#121214]">
            How Marketur Works
          </h2>
          <p className="text-sm text-[#71717A]">
            Clear packages, verified analytics, and protected escrow payments replace messy Instagram direct messages.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Businesses */}
          <div className="bg-white border border-[#E5E5DE] rounded-lg p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
              <h3 className="font-mono text-lg font-bold text-[#121214]">For Businesses</h3>
              <span className="text-xs font-mono bg-[#F4F4F0] px-2.5 py-1 rounded border border-[#E5E5DE] text-[#71717A]">
                Brands & Agencies
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { step: '01', title: 'Discover Creators', desc: 'Filter by city, niche, reach, and verified engagement rates.' },
                { step: '02', title: 'Choose a Package', desc: 'Select from standardized fixed rate cards (Reels, Stories, Lookbooks).' },
                { step: '03', title: 'Fund the Collaboration', desc: 'Deposit funds into Marketur Escrow. Payment is securely held.' },
                { step: '04', title: 'Receive the Content', desc: 'Review media drafts and proof inside the private order workspace.' },
                { step: '05', title: 'Approve & Release Payment', desc: 'One-click signoff automatically releases UPI payout to the creator.' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#FF5416] bg-[#FFF2EC] w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#FFD2C1]">
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
              <Link href="/discover">
                <Button variant="outline" size="sm" className="w-full">
                  <span>Explore Creator Marketplace</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* For Creators */}
          <div className="bg-white border border-[#E5E5DE] rounded-lg p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
              <h3 className="font-mono text-lg font-bold text-[#121214]">For Creators</h3>
              <span className="text-xs font-mono bg-[#F4F4F0] px-2.5 py-1 rounded border border-[#E5E5DE] text-[#71717A]">
                Instagram Influencers
              </span>
            </div>

            <ol className="space-y-4">
              {[
                { step: '01', title: 'Connect Your Account', desc: 'Sync your metrics securely. Handles are kept strictly confidential.' },
                { step: '02', title: 'Create Your Rate Card', desc: 'Define your package pricing, delivery timeline, and revision limits.' },
                { step: '03', title: 'Receive Collaboration Requests', desc: 'Accept or decline briefs backed by 100% pre-funded escrow.' },
                { step: '04', title: 'Deliver the Campaign', desc: 'Upload drafts and content proofs directly in the order workspace.' },
                { step: '05', title: 'Get Paid Instantly', desc: 'Receive direct UPI/bank payouts without chasing delayed invoices.' },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-4">
                  <span className="font-mono text-xs font-bold text-[#121214] bg-[#F4F4F0] w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#E5E5DE]">
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
              <Link href="/auth/signup">
                <Button variant="primary" size="sm" className="w-full">
                  <span>Join as Creator</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="editorial-label text-[#FF5416]">Marketplace Preview</span>
            <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] mt-1">
              Featured Verified Creators
            </h2>
            <p className="text-xs text-[#71717A] mt-1">
              Real Indian audiences, verified metrics, and predefined collaboration packages.
            </p>
          </div>

          <Link href="/discover">
            <Button variant="outline" size="sm">
              <span>View All Creators ({INITIAL_CREATORS.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCreators.map((creator) => (
            <CreatorCard key={creator.user_id} creator={creator} />
          ))}
        </div>
      </section>

      {/* WHY THE PLATFORM */}
      <section className="bg-white border-y border-[#E5E5DE] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="editorial-label text-[#FF5416]">Marketplace Guarantees</span>
            <h2 className="font-mono text-3xl font-bold text-[#121214]">
              Why Businesses & Creators Choose Marketur
            </h2>
            <p className="text-sm text-[#71717A]">
              We built an infrastructure around accountability and protected collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Protected Transactions',
                desc: 'Every collaboration is pre-funded into escrow before production starts. Creators know funds exist; brands release payment upon satisfaction.',
              },
              {
                icon: CheckCircle2,
                title: 'Verified Creator Metrics',
                desc: 'Audience demographics, engagement percentages, and local city reach are verified directly through official APIs, eliminating fake screenshot claims.',
              },
              {
                icon: Zap,
                title: 'Clear Fixed Packages',
                desc: 'No vague pricing quotes or endless negotiation. Purchase predefined Reels, Stories, or Lookbooks with explicit delivery timelines.',
              },
              {
                icon: MapPin,
                title: 'Local Discovery',
                desc: 'Target niche creators by city (Varanasi, Bengaluru, Jaipur, Mumbai) so regional businesses reach customers who actually live nearby.',
              },
              {
                icon: Users,
                title: 'Simple Collaboration',
                desc: 'Structured campaign briefs, Dos & Don’ts, order-specific chat, and delivery verification in one unified dashboard.',
              },
              {
                icon: TrendingUp,
                title: 'Transparent 5% Pricing',
                desc: 'No hidden markup or agency retainers. Simple, honest 5% platform fee with zero monthly subscription barriers.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg space-y-3"
                >
                  <div className="w-10 h-10 rounded-md bg-white border border-[#E5E5DE] flex items-center justify-center text-[#FF5416] shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-mono text-base font-bold text-[#121214]">{feature.title}</h3>
                  <p className="text-xs text-[#52525B] leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#121214] text-white rounded-xl p-10 sm:p-14 text-center space-y-6 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5416]/10 rounded-full blur-3xl pointer-events-none" />

          <span className="editorial-label text-[#FF5416]">Get Started Today</span>
          <h2 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl mx-auto">
            Ready to work together?
          </h2>
          <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto leading-relaxed">
            Join hundreds of forward-thinking Indian brands and verified creators doing business on clean, structured terms.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/discover">
              <Button variant="primary" size="lg">
                <span>Find a Creator</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/auth/signup">
              <Button
                variant="outline"
                size="lg"
                className="text-white border-[#3F3F46] hover:bg-[#27272A]"
              >
                <span>Join as a Creator</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
