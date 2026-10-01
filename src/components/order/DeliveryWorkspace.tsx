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
} from 'lucide-react';

interface DeliveryWorkspaceProps {
  order: Order;
  onOpenDispute: () => void;
}

export function DeliveryWorkspace({ order, onOpenDispute }: DeliveryWorkspaceProps) {
  const {
    currentUser,
    activeRole,
    startOrderProgress,
    submitDelivery,
    approveDelivery,
    requestRevision,
    markWaitingForBusiness,
    resumeFromWaiting,
    requestDeadlineExtension,
    respondDeadlineExtension,
  } = useMarketplace();

  // Submission form state
  const [proofUrl, setProofUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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
    ['ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.order_status);

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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim()) return;
    setIsSubmitting(true);
    try {
      await submitDelivery(order.id, proofUrl.trim(), deliveryNotes.trim());
      setProofUrl('');
      setDeliveryNotes('');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECECE6] dark:border-zinc-800 gap-3">
        <div>
          <span className="editorial-label text-[#71717A] dark:text-zinc-400">Content Delivery & Verification</span>
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white mt-0.5">
            Deliverable Status: {order.order_status}
          </h3>
        </div>

        {order.order_status === 'COMPLETED' && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Order Completed • Payout Eligible</span>
          </div>
        )}

        {order.order_status === 'AUTO_APPROVED' && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
            <CheckCircle className="w-4 h-4" />
            <span>Auto-Approved (4-Day Window Concluded)</span>
          </div>
        )}
      </div>

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

      {/* 1. DELIVERED STATE: 4-DAY AUTO-APPROVAL NOTICE & 3 BUSINESS CHOICES */}
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
            <div className="bg-white dark:bg-zinc-800 border border-[#ECECE6] dark:border-zinc-700 rounded p-4 text-xs space-y-3">
              <p className="font-medium text-[#121214] dark:text-white leading-relaxed">
                {order.delivery.notes || 'Deliverable submitted for review.'}
              </p>
              <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[#71717A] dark:text-zinc-400 font-mono truncate max-w-sm">
                  Proof Asset: {order.delivery.proof_url}
                </span>
                <a
                  href={order.delivery.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#FF5416] font-semibold hover:underline shrink-0"
                >
                  <span>Inspect Media / Proof</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Business Review Controls: 3 Options */}
          {order.order_status === 'DELIVERED' && isMeBusiness && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF9F5] dark:bg-zinc-800/80 border border-[#ECECE6] dark:border-zinc-700 p-4 rounded-lg">
              <div>
                <h4 className="text-xs font-bold text-[#121214] dark:text-white">Business Review Options</h4>
                <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                  Accept the delivery, request an allowed revision, or raise a System Review if agreed brief requirements were missed.
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
        </div>
      )}

      {/* REVISION REQUESTED STATE: Creator must submit revised draft */}
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
            <form onSubmit={handleSubmitProof} className="bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg p-4 space-y-3 font-mono text-xs">
              <h5 className="font-bold text-[#121214] dark:text-white">Submit Revised Delivery</h5>
              <div>
                <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                  Revised Proof / Video URL
                </label>
                <input
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or revised video proof"
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
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Submit Revised Work for 4-Day Review</span>
              </Button>
            </form>
          )}
        </div>
      )}

      {/* 2. IN_PROGRESS STATE: Creator Production Workspace */}
      {(order.order_status === 'ACCEPTED' || order.order_status === 'IN_PROGRESS') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F4F4F0] dark:bg-zinc-800/60 p-4 rounded-md text-xs text-[#52525B] dark:text-zinc-400 font-mono">
            <div>
              <span className="font-semibold text-[#121214] dark:text-white block">Campaign In Production</span>
              Creator is preparing the deliverable according to brief specs.
            </div>

            <div className="flex items-center gap-2">
              {order.order_status === 'ACCEPTED' && isMeCreator && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => startOrderProgress(order.id)}
                  className="font-mono text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-[#FF5416] mr-1" />
                  <span>Start Work</span>
                </Button>
              )}

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
                </>
              )}
            </div>
          </div>

          {/* Submission Form for Creator */}
          {isMeCreator && (
            <form
              onSubmit={handleSubmitProof}
              className="border border-[#E5E5DE] dark:border-zinc-800 rounded-lg p-5 space-y-4 bg-white dark:bg-zinc-900 font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2">
                <h4 className="editorial-label text-[#121214] dark:text-white flex items-center gap-1.5 font-bold">
                  <Upload className="w-3.5 h-3.5 text-[#FF5416]" />
                  Submit Delivery Draft (Creator Workspace)
                </h4>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                  4-Day Review Period applies after submission
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Content Proof / Video Preview Link
                </label>
                <input
                  type="url"
                  required
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or video proof URL"
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Submission Notes & Verification Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Mention timestamps, tagged brand handle, or link placement for verification..."
                  className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="bg-[#FAF9F6] dark:bg-zinc-800/50 p-3 rounded text-[11px] text-[#71717A] dark:text-zinc-400">
                <Info className="w-3.5 h-3.5 text-[#FF5416] inline mr-1" />
                Once submitted, the business gets 4 days to review. If no action is taken during that window, the delivery will be automatically approved.
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="w-full sm:w-auto"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Submit Deliverable for 4-Day Brand Review</span>
              </Button>
            </form>
          )}
        </div>
      )}

      {/* 3. SYSTEM REVIEW / DISPUTE BANNER */}
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
