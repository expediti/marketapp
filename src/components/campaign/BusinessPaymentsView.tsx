'use client';

import React from 'react';
import Link from 'next/link';
import { Order } from '@/types/marketplace';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Info,
} from 'lucide-react';

interface BusinessPaymentsViewProps {
  orders: Order[];
}

export function BusinessPaymentsView({ orders }: BusinessPaymentsViewProps) {
  let totalCommitted = 0;
  let totalPaidOut = 0;
  let pendingSecondInstalments = 0;
  let totalPlatformFees = 0;

  orders.forEach((ord) => {
    const total = Number(ord.total_amount || 0);
    const commPct = Number(ord.platform_commission_percentage || 10.00);
    const fee = ord.platform_commission_amount ?? Math.round(total * (commPct / 100.0) * 100) / 100;

    totalCommitted += total;
    totalPlatformFees += fee;

    const is1stPaid = Boolean(
      ord.initial_paid_at ||
      ['WORK_STARTED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_FINAL_PAYMENT', 'READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
    );
    const is2ndPaid = Boolean(
      ord.final_paid_at ||
      ['READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
    );

    if (is1stPaid) totalPaidOut += total * 0.5;
    if (is2ndPaid) totalPaidOut += total * 0.5;
    if (is1stPaid && !is2ndPaid) pendingSecondInstalments += total * 0.5;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Total Campaign Budget</span>
          <span className="font-bold text-lg sm:text-xl text-[#121214] dark:text-white mt-1 block">
            ₹{totalCommitted.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Across {orders.length} campaigns
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Instalments Paid</span>
          <span className="font-bold text-lg sm:text-xl text-[#047857] dark:text-emerald-400 mt-1 block">
            ₹{totalPaidOut.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Verified server-side
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Remaining 50% Pending</span>
          <span className="font-bold text-lg sm:text-xl text-purple-700 dark:text-purple-300 mt-1 block">
            ₹{pendingSecondInstalments.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Due after preview inspection
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Platform Fee Included</span>
          <span className="font-bold text-lg sm:text-xl text-[#121214] dark:text-white mt-1 block">
            ₹{totalPlatformFees.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Standard 10% Easy Split
          </span>
        </div>
      </div>

      {/* Payment Security Notice */}
      <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-[#121214] dark:text-white">
          <ShieldCheck className="w-4 h-4 text-[#FF5416]" />
          <span>Two-Instalment Payment Protection Model</span>
        </div>
        <p className="text-[#52525B] dark:text-zinc-300 leading-relaxed text-[11px]">
          Your payments are split into two equal 50% instalments. The creator receives eligibility to start working only after the first instalment is verified. The second 50% instalment is held until you review and approve the watermarked preview.
        </p>
      </div>

      {/* Campaigns Payment Status Ledger */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
          <div>
            <h4 className="font-bold text-sm text-[#121214] dark:text-white">
              Campaign Payment Orders ({orders.length})
            </h4>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              Instalment progress, payment status, and pending payment actions
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="text-center py-8 text-[#71717A] text-xs">No active campaign payment records.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECECE6] dark:border-zinc-800 text-[10px] uppercase text-[#71717A] dark:text-zinc-400">
                  <th className="pb-2.5 font-semibold">Campaign / Order</th>
                  <th className="pb-2.5 font-semibold">Creator</th>
                  <th className="pb-2.5 font-semibold">Total Amount</th>
                  <th className="pb-2.5 font-semibold">First 50%</th>
                  <th className="pb-2.5 font-semibold">Second 50%</th>
                  <th className="pb-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
                {orders.map((ord) => {
                  const total = Number(ord.total_amount || 0);
                  const half = Math.round(total * 0.5 * 100) / 100;

                  const is1stPaid = Boolean(
                    ord.initial_paid_at ||
                    ['WORK_STARTED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_FINAL_PAYMENT', 'READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
                  );
                  const is2ndPaid = Boolean(
                    ord.final_paid_at ||
                    ['READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
                  );

                  return (
                    <tr key={ord.id} className="hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 pr-2">
                        <span className="font-bold text-[#121214] dark:text-white block">
                          #{ord.order_number}
                        </span>
                        <span className="text-[10px] text-[#71717A] truncate block max-w-[140px]">
                          {ord.package?.name || ord.campaign?.campaign_name || 'Campaign'}
                        </span>
                      </td>

                      <td className="py-3 font-semibold text-[#121214] dark:text-white">
                        {ord.creator?.display_name || ord.creator?.profile?.display_name || 'Creator'}
                      </td>

                      <td className="py-3 font-bold text-[#121214] dark:text-white">
                        ₹{total.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3">
                        {is1stPaid ? (
                          <span className="text-[10px] text-[#047857] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid (₹{half.toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200">
                            Due (₹{half.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>

                      <td className="py-3">
                        {is2ndPaid ? (
                          <span className="text-[10px] text-[#047857] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid (₹{half.toLocaleString('en-IN')})
                          </span>
                        ) : ord.order_status === 'AWAITING_FINAL_PAYMENT' ? (
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 animate-pulse">
                            Pay Now (₹{half.toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#71717A]">
                            Pending Preview (₹{half.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>

                      <td className="py-3">
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5">
                            {!is1stPaid
                              ? 'Pay 50%'
                              : ord.order_status === 'AWAITING_FINAL_PAYMENT'
                              ? 'Pay Final 50%'
                              : 'Workspace'}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
