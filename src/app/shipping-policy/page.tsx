import React from 'react';
import Link from 'next/link';
import { Truck, CheckCircle2, ShieldCheck, Clock, FileCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Shipping and Delivery Policy | MarketMyIdea',
  description:
    'Shipping and Delivery Policy for MarketMyIdea. Explaining digital service deliverables, submission workflows, review windows, and zero physical shipping.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Fulfillment & Delivery Framework</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Shipping and Delivery Policy
        </h1>
        <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
          Last updated: October 14, 2026 • Effective Date: Immediately
        </p>
      </div>

      {/* Operator notice banner */}
      <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-1 text-xs">
        <p className="text-[#3F3F46] dark:text-zinc-300">
          <strong>Website:</strong>{' '}
          <a href={BUSINESS_INFO.contact.websiteUrl} className="text-[#FF5416] hover:underline font-mono">
            {BUSINESS_INFO.contact.websiteUrl}
          </a>{' '}
          • <strong>Brand Name:</strong> {BUSINESS_INFO.brandName} • <strong>Legal Operator:</strong>{' '}
          {BUSINESS_INFO.proprietorName} • <strong>Location:</strong> {BUSINESS_INFO.address.fullDisplayAddress}
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        {/* Important notice */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs sm:text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-bold font-mono text-sm">
            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Digital Promotional Services — No Physical Goods Shipped</span>
          </div>
          <p className="leading-relaxed">
            MarketMyIdea operates an online marketplace connecting business owners and app founders with independent content creators and influencers. All deliverables provided through MarketMyIdea are <strong>strictly digital marketing and promotional services</strong>. We do not sell, stock, or ship any tangible physical merchandise.
          </p>
        </div>

        {/* 1. Nature of Deliverables */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Nature of Deliverables
          </h2>
          <p>
            Deliverables purchased through MarketMyIdea consist exclusively of electronic content creation, promotional broadcasts, and digital marketing materials agreed between the Business and the Creator. These include, but are not limited to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>Instagram promotional Reels, short-form product demonstration videos, or walkthroughs</li>
            <li>Instagram Story series, swipe-up/sticker promotions, and highlights</li>
            <li>Digital broadcast announcements across authorized community channels</li>
            <li>Digital creative assets (video files, graphic banners, voiceover audio clips) delivered electronically</li>
          </ul>
        </section>

        {/* 2. Mode of Delivery */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. Mode of Delivery
          </h2>
          <p>
            All delivery of services occurs electronically directly through the MarketMyIdea platform order workspace:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Proof of Publication:</strong> When a promotional post is published on social media, the Creator submits the live public URL (e.g. Instagram Reel link, post link, or broadcast link) in the order delivery tab.
            </li>
            <li>
              <strong>Media File Deliveries:</strong> For pre-publication draft review or raw video deliverables, the Creator provides accessible cloud storage links or direct file uploads within the platform workspace.
            </li>
            <li>
              <strong>Timestamped Record:</strong> Each delivery submission is automatically timestamped and logged in our system, triggering immediate notification to the Business.
            </li>
          </ul>
        </section>

        {/* 3. Delivery Timelines */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Delivery Timelines
          </h2>
          <p>
            Delivery turnaround times are clearly agreed upon before work commences:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Package Standard Turnaround:</strong> Creators specify estimated delivery timeframes on their profile rate cards (typically between 3 to 14 business days).
            </li>
            <li>
              <strong>Brief Deadline Agreement:</strong> During campaign proposal creation, the Business specifies a target deadline. Once the Creator accepts and the deal terms are locked, this deadline becomes binding on the order.
            </li>
            <li>
              <strong>Deadline Extensions:</strong> If additional time is required due to mutual brief adjustments or draft revisions, the Creator may request a deadline extension through the platform, which must be approved by the Business.
            </li>
          </ul>
        </section>

        {/* 4. Inspection, Revision & Acceptance Window */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. Inspection, Revision & Acceptance Window
          </h2>
          <p>
            To ensure complete quality and satisfaction, the platform provides a structured inspection process upon digital delivery:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Inspection Window:</strong> Upon delivery submission by the Creator, the Business has a <strong>4-day inspection window</strong> to review the submitted promotional proof or draft.
            </li>
            <li>
              <strong>Acceptance:</strong> If the deliverable fulfills the agreed brief requirements, the Business clicks &quot;Accept Delivery&quot;, marking the order complete and clearing payout to the Creator.
            </li>
            <li>
              <strong>Revision Requests:</strong> If adjustments are needed and included revisions remain under the package, the Business may request a revision detailing the required changes.
            </li>
            <li>
              <strong>Automatic Approval:</strong> If the Business does not take action or raise a dispute within 4 days (96 hours) from delivery submission, the delivery is automatically approved and cleared for payout. This protects Creators from uncommunicative clients.
            </li>
          </ul>
        </section>

        {/* 5. Shipping Charges */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Shipping Charges & Courier Details
          </h2>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-2">
            <p className="font-mono text-xs font-bold text-[#121214] dark:text-white">
              Applicable Shipping Fee: ₹0.00 (Zero)
            </p>
            <p className="text-xs text-[#52525B] dark:text-zinc-300">
              Because all transactions relate strictly to electronic digital promotional services delivered online, <strong>no shipping charges, delivery fees, customs duties, courier surcharges, or physical logistics costs</strong> are ever billed to customers.
            </p>
          </div>
        </section>

        {/* 6. Non-Delivery & Failure to Fulfill */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Non-Delivery & Failure to Fulfill
          </h2>
          <p>
            If a Creator fails to deliver the agreed digital promotional work by the confirmed deadline without an approved extension, the Business is entitled to cancel the order and receive a full refund under our{' '}
            <Link href="/refund-policy" className="text-[#FF5416] hover:underline font-semibold">
              Refund & Cancellation Policy
            </Link>
            .
          </p>
        </section>

        {/* 7. Contact for Delivery Inquiries */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Delivery Support & Inquiries
          </h2>
          <p>
            For any questions regarding order delivery status, proof verification, or delivery timeline disputes, please contact us:
          </p>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-1.5 font-mono text-xs">
            <p>
              <strong>Brand Name:</strong> {BUSINESS_INFO.brandName}
            </p>
            <p>
              <strong>Legal Operator:</strong> {BUSINESS_INFO.proprietorName}
            </p>
            <p>
              <strong>Address:</strong> {BUSINESS_INFO.address.fullDisplayAddress}
            </p>
            <p>
              <strong>Support Email:</strong>{' '}
              <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline">
                {BUSINESS_INFO.contact.officialEmail}
              </a>
            </p>
            <p>
              <strong>Support Working Hours:</strong> {BUSINESS_INFO.support.hours}
            </p>
          </div>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Need assistance with an active delivery?</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:text-[#FF5416] transition-colors">
            Contact Support
          </Link>
          <Link href="/refund-policy" className="hover:text-[#FF5416] transition-colors">
            Refund Policy
          </Link>
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
