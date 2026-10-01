import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 font-mono">
      <div className="border-b border-[#ECECE6] pb-6 space-y-2">
        <span className="editorial-label text-[#FF5416]">Platform Terms</span>
        <h1 className="text-3xl font-bold text-[#121214]">Terms of Service</h1>
        <p className="text-xs text-[#71717A]">Last updated: October 2026</p>
      </div>

      <div className="space-y-6 text-xs text-[#3F3F46] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">1. Marketplace Protocol</h2>
          <p>
            Market My App connects businesses and founders with creators and influencers across India. All collaboration requests, orders, content delivery proofs, and communications are tracked directly through the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">2. Platform Payments & Order Completion</h2>
          <p>
            Platform payment is required once a collaboration deal is confirmed before creator production begins. Funds are held safely and recorded by the platform. Payouts become payable to the creator upon business approval of the delivered work or following the conclusion of the 4-day review window.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">3. 4-Day Review Period & Automatic Approval</h2>
          <p>
            Upon creator submission of deliverable content, the business receives a 4-day review period. During this period, the business can accept the deliverable, request an included revision, or raise a System Review. If no action is taken within the full 4-day review period, the deliverable is automatically approved and the creator payout becomes eligible.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">4. Revisions Policy</h2>
          <p>
            Every order includes a defined revision allowance (default 1 revision). Revisions must be based on objective deviations from the agreed campaign brief requirements. Once the included revision allowance is exhausted, additional modifications require a separate agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">5. Platform Communication & Safety</h2>
          <p>
            To keep collaboration details and payments protected and traceable, all campaign briefs, messages, and payments must remain within Market My App. Sharing personal phone numbers, emails, or off-platform payment details is strictly discouraged.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#121214]">6. System Review</h2>
          <p>
            In the event that delivered content fails to satisfy agreed brief requirements (such as missing CTA, incorrect product details, or unfulfilled deliverables), either party may raise a formal System Review. Cases are evaluated neutrally against the agreed brief, negotiation thread, and deliverable proofs.
          </p>
        </section>
      </div>
    </div>
  );
}
