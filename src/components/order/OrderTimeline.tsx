import React from 'react';
import { OrderStatus } from '@/types/marketplace';
import { Check, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'FUNDED', label: 'Funded' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const isDisputed = currentStatus === 'DISPUTED' || currentStatus === 'ADMIN_REVIEW';
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
      case 'PAYMENT_PENDING':
        return -1;
      case 'FUNDED':
      case 'CREATOR_PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'APPROVED':
      case 'PAYOUT_PENDING':
        return 4;
      case 'COMPLETED':
      case 'PAID':
        return 5;
      case 'DISPUTED':
      case 'ADMIN_REVIEW':
        return 3; // Disputed at delivery stage
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <span className="editorial-label text-[#71717A]">Collaboration Timeline</span>
        {isDisputed && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#B91C1C] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Under Dispute Mediation
          </span>
        )}
        {isCancelled && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[#71717A] bg-[#F4F4F5] px-2 py-0.5 rounded border border-[#E4E4E7]">
            <XCircle className="w-3.5 h-3.5" />
            Order Closed
          </span>
        )}
      </div>

      {/* Progress Line and Steps */}
      <div className="relative">
        <div className="hidden sm:block absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#E5E5DE]" />

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-2 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            let circleClasses = 'bg-[#F4F4F0] border-[#E5E5DE] text-[#71717A]';
            if (isCompleted) {
              circleClasses = 'bg-[#047857] border-[#047857] text-white';
            } else if (isCurrent) {
              circleClasses = isDisputed
                ? 'bg-[#B91C1C] border-[#B91C1C] text-white ring-4 ring-[#FEE2E2]'
                : 'bg-[#FF5416] border-[#FF5416] text-white ring-4 ring-[#FFF2EC]';
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
                      ? 'font-bold text-[#121214]'
                      : isCompleted
                      ? 'font-medium text-[#047857]'
                      : 'text-[#71717A]'
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
