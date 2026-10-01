'use client';

import React, { useState } from 'react';
import { Order } from '@/types/marketplace';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle,
  AlertTriangle,
  Upload,
  ExternalLink,
  ShieldCheck,
  Clock,
  PlayCircle,
  FileCheck,
  RefreshCw,
  HelpCircle,
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
    simulatePaymentSuccess,
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

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setSubmissionError(null);
  };

  // Submit delivery with Supabase Storage upload
  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    let finalProofUrl = proofFileUrl.trim();

    if (!finalProofUrl && !proofFile) {
      setSubmissionError('Please upload an actual proof file (image/video/pdf) to Supabase Storage.');
      return;
    }

    if (!instagramPostUrl.trim()) {
      setSubmissionError('Please provide the live Instagram post URL for verification.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (proofFile && !finalProofUrl) {
        setIsUploadingFile(true);
        const { publicUrl } = await uploadDeliveryProofFile(proofFile);
        finalProofUrl = publicUrl;
        setProofFileUrl(publicUrl);
        setIsUploadingFile(false);
      }

      await submitDelivery(
        order.id,
        finalProofUrl,
        deliveryNotes.trim(),
        instagramPostUrl.trim()
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

  const handleSimulatePayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);
    try {
      await simulatePaymentSuccess(order.id);
      setIsPayNowModalOpen(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment simulation failed');
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

  const isConfirmedUnpaid =
    order.order_status === 'DEAL_CONFIRMED' ||
    (order.order_status === 'PAYMENT_PENDING' && order.payment_status !== 'PAID');

  const isPaidAwaitingStart =
    (order.order_status === 'PAID' || order.payment_status === 'PAID') &&
    order.order_status !== 'WORK_STARTED' &&
    order.order_status !== 'DELIVERED' &&
    order.order_status !== 'COMPLETED' &&
    order.order_status !== 'AUTO_APPROVED';

  const isWorkInProgress =
    order.order_status === 'WORK_STARTED' ||
    order.order_status === 'IN_PROGRESS' ||
    order.order_status === 'ACCEPTED';

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECECE6] dark:border-zinc-800 gap-3">
        <div>
          <span className="editorial-label text-[#71717A] dark:text-zinc-400">Collaboration Workflow</span>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white mt-0.5">
            Current Status: {order.order_status}
          </h3>
        </div>

        {order.order_status === 'COMPLETED' && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Order Completed ✓</span>
          </div>
        )}

        {order.order_status === 'AUTO_APPROVED' && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Auto-Approved (4-Day Window Concluded)</span>
          </div>
        )}
      </div>

      {/* STAGE 1: DEAL CONFIRMED (Awaiting Payment) */}
      {isConfirmedUnpaid && (
        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              Deal Confirmed ✓ (Terms Locked)
            </span>
            <span className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
              Payment Pending: ₹{order.total_amount.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-purple-800 dark:text-purple-300 leading-relaxed">
            The agreed package terms, price, and deadline are locked. Payment is required before the creator begins work.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isMeBusiness && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPayNowModalOpen(true)}
                  className="bg-[#047857] hover:bg-[#065F46] font-mono text-xs text-white"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1" />
                  <span>Pay Now (₹{order.total_amount.toLocaleString('en-IN')})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDealModalOpen(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50 font-mono text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Cancel Deal</span>
                </Button>
              </>
            )}

            {isMeCreator && (
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-3 py-2 rounded">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Waiting for business payment. Do not start production until payment is confirmed.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: PAID (Awaiting Work Start) */}
      {isPaidAwaitingStart && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Payment Confirmed ✓
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Status: PAID
            </span>
          </div>

          <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
            Payment has been successfully confirmed. The creator can now begin production on the agreed deliverable.
          </p>

          {isMeCreator && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartWork}
                isLoading={isStartingWork}
                className="bg-[#FF5416] hover:bg-[#E04810] font-mono text-xs text-white"
              >
                <PlayCircle className="w-3.5 h-3.5 mr-1" />
                <span>Mark as Started</span>
              </Button>
            </div>
          )}

          {isMeBusiness && (
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Creator has been notified that payment is confirmed and will mark work as started shortly.
            </div>
          )}
        </div>
      )}

      {/* OVERDUE NOTICE */}
      {isOverdue && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
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
                className="font-mono text-xs"
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
                className="text-red-600 border-red-200 hover:bg-red-100 font-mono text-xs"
              >
                <span>System Review</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DEADLINE EXTENSION BANNER IF PENDING */}
      {order.extension_status === 'REQUESTED' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="font-bold text-amber-800 dark:text-amber-400 block">
              Deadline Extension Requested
            </span>
            <p className="text-amber-700 dark:text-amber-300 text-[11px] mt-0.5">
              Creator requested new deadline:{' '}
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
                className="font-mono text-xs"
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => respondDeadlineExtension(order.id, true)}
                className="font-mono text-xs bg-[#047857] hover:bg-[#065F46]"
              >
                Accept Extension
              </Button>
            </div>
          )}
        </div>
      )}

      {/* WAITING FOR BUSINESS BANNER */}
      {order.order_status === 'WAITING_FOR_BUSINESS' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-xs font-mono space-y-2">
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
                className="font-mono text-xs"
              >
                Resume Production
              </Button>
            )}
          </div>
          <p className="text-blue-700 dark:text-blue-400 text-[11px]">
            {order.waiting_reason || 'Waiting for assets, logos, footage or required product access.'}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-500">
            The creator&apos;s deadline is paused while waiting for necessary materials from the business.
          </p>
        </div>
      )}

      {/* STAGE 3: WORK_STARTED / IN_PROGRESS (Creator Delivery Submission) */}
      {isWorkInProgress && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F4F4F0] dark:bg-zinc-800/60 p-4 rounded-md text-xs text-[#52525B] dark:text-zinc-400 font-mono">
            <div>
              <span className="font-semibold text-[#121214] dark:text-white block">Work In Progress</span>
              Deliverable is actively being created according to the agreed brief.
            </div>

            <div className="flex items-center gap-2">
              {isMeCreator && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsWaitingModalOpen(true)}
                    className="font-mono text-xs"
                  >
                    <Hourglass className="w-3.5 h-3.5 mr-1" />
                    <span>Waiting for Assets</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExtensionModalOpen(true)}
                    className="font-mono text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>Request Extension</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onOpenDispute}
                    className="font-mono text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900"
                    title="Request cancellation of active order (routes to System Review)"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600" />
                    <span>Request Cancellation</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Submission Form for Creator */}
          {isMeCreator && (
            <form
              onSubmit={handleSubmitDelivery}
              className="border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-5 space-y-4 bg-white dark:bg-zinc-900 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2">
                <h4 className="editorial-label text-[#121214] dark:text-white flex items-center gap-1.5 font-bold">
                  <Upload className="w-3.5 h-3.5 text-[#FF5416]" />
                  Submit Delivery (Creator Deliverable)
                </h4>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                  Starts 4-day business review window
                </span>
              </div>

              {submissionError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* 1. Supabase Storage Proof File Upload */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  1. Proof Asset File (Upload to Supabase Storage) <span className="text-red-500">*</span>
                </label>
                <div className="p-3 border-2 border-dashed border-[#E5E5DE] dark:border-zinc-700 rounded-lg bg-[#FBFBFA] dark:bg-zinc-800/40 space-y-2">
                  <input
                    type="file"
                    id="deliveryProofUpload"
                    onChange={handleFileChange}
                    accept="image/*,video/*,application/pdf"
                    className="block w-full text-xs text-[#71717A] dark:text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#FF5416] file:text-white hover:file:bg-[#E04810] cursor-pointer"
                  />
                  {proofFile && (
                    <div className="flex items-center gap-2 text-[11px] text-[#047857] font-medium pt-1">
                      <FileCheck className="w-4 h-4 shrink-0" />
                      <span>Ready for upload: {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                  {proofFileUrl && (
                    <div className="text-[10px] text-[#71717A] dark:text-zinc-400 truncate">
                      Uploaded storage URL: {proofFileUrl}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1">
                  Chat must NOT be used for delivery attachments. Upload direct proof video/screenshot here.
                </p>
              </div>

              {/* 2. Instagram Post URL */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  2. Instagram Post URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <InstagramIcon className="w-4 h-4 absolute left-3 top-2.5 text-[#FF5416]" />
                  <input
                    type="url"
                    required
                    value={instagramPostUrl}
                    onChange={(e) => setInstagramPostUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    className="w-full text-xs py-2 pl-9 pr-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              {/* 3. Optional Notes */}
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  3. Optional Delivery Notes / Verification Details
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Mention timestamps, tagged brand handle, or link in bio placement for verification..."
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="bg-[#FAF9F6] dark:bg-zinc-800/50 p-3 rounded text-[11px] text-[#71717A] dark:text-zinc-400">
                <Info className="w-3.5 h-3.5 text-[#FF5416] inline mr-1" />
                On submission, status transitions to <strong>DELIVERED</strong> and the 4-day business review window starts.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting || isUploadingFile}
                className="w-full sm:w-auto"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>{isUploadingFile ? 'Uploading to Supabase Storage...' : 'Submit Delivery'}</span>
              </Button>
            </form>
          )}

          {isMeBusiness && (
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded-lg text-xs font-mono text-[#71717A] dark:text-zinc-400">
              The creator is actively preparing your deliverable. Once submitted with proof files and live Instagram post URL, it will appear here for your review.
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: DELIVERED (4-Day Review Window & 3 Business Choices) */}
      {(order.order_status === 'DELIVERED' || order.delivery) && (
        <div className="bg-[#FBFBFA] dark:bg-zinc-900/50 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="editorial-label text-[#047857] flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Delivery Proof Available
            </span>
            {order.delivery?.submitted_at && (
              <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                Submitted on {new Date(order.delivery.submitted_at).toLocaleDateString('en-IN')}
              </span>
            )}
          </div>

          {/* 4-Day Review Warning Banner */}
          {order.order_status === 'DELIVERED' && (
            <div className="bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] p-4 rounded-lg text-xs font-mono space-y-2">
              <div className="flex items-center justify-between font-bold text-[#C2410C] dark:text-[#F97316]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF5416]" />
                  <span>4-Day Business Review Window</span>
                </div>
                {autoApproveTimeRemaining && (
                  <span className="text-[10px] bg-[#FF5416] text-white px-2 py-0.5 rounded">
                    {autoApproveTimeRemaining}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#C2410C] dark:text-[#F97316]">
                Please review this delivery within 4 days. If no action is taken, the delivery will be automatically approved.
              </p>
              <div className="text-[10px] text-[#A1A1AA] dark:text-zinc-400 pt-1 border-t border-[#FFD2C1]/60 dark:border-[#4D1F0E]">
                Included Revisions: <strong>{includedRevisions}</strong> • Revisions Used: <strong>{revisionsUsed}</strong> • Remaining: <strong>{revisionsRemaining}</strong>
              </div>
            </div>
          )}

          {/* Delivery content preview */}
          {order.delivery && (
            <div className="bg-white dark:bg-zinc-800 border border-[#ECECE6] dark:border-zinc-700 rounded p-4 text-xs space-y-3 font-mono">
              {order.delivery.notes && (
                <p className="font-medium text-[#121214] dark:text-white leading-relaxed">
                  {order.delivery.notes}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#ECECE6] dark:border-zinc-700">
                {/* Proof Asset */}
                <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded border border-[#ECECE6] dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#FF5416]" />
                    Proof Asset (Supabase Storage)
                  </span>
                  <a
                    href={order.delivery.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#FF5416] font-semibold hover:underline text-xs truncate max-w-full"
                  >
                    <span className="truncate">View Uploaded Asset</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                {/* Instagram Post Link */}
                <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded border border-[#ECECE6] dark:border-zinc-800 space-y-1">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 uppercase font-bold flex items-center gap-1">
                    <InstagramIcon className="w-3 h-3 text-[#FF5416]" />
                    Live Instagram Post
                  </span>
                  {order.delivery.instagram_post_url ? (
                    <a
                      href={order.delivery.instagram_post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#FF5416] font-semibold hover:underline text-xs truncate max-w-full"
                    >
                      <span className="truncate">{order.delivery.instagram_post_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#71717A] dark:text-zinc-400">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business Review Controls: ONLY when order_status = DELIVERED */}
          {order.order_status === 'DELIVERED' && isMeBusiness && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F5] dark:bg-zinc-800/80 border border-[#ECECE6] dark:border-zinc-700 p-4 rounded-lg">
              <div>
                <h4 className="text-xs font-bold text-[#121214] dark:text-white">Business Review Options</h4>
                <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                  Accept the delivery, request an included revision, or raise a System Review if agreed brief terms were violated.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* 1. Request Revision */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRequestingRevision(true)}
                  disabled={revisionsRemaining <= 0}
                  className="w-full sm:w-auto font-mono text-xs"
                  title={revisionsRemaining <= 0 ? 'All included revisions have been used' : 'Request revision'}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                  <span>
                    Request Revision ({revisionsRemaining > 0 ? `${revisionsRemaining} left` : 'Exhausted'})
                  </span>
                </Button>

                {/* 2. System Review */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDispute}
                  className="w-full sm:w-auto text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2] dark:border-red-900 font-mono text-xs"
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
                  className="w-full sm:w-auto bg-[#047857] hover:bg-[#065F46] font-mono text-xs text-white"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Accept Delivery</span>
                </Button>
              </div>
            </div>
          )}

          {order.order_status === 'DELIVERED' && isMeCreator && (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded text-xs font-mono text-blue-800 dark:text-blue-300">
              Delivery submitted! The business has 4 days to review. If no action is taken, the delivery will be automatically approved.
            </div>
          )}
        </div>
      )}

      {/* REVISION REQUESTED STATE: Creator resubmits */}
      {order.order_status === 'REVISION_REQUESTED' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 text-xs font-mono">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              Revision Requested by Brand ({revisionsUsed}/{includedRevisions} used)
            </span>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-300 font-mono">
            The business requested changes adhering to the agreed brief. Please address the feedback and submit the revised deliverable.
          </p>

          {isMeCreator && (
            <form onSubmit={handleSubmitDelivery} className="bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg p-4 space-y-3 font-mono text-xs">
              <h5 className="font-bold text-[#121214] dark:text-white">Submit Revised Delivery</h5>

              {submissionError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                  {submissionError}
                </div>
              )}

              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Revised Proof Asset File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf"
                  className="block w-full text-xs text-[#71717A] dark:text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#FF5416] file:text-white hover:file:bg-[#E04810] cursor-pointer"
                />
                {proofFile && (
                  <p className="text-[11px] text-[#047857] mt-1">Ready: {proofFile.name}</p>
                )}
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Instagram Post URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={instagramPostUrl}
                  onChange={(e) => setInstagramPostUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Revision Notes (What was updated)
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Describe the adjustments made according to the feedback..."
                  className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting || isUploadingFile}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>{isUploadingFile ? 'Uploading to Supabase Storage...' : 'Submit Revised Delivery'}</span>
              </Button>
            </form>
          )}

          {isMeBusiness && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
              Waiting for creator to submit the revised deliverable according to your requested adjustments.
            </p>
          )}
        </div>
      )}

      {/* SYSTEM REVIEW / DISPUTE BANNER */}
      {(order.order_status === 'SYSTEM_REVIEW' || order.order_status === 'DISPUTED') && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 font-bold text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Case Under System Review</span>
          </div>
          <p className="text-red-700 dark:text-red-300 leading-relaxed text-[11px]">
            {order.system_review_description || order.dispute?.description || 'A System Review was opened to evaluate deliverable adherence to the agreed campaign brief.'}
          </p>
          <div className="pt-2 border-t border-red-200 dark:border-red-900/60 flex items-center justify-between text-[10px] text-red-600 dark:text-red-400">
            <span>Transaction: ₹{order.total_amount.toLocaleString('en-IN')} held safely</span>
            <span>Evaluating brief, chat thread, and deliverable</span>
          </div>
        </div>
      )}

      {/* MODAL: Pay Now */}
      {isPayNowModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h4 className="font-bold text-base text-[#121214] dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#047857]" />
              Platform Payment Checkout
            </h4>
            <div className="p-3 bg-[#FAF9F6] dark:bg-zinc-800 rounded border border-[#ECECE6] dark:border-zinc-700 space-y-2">
              <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
                <span>Agreed Subtotal:</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#71717A] dark:text-zinc-400">
                <span>Platform Fee:</span>
                <span>₹{order.platform_fee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-bold text-[#121214] dark:text-white pt-2 border-t border-[#ECECE6] dark:border-zinc-700">
                <span>Total Amount Due:</span>
                <span className="text-[#047857]">₹{order.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
              Payment is held safely until you accept the verified delivery or the 4-day review window passes.
            </p>

            {paymentError && (
              <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs">
                {paymentError}
              </div>
            )}

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
                onClick={handleSimulatePayment}
                className="bg-[#047857] hover:bg-[#065F46] text-white"
              >
                Confirm Payment (₹{order.total_amount.toLocaleString('en-IN')})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancel Deal */}
      {isCancelDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm flex items-center gap-1.5 text-red-600">
              <XCircle className="w-4 h-4" />
              Cancel Confirmed Deal
            </h4>
            <p className="text-[#71717A] dark:text-zinc-400 text-[11px]">
              This deal has not been paid yet. Cancelling will close this order without any financial charge. The proposal history will be preserved.
            </p>
            <form onSubmit={handleConfirmCancelDeal} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explain why this deal is being cancelled before payment..."
                  className="w-full p-2.5 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                />
              </div>
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
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
              Request Included Revision ({revisionsUsed + 1} of {includedRevisions})
            </h4>
            <p className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
              Please specify which agreed brief requirements were not met. Revisions are intended for objective deviations from the brief.
            </p>
            {revisionError && (
              <div className="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 font-mono">
                {revisionError}
              </div>
            )}
            <form onSubmit={handleConfirmRevisionRequest} className="space-y-4 font-mono text-xs">
              <textarea
                rows={4}
                required
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. The agreed CTA was missing from the last 3 seconds of the reel..."
                className="w-full p-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded focus:outline-none focus:border-[#FF5416]"
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
                >
                  Submit Revision Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Waiting for Business Materials */}
      {isWaitingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm">
              Waiting for Business Material
            </h4>
            <p className="text-[#71717A] dark:text-zinc-400 text-[11px]">
              Indicate what materials are missing from the business. This pauses your deadline counter so you are not marked overdue.
            </p>
            <form onSubmit={handleConfirmWaiting} className="space-y-4">
              <textarea
                rows={3}
                required
                value={waitingReason}
                onChange={(e) => setWaitingReason(e.target.value)}
                placeholder="e.g. Waiting for brand logo transparent PNG and test app login credentials..."
                className="w-full p-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
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
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl font-mono text-xs">
            <h4 className="font-bold text-[#121214] dark:text-white text-sm">
              Request Deadline Extension
            </h4>
            <form onSubmit={handleConfirmExtension} className="space-y-4">
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Requested New Deadline
                </label>
                <input
                  type="date"
                  required
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full p-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Reason for Extension
                </label>
                <textarea
                  rows={3}
                  required
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="Explain why extra production time is required..."
                  className="w-full p-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
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
                  Send Extension Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
