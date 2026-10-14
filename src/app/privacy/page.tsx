import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, Mail, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Privacy Policy | MarketMyIdea',
  description:
    'Privacy Policy for MarketMyIdea. Explaining data collection, payment information handling, Instagram API integration, and user privacy rights. Operated by Amit Kumar Sharma.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Privacy & Data Protection Policy</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Privacy Policy
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
          <strong>Privacy Contact:</strong>{' '}
          <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline font-mono">
            {BUSINESS_INFO.contact.officialEmail}
          </a>
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          At <strong>{BUSINESS_INFO.brandName}</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), operated by{' '}
          <strong>{BUSINESS_INFO.proprietorName}</strong>, we are committed to transparent and ethical data practices. This Privacy Policy details what information we collect when you use our website ({BUSINESS_INFO.contact.websiteUrl}) and marketplace services, why we collect it, how it is processed and protected, and your rights regarding your personal information under the Information Technology Act, 2000, the Digital Personal Data Protection Act, 2023, and applicable Indian data protection laws.
        </p>

        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            We collect only the minimum personal and business data necessary to facilitate marketplace matchmaking, order execution, payments, and security:
          </p>
          <ul className="list-disc pl-5 space-y-2 font-mono text-xs">
            <li>
              <strong>Account & Profile Information:</strong> When you sign up via Google OAuth or email, we collect your full name, email address, profile photo, and chosen platform role (Business or Creator).
            </li>
            <li>
              <strong>Business Profile Details:</strong> Company/app name, website URL, target audience niche, business category, and operational location provided during onboarding.
            </li>
            <li>
              <strong>Creator Profile & Social Metrics:</strong> Instagram handle, biographical description, content niche, city/state, audience reach metrics, and publicly shared sample demonstration reels. If you connect via the official Instagram API, we receive basic public profile information and metrics strictly as permitted by your consent and Meta Platform Terms.
            </li>
            <li>
              <strong>Campaign Briefs & Workspace Communication:</strong> Promotion objectives, talking points, product links, delivery deadlines, revision notes, and in-app chat messages exchanged within active collaboration workspaces.
            </li>
            <li>
              <strong>Payment & Transaction Information:</strong> Order numbers, billing amounts, platform fees, payment timestamps, and transaction reference IDs issued by our payment gateway. For creators, we collect your designated UPI Virtual Payment Address (VPA) or verified bank account details strictly to disburse order payouts. <em>(Note: We do NOT store credit/debit card numbers, CVVs, expiry dates, or netbanking passwords on our servers; all card and UPI processing is handled directly by PCI-DSS compliant payment gateways).</em>
            </li>
            <li>
              <strong>Technical & Usage Data:</strong> IP addresses, browser user agent, device operating system, access timestamps, and page interaction logs collected for security auditing, fraud detection, and platform stability.
            </li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. How We Use Your Information
          </h2>
          <p>We process your data strictly for legitimate operational purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>To operate and maintain the {BUSINESS_INFO.brandName} marketplace platform</li>
            <li>To match Businesses with relevant Creators based on niche, location, and rate cards</li>
            <li>To facilitate deal proposals, brief confirmation, and private collaboration workspaces</li>
            <li>To process payments via authorized third-party payment gateways and disburse creator payouts</li>
            <li>To mediate order disputes and verify delivery fulfillment via System Review</li>
            <li>To prevent fraud, multiple fake accounts, spam, and off-platform bypass</li>
            <li>To comply with legal, tax, accounting, and regulatory obligations in India</li>
          </ul>
        </section>

        {/* 3. Third-Party Payment Providers & Data Sharing */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Third-Party Payment Providers & Data Sharing
          </h2>
          <p>
            We do NOT sell, rent, or trade your personal information to marketing aggregators or third parties. We share information only with trusted service providers strictly as required to deliver our services:
          </p>
          <ul className="list-disc pl-5 space-y-2 font-mono text-xs">
            <li>
              <strong>Payment Gateway Partners (PayU / Razorpay):</strong> We share transaction amounts and order IDs with PCI-DSS certified payment processors to securely process customer checkouts and payouts. Payment data is encrypted and handled in compliance with Reserve Bank of India (RBI) payment aggregator regulations.
            </li>
            <li>
              <strong>Cloud & Database Hosting (Supabase / Cloudflare):</strong> Our databases and server infrastructure are securely hosted using enterprise cloud providers with encrypted data storage and strict Row Level Security (RLS) policies.
            </li>
            <li>
              <strong>Meta / Instagram API:</strong> Creator metrics are fetched via official Graph API endpoints in strict compliance with Meta Developer Policies and data permissions.
            </li>
            <li>
              <strong>Legal Authorities:</strong> If required by valid court order, subpoena, law enforcement inquiry, or statutory regulation under Indian law.
            </li>
          </ul>
        </section>

        {/* 4. Data Retention & Deletion */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. Data Retention & Account Deletion
          </h2>
          <p>
            We retain personal data for as long as your account remains active. Users may request full account deletion at any time:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Self-Service Deletion:</strong> You can permanently delete your account directly through your dashboard settings or by visiting our{' '}
              <Link href="/delete-account" className="text-[#FF5416] hover:underline font-semibold">
                Account Deletion Page
              </Link>
              .
            </li>
            <li>
              <strong>Email Deletion Request:</strong> You can submit a deletion request to{' '}
              <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}?subject=Account%20Deletion%20Request`} className="text-[#FF5416] hover:underline font-mono">
                {BUSINESS_INFO.contact.officialEmail}
              </a>
              .
            </li>
            <li>
              <strong>Statutory Record Retention:</strong> When an account is deleted, personal profile data, public listings, and credentials are removed immediately. However, completed financial transactions, tax invoices, and dispute resolution records are retained for statutory periods as mandated by Indian tax and accounting laws.
            </li>
          </ul>
        </section>

        {/* 5. Security Measures */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Security Measures
          </h2>
          <p>
            We implement reasonable technical and organizational safeguards to protect your personal data from unauthorized access, disclosure, or misuse:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li>HTTPS / TLS 1.3 encryption across all website communications and API traffic</li>
            <li>Row Level Security (RLS) at the database layer ensuring users can access only their own authorized records</li>
            <li>OAuth 2.0 tokenized authentication and server-side session verification</li>
            <li>Strict separation of payment secrets: payment gateway API secret keys are stored securely on server environments and are never exposed to client browsers</li>
          </ul>
          <p className="text-xs text-[#71717A] dark:text-zinc-400">
            While no online platform is 100% impenetrable, we continually monitor, audit, and patch our systems against emerging vulnerabilities.
          </p>
        </section>

        {/* 6. User Privacy Rights */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Your Privacy Rights
          </h2>
          <p>Under applicable Indian data privacy regulations, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li>Access a summary of the personal information we hold about you</li>
            <li>Correct inaccurate, outdated, or incomplete personal data</li>
            <li>Withdraw previously granted consent for non-essential processing</li>
            <li>Request erasure of your account and personal profile data</li>
            <li>Nominate a representative in accordance with applicable data protection laws</li>
          </ul>
        </section>

        {/* 7. Children's Privacy */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Children&apos;s Privacy
          </h2>
          <p>
            {BUSINESS_INFO.brandName} is intended exclusively for individuals aged 18 and older. We do not knowingly solicit or collect personal information from minors. If we discover that personal data of a minor has been collected without parental consent, we will promptly delete it.
          </p>
        </section>

        {/* 8. Policy Updates */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time to reflect operational, legal, or regulatory updates. Any revisions will be published on this page with an updated effective date. Continued use of the platform after updates indicates acceptance of the revised policy.
          </p>
        </section>

        {/* 9. Contact for Privacy & Grievances */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            9. Privacy Contact & Grievance Officer
          </h2>
          <p>
            For any questions, data access requests, or privacy-related concerns:
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
              <strong>Grievance Escalation:</strong>{' '}
              <Link href="/grievance" className="text-[#FF5416] hover:underline">
                View Grievance Redressal Procedure →
              </Link>
            </p>
          </div>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Official Privacy Policy of MarketMyIdea</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:text-[#FF5416] transition-colors">
            Contact Support
          </Link>
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms of Service
          </Link>
          <Link href="/refund-policy" className="hover:text-[#FF5416] transition-colors">
            Refund Policy
          </Link>
          <Link href="/delete-account" className="hover:text-[#FF5416] transition-colors">
            Delete Account
          </Link>
        </div>
      </div>
    </div>
  );
}
