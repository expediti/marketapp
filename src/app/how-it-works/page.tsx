import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  Search,
  CheckCircle2,
  Users,
  Smartphone,
  Film,
  Sparkles,
  Layers,
  Send,
  Zap,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Clear Collaboration Workflow</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          How Market My App Works
        </h1>
        <p className="text-sm text-[#71717A] dark:text-zinc-400">
          A modern marketplace specifically designed for applications, websites, and products to partner directly with high-converting Indian influencers.
        </p>
      </div>

      {/* 2 Main Columns: Advertisers & Influencers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. For Advertisers */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#FF5416]/10 text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#FF5416]/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Advertisers</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">Apps, Websites, SaaS & Products</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Choose your category',
                desc: 'Select from Technology, Gaming, AI, Finance, Fitness, Fashion, Education, and more.',
              },
              {
                num: '02',
                title: 'Discover influencers',
                desc: 'Filter Indian creators by niche, location, follower range, engagement, and budget.',
              },
              {
                num: '03',
                title: 'Compare audience, reach and packages',
                desc: 'Inspect average reach, demographic split, and fixed-price packages before contacting.',
              },
              {
                num: '04',
                title: 'Select an influencer',
                desc: 'Choose the creator and package that matches your app download or web traffic goals.',
              },
              {
                num: '05',
                title: 'Submit your promotion requirements',
                desc: 'Provide your app link, campaign objective, key talking points, and call to action.',
              },
              {
                num: '06',
                title: 'Collaborate and receive the promotion',
                desc: 'Review the reel draft, request any adjustments, and watch the promotion go live.',
              },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#FF5416] bg-[#FFF2EC] dark:bg-[#FF5416]/10 w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#FFD2C1] dark:border-[#FF5416]/30">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] dark:text-white block font-mono text-sm">{s.title}</strong>
                  <span className="text-[#52525B] dark:text-zinc-400 mt-0.5 block">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/discover" className="block pt-2">
            <Button variant="primary" size="md" className="w-full">
              <span>Find Influencers</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* 2. For Influencers */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-zinc-800 text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Influencers</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">Content Creators & Streamers</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Create your profile',
                desc: 'Add your display name, profile photo, city, state, and languages spoken.',
              },
              {
                num: '02',
                title: 'Select your niches',
                desc: 'Tag your content categories so relevant apps and tech products can discover you.',
              },
              {
                num: '03',
                title: 'Add audience information',
                desc: 'Specify your audience locations, age demographics, and primary interests.',
              },
              {
                num: '04',
                title: 'Create promotion packages',
                desc: 'Set transparent deliverables (e.g. 1 Reel, Reel + Story) with fixed prices.',
              },
              {
                num: '05',
                title: 'Upload your work / reels',
                desc: 'Upload sample vertical reels (max 19MB) to demonstrate video production quality.',
              },
              {
                num: '06',
                title: 'Receive collaboration opportunities',
                desc: 'Get genuine paid promotion briefs from apps, websites, and growing brands.',
              },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#121214] dark:text-zinc-200 bg-[#F4F4F0] dark:bg-zinc-800 w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#E5E5DE] dark:border-zinc-700">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] dark:text-white block font-mono text-sm">{s.title}</strong>
                  <span className="text-[#52525B] dark:text-zinc-400 mt-0.5 block">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup?role=influencer" className="block pt-2">
            <Button variant="outline" size="md" className="w-full">
              <span>Join as an Influencer</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Network Pipeline Diagram */}
      <div className="bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 text-center space-y-6">
        <span className="editorial-label text-[#FF5416]">Promotion Engine</span>
        <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
          The Direct Marketing Funnel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-2">
          <div className="p-4 bg-white dark:bg-[#18181B] rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">01 / SOURCE</span>
            <strong className="font-mono text-sm text-[#121214] dark:text-white block">Your App / Site</strong>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-1">iOS, Android, SaaS, or Product</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#18181B] rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">02 / MATCH</span>
            <strong className="font-mono text-sm text-[#FF5416] block">Niche Influencer</strong>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-1">Verified audience & short reels</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#18181B] rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">03 / DISTRIBUTION</span>
            <strong className="font-mono text-sm text-[#121214] dark:text-white block">Target Audience</strong>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-1">Tier-1 & Tier-2 Indian viewers</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#18181B] rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-400 block mb-1">04 / OUTCOME</span>
            <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400 block">Organic Installs</strong>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-1">High-intent user downloads</p>
          </div>
        </div>
      </div>
    </div>
  );
}
