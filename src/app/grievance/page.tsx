import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Mail, MapPin, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Grievance Redressal Mechanism | MarketMyIdea',
  description:
    'Grievance Redressal and dispute escalation process for MarketMyIdea. Operated by Amit Kumar Sharma, Jeonathpur, Uttar Pradesh, India.',
};

export default function GrievancePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
      {/* Header */}
      <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Statutory Compliance & Dispute Redressal</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white">
          Grievance Redressal Mechanism
        </h1>
        <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
          In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020.
        </p>
      </div>

      {/* Grievance Officer Details Card */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] flex items-center justify-center text-[#FF5416]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Designated Grievance Contact
            </h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              For consumer complaints, regulatory compliance, and unresolved dispute escalations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-[#71717A] dark:text-zinc-400 block">
              Marketplace Brand
            </span>
            <span className="font-bold text-sm text-[#121214] dark:text-white block">
              {BUSINESS_INFO.brandName}
            </span>
            <span className="text-[11px] text-[#71717A]">
              Audience Distribution & Influencer Marketplace
            </span>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-[#71717A] dark:text-zinc-400 block">
              Legal Operator / Grievance Officer
            </span>
            <span className="font-bold text-sm text-[#121214] dark:text-white block">
              {BUSINESS_INFO.grievance.officerName}
            </span>
            <span className="text-[11px] text-[#71717A]">
              Proprietor, MarketMyIdea
            </span>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-[#71717A] dark:text-zinc-400 block">
              Contact Address
            </span>
            <span className="font-bold text-xs text-[#121214] dark:text-white block">
              {BUSINESS_INFO.grievance.address}
            </span>
          </div>

          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-[#71717A] dark:text-zinc-400 block">
              Official Grievance Email
            </span>
            <a
              href={`mailto:${BUSINESS_INFO.grievance.email}?subject=Grievance%20Escalation`}
              className="font-bold text-xs text-[#FF5416] hover:underline block break-all"
            >
              {BUSINESS_INFO.grievance.email}
            </a>
          </div>
        </div>
      </div>

      {/* Escalation Process */}
      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3F3F46] dark:text-zinc-300 space-y-8 leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            Complaint Submission & Escalation Procedure
          </h2>
          <p>
            MarketMyIdea is committed to transparent, fair, and prompt resolution of all consumer and creator concerns. We follow a structured two-tier redressal framework:
          </p>

          <div className="space-y-4 pt-2">
            {/* Level 1 */}
            <div className="p-5 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#FF5416] px-2.5 py-0.5 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E]">
                  Level 1: General Customer Support
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">Response within 24–48 hours</span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-zinc-300">
                For order inquiries, billing questions, campaign revisions, or platform navigation issues, users should first contact our standard support desk via the{' '}
                <Link href="/contact" className="text-[#FF5416] hover:underline font-semibold">
                  Contact Us page
                </Link>{' '}
                or email{' '}
                <a href={`mailto:${BUSINESS_INFO.contact.supportEmail}`} className="text-[#FF5416] hover:underline font-mono">
                  {BUSINESS_INFO.contact.supportEmail}
                </a>
                .
              </p>
            </div>

            {/* Level 2 */}
            <div className="p-5 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#047857] dark:text-[#34D399] px-2.5 py-0.5 rounded bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46]">
                  Level 2: Grievance Escalation
                </span>
                <span className="text-[11px] font-mono text-[#71717A]">Acknowledgment: 48 hours • Resolution: 15–30 days</span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-zinc-300">
                If your issue remains unresolved after contacting Level 1 support, or if your complaint involves a material contractual breach, privacy violation, or systemic dispute, you may submit a formal escalation directly to our Grievance Officer:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-[#52525B] dark:text-zinc-400">
                <li>Send an email to <a href={`mailto:${BUSINESS_INFO.grievance.email}`} className="text-[#FF5416] hover:underline">{BUSINESS_INFO.grievance.email}</a></li>
                <li>Use the subject format: <code>&quot;Grievance Escalation - [Order ID / User ID]&quot;</code></li>
                <li>Include a clear description of the grievance, prior ticket reference, and any supporting documentation</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Timelines and Commitments */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            Statutory Commitments & Timelines
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-xs">
            <li>
              <strong>Acknowledgment:</strong> Every formal grievance received by the Grievance Officer will be acknowledged within <strong>48 hours</strong> of receipt with a designated tracking reference number.
            </li>
            <li>
              <strong>Investigation & Mediation:</strong> The Grievance Officer will review all order records, communication logs, brief deliverables, and evidence objectively.
            </li>
            <li>
              <strong>Resolution:</strong> The grievance will be redressed within <strong>30 days</strong> (or sooner) from the date of receipt, and a written communication explaining the outcome will be sent to the complainant.
            </li>
          </ul>
        </section>

        {/* Prohibited Content Takedowns */}
        <section className="space-y-3">
          <h2 className="font-mono text-sm sm:text-base font-bold text-[#121214] dark:text-white">
            Content Takedowns & Notice Redressal
          </h2>
          <p>
            If any content, profile, or deliverable displayed on MarketMyIdea is alleged to infringe third-party intellectual property, privacy rights, or Indian laws, rights holders or law enforcement agencies may send formal notices to{' '}
            <a href={`mailto:${BUSINESS_INFO.grievance.email}`} className="text-[#FF5416] hover:underline font-mono">
              {BUSINESS_INFO.grievance.email}
            </a>
            . We will review and act upon verified legal notices within statutory timelines under applicable Indian law.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-[#ECECE6] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Official Grievance Desk of MarketMyIdea</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:text-[#FF5416] transition-colors">
            Contact Support
          </Link>
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-[#FF5416] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-[#FF5416] transition-colors">
            Refund Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
