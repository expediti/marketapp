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
        return 'bg-[#FFF2EC] text-[#FF5416] border-[#FFD2C1]';
      case 'ACCEPTED':
        return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
      case 'IN_PROGRESS':
        return 'bg-[#FEFCE8] text-[#A16207] border-[#FEF08A]';
      case 'DELIVERED':
        return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'APPROVED':
      case 'COMPLETED':
      case 'PAID':
        return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
      case 'DISPUTED':
      case 'ADMIN_REVIEW':
        return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
      case 'REFUNDED':
      case 'CANCELLED':
        return 'bg-[#F4F4F5] text-[#71717A] border-[#E4E4E7]';
      case 'CREATOR_PENDING':
      case 'PAYMENT_PENDING':
      case 'PAYOUT_PENDING':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      default:
        return 'bg-[#F4F4F5] text-[#52525B] border-[#E4E4E7]';
    }
  };

  const formatLabel = (val: string) => {
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
