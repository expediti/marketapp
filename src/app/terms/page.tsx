import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Market My Idea',
  description: 'Terms of Service and Collaboration Agreement for Market My Idea.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <span className="editorial-label text-[#FF5416]">Legal Agreement</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Terms & Conditions
        </h1>
        <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
          Last updated: October 5, 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          These Terms govern your use of Market My Idea (&quot;the Platform,&quot; &quot;we,&quot; &quot;us&quot;). By creating an account or accessing any feature of the platform, you agree to these Terms.
        </p>

        {/* 1. What Market My Idea Is */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. What Market My Idea Is
          </h2>
          <p>
            Market My Idea is a platform that connects businesses (&quot;Businesses&quot;) with Instagram creators (&quot;Creators&quot;) for paid promotional collaborations. We facilitate discovery, communication, payment, and delivery tracking between both parties. We are not a party to the underlying promotional agreement between a Business and a Creator, except as explicitly described in these Terms regarding payment handling.
          </p>
        </section>

        {/* 2. Eligibility */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. Eligibility
          </h2>
          <p>
            You must be at least 18 years old and capable of entering a binding agreement under Indian law to use this Platform. Creators must have an active, genuine Instagram account that they personally control.
          </p>
        </section>

        {/* 3. Account Responsibilities */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. Account Responsibilities & Deletion
          </h2>
          <p>
            You are responsible for all activity under your account. You agree to provide accurate information, including business details, payout information, and Instagram account ownership. Impersonation, fake profiles, or misrepresented follower/engagement data will result in immediate account suspension.
          </p>
          <p>
            Both Creator and Business account holders may request deletion of their account at any time through their settings or by contacting <a href="mailto:support@gmail.com" className="text-[#FF5416] hover:underline font-mono">support@gmail.com</a>, subject to our statutory record retention obligations.
          </p>
        </section>

        {/* 4. How Orders Work */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. How Orders Work
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>A Business sends a collaboration request to a Creator.</li>
            <li>If accepted, both parties agree on deliverables, price, deadline, and revisions through the Platform&apos;s deal confirmation process.</li>
            <li>Once terms are confirmed, payment becomes due before work begins.</li>
            <li>The Creator delivers the agreed content and submits proof via the Platform.</li>
            <li>The Business reviews and approves, requests an included revision (if available), or raises a dispute through System Review.</li>
            <li>If no action is taken within the stated review period (4 days), the delivery is automatically approved and payment is cleared for payout.</li>
          </ul>
        </section>

        {/* 5. Payments */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Payments
          </h2>
          <p>
            All payments must be made through the Platform using supported payment methods. Businesses and Creators agree not to arrange payment outside the Platform for any order initiated here. Market My Idea charges a platform fee as described on our <Link href="/pricing" className="text-[#FF5416] hover:underline font-mono">Pricing page</Link>, which may be updated from time to time with reasonable notice.
          </p>
        </section>

        {/* 6. Cancellations and Refunds */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Cancellations and Refunds
          </h2>
          <p>
            Cancellations and refunds are governed strictly by our separate <Link href="/refund-policy" className="text-[#FF5416] hover:underline font-mono">Refund / Cancellation Policy</Link>, which forms an integral part of these Terms.
          </p>
        </section>

        {/* 7. Prohibited Conduct */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Prohibited Conduct
          </h2>
          <p>
            You agree not to: share personal contact details to bypass the Platform before a deal is confirmed and paid; use fake or purchased followers/engagement; post content that violates Instagram&apos;s own policies, Indian law, or involves misleading claims; or harass, threaten, or defraud another user.
          </p>
        </section>

        {/* 8. Content Ownership */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. Content Ownership & Licensing
          </h2>
          <p>
            Unless otherwise agreed in writing between the Business and Creator, the Creator retains ownership of content they create, while the Business is granted a commercial license to use the delivered content for the agreed promotional purpose and timeframe.
          </p>
        </section>

        {/* 9. Platform's Role in Disputes */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            9. Platform&apos;s Role in Disputes (System Review)
          </h2>
          <p>
            Market My Idea will review disputes raised through System Review in good faith, based on the agreed brief terms, chat evidence, and deliverable proofs. Our decision on fund release is final for the purposes of the Platform, though this does not limit either party&apos;s statutory legal rights.
          </p>
        </section>

        {/* 10. Limitation of Liability */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            10. Limitation of Liability
          </h2>
          <p>
            Market My Idea is not responsible for the quality, legality, or outcome of promotional content, or for any specific commercial results (such as sales, app downloads, or conversion rates) arising from a campaign. We are not liable for indirect, incidental, or consequential damages arising from use of the Platform, to the maximum extent permitted by law.
          </p>
        </section>

        {/* 11. Account Suspension/Termination */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            11. Account Suspension & Termination
          </h2>
          <p>
            We may suspend or terminate accounts that violate these Terms, engage in fraud, or misuse the Platform, with or without notice depending on severity.
          </p>
        </section>

        {/* 12. Governing Law */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            12. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>

        {/* 13. Changes to These Terms */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            13. Changes to These Terms
          </h2>
          <p>
            We may update these Terms periodically. Continued use of the Platform after changes are published constitutes acceptance of the updated Terms.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        Questions about our Terms? Email us at <a href="mailto:support@gmail.com" className="text-[#FF5416] hover:underline">support@gmail.com</a>.
      </div>
    </div>
  );
}
