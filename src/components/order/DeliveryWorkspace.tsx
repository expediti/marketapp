'use client';

import React, { useState } from 'react';
import { Order } from '@/types/marketplace';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { parseInstagramUrl } from '@/lib/utils/instagram';
import {
  CheckCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  Clock,
  PlayCircle,
  FileCheck,
  RefreshCw,
  Calendar,
  Hourglass,
  Info,
  CreditCard,
  XCircle,
  Eye,
  Send,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

interface DeliveryWorkspaceProps {
  order: Order;
  onOpenDispute: () => void;
}

export function DeliveryWorkspace({ order, onOpenDispute }: DeliveryWorkspaceProps) {
  const {
    currentUser,
    activeRole,
    submitPrivatePreview,
    publishAndCompleteOrder,
    requestRevision,
    markWaitingForBusiness,
    resumeFromWaiting,
    requestDeadlineExtension,
    respondDeadlineExtension,
    payOrderWithRazorpay,
    cancelConfirmedDeal,
    uploadDeliveryProofFile,
  } = useMarketplace();

  // Two-Stage Calculation
  const initialPaymentAmount =
    order.initial_payment_amount ?? Math.round(order.total_amount * 0.5 * 100) / 100;
  const finalPaymentAmount =
    order.final_payment_amount ?? Math.round((order.total_amount - initialPaymentAmount) * 100) / 100;

  // State flags
  const isInitialPaid = Boolean(
    order.initial_paid_at ||
    order.payment_status === 'PARTIALLY_PAID' ||
    order.payment_status === 'PAID' ||
    order.order_status === 'WORK_STARTED' ||
    order.order_status === 'IN_PROGRESS' ||
    order.order_status === 'PREVIEW_SUBMITTED' ||
    order.order_status === 'FINAL_PAYMENT_PENDING' ||
    order.order_status === 'READY_TO_PUBLISH' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'APPROVED' ||
    order.order_status === 'AUTO_APPROVED' ||
    order.order_status === 'COMPLETED'
  );

  const isPreviewSubmitted = Boolean(
    order.preview_url ||
    order.order_status === 'PREVIEW_SUBMITTED' ||
    order.order_status === 'FINAL_PAYMENT_PENDING' ||
    order.order_status === 'READY_TO_PUBLISH' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'COMPLETED'
  );

  const isFinalPaid = Boolean(
    order.final_paid_at ||
    order.order_status === 'READY_TO_PUBLISH' ||
    (order.payment_status === 'PAID' &&
      order.order_status !== 'WORK_STARTED' &&
      order.order_status !== 'PREVIEW_SUBMITTED') ||
    order.order_status === 'COMPLETED'
  );

  const isCompleted =
    order.order_status === 'COMPLETED' ||
    order.order_status === 'APPROVED' ||
    order.order_status === 'AUTO_APPROVED';

  // Private Preview form state (Creator)
  const [previewInputUrl, setPreviewInputUrl] = useState('');
  const [previewInputNotes, setPreviewInputNotes] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isSubmittingPreview, setIsSubmittingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Final Publication form state (Creator)
  const [publicPostUrl, setPublicPostUrl] = useState('');
  const [publicNotes, setPublicNotes] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Payment states (Brand)
  const [isProcessingInitialPay, setIsProcessingInitialPay] = useState(false);
  const [initialPayError, setInitialPayError] = useState<string | null>(null);
  const [isProcessingFinalPay, setIsProcessingFinalPay] = useState(false);
  const [finalPayError, setFinalPayError] = useState<string | null>(null);

  // Cancel Deal Modal state
  const [isCancelDealModalOpen, setIsCancelDealModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Revision state
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Waiting for business state
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);
  const [waitingReason, setWaitingReason] = useState('');
  const [isSubmittingWaiting, setIsSubmittingWaiting] = useState(false);

  // Extension request state
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionDate, setExtensionDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [extensionReason, setExtensionReason] = useState('');
  const [isSubmittingExtension, setIsSubmittingExtension] = useState(false);

  // Policy disclosure expander
  const [showPolicyInfo, setShowPolicyInfo] = useState(false);

  const isMeBusiness =
    currentUser?.id === order.business_user_id ||
    currentUser?.id === order.business_id ||
    activeRole === 'business' ||
    activeRole === 'advertiser';

  const isMeCreator =
    currentUser?.id === order.creator_user_id ||
    currentUser?.id === order.creator_id ||
    activeRole === 'creator' ||
    activeRole === 'influencer';

  const includedRevisions = order.included_revisions ?? 1;
  const revisionsUsed = order.revisions_used ?? 0;
  const revisionsRemaining = Math.max(0, includedRevisions - revisionsUsed);

  // Check deadline overdue
  const isOverdue =
    order.deadline &&
    new Date(order.deadline).getTime() < Date.now() &&
    ['ACCEPTED', 'IN_PROGRESS', 'WORK_STARTED', 'REVISION_REQUESTED'].includes(order.order_status);

  // Handlers
  const handlePayInitialStage = async () => {
    setIsProcessingInitialPay(true);
    setInitialPayError(null);
    try {
      const res = await payOrderWithRazorpay(
        order.id,
        'INITIAL',
        currentUser?.display_name,
        currentUser?.email
      );
      if (!res.success && res.status !== 'CANCELLED') {
        setInitialPayError(res.error || 'Initial payment failed. You can retry.');
      }
    } catch (err: any) {
      setInitialPayError(err.message || 'Payment initiation failed.');
    } finally {
      setIsProcessingInitialPay(false);
    }
  };

  const handlePayFinalStage = async () => {
    setIsProcessingFinalPay(true);
    setFinalPayError(null);
    try {
      const res = await payOrderWithRazorpay(
        order.id,
        'FINAL',
        currentUser?.display_name,
        currentUser?.email
      );
      if (!res.success && res.status !== 'CANCELLED') {
        setFinalPayError(res.error || 'Final payment failed. You can retry.');
      }
    } catch (err: any) {
      setFinalPayError(err.message || 'Payment initiation failed.');
    } finally {
      setIsProcessingFinalPay(false);
    }
  };

  const handleConfirmCancelDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCancel(true);
    try {
      await cancelConfirmedDeal(order.id, cancelReason.trim() || 'Business cancelled unpaid deal');
      setIsCancelDealModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel deal');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleSubmitPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewError(null);

    if (!previewInputUrl.trim() && !previewFile) {
      setPreviewError('Please provide a preview link or upload a draft file.');
      return;
    }

    setIsSubmittingPreview(true);
    try {
      let finalUrl = previewInputUrl.trim();
      if (previewFile && !finalUrl) {
        const { publicUrl } = await uploadDeliveryProofFile(previewFile);
        finalUrl = publicUrl;
      }

      await submitPrivatePreview(order.id, finalUrl, previewInputNotes.trim());
      setPreviewInputUrl('');
      setPreviewInputNotes('');
      setPreviewFile(null);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to submit preview');
    } finally {
      setIsSubmittingPreview(false);
    }
  };

  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;
    setIsSubmittingRevision(true);
    setRevisionError(null);
    try {
      await requestRevision(order.id, revisionNotes.trim());
      setIsRequestingRevision(false);
      setRevisionNotes('');
    } catch (err: any) {
      setRevisionError(err.message || 'Failed to request revision');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const handlePublishAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);

    const parsedIg = parseInstagramUrl(publicPostUrl.trim());
    const validUrl = parsedIg.isValid ? parsedIg.canonicalUrl! : publicPostUrl.trim();

    if (!validUrl) {
      setPublishError('Please provide the live publication link or deliverable URL.');
      return;
    }

    setIsPublishing(true);
    try {
      await publishAndCompleteOrder(order.id, validUrl, publicNotes.trim());
      setPublicPostUrl('');
      setPublicNotes('');
    } catch (err: any) {
      setPublishError(err.message || 'Failed to complete campaign');
    } finally {
      setIsPublishing(false);
    }
  };

  const currentPreviewUrl = order.preview_url;
  const currentLiveUrl =
    order.final_delivery_url || order.delivery?.instagram_post_url || order.delivery?.proof_url;

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm font-mono text-xs">
      {/* 1. TWO-STAGE PAYMENT ARCHITECTURE OVERVIEW CARD */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FBFBFA] via-white to-[#FFF6F2] dark:from-zinc-900 dark:via-[#18181B] dark:to-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF5416] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Two-Stage Campaign Payments</span>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
              Direct two-installment process. No escrow or platform-held campaign balance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicyInfo(!showPolicyInfo)}
            className="inline-flex items-center gap-1 text-[11px] text-[#FF5416] hover:underline self-start sm:self-auto font-semibold"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showPolicyInfo ? 'Hide Policy Details' : 'How Payments Work'}</span>
            {showPolicyInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* 2 Stages Visual Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Stage 1 Breakdown */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              isInitialPaid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-zinc-800 border-purple-200 dark:border-purple-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] flex items-center justify-center text-[10px]">
                  1
                </span>
                Initial Payment (50%)
              </span>
              {isInitialPaid ? (
                <span className="text-[11px] text-[#047857] dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Paid ✓
                </span>
              ) : (
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                  Due Before Work
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                Pays to initiate campaign production
              </span>
              <span className="font-bold text-sm text-[#121214] dark:text-white">
                ₹{initialPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Stage 2 Breakdown */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              isFinalPaid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : isPreviewSubmitted
                ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700 ring-2 ring-purple-100 dark:ring-purple-900/30'
                : 'bg-white dark:bg-zinc-800 border-[#E5E5DE] dark:border-zinc-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] flex items-center justify-center text-[10px]">
                  2
                </span>
                Final Payment (50%)
              </span>
              {isFinalPaid ? (
                <span className="text-[11px] text-[#047857] dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Paid ✓
                </span>
              ) : isPreviewSubmitted ? (
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold animate-pulse">
                  Due After Preview
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                  After Preview Review
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                Paid before public release or deliverable
              </span>
              <span className="font-bold text-sm text-[#121214] dark:text-white">
                ₹{finalPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Policy Explainer Drawer */}
        {showPolicyInfo && (
          <div className="p-3.5 bg-[#FAF9F5] dark:bg-zinc-950/60 rounded-lg border border-[#ECECE6] dark:border-zinc-800 text-[11px] text-[#52525B] dark:text-zinc-300 space-y-2 leading-relaxed">
            <p className="font-bold text-[#121214] dark:text-white">
              MarketMyIdea Payment Framework:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Two Instalments:</strong> 50% before work begins and 50% before final publication or unwatermarked delivery.
              </li>
              <li>
                <strong>No Platform-Held Escrow:</strong> MarketMyIdea does not hold campaign funds in escrow or maintain platform-held balances.
              </li>
              <li>
                <strong>Private Preview Protection:</strong> The second instalment is only due after the creator shares a private preview.
              </li>
              <li>
                <strong>Creator Protection:</strong> Creators are never required to publish publicly before the final payment is confirmed.
              </li>
              <li>
                <strong>Transparent Economics:</strong> Platform and gateway fees are disclosed during checkout. Disputes follow the platform Refund and Cancellation Policy.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* OVERDUE NOTICE */}
      {isOverdue && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Delivery is past the agreed deadline ({new Date(order.deadline).toLocaleDateString('en-IN')}).</span>
          </div>
          <div className="flex items-center gap-2">
            {isMeCreator && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExtensionModalOpen(true)}
                className="text-xs"
              >
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span>Request Extension</span>
              </Button>
            )}
            {isMeBusiness && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenDispute}
                className="text-red-600 border-red-200 hover:bg-red-100 text-xs"
              >
                <span>System Review</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DEADLINE EXTENSION BANNER */}
      {order.extension_status === 'REQUESTED' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-400 block">
              Deadline Extension Requested
            </span>
            <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
              Creator requested:{' '}
              <strong>
                {order.extension_requested_deadline
                  ? new Date(order.extension_requested_deadline).toLocaleDateString('en-IN')
                  : 'N/A'}
              </strong>
              {order.extension_reason && ` — Reason: "${order.extension_reason}"`}
            </p>
          </div>
          {isMeBusiness && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => respondDeadlineExtension(order.id, false)}
                className="text-xs"
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => respondDeadlineExtension(order.id, true)}
                className="text-xs bg-[#047857] hover:bg-[#065F46] text-white"
              >
                Accept Extension
              </Button>
            </div>
          )}
        </div>
      )}

      {/* WAITING FOR BUSINESS BANNER */}
      {order.order_status === 'WAITING_FOR_BUSINESS' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Hourglass className="w-4 h-4 text-blue-600" />
              Creator Waiting for Brand Materials
            </span>
            {isMeCreator && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => resumeFromWaiting(order.id)}
                className="text-xs"
              >
                Resume Production
              </Button>
            )}
          </div>
          <p className="text-blue-700 dark:text-blue-400 text-[11px]">
            {order.waiting_reason || 'Waiting for assets, brand guidelines, or product access.'}
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 1: INITIAL PAYMENT (50%) PENDING */}
      {/* ========================================================================= */}
      {!isInitialPaid && (
        <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-purple-600" />
              STAGE 1: INITIAL 50% PAYMENT DUE
            </span>
            <span className="text-sm font-bold text-purple-950 dark:text-purple-200">
              ₹{initialPaymentAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-purple-900 dark:text-purple-300 text-xs leading-relaxed">
            {isMeBusiness
              ? 'Pay the initial 50% instalment to begin campaign production. Once confirmed, the creator can start work and prepare your private preview. The remaining 50% is due only after you inspect the preview.'
              : 'Waiting for brand partner to pay the initial 50% instalment. You will be notified immediately when confirmed so you can begin work.'}
          </p>

          {initialPayError && (
            <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
              {initialPayError}
            </div>
          )}

          {isMeBusiness && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handlePayInitialStage}
                isLoading={isProcessingInitialPay}
                disabled={isProcessingInitialPay}
                className="bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold px-4"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {isProcessingInitialPay
                    ? 'Processing...'
                    : `Pay Initial 50% — ₹${initialPaymentAmount.toLocaleString('en-IN')}`}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelDealModalOpen(true)}
                disabled={isProcessingInitialPay}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                <span>Cancel Deal</span>
              </Button>
            </div>
          )}

          {isMeCreator && (
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-3 py-2 rounded text-xs">
              <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                Work starts once the brand completes the initial 50% payment (₹{initialPaymentAmount.toLocaleString('en-IN')}).
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: IN PRODUCTION & PRIVATE PREVIEW SUBMISSION */}
      {/* (Initial 50% paid, preview not yet submitted) */}
      {/* ========================================================================= */}
      {isInitialPaid && !isPreviewSubmitted && !isFinalPaid && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-[#047857] dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#047857]" />
                Stage 1 Payment Confirmed (₹{initialPaymentAmount.toLocaleString('en-IN')})
              </span>
              <p className="text-[#065F46] dark:text-emerald-300 text-[11px] mt-0.5">
                {isMeCreator
                  ? 'Campaign is in production. Prepare your content and share a private preview when ready.'
                  : 'Creator has received upfront payment and is producing your promotional content.'}
              </p>
            </div>

            {isMeCreator && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWaitingModalOpen(true)}
                  className="text-xs"
                >
                  <Hourglass className="w-3.5 h-3.5 mr-1" />
                  <span>Waiting for Assets</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExtensionModalOpen(true)}
                  className="text-xs"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>Request Extension</span>
                </Button>
              </div>
            )}
          </div>

          {/* Form for Creator to share private preview */}
          {isMeCreator && (
            <form
              onSubmit={handleSubmitPreview}
              className="border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-4 bg-white dark:bg-zinc-900 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#FF5416]" />
                    Share Private Preview with Brand
                  </h4>
                  <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                    Share an unlisted video, drive link, or draft preview for brand inspection.
                  </p>
                </div>
                <span className="text-[11px] text-[#FF5416] bg-[#FFF2EC] dark:bg-[#27140B] px-2.5 py-0.5 rounded font-semibold border border-[#FFD2C1] dark:border-[#4D1F0E]">
                  Private Preview
                </span>
              </div>

              {previewError && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Private Preview URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={previewInputUrl}
                  onChange={(e) => setPreviewInputUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/... or unlisted YouTube / Vimeo / Reel draft"
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
                <p className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1">
                  You are not required to publish publicly yet. The brand pays the remaining 50% after reviewing this preview.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Preview Notes for Brand <span className="text-[#71717A] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={previewInputNotes}
                  onChange={(e) => setPreviewInputNotes(e.target.value)}
                  placeholder="Outline key talking points, audio tracks used, and any specific questions for the brand..."
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingPreview}
                  className="w-full sm:w-auto bg-[#FF5416] hover:bg-[#E04810] text-white font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>Submit Private Preview for Review</span>
                </Button>
              </div>
            </form>
          )}

          {isMeBusiness && (
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded-lg text-xs text-[#71717A] dark:text-zinc-400 space-y-1">
              <strong className="text-[#121214] dark:text-white block font-mono">
                Production in Progress
              </strong>
              <p>
                The creator is currently producing your agreed content. Once ready, they will upload a private preview link here for your review. You will inspect the work and confirm the final 50% payment before public release.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 3: PRIVATE PREVIEW REVIEW & FINAL 50% PAYMENT */}
      {/* (Preview submitted, final payment not yet completed) */}
      {/* ========================================================================= */}
      {isPreviewSubmitted && !isFinalPaid && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-900 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#121214] dark:text-white">
                    Private Preview Shared
                  </h4>
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                    Shared for Brand Review
                  </span>
                </div>
              </div>

              {currentPreviewUrl && (
                <a
                  href={currentPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span>Open Preview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Preview link details */}
            <div className="p-3 bg-[#FAF9F5] dark:bg-zinc-800 rounded-lg space-y-1 text-xs">
              <div className="text-[11px] text-[#71717A] dark:text-zinc-400">
                <strong>Preview Link:</strong>{' '}
                <a
                  href={currentPreviewUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                >
                  {currentPreviewUrl}
                </a>
              </div>
              {order.preview_notes && (
                <div className="text-[11px] text-[#52525B] dark:text-zinc-300 pt-1 border-t border-[#ECECE6] dark:border-zinc-700 mt-1">
                  <strong>Notes:</strong> {order.preview_notes}
                </div>
              )}
            </div>

            {/* Actions for Brand: Request Revision, System Review, Pay Final 50% */}
            {isMeBusiness && (
              <div className="p-4 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-200 block">
                      STAGE 2: FINAL PAYMENT (50%) DUE BEFORE PUBLICATION
                    </span>
                    <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                      Review the completed work. The brand pays the remaining 50% before the creator publishes publicly or releases unwatermarked deliverables.
                    </p>
                  </div>
                  <span className="font-bold text-sm text-purple-950 dark:text-purple-100 shrink-0">
                    ₹{finalPaymentAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {finalPayError && (
                  <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                    {finalPayError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-purple-200 dark:border-purple-800">
                  <div className="text-[11px] text-purple-800 dark:text-purple-300">
                    Revisions remaining: <strong>{revisionsRemaining}</strong>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Revision Request */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRequestingRevision(true)}
                      disabled={revisionsRemaining <= 0 || isProcessingFinalPay}
                      className="text-xs"
                      title={revisionsRemaining <= 0 ? 'All revisions used' : 'Request changes'}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                      <span>Request Revision</span>
                    </Button>

                    {/* System Review Dispute */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenDispute}
                      disabled={isProcessingFinalPay}
                      className="text-xs text-[#B91C1C] border-red-200 hover:bg-red-50 dark:border-red-900"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#B91C1C]" />
                      <span>System Review</span>
                    </Button>

                    {/* Approve & Pay Final 50% */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePayFinalStage}
                      isLoading={isProcessingFinalPay}
                      disabled={isProcessingFinalPay}
                      className="text-xs bg-[#047857] hover:bg-[#065F46] text-white font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      <span>
                        {isProcessingFinalPay
                          ? 'Processing...'
                          : `Approve & Pay Final 50% — ₹${finalPaymentAmount.toLocaleString('en-IN')}`}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isMeCreator && (
              <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview is under brand review</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The brand is reviewing your draft. As stated in the platform payment policy, <strong>creators are not required to publish publicly before the final payment is confirmed</strong>. Once the brand confirms the remaining 50% (₹{finalPaymentAmount.toLocaleString('en-IN')}), you will be notified to publish.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 4: FINAL PAYMENT CONFIRMED / READY FOR PUBLICATION */}
      {/* (Both stages paid, awaiting public post submission) */}
      {/* ========================================================================= */}
      {isFinalPaid && !isCompleted && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#047857] dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#047857]" />
                STAGE 2: FINAL PAYMENT CONFIRMED (100% PAID)
              </span>
              <span className="text-xs font-bold text-[#047857]">
                Total: ₹{order.total_amount.toLocaleString('en-IN')} ✓
              </span>
            </div>
            <p className="text-xs text-[#065F46] dark:text-emerald-300">
              {isMeCreator
                ? 'Final 50% payment is confirmed! Please publish the approved content publicly or release the final deliverable to complete the campaign.'
                : 'Both instalments are fully confirmed! The creator has been notified to publish the approved content publicly.'}
            </p>
          </div>

          {/* Form for Creator to submit public live URL */}
          {isMeCreator && (
            <form
              onSubmit={handlePublishAndComplete}
              className="border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-4 bg-white dark:bg-zinc-900 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#FF5416]" />
                    Publish & Complete Campaign
                  </h4>
                  <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                    Submit the live Instagram Reel / post URL or final deliverable link.
                  </p>
                </div>
                <span className="text-[11px] text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-0.5 rounded font-semibold border border-[#A7F3D0] dark:border-emerald-800">
                  Ready to Publish
                </span>
              </div>

              {publishError && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Live Public Post / Reel URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#FF5416]" />
                  <input
                    type="url"
                    required
                    value={publicPostUrl}
                    onChange={(e) => setPublicPostUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                    className="w-full text-xs py-2 pl-9 pr-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
                <p className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1">
                  Provide the live Instagram link where the approved content is published.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Completion Notes <span className="text-[#71717A] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={publicNotes}
                  onChange={(e) => setPublicNotes(e.target.value)}
                  placeholder="Notes for brand (e.g. pinned comment, hashtags, duration)..."
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isPublishing}
                  className="w-full sm:w-auto bg-[#047857] hover:bg-[#065F46] text-white font-semibold"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span>Mark Campaign as Completed</span>
                </Button>
              </div>
            </form>
          )}

          {isMeBusiness && (
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded-lg text-xs text-[#71717A] dark:text-zinc-400 space-y-1">
              <strong className="text-[#121214] dark:text-white block font-mono">
                Awaiting Public Publication
              </strong>
              <p>
                Your final payment is confirmed. The creator has been notified to publish the approved content publicly on their channel. Once published, the live URL will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 5: CAMPAIGN COMPLETED */}
      {/* ========================================================================= */}
      {isCompleted && (
        <div className="bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#A7F3D0] dark:border-emerald-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#A7F3D0] dark:border-emerald-800/60 pb-3">
            <span className="font-bold text-sm text-[#047857] dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#047857]" />
              CAMPAIGN COMPLETED SUCCESSFULLY
            </span>
            <span className="text-xs font-bold text-[#047857]">
              ₹{order.total_amount.toLocaleString('en-IN')} (100% Settled)
            </span>
          </div>

          <p className="text-xs text-[#065F46] dark:text-emerald-300 leading-relaxed">
            {isMeCreator
              ? 'Campaign completed! Your net payout is eligible and will settle directly to your verified bank account or UPI ID.'
              : 'The campaign has been completed and verified. Thank you for collaborating on MarketMyIdea!'}
          </p>

          {currentLiveUrl && (
            <div className="p-3.5 bg-white dark:bg-zinc-800 rounded-lg border border-[#A7F3D0] dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#121214] dark:text-white block">
                    Delivered Publication Link
                  </span>
                  <span className="text-[11px] text-[#71717A] dark:text-zinc-400 truncate max-w-xs sm:max-w-md block">
                    {currentLiveUrl}
                  </span>
                </div>
              </div>

              <a
                href={currentLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FF5416] text-white hover:bg-[#E04810] text-xs font-semibold transition-colors shrink-0 shadow-sm"
              >
                <span>View Live Content</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVISION REQUESTED STATE MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isRequestingRevision && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-[#FF5416]" />
                Request Revision ({revisionsUsed + 1}/{includedRevisions})
              </h4>
              <button
                type="button"
                onClick={() => setIsRequestingRevision(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {revisionError && (
              <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                {revisionError}
              </div>
            )}

            <form onSubmit={handleConfirmRevision} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Revision Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail the specific adjustments needed based on the private preview..."
                  className="w-full text-xs p-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestingRevision(false)}
                  disabled={isSubmittingRevision}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingRevision}
                  className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white"
                >
                  Submit Revision Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL DEAL MODAL */}
      {isCancelDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white">Cancel Confirmed Deal</h4>
            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              Because no payment has been made yet, you can cancel this deal without penalty.
            </p>
            <form onSubmit={handleConfirmCancelDeal} className="space-y-3">
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full text-xs p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDealModalOpen(false)}
                  disabled={isSubmittingCancel}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingCancel}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WAITING FOR BUSINESS MODAL */}
      {isWaitingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white">
              Waiting for Brand Assets
            </h4>
            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              Pause production while waiting for product access, brand guidelines, or answers from the brand.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!waitingReason.trim()) return;
                setIsSubmittingWaiting(true);
                try {
                  await markWaitingForBusiness(order.id, waitingReason.trim());
                  setIsWaitingModalOpen(false);
                  setWaitingReason('');
                } finally {
                  setIsSubmittingWaiting(false);
                }
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                required
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                placeholder="What materials or assets are you waiting for?..."
                className="w-full text-xs p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWaitingModalOpen(false)}
                  disabled={isSubmittingWaiting}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingWaiting}
                >
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEADLINE EXTENSION MODAL */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white">
              Request Deadline Extension
            </h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!extensionDate || !extensionReason.trim()) return;
                setIsSubmittingExtension(true);
                try {
                  await requestDeadlineExtension(
                    order.id,
                    new Date(extensionDate).toISOString(),
                    extensionReason.trim()
                  );
                  setIsExtensionModalOpen(false);
                  setExtensionReason('');
                } finally {
                  setIsSubmittingExtension(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-semibold block mb-1">New Target Date</label>
                <input
                  type="date"
                  required
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Reason for Extension</label>
                <textarea
                  rows={3}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why extra production time is required..."
                  className="w-full text-xs p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExtensionModalOpen(false)}
                  disabled={isSubmittingExtension}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingExtension}
                >
                  Send Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
