import React from 'react';
import Link from 'next/link';
import { Mail, Clock, ShieldAlert, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Contact Us | Market My Idea',
  description: 'Get in touch with the Market My Idea support and partnership team.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <span className="editorial-label text-[#FF5416]">Support & Partnerships</span>
        <h1 className="font-mono text-3xl sm:text-5xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Contact Us
        </h1>
        <p className="text-sm sm:text-base text-[#52525B] dark:text-zinc-300 max-w-2xl leading-relaxed">
          Have a question, issue, or need help with an order? We typically respond within 24–48 hours on business days.
        </p>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Card */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#FFF2EC] dark:bg-[#27140B] flex items-center justify-center text-[#FF5416]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="editorial-label text-[#FF5416]">General & Order Support</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-1">Customer Support</h3>
            <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-2 leading-relaxed">
              For active order assistance, account inquiries, or verification questions.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono">
            <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded border border-[#E5E5DE] dark:border-zinc-800">
              <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Primary Email</span>
              <a
                href="mailto:support@gmail.com"
                className="text-sm font-bold text-[#121214] dark:text-white hover:text-[#FF5416] transition-colors mt-0.5 block"
              >
                support@gmail.com
              </a>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              <strong>Tip for order-related issues:</strong> Please include your <strong>Order ID</strong> so we can resolve your inquiry faster.
            </p>
          </div>
        </div>

        {/* Partnerships Card */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#F4F4F0] dark:bg-zinc-800 flex items-center justify-center text-[#121214] dark:text-white">
            <Sparkles className="w-5 h-5 text-[#FF5416]" />
          </div>
          <div>
            <span className="editorial-label text-[#71717A] dark:text-zinc-400">Brand & Creator Partnerships</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-1">Campaigns & Bulk Deals</h3>
            <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-2 leading-relaxed">
              For business partnerships, multi-influencer campaigns, or high-volume app marketing.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono">
            <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded border border-[#E5E5DE] dark:border-zinc-800">
              <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Partnership Inbox</span>
              <a
                href="mailto:partnerships@marketmyidea.online"
                className="text-sm font-bold text-[#121214] dark:text-white hover:text-[#FF5416] transition-colors mt-0.5 block"
              >
                partnerships@marketmyidea.online
              </a>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              We work closely with app founders and growth teams to curate tailored creator rosters.
            </p>
          </div>
        </div>
      </div>

      {/* Response Time & Guidelines */}
      <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FF5416]" />
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Response Time & Office Hours</h3>
        </div>
        <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
          Our team is based in India and operates Monday through Saturday, 9:30 AM – 6:30 PM IST. We strive to address all ticket requests, account verification queries, and dispute reviews within 24–48 business hours.
        </p>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono text-[#71717A] dark:text-zinc-400">
        <div>
          Looking for terms or refund policies?
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-[#FF5416] transition-colors">
            Terms & Conditions
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
