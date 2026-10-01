import React from 'react';
import { OrderStatus } from '@/types/marketplace';
import { Check, Clock, AlertTriangle, XCircle, RefreshCw, Hourglass } from 'lucide-react';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

const STEPS: { key: string; label: string }[] = [
  { key: 'CONFIRMED', label: 'Deal Confirmed' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In Production' },
  { key: 'DELIVERED', label: 'Delivered (4-Day Review)' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isDisputed =
    currentStatus === 'DISPUTED' ||
    currentStatus === 'SYSTEM_REVIEW' ||
    currentStatus === 'ADMIN_REVIEW';
  const isRevision = currentStatus === 'REVISION_REQUESTED';
  const isWaiting = currentStatus === 'WAITING_FOR_BUSINESS';
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
      case 'REQUESTED':
        return -1;
      case 'DEAL_CONFIRMED':
      case 'PAYMENT_PENDING':
      case 'ACCEPTED_AWAITING_PAYMENT':
      case 'FUNDED':
      case 'PAID_IN_ESCROW':
      case 'CREATOR_PENDING':
        return 0;
      case 'PAID':
      case 'ACCEPTED':
        return 1;
      case 'WORK_STARTED':
      case 'IN_PROGRESS':
      case 'WAITING_FOR_BUSINESS':
      case 'OVERDUE':
        return 2;
      case 'DELIVERED':
      case 'REVISION_REQUESTED':
      case 'DISPUTED':
      case 'SYSTEM_REVIEW':
      case 'ADMIN_REVIEW':
        return 3;
      case 'APPROVED':
      case 'AUTO_APPROVED':
      case 'PAYOUT_PENDING':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <span className="editorial-label text-[#71717A] dark:text-zinc-400">Collaboration Lifecycle</span>

        {isDisputed && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#B91C1C] bg-[#FEF2F2] dark:bg-red-950/40 px-2.5 py-0.5 rounded border border-[#FECACA] dark:border-red-900">
            <AlertTriangle className="w-3.5 h-3.5" />
            Under System Review
          </span>
        )}
        {isRevision && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
            <RefreshCw className="w-3.5 h-3.5" />
            Revision Requested
          </span>
        )}
        {isWaiting && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
            <Hourglass className="w-3.5 h-3.5" />
            Waiting for Brand Materials
          </span>
        )}
        {isCancelled && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#71717A] bg-[#F4F4F5] dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-[#E4E4E7] dark:border-zinc-700">
            <XCircle className="w-3.5 h-3.5" />
            Order Closed
          </span>
        )}
      </div>

      {/* Progress Line and Steps */}
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#E5E5DE] dark:bg-zinc-800" />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-2 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            let circleClasses = 'bg-[#F4F4F0] dark:bg-zinc-800 border-[#E5E5DE] dark:border-zinc-700 text-[#71717A] dark:text-zinc-400';
            if (isCompleted) {
              circleClasses = 'bg-[#047857] border-[#047857] text-white';
            } else if (isCurrent) {
              circleClasses = isDisputed
                ? 'bg-[#B91C1C] border-[#B91C1C] text-white ring-4 ring-[#FEE2E2] dark:ring-red-950'
                : 'bg-[#FF5416] border-[#FF5416] text-white ring-4 ring-[#FFF2EC] dark:ring-orange-950';
            }

            return (
              <div
                key={step.key}
                className="flex flex-col sm:items-center text-left sm:text-center"
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all sm:mx-auto mb-1.5 ${circleClasses}`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-xs font-mono tracking-tight ${
                    isCurrent
                      ? 'text-[#121214] dark:text-white font-bold'
                      : isCompleted
                      ? 'text-[#047857] dark:text-emerald-400 font-medium'
                      : 'text-[#71717A] dark:text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
