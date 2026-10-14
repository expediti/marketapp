import React from 'react';
import Link from 'next/link';
import { RotateCcw, AlertCircle, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Refund & Cancellation Policy | MarketMyIdea',
  description:
    'Comprehensive stage-based cancellation and refund guidelines for MarketMyIdea. Operated by Amit Kumar Sharma, Jeonathpur, Uttar Pradesh, India.',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Stage-Based Order Protection Framework</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Refund & Cancellation Policy
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
          {BUSINESS_INFO.proprietorName} • <strong>Location:</strong> {BUSINESS_INFO.address.fullDisplayAddress} •{' '}
          <strong>Support Email:</strong>{' '}
          <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline font-mono">
            {BUSINESS_INFO.contact.officialEmail}
          </a>
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          At <strong>{BUSINESS_INFO.brandName}</strong>, operated by <strong>{BUSINESS_INFO.proprietorName}</strong>, our milestone-based order lifecycle is designed to protect both Businesses commissioning promotional campaigns and independent Creators delivering digital content. This policy clearly outlines cancellation rights, refund eligibility, and resolution mechanisms at each distinct stage of a collaboration.
        </p>

        {/* 1. Cancellation Before a Campaign Begins */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Business Cancellation Before a Campaign Begins (Prior to Payment)
          </h2>
          <p>
            If a Business submits a collaboration proposal that is declined by the Creator, or if negotiations conclude before terms are confirmed and payment is deposited, no monetary transaction has occurred. In this scenario, the proposal is closed automatically and no cancellation charges or refunds apply.
          </p>
        </section>

        {/* 2. Cancellation After Creator Accepts but Before Work Starts */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. Cancellation After Deal Confirmation, Before Work Starts
          </h2>
          <p>
            Once a deal is confirmed and the Business deposits the campaign funds into platform payment protection:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Cancellation by Business:</strong> If the Business requests cancellation <em>before</em> the Creator marks the order as &quot;Started&quot; (prior to commencement of video production or scripting), the Business is eligible for a refund of the order subtotal. Non-refundable payment gateway transaction charges levied by the third-party payment gateway (if any) may be deducted.
            </li>
            <li>
              <strong>Cancellation by Creator:</strong> If the Creator cancels or declines to proceed before commencing work, 100% of the deposited amount is refunded to the Business.
            </li>
          </ul>
        </section>

        {/* 3. Cancellation After Work Has Started */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Cancellation After Work Has Started
          </h2>
          <p>
            Once the Creator has formally marked the order as &quot;Started&quot; and commenced production:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>Orders cannot be cancelled unilaterally with an immediate automated full refund, as the Creator has already allocated time and creative resources.</li>
            <li>If either party wishes to cancel due to unforeseen circumstances or irreconcilable brief divergence, the order must be escalated to <strong>System Review</strong>.</li>
            <li>Our administrative review evaluates script drafts, progress evidence, and chat logs to arrive at an equitable resolution, which may include a mutual partial refund to the Business and partial compensation to the Creator for work performed.</li>
          </ul>
        </section>

        {/* 4. Influencer Failure to Deliver (Missed Deadlines) */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. Influencer Failure to Deliver
          </h2>
          <p>
            Creators are obligated to submit agreed digital deliverables on or before the confirmed deadline:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>If a Creator fails to submit the delivery by the confirmed deadline without an approved deadline extension from the Business, the Business may cancel the order.</li>
            <li>Upon verification of unexcused non-delivery, the Business is entitled to a <strong>100% full refund</strong> of the deposited amount.</li>
            <li>Repeated unexcused missed deadlines by a Creator will lead to penalty strikes and removal from the platform directory.</li>
          </ul>
        </section>

        {/* 5. Rejected Deliverables & Revision Requests */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Rejected Deliverables & Revision Requests
          </h2>
          <p>
            When a Creator submits delivery proofs (e.g. video drafts or live post links):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Included Revisions:</strong> Every package includes specified revision allowances (typically 1 revision). If the deliverable requires minor edits (e.g., pronunciation correction, caption tweak, audio adjustment) consistent with the initial brief, the Business should submit a revision request within the platform workspace.
            </li>
            <li>
              <strong>Material Non-Compliance:</strong> If the deliverable completely fails to mention mandatory key talking points or clearly violates the brief&apos;s explicit &quot;Don&apos;ts&quot;, the Business can reject the delivery and escalate to System Review.
            </li>
            <li>
              <strong>Subjective Preference:</strong> A refund cannot be issued simply because the Business changes its creative mind, changes product direction after recording, or dislikes personal creative style that was already visible in the Creator&apos;s public rate card samples.
            </li>
          </ul>
        </section>

        {/* 6. 4-Day Automatic Approval Window */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. 4-Day Automatic Approval Window
          </h2>
          <p>
            Upon delivery submission by the Creator, the Business has <strong>{BUSINESS_INFO.support.autoApproveDays} calendar days (96 hours)</strong> to inspect the deliverable and take action (Approve, Request Revision, or Raise Dispute).
          </p>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-1 text-xs">
            <span className="font-bold text-[#121214] dark:text-white block font-mono">
              Auto-Approval Safeguard:
            </span>
            <p className="text-[#52525B] dark:text-zinc-300">
              If no action or dispute is initiated within {BUSINESS_INFO.support.autoApproveDays} days, the order is automatically approved by the platform and funds are released for creator payout. Once an order is auto-approved, refund requests cannot be entertained, except in documented cases of fraudulent proof.
            </p>
          </div>
        </section>

        {/* 7. Disputed Campaigns (System Review) */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Disputed Campaigns & System Review
          </h2>
          <p>
            If a dispute arises that cannot be resolved amicably through direct messaging:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>Either party can initiate <strong>System Review</strong> directly from the order page.</li>
            <li>Both parties may upload supporting evidence (screenshots, draft files, chat excerpts).</li>
            <li>Our administrative team reviews the dispute within {BUSINESS_INFO.support.disputeTurnaround}.</li>
            <li>The outcome (full refund, partial refund, or order completion with payout) is determined objectively based on verifiable brief compliance.</li>
          </ul>
        </section>

        {/* 8. Refund Processing Timeline & Method */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. Refund Eligibility & Processing Timelines
          </h2>
          <div className="p-4 bg-[#ECFDF5] dark:bg-[#064E3B]/20 border border-[#A7F3D0] dark:border-[#065F46] rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold font-mono text-[#065F46] dark:text-[#34D399]">
              <Clock className="w-4 h-4" />
              <span>Settlement Window: {BUSINESS_INFO.support.refundSettlementWindow}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[#047857] dark:text-[#A7F3D0] font-mono text-xs">
              <li>Approved refunds are authorized electronically on the payment gateway within 24–48 hours of resolution.</li>
              <li>Refunded amounts are credited directly back to the <strong>original source of payment</strong> (credit/debit card, netbanking account, or UPI VPA) used during checkout.</li>
              <li>Depending on the card issuing bank or payment network, credited funds typically reflect in the customer&apos;s statement within <strong>5 to 7 business days</strong>.</li>
            </ul>
          </div>
        </section>

        {/* 9. Payment Gateway & Third-Party Fees */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            9. Payment Gateway & Platform Fees
          </h2>
          <p>
            Third-party payment gateway transaction fees incurred on the original transaction are levied by the payment processing partner (PayU / Razorpay) for executing the payment attempt. Where a cancellation is initiated solely due to a business change of mind, any non-recoverable payment gateway transaction surcharge may be deducted from the refund payout.
          </p>
        </section>

        {/* 10. How to Request a Cancellation or Refund */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            10. How to Request a Cancellation or Support
          </h2>
          <p>
            To initiate a cancellation, request a refund, or report an order dispute:
          </p>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-1.5 font-mono text-xs">
            <p><strong>Primary Method:</strong> Click <strong>&quot;System Review / Raise Dispute&quot;</strong> on your active order workspace page.</p>
            <p>
              <strong>Email Support:</strong> Send your <strong>Order ID</strong> and issue details to{' '}
              <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline">
                {BUSINESS_INFO.contact.officialEmail}
              </a>
            </p>
            <p><strong>Support Operating Hours:</strong> {BUSINESS_INFO.support.hours}</p>
            <p><strong>Resolution Window:</strong> {BUSINESS_INFO.support.responseTime}</p>
          </div>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Need help with an active order?</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:text-[#FF5416] transition-colors">
            Contact Support
          </Link>
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms of Service
          </Link>
          <Link href="/shipping-policy" className="hover:text-[#FF5416] transition-colors">
            Shipping & Delivery
          </Link>
          <Link href="/grievance" className="hover:text-[#FF5416] transition-colors">
            Grievance Redressal
          </Link>
        </div>
      </div>
    </div>
  );
}
