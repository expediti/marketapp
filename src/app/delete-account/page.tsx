'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, Trash2, HelpCircle, Mail, ArrowRight, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function DeleteAccountContent() {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams?.get('confirmation_code');

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-black text-[#121214] dark:text-[#E4E4E7] font-sans selection:bg-[#FF5416] selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-mono font-semibold">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Data Privacy & Account Removal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#121214] dark:text-white">
            Delete Your Market My Idea Account
          </h1>
          <p className="text-sm text-[#71717A] dark:text-zinc-400 max-w-xl mx-auto">
            Instructions and policies for deleting your Creator or Business account and requesting the erasure of your personal information.
          </p>
        </div>

        {/* Confirmation Banner if redirected with a code */}
        {confirmationCode && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#047857] block">
                Data Deletion Request Received
              </span>
              <p className="text-[#047857]/90">
                Your request has been queued. Tracking Code: <code className="font-mono font-bold bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">{confirmationCode}</code>
              </p>
            </div>
          </div>
        )}

        {/* How to Delete in Self-Service */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <span className="editorial-label text-[#FF5416]">Self-Service Deletion</span>
            <h2 className="text-lg font-bold font-mono text-[#121214] dark:text-white mt-1">
              How to Delete Your Account
            </h2>
          </div>

          <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
            Both <strong>Creator</strong> and <strong>Business</strong> accounts can be permanently closed and deleted at any time directly through your dashboard settings:
          </p>

          <ol className="space-y-3 text-xs text-[#52525B] dark:text-zinc-300 list-decimal list-inside">
            <li className="pl-1">
              Log in to your <strong>Market My Idea</strong> account.
            </li>
            <li className="pl-1">
              Navigate to <strong>Dashboard → Settings</strong>.
            </li>
            <li className="pl-1">
              Scroll down to the <strong>Delete Account</strong> section.
            </li>
            <li className="pl-1">
              Click <strong>Delete Account</strong> and confirm your request in the security confirmation dialog.
            </li>
          </ol>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link href="/dashboard/creator">
              <Button variant="outline" size="sm" className="text-xs">
                <span>Creator Settings</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/dashboard/business">
              <Button variant="outline" size="sm" className="text-xs">
                <span>Business Settings</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* What Happens When You Delete */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <span className="editorial-label text-[#FF5416]">Data & Retention Policies</span>
            <h2 className="text-lg font-bold font-mono text-[#121214] dark:text-white mt-1">
              What Happens to Your Data
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#121214] dark:text-white">
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>What Is Removed Immediately</span>
              </div>
              <ul className="text-[#52525B] dark:text-zinc-400 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                <li>Public creator & business profile listings</li>
                <li>Biographies, photos, logos, and custom links</li>
                <li>Connected Instagram tokens and synced metrics</li>
                <li>Private UPI IDs and payout configurations</li>
                <li>Authentication credentials and login sessions</li>
              </ul>
            </div>

            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#121214] dark:text-white">
                <Shield className="w-4 h-4 text-[#047857]" />
                <span>Legitimate Records Retained</span>
              </div>
              <ul className="text-[#52525B] dark:text-zinc-400 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
                <li>Historical completed transaction & payment ledgers</li>
                <li>Invoices, refunds, and payout receipts required by tax & banking laws</li>
                <li>Completed dispute and System Review resolutions</li>
                <li>Fraud prevention and platform safety logs</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Note:</strong> If you currently have active orders in progress or pending payments, you must complete or cancel those collaborations before deleting your account.
            </span>
          </div>
        </div>

        {/* Manual Request & Contact */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm text-xs">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <span className="editorial-label text-[#FF5416]">Support Assistance</span>
            <h2 className="text-lg font-bold font-mono text-[#121214] dark:text-white mt-1">
              Need Help or Manual Deletion Request?
            </h2>
          </div>

          <p className="text-[#52525B] dark:text-zinc-300 leading-relaxed">
            If you are unable to access your account or wish to submit a manual deletion request under GDPR / CCPA or Meta Developer policies, you can contact our privacy and support team directly:
          </p>

          <div className="p-4 bg-[#FAF9F5] dark:bg-zinc-900 rounded-xl border border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#121214] dark:text-white">
              <Mail className="w-4 h-4 text-[#FF5416]" />
              <span>support@gmail.com</span>
            </div>
            <a
              href="mailto:support@gmail.com?subject=Account%20Deletion%20Request"
              className="text-xs font-mono font-bold text-[#FF5416] hover:underline"
            >
              Send Request →
            </a>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#71717A] dark:text-zinc-400 border-t border-[#ECECE6] dark:border-zinc-800">
            <Link href="/privacy" className="hover:underline flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Read Privacy Policy</span>
            </Link>
            <Link href="/" className="hover:underline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeleteAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center text-xs font-mono">Loading...</div>}>
      <DeleteAccountContent />
    </Suspense>
  );
}
