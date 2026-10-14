import React from 'react';
import Link from 'next/link';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Terms & Conditions | MarketMyIdea',
  description:
    'Terms of Service and Marketplace Agreement for MarketMyIdea. Owned and operated by Amit Kumar Sharma, Jeonathpur, Uttar Pradesh, India.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Marketplace User Agreement</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Terms & Conditions
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
          {BUSINESS_INFO.proprietorName} • <strong>Address:</strong> {BUSINESS_INFO.address.fullDisplayAddress} •{' '}
          <strong>Contact Email:</strong>{' '}
          <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline font-mono">
            {BUSINESS_INFO.contact.officialEmail}
          </a>
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) govern your access to and use of the website{' '}
          <strong>{BUSINESS_INFO.contact.websiteUrl}</strong> and the services provided under the trade name{' '}
          <strong>{BUSINESS_INFO.brandName}</strong> (&quot;Marketplace&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), operated by{' '}
          <strong>{BUSINESS_INFO.proprietorName}</strong> ({BUSINESS_INFO.legalStructure}), residing in {BUSINESS_INFO.address.fullDisplayAddress}.
        </p>
        <p>
          By creating an account, browsing the marketplace, commissioning promotional packages, or accepting collaboration requests, you agree to be bound by these Terms, our{' '}
          <Link href="/privacy" className="text-[#FF5416] hover:underline font-semibold">
            Privacy Policy
          </Link>
          , our{' '}
          <Link href="/refund-policy" className="text-[#FF5416] hover:underline font-semibold">
            Refund & Cancellation Policy
          </Link>
          , and our{' '}
          <Link href="/shipping-policy" className="text-[#FF5416] hover:underline font-semibold">
            Shipping and Delivery Policy
          </Link>
          .
        </p>

        {/* 1. What MarketMyIdea Does & Platform Intermediary Role */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Platform Intermediary Role & Scope of Services
          </h2>
          <p>
            {BUSINESS_INFO.brandName} is a two-sided technology marketplace that connects businesses, application developers, indie founders, and small merchants (&quot;Businesses&quot;) with independent content creators, influencers, and community leaders (&quot;Creators&quot;) for paid digital promotional campaigns.
          </p>
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
            <strong>Clear Distinction of Platform Role:</strong>
            <p>
              {BUSINESS_INFO.brandName} acts strictly as an electronic marketplace platform and intermediary facilitating discovery, communication, deal locking, and milestone tracking. Creators are independent third parties and are NOT employees, agents, partners, or joint venturers of {BUSINESS_INFO.brandName} or {BUSINESS_INFO.proprietorName}. We do not author, direct, or endorse the creative content produced by Creators.
            </p>
          </div>
        </section>

        {/* 2. Eligibility & Account Responsibilities */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. Eligibility & Account Responsibilities
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              You must be at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872.
            </li>
            <li>
              You must provide accurate, current, and complete registration details. You are responsible for safeguarding your login credentials.
            </li>
            <li>
              Creators must have genuine, authentic social media accounts that they personally control. Misrepresenting follower counts, utilizing artificial bot engagement, or impersonating others will result in immediate profile removal and account termination.
            </li>
            <li>
              Both Creator and Business account holders may request account deletion at any time via their dashboard settings or by visiting our{' '}
              <Link href="/delete-account" className="text-[#FF5416] hover:underline">
                Account Deletion page
              </Link>
              , subject to legitimate legal and accounting record-keeping requirements.
            </li>
          </ul>
        </section>

        {/* 3. Campaign Proposals & Deal Confirmation */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Campaign Creation, Proposals & Acceptance
          </h2>
          <p>
            The campaign workflow on {BUSINESS_INFO.brandName} operates through a structured milestone process:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Browsing & Proposals:</strong> Businesses can browse Creator rate cards for free and submit a structured collaboration request specifying their product name, promotional goals, key talking points, do&apos;s & don&apos;ts, and deadline.
            </li>
            <li>
              <strong>Creator Review:</strong> The Creator reviews the proposal and may accept, decline, or suggest proposal adjustments. Private in-app chat unlocks only after mutual interest or acceptance.
            </li>
            <li>
              <strong>Deal Confirmation:</strong> Once deliverables, price, deadline, and revision allowances are agreed upon, terms are locked into a binding order brief.
            </li>
          </ul>
        </section>

        {/* 4. Payments, Pricing & Platform Protection */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. Payments, Pricing & Platform Protection Fee
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Currency:</strong> All transactions and package prices on {BUSINESS_INFO.brandName} are listed and billed in <strong>Indian Rupees (INR - ₹)</strong>.
            </li>
            <li>
              <strong>Zero Subscriptions:</strong> There are no recurring subscription fees or upfront listing charges to use the marketplace.
            </li>
            <li>
              <strong>Platform Protection Fee:</strong> A transparent platform fee of <strong>{BUSINESS_INFO.economics.platformFeePercentage}%</strong> is applied to cover transaction verification, dispute mediation, infrastructure, and delivery tracking.
            </li>
            <li>
              <strong>Payment Collection:</strong> Payments are collected securely from the Business through authorized, PCI-DSS compliant third-party payment gateway partners (e.g. PayU / Razorpay). Sensitive card credentials or netbanking passwords are never collected or stored on our servers.
            </li>
            <li>
              <strong>Platform Payment Holding:</strong> The Business deposits the total order amount upon deal confirmation. Funds are held in platform payment protection pending verified delivery and business acceptance. (Note: This is an internal milestone payment holding mechanism and does not constitute a licensed third-party banking escrow service).
            </li>
            <li>
              <strong>Creator Payouts:</strong> Upon order completion (or 4-day auto-approval), the net payout (order subtotal minus applicable platform fee) is initiated manually to the Creator&apos;s verified Indian bank account or UPI ID.
            </li>
            <li>
              <strong>No Off-Platform Bypass:</strong> Arranging, requesting, or making direct payments outside the platform for collaborations initiated on {BUSINESS_INFO.brandName} is strictly prohibited and constitutes grounds for immediate permanent ban and forfeiture of pending claims.
            </li>
          </ul>
        </section>

        {/* 5. Creator Deliverables & Submission Requirements */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Creator Deliverables & Submission Requirements
          </h2>
          <p>
            Creators agree to produce and submit deliverables that comply with the agreed brief:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>Deliverables are purely digital promotional content (e.g. Instagram Reels, Story series, promotional videos, broadcast posts).</li>
            <li>Submission proof (live public post URL or draft media files) must be uploaded directly to the platform order workspace before the agreed deadline.</li>
            <li>All promotional posts must visibly disclose the sponsorship in compliance with the Advertising Standards Council of India (ASCI) Influencer Guidelines (e.g., using #ad, #sponsored, or official Instagram Paid Partnership labels).</li>
            <li>Promotional posts must remain publicly active on the Creator&apos;s channel for the duration agreed in the rate card (typically a minimum of 30 days).</li>
          </ul>
        </section>

        {/* 6. Review, Revisions & 4-Day Auto-Approval */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Review, Revisions & 4-Day Auto-Approval
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Inspection Window:</strong> The Business has <strong>{BUSINESS_INFO.support.autoApproveDays} calendar days (96 hours)</strong> from the timestamp of delivery submission to inspect the work, approve it, request an included revision, or raise an issue.
            </li>
            <li>
              <strong>Revisions:</strong> Revisions must align strictly with the original agreed brief. Requests for completely new creative concepts or features not in the initial brief may be declined by the Creator or require an additional fee.
            </li>
            <li>
              <strong>Automatic Approval:</strong> If the Business fails to approve or raise a dispute within {BUSINESS_INFO.support.autoApproveDays} days, the system automatically marks the delivery as approved, completing the order and clearing funds for creator payout. This safeguard ensures Creators are not left unpaid due to client inaction.
            </li>
          </ul>
        </section>

        {/* 7. Cancellations, Refunds & Dispute Handling */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Cancellations, Refunds & Dispute Handling (System Review)
          </h2>
          <p>
            Cancellations and refunds are governed strictly by our separate{' '}
            <Link href="/refund-policy" className="text-[#FF5416] hover:underline font-semibold">
              Refund & Cancellation Policy
            </Link>
            , which is incorporated by reference into these Terms.
          </p>
          <p>
            In the event of an unresolvable disagreement regarding brief fulfillment, either party may trigger <strong>System Review</strong> on the active order page. MarketMyIdea reviews the brief, chat records, and delivery proofs objectively within 24–48 business hours. Our administrative determination on fund release or refund distribution is binding for the purposes of the platform.
          </p>
        </section>

        {/* 8. Prohibited Activities */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. Prohibited Activities & Conduct
          </h2>
          <p>Users of MarketMyIdea agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li>Circumvent the platform by soliciting direct payments or exchanging off-platform payment details before deal confirmation</li>
            <li>Use automated scripts, bots, scraping tools, or fake followers/engagement</li>
            <li>Promote illegal goods, gambling, adult content, fraudulent schemes, or deceptive medical claims</li>
            <li>Infringe third-party intellectual property, trademarks, or copyrights</li>
            <li>Harass, intimidate, defame, or defraud any other user or platform administrator</li>
            <li>Interfere with platform infrastructure, security measures, or payment processing protocols</li>
          </ul>
        </section>

        {/* 9. Intellectual Property & Commercial Licensing */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            9. Intellectual Property & Commercial Licensing
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Platform IP:</strong> The trade name &quot;{BUSINESS_INFO.brandName}&quot;, logos, user interface design, website code, and visual assets are owned exclusively by {BUSINESS_INFO.proprietorName}.
            </li>
            <li>
              <strong>Creator Content Rights:</strong> Unless explicitly agreed otherwise in writing between the parties, the Creator retains underlying copyright in promotional materials they author, and grants the Business a non-exclusive, worldwide, royalty-free license to repost, share, and digitally display the delivered content for the agreed promotional duration.
            </li>
            <li>
              <strong>Business Assets:</strong> The Business grants the Creator a limited, revocable license to display their logos, app screenshots, and product assets strictly for the purpose of executing the agreed promotional campaign.
            </li>
          </ul>
        </section>

        {/* 10. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            10. Disclaimers & Limitation of Liability
          </h2>
          <p>
            {BUSINESS_INFO.brandName} does not guarantee any specific commercial performance, conversion rates, app installs, website traffic, or sales volume resulting from any creator campaign. All collaborations are entered into at the independent discretion of the Business and Creator.
          </p>
          <p>
            To the maximum extent permitted under applicable Indian law, {BUSINESS_INFO.proprietorName} and {BUSINESS_INFO.brandName} shall not be liable for any indirect, incidental, punitive, or consequential damages arising from use of the platform.
          </p>
        </section>

        {/* 11. Suspension & Termination */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            11. Account Suspension & Termination
          </h2>
          <p>
            We reserve the right to suspend or permanently terminate user accounts that violate these Terms, engage in deceptive marketing, fail to fulfill confirmed campaigns, or pose financial or legal risks to the marketplace, with or without prior notice.
          </p>
        </section>

        {/* 12. Governing Law & Jurisdiction */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            12. Governing Law & Dispute Jurisdiction
          </h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the Republic of India. Any legal action, suit, or proceeding arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in Uttar Pradesh, India.
          </p>
        </section>

        {/* 13. Grievance Officer & Customer Contact */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            13. Customer Support & Grievance Redressal
          </h2>
          <p>
            For customer support, order inquiries, or statutory grievances under the Information Technology (Intermediary Guidelines) Rules, 2021:
          </p>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-1.5 font-mono text-xs">
            <p><strong>Platform:</strong> {BUSINESS_INFO.brandName} ({BUSINESS_INFO.contact.websiteUrl})</p>
            <p><strong>Legal Operator / Grievance Officer:</strong> {BUSINESS_INFO.proprietorName}</p>
            <p><strong>Address:</strong> {BUSINESS_INFO.address.fullDisplayAddress}</p>
            <p>
              <strong>Official Email:</strong>{' '}
              <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline">
                {BUSINESS_INFO.contact.officialEmail}
              </a>
            </p>
            <p>
              <strong>Grievance Redressal Page:</strong>{' '}
              <Link href="/grievance" className="text-[#FF5416] hover:underline">
                View Grievance Mechanism →
              </Link>
            </p>
          </div>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Have questions regarding our Terms?</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:text-[#FF5416] transition-colors">
            Contact Support
          </Link>
          <Link href="/privacy" className="hover:text-[#FF5416] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-[#FF5416] transition-colors">
            Refund Policy
          </Link>
          <Link href="/shipping-policy" className="hover:text-[#FF5416] transition-colors">
            Shipping Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
