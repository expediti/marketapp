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
  Clock,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
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
          A transparent, end-to-end platform connecting businesses and founders with creators and influencers for high-converting social collaborations.
        </p>
      </div>

      {/* 2 Main Columns: Businesses & Creators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. For Businesses */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#FF5416]/10 text-[#FF5416] flex items-center justify-center border border-[#FFD2C1] dark:border-[#FF5416]/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Businesses & Founders</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">Apps, SaaS, Products & Startups</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Discover Real Creators',
                desc: 'Filter verified creators by category, city, reach, engagement, and fixed package pricing. Watch their actual video reels.',
              },
              {
                num: '02',
                title: 'Send Collaboration Request',
                desc: 'Propose a collaboration with your product details, campaign goal, budget, and desired package. No charge for sending a request.',
              },
              {
                num: '03',
                title: 'Discuss in Private Chat',
                desc: 'Once the creator accepts, a private chat opens to clarify deliverables, script talking points, and logistics.',
              },
              {
                num: '04',
                title: 'Confirm Structured Deal',
                desc: 'Formalize deliverables, agreed price, delivery deadline, and included revision allowance into an official order.',
              },
              {
                num: '05',
                title: 'Platform Payment',
                desc: 'Payment is recorded securely through Market My App before production begins so both parties have protected records.',
              },
              {
                num: '06',
                title: 'Review Delivery & Complete',
                desc: 'Review the creator’s delivery within 4 days. Accept to complete the order, request an included revision, or raise a System Review.',
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
              <span>Discover Creators</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* 2. For Creators */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-zinc-800 text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">For Creators & Influencers</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">Content Creators & Video Makers</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                num: '01',
                title: 'Create Your Profile',
                desc: 'Add your niche, bio, city, languages, and upload real video reels showing your creative style.',
              },
              {
                num: '02',
                title: 'Optionally Connect Instagram',
                desc: 'Attach your Instagram account to sync metrics. Your profile and dashboard function normally even without Instagram.',
              },
              {
                num: '03',
                title: 'Set Packages & Pricing',
                desc: 'Create clear, fixed deliverables (e.g. 1 Reel, Reel + Story) with turnaround days and included revisions.',
              },
              {
                num: '04',
                title: 'Receive & Accept Requests',
                desc: 'Get genuine collaboration requests from verified businesses and founders. Accept or decline directly.',
              },
              {
                num: '05',
                title: 'Discuss & Produce Content',
                desc: 'Coordinate script requirements in private chat. If you need brand assets, flag Waiting for Business so your deadline is protected.',
              },
              {
                num: '06',
                title: 'Deliver & Receive Payout',
                desc: 'Submit your delivery draft. Upon business approval or 4-day auto-approval, your creator payout becomes payable.',
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

          <Link href="/auth/signup?role=creator" className="block pt-2">
            <Button variant="outline" size="md" className="w-full">
              <span>Join as a Creator</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* CORE PLATFORM POLICIES & RULES */}
      <div className="bg-[#FAF9F5] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="editorial-label text-[#FF5416]">Fair Marketplace Standards</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
            Key Collaboration Rules
          </h2>
          <p className="text-xs text-[#71717A] dark:text-zinc-400">
            Rules are built directly into the platform workflow to protect both sides transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {/* Rule 1: 4-Day Review & Auto-Approval */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 p-5 rounded-lg space-y-2 font-mono text-xs">
            <div className="w-8 h-8 rounded bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <strong className="text-sm font-bold text-[#121214] dark:text-white block">
              4-Day Review & Auto-Approval
            </strong>
            <p className="text-[#52525B] dark:text-zinc-400 text-[11px] leading-relaxed">
              When a creator delivers work, the business has 4 days to review. If no action is taken within 4 days, the delivery is automatically approved and creator payout becomes eligible.
            </p>
          </div>

          {/* Rule 2: Revisions Policy */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 p-5 rounded-lg space-y-2 font-mono text-xs">
            <div className="w-8 h-8 rounded bg-[#F4F4F0] dark:bg-zinc-800 text-[#121214] dark:text-white flex items-center justify-center mb-3">
              <RefreshCw className="w-4 h-4" />
            </div>
            <strong className="text-sm font-bold text-[#121214] dark:text-white block">
              Defined Revision Allowance
            </strong>
            <p className="text-[#52525B] dark:text-zinc-400 text-[11px] leading-relaxed">
              Each order includes a defined revision count (e.g. 1 included). Revisions apply when delivered work deviates from the agreed brief. Unlimited revisions are not supported.
            </p>
          </div>

          {/* Rule 3: Objective System Review */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 p-5 rounded-lg space-y-2 font-mono text-xs">
            <div className="w-8 h-8 rounded bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <strong className="text-sm font-bold text-[#121214] dark:text-white block">
              Objective System Review
            </strong>
            <p className="text-[#52525B] dark:text-zinc-400 text-[11px] leading-relaxed">
              If a deliverable misses agreed requirements (e.g., missing CTA, wrong product details), either party can raise a System Review with evidence for structured evaluation.
            </p>
          </div>

          {/* Rule 4: Platform Records */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 p-5 rounded-lg space-y-2 font-mono text-xs">
            <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <strong className="text-sm font-bold text-[#121214] dark:text-white block">
              Platform Transaction Protection
            </strong>
            <p className="text-[#52525B] dark:text-zinc-400 text-[11px] leading-relaxed">
              Keeping briefs, messages, and payments inside Market My App guarantees full transaction tracking, delivery verification, and official platform dispute protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
