import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Market My Idea',
  description:
    'Privacy Policy for Market My Idea. Explaining data collection, Instagram API usage, account deletion, and user data rights.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <span className="editorial-label text-[#FF5416]">Privacy & Data Protection</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
          Last updated: October 5, 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          Market My Idea (&quot;we,&quot; &quot;us&quot;, &quot;marketmyidea.online&quot;) respects your privacy. This policy explains what data we collect, why, and how it is securely processed and handled.
        </p>

        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-2 font-mono text-xs">
            <li>
              <strong>Account information:</strong> Name, email address, profile avatar (authenticated securely via Google login).
            </li>
            <li>
              <strong>Business details:</strong> Company/app name, website, industry niche, and operational location for Business accounts.
            </li>
            <li>
              <strong>Creator details:</strong> Instagram account information (via Instagram Login / Graph API), including follower count, engagement data, public media identifiers, and audience demographics, strictly as permitted by Instagram&apos;s API and your consent.
            </li>
            <li>
              <strong>Payment & payout information:</strong> Processed through authorized payment partners (e.g. Razorpay) and creator UPI VPAs. We do not store full payment card numbers or sensitive banking credentials on our servers.
            </li>
            <li>
              <strong>Usage data:</strong> Pages visited, interaction timestamps, device and browser information for platform security and fraud prevention.
            </li>
            <li>
              <strong>Order and communication data:</strong> In-app chat messages, campaign deliverables, revision briefs, and transaction history, retained for dispute resolution, System Review, and accounting record-keeping.
            </li>
          </ul>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>To operate the marketplace (creator matching, orders, payments, automated delivery tracking, notifications).</li>
            <li>To verify Creator authenticity and display verified metrics via Instagram&apos;s official API.</li>
            <li>To resolve order disputes through objective System Review.</li>
            <li>To comply with legal, statutory, and taxation obligations in India.</li>
            <li>We do not sell your personal information or promotional data to third parties.</li>
          </ul>
        </section>

        {/* 3. Data Sharing */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Data Sharing
          </h2>
          <p>
            We share data only with:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li><strong>Payment Processors (Razorpay):</strong> Strictly as required to securely process transactions and payouts.</li>
            <li><strong>Instagram / Meta:</strong> As required for API verification (governed by Meta&apos;s Platform Terms and Instagram data policies).</li>
            <li><strong>Law Enforcement & Regulators:</strong> If required by Indian law, subpoena, or legal process.</li>
          </ul>
        </section>

        {/* 4. Data Retention */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. Data Retention
          </h2>
          <p>
            We retain order, payment, and message data for as long as necessary to fulfill the services, resolve potential disputes, and meet legal and tax record-keeping requirements under applicable Indian laws, even after an account is closed.
          </p>
        </section>

        {/* 5. Your Rights & Account Deletion */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Your Rights & Account Deletion
          </h2>
          <p>
            You have the right to request access to, correction of, or permanent deletion of your personal data, creator profile, or business account.
          </p>
          <p>
            To submit an account deletion request or user data deletion request, contact us directly at <a href="mailto:support@gmail.com" className="text-[#FF5416] hover:underline font-mono">support@gmail.com</a> with the subject &quot;Account Deletion Request&quot;. Requests are processed within 30 days, subject to our statutory financial record retention obligations.
          </p>
        </section>

        {/* 6. Security */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Security
          </h2>
          <p>
            We use industry-standard measures (SSL/TLS encryption, Row Level Security policies, tokenized authentication) to protect your data. While no internet-based service is 100% immune from risks, we continually audit and update our platform security standards.
          </p>
        </section>

        {/* 7. Children's Privacy */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Children&apos;s Privacy
          </h2>
          <p>
            Market My Idea is intended exclusively for individuals aged 18 and older. We do not knowingly collect personal data from minors.
          </p>
        </section>

        {/* 8. Changes to This Policy */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy periodically. Material changes will be highlighted on our website or communicated via email.
          </p>
        </section>

        {/* 9. Contact */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            9. Contact & Data Protection
          </h2>
          <p>
            For privacy inquiries or data rights requests:
          </p>
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg space-y-1 font-mono text-xs">
            <p><strong>Support & Privacy Inbox:</strong> <a href="mailto:support@gmail.com" className="text-[#FF5416] hover:underline">support@gmail.com</a></p>
            <p><strong>Website:</strong> <a href="https://marketmyidea.online" className="text-[#FF5416] hover:underline">marketmyidea.online</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
