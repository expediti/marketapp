import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy | Market My Idea',
  description:
    'Clear guidelines on stage-based cancellations, System Review, 4-day auto approval, and refund eligibility for Market My Idea.',
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <span className="editorial-label text-[#FF5416]">Cancellation & Dispute Framework</span>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
          Last updated: October 5, 2026
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <p>
          This policy explains when refunds and cancellations are available on Market My Idea (&quot;marketmyidea.online&quot;). Our milestone-based workflow is designed to protect both Businesses and Creators at every stage of collaboration.
        </p>

        {/* 1. Before Payment */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            1. Before Payment
          </h2>
          <p>
            If a collaboration request is declined, or negotiation ends before a deal is confirmed and paid, no payment has occurred and no refund is applicable.
          </p>
        </section>

        {/* 2. After Payment, Before Work Begins */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            2. After Payment, Before Work Begins
          </h2>
          <p>
            If a Business cancels an order after payment but before the Creator has marked the order as started, a refund may be issued according to the cancellation circumstances. Where the cancellation qualifies for a full refund, any non-refundable payment gateway processing fee may be deducted if applicable.
          </p>
        </section>

        {/* 3. After Work Has Started */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            3. After Work Has Started
          </h2>
          <p>
            If either party wishes to cancel after the Creator has marked the order as started, the cancellation will be reviewed under <strong>System Review</strong>. Depending on the circumstances and evidence provided, the outcome may be a full refund, partial refund, partial payout to the Creator, or full payout, based on work actually completed.
          </p>
        </section>

        {/* 4. After Delivery */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            4. After Delivery
          </h2>
          <p>
            Once a Creator has submitted delivery proofs, the Business may:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li>Accept the delivery (releasing cleared payout to the Creator).</li>
            <li>Request an included revision (if available under the agreed package).</li>
            <li>Raise a <strong>System Review</strong> if the delivery does not meet the agreed brief requirements.</li>
          </ul>
          <p>
            Refunds after delivery are only considered where the delivered work clearly does not match the agreed deliverables or there is another material issue supported by the order evidence. A simple change of preference or creative taste does not automatically qualify for a refund.
          </p>
        </section>

        {/* 5. Automatic Approval */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            5. Automatic Approval (4-Day Window)
          </h2>
          <p>
            If a Business does not respond within the stated review period (currently <strong>4 days</strong>) after delivery, the order is automatically approved and payment is released to the Creator. This safeguard protects Creators from being left unpaid indefinitely.
          </p>
        </section>

        {/* 6. Non-Refundable Circumstances */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            6. Non-Refundable Circumstances
          </h2>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            <li>The Business simply changes their mind about creative style, with no breach of agreed requirements.</li>
            <li>The agreed revision allowance has already been exhausted.</li>
            <li>The dispute is raised after the automatic approval window has passed, except in verified cases of clear fraud.</li>
          </ul>
        </section>

        {/* 7. Payment Gateway Fees */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            7. Payment Gateway Fees
          </h2>
          <p>
            Any payment gateway processing fees incurred on the original transaction are non-refundable and may be deducted from refund amounts, as this cost is charged by the payment gateway partner (Razorpay) regardless of order outcome.
          </p>
        </section>

        {/* 8. How to Request a Refund or Raise a Dispute */}
        <section className="space-y-2">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            8. How to Request a Refund or Raise a Dispute
          </h2>
          <p>
            Use the <strong>&quot;System Review&quot;</strong> option directly on your active order page, or contact <a href="mailto:support@gmail.com" className="text-[#FF5416] hover:underline font-mono">support@gmail.com</a> with your <strong>Order ID</strong> and a clear description of the issue. We review disputes promptly within 24–48 business hours.
          </p>
        </section>
      </div>
    </div>
  );
}
