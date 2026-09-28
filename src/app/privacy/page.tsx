import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="border-b border-[#ECECE6] pb-4">
        <span className="editorial-label text-[#FF5416]">Data & Confidentiality</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">Privacy Policy & Handle Anonymity</h1>
        <p className="text-xs text-[#71717A] mt-1">Last revised: September 2026</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-6 text-xs text-[#3F3F46] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">1. Strict Creator Anonymity Guarantee</h2>
          <p>
            Unlike open social directories, Marketur never exposes creator Instagram handles or personal profiles publicly. All listings are identified using anonymized identifiers (e.g. Creator 042) paired with verified audience metrics.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">2. Public vs. Private Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded">
              <strong className="editorial-label text-[#047857] block mb-2">Publicly Visible Data</strong>
              <ul className="space-y-1 font-mono text-[11px] text-[#52525B]">
                <li>• Niche & primary city</li>
                <li>• Verified follower count & engagement</li>
                <li>• Audience age, gender & geographic percentages</li>
                <li>• Package deliverables & prices</li>
                <li>• Watermarked work portfolio samples</li>
              </ul>
            </div>

            <div className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded">
              <strong className="editorial-label text-[#B91C1C] block mb-2">Confidential & Private Data</strong>
              <ul className="space-y-1 font-mono text-[11px] text-[#52525B]">
                <li>• Instagram access tokens & raw handles</li>
                <li>• Bank account details & UPI VPAs</li>
                <li>• PAN / KYC / GSTIN documentation</li>
                <li>• Personal phone numbers & email addresses</li>
                <li>• Internal moderation audit records</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-sm font-bold text-[#121214]">3. Data Security & Storage</h2>
          <p>
            All user profiles and transaction events are secured via PostgreSQL Row Level Security (RLS) policies. Only authorized parties involved in an active order can view campaign briefs and communication threads.
          </p>
        </section>
      </div>
    </div>
  );
}
