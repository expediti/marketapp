'use client';

import React, { useState } from 'react';
import { Order } from '@/types/marketplace';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { PreviewRoom } from '@/components/campaign/PreviewRoom';
import { FinalDeliverySection } from '@/components/campaign/FinalDeliverySection';
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

interface DeliveryWorkspaceProps {
  order: Order;
  onOpenDispute: () => void;
}

export function DeliveryWorkspace({ order, onOpenDispute }: DeliveryWorkspaceProps) {
  const {
    currentUser,
    activeRole,
    markWaitingForBusiness,
    resumeFromWaiting,
    requestDeadlineExtension,
    respondDeadlineExtension,
    payOrderWithRazorpay,
    cancelConfirmedDeal,
  } = useMarketplace();

  // Financial calculations
  const totalAmount = Number(order.total_amount || 0);
  const initialPaymentAmount =
    order.first_payment_amount ?? order.initial_payment_amount ?? Math.round(totalAmount * 0.5 * 100) / 100;
  const finalPaymentAmount =
    order.second_payment_amount ?? order.final_payment_amount ?? Math.round((totalAmount - initialPaymentAmount) * 100) / 100;

  const commissionPct = Number(order.platform_commission_percentage || 10.00);
  const platformCommissionTotal = order.platform_commission_amount ?? Math.round(totalAmount * (commissionPct / 100.0) * 100) / 100;
  const creatorShareTotal = order.creator_total_amount ?? (totalAmount - platformCommissionTotal);

  // Status flags
  const isInitialPaid = Boolean(
    order.initial_paid_at ||
    order.payment_status === 'PARTIALLY_PAID' ||
    order.payment_status === 'PAID' ||
    order.order_status === 'WORK_STARTED' ||
    order.order_status === 'IN_PROGRESS' ||
    order.order_status === 'PREVIEW_SUBMITTED' ||
    order.order_status === 'AWAITING_FINAL_PAYMENT' ||
    order.order_status === 'FINAL_PAYMENT_PENDING' ||
    order.order_status === 'READY_FOR_FINAL_DELIVERY' ||
    order.order_status === 'READY_TO_PUBLISH' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'APPROVED' ||
    order.order_status === 'AUTO_APPROVED' ||
    order.order_status === 'COMPLETED'
  );

  const isFinalPaid = Boolean(
    order.final_paid_at ||
    order.order_status === 'READY_FOR_FINAL_DELIVERY' ||
    order.order_status === 'READY_TO_PUBLISH' ||
    (order.payment_status === 'PAID' &&
      order.order_status !== 'WORK_STARTED' &&
      order.order_status !== 'PREVIEW_SUBMITTED' &&
      order.order_status !== 'AWAITING_FINAL_PAYMENT') ||
    order.order_status === 'COMPLETED'
  );

  const isCompleted = order.order_status === 'COMPLETED';

  // Payment states (Brand)
  const [isProcessingInitialPay, setIsProcessingInitialPay] = useState(false);
  const [initialPayError, setInitialPayError] = useState<string | null>(null);
  const [isProcessingFinalPay, setIsProcessingFinalPay] = useState(false);
  const [finalPayError, setFinalPayError] = useState<string | null>(null);

  // Modals
  const [isCancelDealModalOpen, setIsCancelDealModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);
  const [waitingReason, setWaitingReason] = useState('');
  const [isSubmittingWaiting, setIsSubmittingWaiting] = useState(false);

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

  // Check deadline overdue
  const isOverdue =
    order.deadline &&
    new Date(order.deadline).getTime() < Date.now() &&
    ['ACCEPTED', 'IN_PROGRESS', 'WORK_STARTED', 'REVISION_REQUESTED'].includes(order.order_status);

  // Payment Handlers
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
        setInitialPayError(res.error || 'Payment initiation failed. Please try again.');
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
        setFinalPayError(res.error || 'Payment initiation failed. Please try again.');
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

  const handleConfirmWaiting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitingReason.trim()) return;
    setIsSubmittingWaiting(true);
    try {
      await markWaitingForBusiness(order.id, waitingReason.trim());
      setIsWaitingModalOpen(false);
      setWaitingReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsSubmittingWaiting(false);
    }
  };

  const handleConfirmExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionDate) return;
    setIsSubmittingExtension(true);
    try {
      await requestDeadlineExtension(order.id, extensionDate, extensionReason.trim() || 'Deadline extension requested');
      setIsExtensionModalOpen(false);
      setExtensionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to request extension');
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 1. TWO-STAGE PAYMENT ARCHITECTURE & SPLIT SUMMARY */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[#FF5416] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Two-Instalment Campaign Model</span>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
              50% before work starts • 50% after watermarked preview approval
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPolicyInfo(!showPolicyInfo)}
            className="inline-flex items-center gap-1 text-[11px] text-[#FF5416] hover:underline self-start sm:self-auto font-semibold"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showPolicyInfo ? 'Hide Payment Details' : 'Payment & Split Breakdown'}</span>
            {showPolicyInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* 2 Instalment Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Instalment 1 */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              isInitialPaid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-[#FBFBFA] dark:bg-zinc-800/80 border-purple-200 dark:border-purple-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] flex items-center justify-center text-[10px]">
                  1
                </span>
                First Instalment (50%)
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
                Creator Share: ₹{(initialPaymentAmount * (1 - commissionPct / 100)).toLocaleString('en-IN')}
              </span>
              <span className="font-bold text-sm text-[#121214] dark:text-white">
                ₹{initialPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Instalment 2 */}
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              isFinalPaid
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : order.order_status === 'AWAITING_FINAL_PAYMENT' || order.order_status === 'PREVIEW_SUBMITTED'
                ? 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-300 dark:border-purple-700'
                : 'bg-[#FBFBFA] dark:bg-zinc-800/80 border-[#E5E5DE] dark:border-zinc-800 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#121214] dark:bg-white text-white dark:text-[#121214] flex items-center justify-center text-[10px]">
                  2
                </span>
                Second Instalment (50%)
              </span>
              {isFinalPaid ? (
                <span className="text-[11px] text-[#047857] dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Paid ✓
                </span>
              ) : order.order_status === 'AWAITING_FINAL_PAYMENT' ? (
                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                  Due After Preview
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                  After Preview Approval
                </span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                Creator Share: ₹{(finalPaymentAmount * (1 - commissionPct / 100)).toLocaleString('en-IN')}
              </span>
              <span className="font-bold text-sm text-[#121214] dark:text-white">
                ₹{finalPaymentAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Policy & Easy Split Explainer */}
        {showPolicyInfo && (
          <div className="p-3.5 bg-[#FAF9F5] dark:bg-zinc-900 rounded-lg border border-[#ECECE6] dark:border-zinc-800 text-[11px] text-[#52525B] dark:text-zinc-300 space-y-2 leading-relaxed">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-[#ECECE6] dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">Total Value</span>
                <strong className="text-[#121214] dark:text-white">₹{totalAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">Platform Fee ({commissionPct}%)</span>
                <strong className="text-[#121214] dark:text-white">₹{platformCommissionTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">Creator Net Earnings</span>
                <strong className="text-[#047857] dark:text-emerald-400">₹{creatorShareTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#71717A] uppercase block">Settlement Model</span>
                <span className="text-[#121214] dark:text-white font-semibold">Easy Split Architecture</span>
              </div>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><strong>First 50%:</strong> Paid by brand before creator begins work.</li>
              <li><strong>Preview Room:</strong> Creator uploads private watermarked video with 24h retention window.</li>
              <li><strong>Second 50%:</strong> Paid by brand upon preview approval to unlock unwatermarked final video.</li>
              <li><strong>Settlement Independence:</strong> Brand payment success and creator vendor payout settlement remain separate financial events.</li>
            </ul>
          </div>
        )}
      </div>

      {/* OVERDUE NOTICE */}
      {isOverdue && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
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
                <span>Raise Dispute</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DEADLINE EXTENSION BANNER */}
      {order.extension_status === 'REQUESTED' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
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

      {/* FIRST 50% PAYMENT ACTION CARD (FOR BUSINESS) */}
      {!isInitialPaid && (
        <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-purple-600" />
              STAGE 1: FIRST 50% PAYMENT DUE
            </span>
            <span className="text-sm font-bold text-purple-950 dark:text-purple-200">
              ₹{initialPaymentAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-purple-900 dark:text-purple-300 text-xs leading-relaxed">
            {isMeBusiness
              ? 'Pay the initial 50% instalment to authorize the creator to begin work. Once confirmed, creator will start production and submit a watermarked preview. The remaining 50% is due only after you review the preview.'
              : 'Waiting for brand partner to pay the first 50% instalment. You will receive an immediate in-app notification when confirmed so you can start working.'}
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
                    ? 'Connecting Gateway...'
                    : `Pay First 50% — ₹${initialPaymentAmount.toLocaleString('en-IN')}`}
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
                Work begins once brand confirms the first 50% instalment (₹{initialPaymentAmount.toLocaleString('en-IN')}).
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. DEDICATED PREVIEW ROOM (PHASE 3 & 4) */}
      <PreviewRoom
        order={order}
        isCreator={Boolean(isMeCreator)}
        isBusiness={Boolean(isMeBusiness)}
        onPayFinal50={handlePayFinalStage}
      />

      {/* 3. DEDICATED FINAL DELIVERY SECTION (PHASE 6) */}
      <FinalDeliverySection
        order={order}
        isCreator={Boolean(isMeCreator)}
        isBusiness={Boolean(isMeBusiness)}
        onPayFinal50={handlePayFinalStage}
        onOpenDispute={onOpenDispute}
      />

      {/* CANCEL DEAL MODAL */}
      {isCancelDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>Cancel Unpaid Deal</span>
            </h4>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Since no payment has been made yet, cancelling will close this campaign order immediately.
            </p>
            <form onSubmit={handleConfirmCancelDeal} className="space-y-3">
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Cancellation reason (optional)..."
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDealModalOpen(false)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingCancel}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WAITING FOR ASSETS MODAL */}
      {isWaitingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
              <Hourglass className="w-4 h-4 text-blue-600" />
              <span>Waiting for Brand Materials</span>
            </h4>
            <p className="text-xs text-[#71717A]">
              Pauses your active delivery countdown while you await product delivery, credentials, or brief clarification.
            </p>
            <form onSubmit={handleConfirmWaiting} className="space-y-3">
              <textarea
                required
                rows={3}
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                placeholder="Specify what materials or access you are waiting for from the brand..."
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWaitingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingWaiting || !waitingReason.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmittingWaiting ? 'Saving...' : 'Set Waiting Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTENSION MODAL */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <h4 className="font-bold text-sm text-[#121214] dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF5416]" />
              <span>Request Deadline Extension</span>
            </h4>
            <form onSubmit={handleConfirmExtension} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#71717A] block mb-1">New Requested Deadline</label>
                <input
                  type="date"
                  required
                  value={extensionDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#71717A] block mb-1">Reason for Extension</label>
                <textarea
                  rows={2}
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g. Weather delay during shoot, additional post-production..."
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExtensionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingExtension}
                  className="bg-[#FF5416] hover:bg-[#E0440A] text-white"
                >
                  {isSubmittingExtension ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
