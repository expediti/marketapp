import React from 'react';
import Link from 'next/link';
import { Mail, Clock, ShieldCheck, MapPin, Building, User, FileText, ArrowRight, HelpCircle } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import { BUSINESS_INFO } from '@/lib/config/businessInfo';

export const metadata = {
  title: 'Contact Us | MarketMyIdea',
  description:
    'Contact MarketMyIdea customer support and partnerships. Owned and operated by Amit Kumar Sharma, Jeonathpur, Uttar Pradesh, India.',
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] text-xs font-mono text-[#FF5416] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5416]" />
          <span>Official Customer Support & Grievance</span>
        </div>
        <h1 className="font-mono text-3xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Contact Us
        </h1>
        <p className="text-sm sm:text-base text-[#52525B] dark:text-zinc-300 max-w-2xl leading-relaxed">
          Have an inquiry, feedback, or need assistance with a creator campaign or order? Reach out to our dedicated support team.
        </p>
      </div>

      {/* Main Grid: Business Identity & Contact Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verified Business Identity Card */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] flex items-center justify-center text-[#FF5416]">
              <Building className="w-5 h-5" />
            </div>

            <div>
              <span className="editorial-label text-[#FF5416]">Business Identity</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white mt-1">
                {BUSINESS_INFO.brandName}
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Audience Distribution & Influencer Marketing Marketplace
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
                  Legal Operator / Proprietor
                </span>
                <div className="flex items-center gap-1.5 font-bold text-[#121214] dark:text-white font-mono">
                  <User className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
                  <span>{BUSINESS_INFO.proprietorName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
                  Business / Contact Address
                </span>
                <div className="flex items-start gap-1.5 text-[#3F3F46] dark:text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5416] shrink-0 mt-0.5" />
                  <span>{BUSINESS_INFO.address.fullDisplayAddress}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
                  Official Website
                </span>
                <a
                  href={BUSINESS_INFO.contact.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF5416] hover:underline font-mono text-xs block"
                >
                  {BUSINESS_INFO.contact.websiteUrl}
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6] dark:border-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-400">
            For merchant billing, statutory inquiries, and verified platform correspondence.
          </div>
        </div>

        {/* Customer Support Card */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#065F46] flex items-center justify-center text-[#047857] dark:text-[#34D399]">
              <Mail className="w-5 h-5" />
            </div>

            <div>
              <span className="editorial-label text-[#047857] dark:text-[#34D399]">Direct Electronic Support</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white mt-1">
                Official Support Desk
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Active orders, campaign briefs, cancellations, and creator payouts
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800 text-xs">
              <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 uppercase tracking-wider block">
                  Official Contact Email
                </span>
                <a
                  href={`mailto:${BUSINESS_INFO.contact.officialEmail}`}
                  className="font-mono text-sm font-bold text-[#121214] dark:text-white hover:text-[#FF5416] transition-colors mt-0.5 block break-all"
                >
                  {BUSINESS_INFO.contact.officialEmail}
                </a>
              </div>

              <div className="space-y-1 text-xs text-[#52525B] dark:text-zinc-400 leading-relaxed">
                <p>
                  <strong>Tip for Faster Resolution:</strong> Please include your <strong>Order ID</strong> or registered account email when contacting support.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6] dark:border-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-400">
            Click the email address to open your default mail client.
          </div>
        </div>

        {/* Operating Hours & Escalation Card */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center text-[#121214] dark:text-white">
              <Clock className="w-5 h-5 text-[#FF5416]" />
            </div>

            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400">Timelines & Turnaround</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white mt-1">
                Support Hours
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Committed service response and dispute review standards
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-[#ECECE6] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400">Working Days</span>
                <span className="font-bold text-[#121214] dark:text-white">Mon – Sat</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#ECECE6] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400">Business Hours</span>
                <span className="font-bold text-[#121214] dark:text-white">9:30 AM – 6:30 PM IST</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#ECECE6] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400">Response Window</span>
                <span className="font-bold text-[#047857] dark:text-[#34D399]">{BUSINESS_INFO.support.responseTime}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#71717A] dark:text-zinc-400">Grievance Escalation</span>
                <Link href="/grievance" className="font-bold text-[#FF5416] hover:underline">
                  View Redressal →
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6] dark:border-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-400">
            Disputes raised via in-app System Review are investigated within 24–48 business hours.
          </div>
        </div>
      </div>

      {/* Interactive Contact Form Section */}
      <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-10 space-y-6 shadow-xs">
        <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-4 space-y-1">
          <span className="editorial-label text-[#FF5416]">Send an Inquiry</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
            Send Us a Message
          </h2>
          <p className="text-xs sm:text-sm text-[#52525B] dark:text-zinc-400">
            Fill in the form below. We will log your request and reply directly to your email.
          </p>
        </div>

        <ContactForm />
      </div>

      {/* Support & Dispute Resolution Process */}
      <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#FF5416]" />
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            Customer Support & Escalation Framework
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed pt-2">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1.5">
            <span className="font-mono font-bold text-[#FF5416] text-xs">Step 1: Direct Support</span>
            <p>
              Submit your inquiry using the form above or email us at{' '}
              <a href={`mailto:${BUSINESS_INFO.contact.officialEmail}`} className="text-[#FF5416] hover:underline font-mono">
                {BUSINESS_INFO.contact.officialEmail}
              </a>
              . An acknowledgment and ticket reference will be provided.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1.5">
            <span className="font-mono font-bold text-[#FF5416] text-xs">Step 2: Investigation</span>
            <p>
              Our support team reviews campaign briefs, order chat records, submission links, or payment records to address your question within 24–48 business hours.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-1.5">
            <span className="font-mono font-bold text-[#FF5416] text-xs">Step 3: Grievance Redressal</span>
            <p>
              If an issue remains unresolved, escalate directly to Grievance Officer Amit Kumar Sharma under our statutory{' '}
              <Link href="/grievance" className="text-[#FF5416] hover:underline font-semibold">
                Grievance Redressal Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>Looking for compliance policies?</div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms & Conditions
          </Link>
          <Link href="/privacy" className="hover:text-[#FF5416] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/refund-policy" className="hover:text-[#FF5416] transition-colors">
            Refund & Cancellation
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
