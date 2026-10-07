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
  Layers,
  Send,
  Zap,
  ShieldCheck,
  CreditCard,
  Radio,
  MessageSquare,
} from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="editorial-label text-[#FF5416]">Clear Distribution System</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          How Market My App Works
        </h1>
        <p className="text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
          A structured, milestone-based platform connecting developers, founders, and local businesses with distribution partners that already reach their target audience.
        </p>
      </div>

      {/* 2 Main Columns: Businesses & Distribution Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. For Businesses & Founders */}
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-[#27272A] pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#4D1F0E]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                For Founders & Businesses
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Apps, SaaS, Local Services & Products
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Tell us what you are promoting',
                desc: 'Select your product type (mobile app, web tool, SaaS, local business) and specify your target niche and location.',
              },
              {
                num: '02',
                title: 'Discover relevant audiences',
                desc: 'Browse creators and communities by city, follower count, engagement, and predefined package pricing.',
              },
              {
                num: '03',
                title: 'Submit collaboration request',
                desc: 'Propose a promotion with your product links, key talking points, and deadline. The partner reviews and accepts before chat opens.',
              },
              {
                num: '04',
                title: 'Protected platform payment',
                desc: 'Funds are securely deposited into platform protection before production begins. No risk of unpaid ghosting.',
              },
              {
                num: '05',
                title: 'Review draft & complete distribution',
                desc: 'Review the promotion draft, request included revisions if needed, and approve delivery to release funds to the partner.',
              },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#FF5416] bg-[#FFF2EC] dark:bg-[#27140B] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#FFD2C1] dark:border-[#4D1F0E]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] dark:text-white block font-mono text-sm">
                    {s.title}
                  </strong>
                  <span className="text-[#52525B] dark:text-[#A1A1AA] mt-0.5 block leading-relaxed">
                    {s.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/discover" className="block pt-2">
            <Button variant="primary" size="md" className="w-full">
              <span>Find Your Audience</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* 2. For Creators & Communities */}
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-[#27272A] pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-[#1F1F23] text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-[#27272A]">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                For Distribution Partners
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Creators, Channel Owners & Communities
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Set up your distribution profile',
                desc: 'Add your niche, location (City, State), audience demographic reach, and sample content reels.',
              },
              {
                num: '02',
                title: 'Define clear fixed packages',
                desc: 'Set transparent pricing for Reels, Story Series, channel broadcasts, or dedicated product walkthroughs.',
              },
              {
                num: '03',
                title: 'Receive structured promotion briefs',
                desc: 'Review explicit campaign goals and product details. Accept or decline without sharing private personal contact details.',
              },
              {
                num: '04',
                title: 'Discuss in private workspace',
                desc: 'Once accepted, a private workspace opens to clarify details and coordinate video deliverables.',
              },
              {
                num: '05',
                title: 'Submit delivery & get paid directly',
                desc: 'Deliver the promotion link. Upon founder review and acceptance, funds settle directly to your bank account or UPI.',
              },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3.5 text-xs">
                <span className="font-mono font-bold text-[#121214] dark:text-white bg-[#F4F4F0] dark:bg-[#27272A] w-7 h-7 rounded-md flex items-center justify-center shrink-0 border border-[#E5E5DE] dark:border-[#27272A]">
                  {s.num}
                </span>
                <div>
                  <strong className="text-[#121214] dark:text-white block font-mono text-sm">
                    {s.title}
                  </strong>
                  <span className="text-[#52525B] dark:text-[#A1A1AA] mt-0.5 block leading-relaxed">
                    {s.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link href="/auth/signup?role=creator" className="block pt-2">
            <Button
              variant="outline"
              size="md"
              className="w-full border-[#E5E5DE] dark:border-[#27272A] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]"
            >
              <span>Join as Distribution Partner</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
