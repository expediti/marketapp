import React from 'react';
import { OrderStatus, PaymentStatus, PayoutStatus } from '@/types/marketplace';

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | PayoutStatus | string;
  type?: 'order' | 'payment' | 'payout';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const getBadgeStyle = (val: string) => {
    switch (val) {
      case 'FUNDED':
        return 'bg-[#FFF2EC] dark:bg-orange-950/40 text-[#FF5416] border-[#FFD2C1] dark:border-orange-900';
      case 'ACCEPTED':
        return 'bg-[#F0FDF4] dark:bg-emerald-950/40 text-[#15803D] dark:text-emerald-400 border-[#BBF7D0] dark:border-emerald-800';
      case 'IN_PROGRESS':
        return 'bg-[#FEFCE8] dark:bg-amber-950/40 text-[#A16207] dark:text-amber-400 border-[#FEF08A] dark:border-amber-800';
      case 'WAITING_FOR_BUSINESS':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'DELIVERED':
        return 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#1D4ED8] dark:text-blue-400 border-[#BFDBFE] dark:border-blue-800';
      case 'REVISION_REQUESTED':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'APPROVED':
      case 'AUTO_APPROVED':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-400 border-[#A7F3D0] dark:border-emerald-800';
      case 'DISPUTED':
      case 'SYSTEM_REVIEW':
      case 'ADMIN_REVIEW':
      case 'OVERDUE':
        return 'bg-[#FEF2F2] dark:bg-red-950/40 text-[#B91C1C] dark:text-red-400 border-[#FECACA] dark:border-red-900';
      case 'REFUNDED':
      case 'CANCELLED':
        return 'bg-[#F4F4F5] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-400 border-[#E4E4E7] dark:border-zinc-700';
      case 'DEAL_CONFIRMED':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'WORK_STARTED':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'CREATOR_PENDING':
      case 'PAYMENT_PENDING':
      case 'PAYOUT_PENDING':
        return 'bg-[#FFFBEB] dark:bg-amber-950/30 text-[#B45309] dark:text-amber-300 border-[#FDE68A] dark:border-amber-900';
      default:
        return 'bg-[#F4F4F5] dark:bg-zinc-800 text-[#52525B] dark:text-zinc-300 border-[#E4E4E7] dark:border-zinc-700';
    }
  };

  const formatLabel = (val: string) => {
    if (val === 'DISPUTED' || val === 'ADMIN_REVIEW') return 'System Review';
    return val.replace(/_/g, ' ');
  };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-mono'
      : 'px-2.5 py-1 text-xs font-mono font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase tracking-wider rounded border ${getBadgeStyle(
        status
      )} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {formatLabel(status)}
    </span>
  );
}
