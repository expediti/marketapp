import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2, HeartHandshake, Users, Radio } from 'lucide-react';

export const metadata = {
  title: 'About Us | Market My Idea',
  description:
    'Market My Idea is a distribution and discovery platform connecting developers, founders, and small businesses with existing audiences across creators and communities.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
      {/* Editorial Header */}
      <div className="space-y-4">
        <span className="editorial-label text-[#FF5416]">Our Mission</span>
        <h1 className="font-mono text-3xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight leading-tight">
          Big agencies aren&apos;t built for everyone.
        </h1>
        <p className="text-base sm:text-lg text-[#52525B] dark:text-[#A1A1AA] leading-relaxed max-w-2xl">
          We help local developers, vendors, founders, and small businesses promote their apps, websites, products, services, and local businesses without agency-scale marketing budgets.
        </p>
      </div>

      {/* Core Mission Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 space-y-4 shadow-xs">
          <span className="editorial-label text-[#B91C1C] dark:text-rose-400">The Problem</span>
          <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
            &ldquo;I built something, but I don&apos;t know where to promote it.&rdquo;
          </h3>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Traditional marketing agencies require massive retainer commitments and are built for multinational corporations. Direct messaging random accounts on social media leads to ghosting, lack of accountability, and zero payment protection.
          </p>
          <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
            Builders and small business owners waste weeks trying to get attention, while creators and community leaders deal with vague briefs and delayed payments.
          </p>
        </div>

        <div className="bg-[#121214] text-white border border-[#27272A] rounded-2xl p-8 space-y-4 shadow-xs">
          <span className="editorial-label text-[#FF5416]">The Solution</span>
          <h3 className="font-mono text-xl font-bold text-white">
            &ldquo;Find creators and communities that already have the audience you need.&rdquo;
          </h3>
          <p className="text-xs text-[#D4D4D8] leading-relaxed">
            Market My Idea solves distribution by organizing verified creators, channels, and communities with clear fixed pricing, structured requests, and protected milestone transactions.
          </p>
          <ul className="text-xs text-[#A1A1AA] space-y-2 font-mono pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Affordable promotion with no agency retainers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Relevant existing audiences matching your exact demographic</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Direct and transparent communication in a dedicated workspace</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
              <span>Payment protection holding funds until deliverables are approved</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-[#FF5416]" />
          <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Our Values</h3>
        </div>
        <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
          We believe high-quality distribution should not be reserved only for venture-backed companies with six-figure budgets. Whether you are an indie developer who spent weekends building a mobile app or a local vendor launching in Varanasi or Bengaluru, you deserve direct access to the audiences that matter.
        </p>
      </div>

      {/* CTA */}
      <div className="bg-[#121214] text-white border border-[#27272A] rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-mono text-lg font-bold text-white">
            Ready to find your audience?
          </h3>
          <p className="text-xs text-[#A1A1AA]">
            Discover creators and communities across India or join as a distribution partner today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/discover">
            <Button variant="primary" size="md">
              <span>Find Your Audience</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              size="md"
              className="text-white border-[#3F3F46] hover:bg-[#27272A]"
            >
              <span>Contact Us</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
