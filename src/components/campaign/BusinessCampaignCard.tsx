'use client';

import React from 'react';
import Link from 'next/link';
import { Order } from '@/types/marketplace';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  CreditCard,
  Video,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface BusinessCampaignCardProps {
  order: Order;
  onPayFirst50?: (orderId: string) => void;
  onPayRemaining50?: (orderId: string) => void;
}

export function BusinessCampaignCard({
  order,
  onPayFirst50,
  onPayRemaining50,
}: BusinessCampaignCardProps) {
  const totalAmount = Number(order.total_amount || 0);
  const firstInstalment =
    order.first_payment_amount ?? order.initial_payment_amount ?? Math.round(totalAmount * 0.5 * 100) / 100;
  const secondInstalment =
    order.second_payment_amount ?? order.final_payment_amount ?? Math.round((totalAmount - firstInstalment) * 100) / 100;

  const isFirstPaid = Boolean(
    order.initial_paid_at ||
    ['WORK_STARTED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_FINAL_PAYMENT', 'READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(order.order_status)
  );

  const isSecondPaid = Boolean(
    order.final_paid_at ||
    ['READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(order.order_status)
  );

  const creatorName =
    order.creator?.display_name ||
    order.creator?.profile?.display_name ||
    'Creator Partner';

  const campaignTitle =
    order.campaign?.campaign_name ||
    order.package?.name ||
    order.brief?.objective ||
    `Campaign #${order.order_number}`;

  // Contextual Next Required Action & primary button
  let nextActionText = '';
  let primaryAction: { label: string; href?: string; onClick?: () => void; icon: any; variant: 'primary' | 'outline' } | null = null;

  if (!isFirstPaid) {
    nextActionText = 'Complete the first 50% instalment to authorize the creator to start production.';
    primaryAction = {
      label: `Pay First 50% (₹${firstInstalment.toLocaleString('en-IN')})`,
      href: `/orders/${order.id}`,
      icon: CreditCard,
      variant: 'primary',
    };
  } else if (order.order_status === 'WORK_STARTED' || order.order_status === 'IN_PROGRESS') {
    nextActionText = 'Creator is actively producing content. Awaiting watermarked preview.';
    primaryAction = {
      label: 'Track Campaign',
      href: `/orders/${order.id}`,
      icon: ArrowRight,
      variant: 'outline',
    };
  } else if (order.order_status === 'PREVIEW_SUBMITTED') {
    nextActionText = 'Watermarked preview submitted for your review. (24-hour review window active).';
    primaryAction = {
      label: 'Review Preview Room',
      href: `/orders/${order.id}`,
      icon: Eye,
      variant: 'primary',
    };
  } else if (order.order_status === 'REVISION_REQUESTED') {
    nextActionText = `Revision #${order.revisions_used || 1} requested. Creator is preparing replacement preview.`;
    primaryAction = {
      label: 'View Revision Details',
      href: `/orders/${order.id}`,
      icon: RefreshCw,
      variant: 'outline',
    };
  } else if (order.order_status === 'AWAITING_FINAL_PAYMENT') {
    nextActionText = 'Preview approved! Complete remaining 50% payment to unlock clean final video.';
    primaryAction = {
      label: `Pay Remaining 50% (₹${secondInstalment.toLocaleString('en-IN')})`,
      href: `/orders/${order.id}`,
      icon: CreditCard,
      variant: 'primary',
    };
  } else if (order.order_status === 'READY_FOR_FINAL_DELIVERY' || order.order_status === 'READY_TO_PUBLISH') {
    nextActionText = 'Both instalments confirmed (100%). Creator notified to publish live content.';
    primaryAction = {
      label: 'Track Publication',
      href: `/orders/${order.id}`,
      icon: Clock,
      variant: 'outline',
    };
  } else if (order.order_status === 'DELIVERED') {
    nextActionText = 'Final deliverables submitted. Verify live Instagram post and confirm completion.';
    primaryAction = {
      label: 'View Final Delivery',
      href: `/orders/${order.id}`,
      icon: CheckCircle,
      variant: 'primary',
    };
  } else if (order.order_status === 'COMPLETED') {
    nextActionText = 'Campaign completed successfully. All requirements fulfilled.';
    primaryAction = {
      label: 'View Completed Order',
      href: `/orders/${order.id}`,
      icon: CheckCircle,
      variant: 'outline',
    };
  } else {
    nextActionText = 'Campaign in progress.';
    primaryAction = {
      label: 'Open Workspace',
      href: `/orders/${order.id}`,
      icon: ArrowRight,
      variant: 'outline',
    };
  }

  return (
    <div className="p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 shadow-sm hover:border-[#FF5416]/60 transition-all font-mono text-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base text-[#121214] dark:text-white">
              {campaignTitle}
            </span>
            <StatusBadge status={order.order_status} size="sm" />
          </div>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#FF5416]" />
            <span>{creatorName}</span>
            <span>•</span>
            <span>Order #{order.order_number}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="font-bold text-base sm:text-lg text-[#121214] dark:text-white block">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block">
            2 × ₹{firstInstalment.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Two Instalment Indicators */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase block">First Instalment (50%)</span>
            <span className="font-bold text-[#121214] dark:text-white mt-0.5 block">
              ₹{firstInstalment.toLocaleString('en-IN')}
            </span>
          </div>
          {isFirstPaid ? (
            <span className="text-[10px] text-[#047857] dark:text-emerald-400 font-bold bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Paid
            </span>
          ) : (
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 animate-pulse">
              Due Now
            </span>
          )}
        </div>

        <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#71717A] uppercase block">Second Instalment (50%)</span>
            <span className="font-bold text-[#121214] dark:text-white mt-0.5 block">
              ₹{secondInstalment.toLocaleString('en-IN')}
            </span>
          </div>
          {isSecondPaid ? (
            <span className="text-[10px] text-[#047857] dark:text-emerald-400 font-bold bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Paid
            </span>
          ) : order.order_status === 'AWAITING_FINAL_PAYMENT' ? (
            <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 animate-pulse">
              Due Now
            </span>
          ) : (
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              Pending Preview
            </span>
          )}
        </div>
      </div>

      {/* Next required action guidance */}
      <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2 min-w-0">
          <Clock className="w-4 h-4 text-[#FF5416] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-[#71717A] uppercase font-bold block">Next Required Action</span>
            <p className="text-[#121214] dark:text-zinc-200 font-medium leading-relaxed">
              {nextActionText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
            Deadline: {order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
          </span>
          {primaryAction && (
            <Link href={primaryAction.href || `/orders/${order.id}`}>
              <Button
                variant={primaryAction.variant}
                size="sm"
                className={
                  primaryAction.variant === 'primary'
                    ? 'bg-[#FF5416] hover:bg-[#E0440A] text-white font-bold'
                    : 'text-xs'
                }
              >
                <span>{primaryAction.label}</span>
                <primaryAction.icon className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
