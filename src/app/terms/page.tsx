import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="border-b border-[#ECECE6] pb-4">
        <span className="editorial-label text-[#FF5416]">Legal Architecture</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">Terms of Service</h1>
        <p className="text-xs text-[#71717A] mt-1">Last revised: September 2026</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-xs text-[#3F3F46] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">1. Marketplace Protocol</h2>
          <p>
            Marketur operates as a peer-to-peer collaboration marketplace connecting verified social creators with businesses and agencies across India. All collaboration orders are executed under our fixed package escrow protocol.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">2. Escrow Protection & Payments</h2>
          <p>
            When a business purchases a collaboration package, total order funds including the 5% platform fee are deposited into an escrow account. Funds are released to the creator upon business approval of the delivered work or following an administrative dispute resolution.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">3. Off-Platform Solicitation Policy</h2>
          <p>
            To protect escrow guarantees and dispute coverage, all campaign briefs, delivery proofs, feedback, and communications must remain strictly within the order workspace chat. Sharing personal phone numbers, external payment links, or soliciting off-platform transactions is prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">4. Dispute Mediation</h2>
          <p>
            In the event that delivered content deviates substantially from the agreed campaign brief requirements, either party may invoke formal dispute mediation. Marketur administrators reserve the right to inspect submitted proof and issue full or partial refunds.
          </p>
        </section>
      </div>
    </div>
  );
}
