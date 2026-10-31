'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types/marketplace';
import {
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  Hourglass,
  FileCheck,
  Video,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface CampaignTimelineProps {
  order: Order;
  className?: string;
}

interface TimelineStepDef {
  key: string;
  stepNumber: number;
  label: string;
  sublabel: string;
  getTimestamp: (order: Order) => string | undefined | null;
  isStepComplete: (order: Order, status: OrderStatus) => boolean;
  isStepActive: (order: Order, status: OrderStatus) => boolean;
}

const TIMELINE_STEPS: TimelineStepDef[] = [
  {
    key: 'deal_confirmed',
    stepNumber: 1,
    label: 'Deal Confirmed',
    sublabel: 'Terms locked & 50/50 agreed',
    getTimestamp: (o) => o.created_at,
    isStepComplete: (o, s) => {
      return s !== 'DRAFT' && s !== 'REQUESTED' && s !== 'NEGOTIATING';
    },
    isStepActive: (o, s) => {
      return (
        s === 'DEAL_CONFIRMED' ||
        s === 'AWAITING_FIRST_PAYMENT' ||
        s === 'FIRST_PAYMENT_PENDING' ||
        s === 'PAYMENT_PENDING' ||
        s === 'ACCEPTED_AWAITING_PAYMENT'
      ) && !o.initial_paid_at;
    },
  },
  {
    key: 'first_payment',
    stepNumber: 2,
    label: 'First Payment Received',
    sublabel: 'Initial 50% verified',
    getTimestamp: (o) => o.initial_paid_at,
    isStepComplete: (o) => Boolean(o.initial_paid_at),
    isStepActive: (o, s) => {
      return (
        (s === 'DEAL_CONFIRMED' || s === 'AWAITING_FIRST_PAYMENT' || s === 'FIRST_PAYMENT_PENDING' || s === 'PAYMENT_PENDING') &&
        !o.initial_paid_at
      );
    },
  },
  {
    key: 'work_started',
    stepNumber: 3,
    label: 'Creator Started Working',
    sublabel: 'Content in production',
    getTimestamp: (o) => o.work_started_at || o.initial_paid_at,
    isStepComplete: (o, s) => {
      return Boolean(
        o.work_started_at ||
        o.preview_submitted_at ||
        o.preview_url ||
        s === 'PREVIEW_SUBMITTED' ||
        s === 'REVISION_REQUESTED' ||
        s === 'AWAITING_FINAL_PAYMENT' ||
        s === 'FINAL_PAYMENT_PENDING' ||
        s === 'READY_FOR_FINAL_DELIVERY' ||
        s === 'READY_TO_PUBLISH' ||
        s === 'DELIVERED' ||
        s === 'COMPLETED'
      );
    },
    isStepActive: (o, s) => {
      return Boolean(o.initial_paid_at) && (s === 'WORK_STARTED' || s === 'IN_PROGRESS' || s === 'WAITING_FOR_BUSINESS');
    },
  },
  {
    key: 'preview_submitted',
    stepNumber: 4,
    label: 'Preview Submitted',
    sublabel: 'Watermarked video uploaded',
    getTimestamp: (o) => o.preview_submitted_at || o.current_preview?.uploaded_at,
    isStepComplete: (o, s) => {
      return Boolean(
        o.preview_submitted_at ||
        o.preview_url ||
        o.current_preview_id ||
        s === 'AWAITING_FINAL_PAYMENT' ||
        s === 'FINAL_PAYMENT_PENDING' ||
        s === 'READY_FOR_FINAL_DELIVERY' ||
        s === 'READY_TO_PUBLISH' ||
        s === 'DELIVERED' ||
        s === 'COMPLETED'
      );
    },
    isStepActive: (o, s) => {
      return s === 'WORK_STARTED' || s === 'IN_PROGRESS' || s === 'REVISION_REQUESTED';
    },
  },
  {
    key: 'business_reviewed',
    stepNumber: 5,
    label: 'Business Reviewed Preview',
    sublabel: 'Approved or revision requested',
    getTimestamp: (o) => o.approved_at,
    isStepComplete: (o, s) => {
      return Boolean(
        o.approved_at ||
        s === 'AWAITING_FINAL_PAYMENT' ||
        s === 'FINAL_PAYMENT_PENDING' ||
        s === 'READY_FOR_FINAL_DELIVERY' ||
        s === 'READY_TO_PUBLISH' ||
        s === 'DELIVERED' ||
        s === 'COMPLETED'
      );
    },
    isStepActive: (o, s) => {
      return s === 'PREVIEW_SUBMITTED';
    },
  },
  {
    key: 'second_payment',
    stepNumber: 6,
    label: 'Second Payment Received',
    sublabel: 'Remaining 50% verified',
    getTimestamp: (o) => o.final_paid_at,
    isStepComplete: (o) => Boolean(o.final_paid_at),
    isStepActive: (o, s) => {
      return (s === 'AWAITING_FINAL_PAYMENT' || s === 'FINAL_PAYMENT_PENDING') && !o.final_paid_at;
    },
  },
  {
    key: 'final_video_uploaded',
    stepNumber: 7,
    label: 'Final Video Uploaded',
    sublabel: 'Clean deliverable ready',
    getTimestamp: (o) => o.final_delivered_at || o.delivered_at,
    isStepComplete: (o, s) => {
      return Boolean(
        o.final_delivered_at ||
        o.delivered_at ||
        o.current_final_delivery_id ||
        s === 'DELIVERED' ||
        s === 'COMPLETED'
      );
    },
    isStepActive: (o, s) => {
      return Boolean(o.final_paid_at) && (s === 'READY_FOR_FINAL_DELIVERY' || s === 'READY_TO_PUBLISH');
    },
  },
  {
    key: 'instagram_publication',
    stepNumber: 8,
    label: 'Instagram Publication Submitted',
    sublabel: 'Live post / Reel URL verified',
    getTimestamp: (o) => o.final_delivered_at || o.delivered_at,
    isStepComplete: (o, s) => {
      return Boolean(
        (o.final_delivery_url && o.final_delivery_url.includes('instagram.com')) ||
        (o.delivery?.instagram_post_url) ||
        s === 'COMPLETED'
      );
    },
    isStepActive: (o, s) => {
      return s === 'READY_TO_PUBLISH' || (s === 'DELIVERED' && !o.completed_at);
    },
  },
  {
    key: 'campaign_completed',
    stepNumber: 9,
    label: 'Campaign Completed',
    sublabel: 'Agreed requirements fulfilled',
    getTimestamp: (o) => o.completed_at || o.delivered_at,
    isStepComplete: (o, s) => s === 'COMPLETED',
    isStepActive: (o, s) => s === 'DELIVERED' && !o.completed_at,
  },
];

function formatStepTimestamp(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * 9-Stage Campaign Lifecycle Timeline
 * 
 * The single source of truth for campaign progress.
 * Displays completed steps with green ticks, current step highlighted,
 * and relevant verified timestamps.
 */
export function CampaignTimeline({ order, className = '' }: CampaignTimelineProps) {
  const currentStatus = order.order_status;

  const isDisputed =
    currentStatus === 'DISPUTED' ||
    currentStatus === 'SYSTEM_REVIEW' ||
    currentStatus === 'ADMIN_REVIEW';
  const isRevision = currentStatus === 'REVISION_REQUESTED';
  const isWaiting = currentStatus === 'WAITING_FOR_BUSINESS';

  // Determine active step index
  let activeStepIdx = 0;
  for (let i = TIMELINE_STEPS.length - 1; i >= 0; i--) {
    if (TIMELINE_STEPS[i].isStepComplete(order, currentStatus)) {
      activeStepIdx = Math.min(TIMELINE_STEPS.length - 1, i + 1);
      break;
    }
  }

  // Override if current status explicitly matches an active definition
  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (TIMELINE_STEPS[i].isStepActive(order, currentStatus)) {
      activeStepIdx = i;
      break;
    }
  }

  return (
    <div className={`bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm font-mono ${className}`}>
      {/* Header and status badges */}
      <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
        <div>
          <span className="editorial-label text-[#FF5416] block">
            Campaign Timeline
          </span>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            Permanent record of campaign lifecycle & payment milestones
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isDisputed && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-[#FECACA] dark:border-red-900">
              <AlertTriangle className="w-3.5 h-3.5" />
              Under Dispute Review
            </span>
          )}
          {isRevision && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              Revision #{order.revisions_used || 1} in Progress
            </span>
          )}
          {isWaiting && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
              <Hourglass className="w-3.5 h-3.5" />
              Waiting for Brand Materials
            </span>
          )}
          {order.order_status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-[#A7F3D0] dark:border-emerald-800">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Campaign Completed
            </span>
          )}
        </div>
      </div>

      {/* 9-Step Timeline Grid */}
      <div className="relative">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-4 left-6 right-6 h-0.5 bg-[#E5E5DE] dark:bg-zinc-800 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-4 lg:gap-2 relative z-10">
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = step.isStepComplete(order, currentStatus);
            const isCurrent = idx === activeStepIdx && !isCompleted;
            const timestampStr = formatStepTimestamp(step.getTimestamp(order));

            let circleClass = 'bg-[#F4F4F0] dark:bg-zinc-800 border-[#E5E5DE] dark:border-zinc-700 text-[#71717A] dark:text-zinc-400';
            if (isCompleted) {
              circleClass = 'bg-[#10B981] border-[#10B981] text-white shadow-sm';
            } else if (isCurrent) {
              circleClass = isDisputed
                ? 'bg-[#B91C1C] border-[#B91C1C] text-white ring-4 ring-red-100 dark:ring-red-950'
                : 'bg-[#FF5416] border-[#FF5416] text-white ring-4 ring-orange-100 dark:ring-orange-950';
            }

            return (
              <div
                key={step.key}
                className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-1.5 text-left lg:text-center"
              >
                {/* Step Circle */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all ${circleClass}`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{step.stepNumber}</span>
                  )}
                </div>

                {/* Step Text & Timestamp */}
                <div className="min-w-0">
                  <h5
                    className={`text-xs font-semibold leading-tight ${
                      isCompleted
                        ? 'text-[#047857] dark:text-emerald-400'
                        : isCurrent
                        ? 'text-[#121214] dark:text-white font-bold'
                        : 'text-[#71717A] dark:text-zinc-400'
                    }`}
                  >
                    {step.label}
                  </h5>

                  <p className="text-[10px] text-[#A1A1AA] dark:text-zinc-500 line-clamp-1 mt-0.5">
                    {step.sublabel}
                  </p>

                  {timestampStr && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#71717A] dark:text-zinc-400 mt-1">
                      <Clock className="w-2.5 h-2.5 shrink-0" />
                      <span>{timestampStr}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
