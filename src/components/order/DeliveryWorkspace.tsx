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
  FileText,
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
    submitDelivery,
    approveDelivery,
    requestRevision,
    markWaitingForBusiness,
    resumeFromWaiting,
    requestDeadlineExtension,
    respondDeadlineExtension,
    markWorkStarted,
    payOrderWithRazorpay,
    cancelConfirmedDeal,
    uploadDeliveryProofFile,
  } = useMarketplace();

  // Submission form state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofFileUrl, setProofFileUrl] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [instagramPostUrl, setInstagramPostUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isStartingWork, setIsStartingWork] = useState(false);

  // Pay Now Modal state
  const [isPayNowModalOpen, setIsPayNowModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

  // Canonical state helpers (guarantees NO "Payment Pending" bug after PAID)
  const isPaid =
    order.payment_status === 'PAID' ||
    order.order_status === 'PAID' ||
    order.order_status === 'WORK_STARTED' ||
    order.order_status === 'IN_PROGRESS' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'REVISION_REQUESTED' ||
    order.order_status === 'APPROVED' ||
    order.order_status === 'AUTO_APPROVED' ||
    order.order_status === 'COMPLETED';

  const isConfirmedUnpaid =
    !isPaid &&
    (order.order_status === 'DEAL_CONFIRMED' || order.order_status === 'PAYMENT_PENDING');

  const isPaidAwaitingStart =
    isPaid && order.order_status === 'PAID';

  const isWorkInProgress =
    isPaid &&
    (order.order_status === 'WORK_STARTED' ||
      order.order_status === 'IN_PROGRESS' ||
      order.order_status === 'ACCEPTED');

  // Format 4-day auto-approval timer
  const autoApproveTimeRemaining = (() => {
    if (!order.auto_approve_deadline) return null;
    const diffMs = new Date(order.auto_approve_deadline).getTime() - Date.now();
    if (diffMs <= 0) return 'Auto-approval due';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h remaining`;
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setSubmissionError(null);
  };

  // Submit delivery - Primary is Instagram Reel URL
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    const parsedIg = parseInstagramUrl(instagramPostUrl.trim());
    if (!parsedIg.isValid || !parsedIg.canonicalUrl) {
      setSubmissionError(
        parsedIg.error || 'Please provide a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...)'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let finalProofUrl = proofFileUrl.trim();

      // If user uploaded an optional proof asset, upload it to storage
      if (proofFile && !finalProofUrl) {
        setIsUploadingFile(true);
        const { publicUrl } = await uploadDeliveryProofFile(proofFile);
        finalProofUrl = publicUrl;
        setProofFileUrl(publicUrl);
        setIsUploadingFile(false);
      }

      // If no file uploaded, safe fallback for proof_url is the canonical Instagram Reel URL itself
      if (!finalProofUrl) {
        finalProofUrl = parsedIg.canonicalUrl;
      }

      await submitDelivery(
        order.id,
        finalProofUrl,
        deliveryNotes.trim(),
        parsedIg.canonicalUrl
      );

      setProofFile(null);
      setProofFileUrl('');
      setInstagramPostUrl('');
      setDeliveryNotes('');
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit delivery');
    } finally {
      setIsSubmitting(false);
      setIsUploadingFile(false);
    }
  };

  const handleStartWork = async () => {
    setIsStartingWork(true);
    try {
      await markWorkStarted(order.id);
    } catch (err: any) {
      alert(err.message || 'Failed to mark work as started');
    } finally {
      setIsStartingWork(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveDelivery(order.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmRevisionRequest = async (e: React.FormEvent) => {
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

  const handleStartPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      const res = await payOrderWithRazorpay(
        order.id,
        currentUser?.display_name,
        currentUser?.email
      );
      if (!res.success) {
        if (res.status !== 'CANCELLED') {
          setPaymentError(res.error || 'Payment failed. You can retry payment.');
        }
      } else {
        setIsPayNowModalOpen(false);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed. You can retry payment.');
    } finally {
      setIsProcessingPayment(false);
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
    } finally {
      setIsSubmittingWaiting(false);
    }
  };

  const handleConfirmExtension = async (e: React.FormEvent) => {
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
  };

  const instagramDeliveryUrl = order.delivery?.instagram_post_url || order.delivery?.proof_url || '';

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#ECECE6] dark:border-zinc-800 gap-2">
        <div>
          <span className="editorial-label text-[#71717A] dark:text-zinc-400">Order Delivery & Status</span>
          <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
            Status: {order.order_status}
          </h3>
        </div>

        {(order.order_status === 'COMPLETED' || order.order_status === 'APPROVED' || order.order_status === 'AUTO_APPROVED') && (
          <div className="flex items-center gap-1.5 text-xs text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Delivery Accepted ✓</span>
          </div>
        )}
      </div>

      {/* STAGE 1: DEAL CONFIRMED (Awaiting Payment - Business Needs to Pay) */}
      {isConfirmedUnpaid && (
        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-xs">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              WAITING FOR PAYMENT
            </span>
            <span className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
              Amount Due: ₹{order.total_amount.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-purple-800 dark:text-purple-300 leading-relaxed text-xs">
            {isMeBusiness
              ? 'Complete payment to start the collaboration.'
              : 'Waiting for the business to complete payment.'}
          </p>

          {paymentError && (
            <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
              {paymentError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isMeBusiness && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartPayment}
                  isLoading={isProcessingPayment}
                  disabled={isProcessingPayment}
                  className="bg-[#047857] hover:bg-[#065F46] text-white text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  <span>
                    {isProcessingPayment
                      ? 'Processing...'
                      : `Pay Now — ₹${order.total_amount.toLocaleString('en-IN')}`}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDealModalOpen(true)}
                  disabled={isProcessingPayment}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Cancel Deal</span>
                </Button>
              </>
            )}

            {isMeCreator && (
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-3 py-1.5 rounded text-[11px]">
                <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>You will be notified as soon as the business completes payment.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: PAID (Ready to Start) */}
      {isPaidAwaitingStart && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              PAYMENT RECEIVED
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Payment Protected ✓
            </span>
          </div>

          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed text-xs">
            {isMeCreator
              ? 'Payment received. You can start working.'
              : 'Payment completed. Creator can now start working.'}
          </p>

          {isMeCreator && (
            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartWork}
                isLoading={isStartingWork}
                className="bg-[#FF5416] hover:bg-[#E04810] text-white text-xs"
              >
                <PlayCircle className="w-3.5 h-3.5 mr-1" />
                <span>Start Working</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* OVERDUE NOTICE */}
      {isOverdue && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Delivery is past the agreed deadline ({new Date(order.deadline).toLocaleDateString()}).</span>
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
                  ? new Date(order.extension_requested_deadline).toLocaleDateString()
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

      {/* STAGE 3: WORK_STARTED / IN_PROGRESS (Creator Submit Delivery Form) */}
      {isWorkInProgress && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#F4F4F0] dark:bg-zinc-800/60 p-3.5 rounded-lg text-xs text-[#52525B] dark:text-zinc-400">
            <div>
              <span className="font-semibold text-[#121214] dark:text-white block">IN PRODUCTION</span>
              {isMeCreator ? 'Submit your live Instagram Reel URL once published.' : 'Creator is working on your order.'}
            </div>

            {isMeCreator && (
              <div className="flex items-center gap-2">
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

          {/* Submission Form for Creator */}
          {isMeCreator && (
            <form
              onSubmit={handleSubmitDelivery}
              className="border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-4 space-y-3.5 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2">
                <h4 className="editorial-label text-[#121214] dark:text-white flex items-center gap-1.5 font-bold">
                  <Upload className="w-3.5 h-3.5 text-[#FF5416]" />
                  Submit Delivery
                </h4>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                  Live Instagram Reel URL
                </span>
              </div>

              {submissionError && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Primary: Instagram Reel URL */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Instagram Reel URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#FF5416]" />
                  <input
                    type="url"
                    required
                    value={instagramPostUrl}
                    onChange={(e) => setInstagramPostUrl(e.target.value)}
                    placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                    className="w-full text-xs py-2 pl-9 pr-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
                <p className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1">
                  Paste the live Instagram link for the business to review directly.
                </p>
              </div>

              {/* Optional: Notes */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Delivery Notes <span className="text-[#71717A] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Notes for the business (e.g. caption, hashtags, link in bio)..."
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              {/* Optional: Proof Asset File */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Attach File <span className="text-[#71717A] font-normal">(optional backup screenshot / video)</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf"
                  className="block w-full text-xs text-[#71717A] dark:text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#F4F4F0] dark:file:bg-zinc-800 file:text-[#121214] dark:file:text-white hover:file:bg-[#E5E5DE] cursor-pointer"
                />
                {proofFile && (
                  <p className="text-[11px] text-[#047857] mt-1">Selected: {proofFile.name}</p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting || isUploadingFile}
                  className="w-full sm:w-auto bg-[#FF5416] hover:bg-[#E04810] text-white"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  <span>Submit Delivery</span>
                </Button>
              </div>
            </form>
          )}

          {isMeBusiness && (
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded-lg text-xs text-[#71717A] dark:text-zinc-400">
              Creator is working on your order. As soon as the delivery is submitted, you will be able to view the live Instagram Reel and approve it here.
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: DELIVERED (Business Review & Acceptance) */}
      {(order.order_status === 'DELIVERED' || (order.delivery && order.order_status !== 'COMPLETED' && order.order_status !== 'APPROVED' && order.order_status !== 'AUTO_APPROVED' && order.order_status !== 'REVISION_REQUESTED')) && (
        <div className="bg-[#FBFBFA] dark:bg-zinc-900/50 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2.5">
            <span className="font-bold text-xs text-[#047857] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#047857]" />
              DELIVERY SUBMITTED
            </span>
            {order.delivery?.submitted_at && (
              <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                Submitted {new Date(order.delivery.submitted_at).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>

          {/* Instagram Reel Presentation */}
          <div className="p-4 bg-white dark:bg-zinc-800 border border-[#ECECE6] dark:border-zinc-700 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <InstagramIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#121214] dark:text-white block">
                    Instagram Reel
                  </span>
                  <span className="text-[11px] text-[#71717A] dark:text-zinc-400 truncate max-w-xs sm:max-w-md block">
                    {instagramDeliveryUrl}
                  </span>
                </div>
              </div>

              {instagramDeliveryUrl && (
                <a
                  href={instagramDeliveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FF5416] text-white hover:bg-[#E04810] text-xs font-semibold transition-colors shrink-0 shadow-sm"
                >
                  <span>View on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {order.delivery?.notes && (
              <div className="p-2.5 bg-[#FAF9F5] dark:bg-zinc-900 rounded text-[11px] text-[#52525B] dark:text-zinc-300">
                <strong>Notes:</strong> {order.delivery.notes}
              </div>
            )}
          </div>

          {/* Business Review Actions: Accept Delivery, Request Revision, System Review */}
          {order.order_status === 'DELIVERED' && isMeBusiness && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F5] dark:bg-zinc-800/80 border border-[#ECECE6] dark:border-zinc-700 p-3.5 rounded-lg">
              <div className="text-[11px] text-[#71717A] dark:text-zinc-400">
                {autoApproveTimeRemaining && (
                  <span>Review window: <strong>{autoApproveTimeRemaining}</strong> • </span>
                )}
                <span>Revisions left: <strong>{revisionsRemaining}</strong></span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* 1. Request Revision */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestingRevision(true)}
                  disabled={revisionsRemaining <= 0}
                  className="text-xs"
                  title={revisionsRemaining <= 0 ? 'All included revisions used' : 'Request revision'}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                  <span>Request Revision</span>
                </Button>

                {/* 2. System Review */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDispute}
                  className="text-xs text-[#B91C1C] border-red-200 hover:bg-red-50 dark:border-red-900"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-[#B91C1C]" />
                  <span>System Review</span>
                </Button>

                {/* 3. Accept Delivery */}
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isApproving}
                  onClick={handleApprove}
                  className="text-xs bg-[#047857] hover:bg-[#065F46] text-white"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Accept Delivery</span>
                </Button>
              </div>
            </div>
          )}

          {order.order_status === 'DELIVERED' && isMeCreator && (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded text-xs text-blue-800 dark:text-blue-300">
              Delivery submitted! The business has 4 days to review. Once accepted, payout will be processed to your UPI ID.
            </div>
          )}
        </div>
      )}

      {/* STAGE 5: COMPLETED / APPROVED (Clear Payout Message for Creator) */}
      {(order.order_status === 'COMPLETED' || order.order_status === 'APPROVED' || order.order_status === 'AUTO_APPROVED') && (
        <div className="bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#A7F3D0] dark:border-emerald-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#047857] dark:text-emerald-400 font-bold text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>Delivery accepted.</span>
          </div>

          <p className="text-xs text-[#047857] dark:text-emerald-300 leading-relaxed">
            {isMeCreator
              ? 'Your payout will be processed within 1–2 business days.'
              : 'Delivery accepted. Collaboration completed successfully.'}
          </p>

          {instagramDeliveryUrl && (
            <div className="pt-2 flex items-center gap-3">
              <a
                href={instagramDeliveryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#047857] dark:text-emerald-300 hover:underline font-bold"
              >
                <span>View Delivered Instagram Reel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* REVISION REQUESTED STATE */}
      {order.order_status === 'REVISION_REQUESTED' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              REVISION REQUESTED ({revisionsUsed}/{includedRevisions} used)
            </span>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300">
            {isMeCreator
              ? 'The business requested 1 revision. Please update your delivery and submit the revised Reel URL.'
              : 'Revision requested. Waiting for creator to submit the updated Reel URL.'}
          </p>

          {isMeCreator && (
            <form onSubmit={handleSubmitDelivery} className="bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg p-4 space-y-3 text-xs">
              <h5 className="font-bold text-[#121214] dark:text-white">Submit Revised Delivery</h5>

              {submissionError && (
                <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                  {submissionError}
                </div>
              )}

              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Revised Instagram Reel URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={instagramPostUrl}
                  onChange={(e) => setInstagramPostUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                  className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Revision Notes <span className="text-[#71717A] font-normal">(what was updated)</span>
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Describe the adjustments made..."
                  className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="bg-[#FF5416] hover:bg-[#E04810] text-white"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Submit Revised Delivery</span>
              </Button>
            </form>
          )}
        </div>
      )}

      {/* SYSTEM REVIEW / DISPUTE BANNER */}
      {(order.order_status === 'SYSTEM_REVIEW' || order.order_status === 'DISPUTED') && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Case Under System Review</span>
          </div>
          <p className="text-red-700 dark:text-red-300 leading-relaxed text-[11px]">
            {order.system_review_description || order.dispute?.description || 'A System Review was opened to evaluate deliverable adherence to the agreed campaign brief.'}
          </p>
        </div>
      )}

      {/* MODAL: Pay Now */}
      {isPayNowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-mono">
            <h4 className="font-bold text-base text-[#121214] dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#047857]" />
              Platform Payment Checkout
            </h4>
            <div className="p-3 bg-[#FAF9F5] dark:bg-zinc-800 rounded border border-[#ECECE6] dark:border-zinc-700 space-y-2">
              <div className="flex justify-between text-[#71717A]">
                <span>Agreed Amount:</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#71717A]">
                <span>Platform Fee:</span>
                <span>₹{order.platform_fee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-[#121214] dark:text-white pt-2 border-t border-[#ECECE6] dark:border-zinc-700">
                <span>Total Due:</span>
                <span className="text-[#047857]">₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayNowModalOpen(false)}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessingPayment}
                disabled={isProcessingPayment}
                onClick={handleStartPayment}
                className="bg-[#047857] hover:bg-[#065F46] text-white"
              >
                {isProcessingPayment ? 'Processing...' : `Pay Now — ₹${order.total_amount.toLocaleString('en-IN')}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Deal */}
      {isCancelDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-mono">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm flex items-center gap-1.5 text-red-600">
              <XCircle className="w-4 h-4" />
              Cancel Confirmed Deal
            </h4>
            <p className="text-[#71717A] text-[11px]">
              This deal has not been paid yet. Cancelling will close this order with no financial charge.
            </p>
            <form onSubmit={handleConfirmCancelDeal} className="space-y-3">
              <textarea
                rows={2}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
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
                  isLoading={isSubmittingCancel}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Revision */}
      {isRequestingRevision && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-mono">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#FF5416]" />
              Request Revision ({revisionsUsed + 1} of {includedRevisions})
            </h4>
            <p className="text-[#71717A] text-[11px]">
              Please describe the required adjustment according to the agreed brief.
            </p>
            {revisionError && (
              <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                {revisionError}
              </div>
            )}
            <form onSubmit={handleConfirmRevisionRequest} className="space-y-3">
              <textarea
                rows={3}
                required
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. Please update the caption to tag @mybrand handle..."
                className="w-full p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestingRevision(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingRevision}
                  className="bg-[#FF5416] hover:bg-[#E04810] text-white"
                >
                  Send Revision Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Waiting for Business Materials */}
      {isWaitingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-mono">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm">
              Waiting for Business Material
            </h4>
            <form onSubmit={handleConfirmWaiting} className="space-y-3">
              <textarea
                rows={3}
                required
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                placeholder="e.g. Waiting for brand logo PNG and app login credentials..."
                className="w-full p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
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
                  isLoading={isSubmittingWaiting}
                >
                  Mark Waiting
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Deadline Extension */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs font-mono">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm">
              Request Deadline Extension
            </h4>
            <form onSubmit={handleConfirmExtension} className="space-y-3">
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  New Target Date
                </label>
                <input
                  type="date"
                  required
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full p-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why extra production time is required..."
                  className="w-full p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
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
