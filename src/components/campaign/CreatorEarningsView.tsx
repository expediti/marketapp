'use client';

import React from 'react';
import { Order } from '@/types/marketplace';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Building,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface CreatorEarningsViewProps {
  orders: Order[];
}

export function CreatorEarningsView({ orders }: CreatorEarningsViewProps) {
  // Financial calculations
  let totalAgreedValue = 0;
  let totalPlatformCommission = 0;
  let totalNetEarnings = 0;
  let receivedPaymentsFromBrands = 0;
  let completedEarnings = 0;
  let pendingSettlementAmount = 0;

  orders.forEach((ord) => {
    const amount = Number(ord.total_amount || 0);
    const commPct = Number(ord.platform_commission_percentage || 10.00);
    const commAmount = ord.platform_commission_amount ?? Math.round(amount * (commPct / 100.0) * 100) / 100;
    const netAmount = ord.creator_total_amount ?? (amount - commAmount);

    totalAgreedValue += amount;
    totalPlatformCommission += commAmount;
    totalNetEarnings += netAmount;

    const isFirstPaid = Boolean(
      ord.initial_paid_at ||
      ['WORK_STARTED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_FINAL_PAYMENT', 'READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
    );
    const isSecondPaid = Boolean(
      ord.final_paid_at ||
      ['READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(ord.order_status)
    );

    if (isFirstPaid) {
      receivedPaymentsFromBrands += netAmount * 0.5;
    }
    if (isSecondPaid) {
      receivedPaymentsFromBrands += netAmount * 0.5;
    }

    if (ord.order_status === 'COMPLETED') {
      completedEarnings += netAmount;
      if (ord.payout_status !== 'PAID') {
        pendingSettlementAmount += netAmount;
      }
    }
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Total Campaign Value</span>
          <span className="font-bold text-lg sm:text-xl text-[#121214] dark:text-white mt-1 block">
            ₹{totalAgreedValue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Across {orders.length} agreed deals
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Creator Net Earnings</span>
          <span className="font-bold text-lg sm:text-xl text-[#047857] dark:text-emerald-400 mt-1 block">
            ₹{totalNetEarnings.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            After platform fee (10%)
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Brand Payments Received</span>
          <span className="font-bold text-lg sm:text-xl text-blue-700 dark:text-blue-400 mt-1 block">
            ₹{receivedPaymentsFromBrands.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-0.5 block">
            Funded in 50% instalments
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Settlement In Progress</span>
          <span className="font-bold text-lg sm:text-xl text-amber-700 dark:text-amber-400 mt-1 block">
            ₹{pendingSettlementAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
            Cashfree Easy Split
          </span>
        </div>
      </div>

      {/* Critical Settlement Distinction Notice */}
      <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#121214] dark:text-white">
          <Info className="w-4 h-4 text-[#FF5416]" />
          <span>Payment Collection vs Vendor Settlement Disclosure</span>
        </div>
        <p className="text-[#52525B] dark:text-zinc-300 leading-relaxed text-[11px]">
          <strong>Brand Payment Received</strong> indicates that the advertiser has funded the instalment. <strong>Vendor Settlement</strong> occurs according to the platform settlement cycle through Cashfree Easy Split into your registered payout UPI / bank account. A successful brand payment does not mean the payout has already arrived in your bank.
        </p>
      </div>

      {/* Per-Campaign Financial Breakdown Table */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
          <div>
            <h4 className="font-bold text-sm text-[#121214] dark:text-white">
              Campaign Earnings Ledger ({orders.length})
            </h4>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              Granular breakdown of instalments, platform commission, and settlement status
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="text-center py-8 text-[#71717A] text-xs">No campaign financial records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECECE6] dark:border-zinc-800 text-[10px] uppercase text-[#71717A] dark:text-zinc-400">
                  <th className="pb-2.5 font-semibold">Campaign / Order</th>
                  <th className="pb-2.5 font-semibold">Gross Value</th>
                  <th className="pb-2.5 font-semibold">Fee (10%)</th>
                  <th className="pb-2.5 font-semibold">Creator Share</th>
                  <th className="pb-2.5 font-semibold">1st 50% Status</th>
                  <th className="pb-2.5 font-semibold">2nd 50% Status</th>
                  <th className="pb-2.5 font-semibold">Settlement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
                {orders.map((ord) => {
                  const gross = Number(ord.total_amount || 0);
                  const fee = ord.platform_commission_amount ?? Math.round(gross * 0.1 * 100) / 100;
                  const net = ord.creator_total_amount ?? (gross - fee);

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
                          {ord.business?.business_name || 'Brand Partner'}
                        </span>
                      </td>

                      <td className="py-3 font-semibold text-[#121214] dark:text-white">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 text-[#71717A] dark:text-zinc-400">
                        ₹{fee.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 font-bold text-[#047857] dark:text-emerald-400">
                        ₹{net.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3">
                        {is1stPaid ? (
                          <span className="text-[10px] text-[#047857] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <span className="text-[10px] text-purple-700 font-medium">Unpaid</span>
                        )}
                      </td>

                      <td className="py-3">
                        {is2ndPaid ? (
                          <span className="text-[10px] text-[#047857] font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </span>
                        ) : ord.order_status === 'AWAITING_FINAL_PAYMENT' ? (
                          <span className="text-[10px] text-purple-700 font-bold">Due</span>
                        ) : (
                          <span className="text-[10px] text-[#71717A]">Pending</span>
                        )}
                      </td>

                      <td className="py-3">
                        {ord.payout_status === 'PAID' ? (
                          <span className="text-[10px] text-[#047857] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                            Settled ✓
                          </span>
                        ) : ord.order_status === 'COMPLETED' ? (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Easy Split Pending
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#71717A] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            In Production
                          </span>
                        )}
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
