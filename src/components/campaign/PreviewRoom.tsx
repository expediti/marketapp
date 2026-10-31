'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Order, CampaignPreview } from '@/types/marketplace';
import { Button } from '@/components/ui/Button';
import {
  Video,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  FileCheck,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

interface PreviewRoomProps {
  order: Order;
  isCreator: boolean;
  isBusiness: boolean;
  onPreviewUpdated?: () => void;
  onPayFinal50?: () => void;
}

/**
 * Campaign Preview Room
 * 
 * Secure, private review space for watermarked previews before final payment.
 * Supports:
 * - Creator upload with 24-hour expiry countdown
 * - In-app video playback via short-lived signed URLs
 * - Business preview approval & revision requests
 * - Enforces agreed revision limits
 */
export function PreviewRoom({
  order,
  isCreator,
  isBusiness,
  onPreviewUpdated,
  onPayFinal50,
}: PreviewRoomProps) {
  const [preview, setPreview] = useState<CampaignPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  // Upload Form State (Creator)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewNotes, setPreviewNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Business Review Actions State
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Revision counting
  const allowedRevisions = order.agreed_revision_limit ?? order.included_revisions ?? 1;
  const revisionsUsed = order.revisions_used ?? 0;
  const revisionsRemaining = Math.max(0, allowedRevisions - revisionsUsed);

  // Fetch signed URL & preview info
  const fetchPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/campaigns/${order.id}/preview/signed-url`);
      const data = await res.json();
      if (res.ok && data.preview) {
        setPreview(data.preview);
        setSignedUrl(data.preview.signed_url || null);
        setSecondsRemaining(data.preview.seconds_remaining || 0);
        setIsExpired(Boolean(data.preview.is_expired));
      } else {
        setPreview(null);
        setSignedUrl(null);
      }
    } catch (err) {
      console.warn('Error fetching preview data:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (order.id) {
      fetchPreviewData();
    }
  }, [order.id, order.order_status, order.updated_at]);

  // Expiry countdown timer (local 1s tick)
  useEffect(() => {
    if (secondsRemaining <= 0 || isExpired) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, isExpired]);

  // Format seconds to HH:MM:SS
  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  // Creator Upload Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a watermarked preview video file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (previewNotes.trim()) {
        formData.append('notes', previewNotes.trim());
      }

      setUploadProgress(50);

      const res = await fetch(`/api/campaigns/${order.id}/preview/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload preview');
      }

      setUploadProgress(100);
      setUploadSuccessMsg('Watermarked preview submitted successfully! 24-hour review window active.');
      setSelectedFile(null);
      setPreviewNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await fetchPreviewData();
      if (onPreviewUpdated) onPreviewUpdated();
    } catch (err: any) {
      setUploadError(err.message || 'Preview upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Business Approve Handler
  const handleApprovePreview = async () => {
    setIsApproving(true);
    setApproveError(null);
    try {
      const res = await fetch(`/api/campaigns/${order.id}/preview/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve preview');
      }

      await fetchPreviewData();
      if (onPreviewUpdated) onPreviewUpdated();
    } catch (err: any) {
      setApproveError(err.message || 'Error approving preview');
    } finally {
      setIsApproving(false);
    }
  };

  // Business Request Revision Handler
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) {
      setRevisionError('Please provide detailed feedback for the creator.');
      return;
    }

    setIsSubmittingRevision(true);
    setRevisionError(null);
    try {
      const res = await fetch(`/api/campaigns/${order.id}/preview/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: revisionFeedback.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request revision');
      }

      setIsRevisionModalOpen(false);
      setRevisionFeedback('');
      await fetchPreviewData();
      if (onPreviewUpdated) onPreviewUpdated();
    } catch (err: any) {
      setRevisionError(err.message || 'Revision request failed');
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  const isFirstPaymentVerified = Boolean(
    order.initial_paid_at ||
    ['WORK_STARTED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_FINAL_PAYMENT', 'READY_FOR_FINAL_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.order_status)
  );

  const isApproved =
    order.order_status === 'AWAITING_FINAL_PAYMENT' ||
    order.order_status === 'FINAL_PAYMENT_PENDING' ||
    order.order_status === 'READY_FOR_FINAL_DELIVERY' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'COMPLETED';

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
        <div>
          <span className="editorial-label text-[#FF5416] block">
            Phase 1 Deliverable Review
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#121214] dark:text-white flex items-center gap-2 mt-0.5">
            <Video className="w-5 h-5 text-[#FF5416]" />
            <span>Creator Preview Room</span>
          </h3>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            Watermarked, temporary draft preview for brand verification before second payment.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {preview ? (
            preview.preview_status === 'APPROVED' || isApproved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-[#A7F3D0] dark:border-emerald-800 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Preview Approved</span>
              </span>
            ) : preview.preview_status === 'REVISION_REQUESTED' || order.order_status === 'REVISION_REQUESTED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900 font-semibold">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Revision Requested</span>
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#B91C1C] dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Preview Expired (24h)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 font-semibold">
                <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Under Brand Review</span>
              </span>
            )
          ) : (
            <span className="text-xs text-[#71717A] bg-[#F4F4F5] dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-[#E4E4E7] dark:border-zinc-700">
              No Preview Uploaded
            </span>
          )}
        </div>
      </div>

      {/* Lock Notice if First Payment Not Verified */}
      {!isFirstPaymentVerified && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong className="block font-bold">First Payment Required to Unlock</strong>
            <span>
              The business partner must complete the initial 50% payment before the creator begins work and uploads a preview.
            </span>
          </div>
        </div>
      )}

      {/* ACTIVE PREVIEW PLAYER / DETAILS SECTION */}
      {preview && !isExpired && (
        <div className="space-y-4 bg-[#FBFBFA] dark:bg-zinc-900/60 border border-[#ECECE6] dark:border-zinc-800 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#FF5416]" />
                <span>Preview Version {preview.preview_version} (Watermarked)</span>
              </span>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                {preview.file_name} • {(preview.file_size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>

            {/* 24-Hour Expiry Countdown */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 text-xs shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#FF5416]" />
              <span className="text-[#71717A] dark:text-zinc-400">Expires in:</span>
              <span className="font-bold text-[#121214] dark:text-white tabular-nums">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>
          </div>

          {/* In-App Video Player (Not forced to download) */}
          {signedUrl ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[420px] mx-auto flex items-center justify-center border border-zinc-700 shadow-md">
              <video
                src={signedUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain"
                playsInline
              >
                Your browser does not support in-app video playback.
              </video>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-white/20 pointer-events-none">
                Watermarked Preview
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#71717A] dark:text-zinc-400 border border-dashed border-[#E5E5DE] dark:border-zinc-700 rounded-xl">
              <Clock className="w-6 h-6 mx-auto mb-2 text-[#71717A]" />
              <p>Preparing secure preview stream...</p>
            </div>
          )}

          {preview.notes && (
            <div className="text-xs bg-white dark:bg-zinc-800 p-3 rounded-lg border border-[#E5E5DE] dark:border-zinc-700">
              <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Creator Notes</span>
              <p className="text-[#121214] dark:text-zinc-200 mt-0.5 whitespace-pre-wrap">{preview.notes}</p>
            </div>
          )}

          {/* BUSINESS REVIEW ACTIONS */}
          {isBusiness && order.order_status === 'PREVIEW_SUBMITTED' && (
            <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-[#71717A] dark:text-zinc-400">Revisions remaining:</span>{' '}
                  <span className="font-bold text-[#121214] dark:text-white">
                    {revisionsRemaining} of {allowedRevisions}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRevisionModalOpen(true)}
                    disabled={revisionsRemaining === 0}
                    className="flex-1 sm:flex-none border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Request Revision ({revisionsRemaining} left)
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprovePreview}
                    disabled={isApproving}
                    className="flex-1 sm:flex-none bg-[#047857] hover:bg-[#065F46] text-white"
                  >
                    {isApproving ? 'Approving...' : 'Approve Preview ✓'}
                  </Button>
                </div>
              </div>

              {approveError && (
                <p className="text-xs text-red-600 dark:text-red-400">{approveError}</p>
              )}
            </div>
          )}

          {/* Business Approved Banner prompting Second 50% Payment */}
          {isApproved && (
            <div className="p-4 bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-900 rounded-xl text-xs text-[#065F46] dark:text-emerald-300 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#047857] dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Your preview has been approved.</span>
              </div>
              <p>
                Complete the remaining 50% payment to unlock final delivery from the creator.
              </p>
              {isBusiness && !order.final_paid_at && onPayFinal50 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onPayFinal50}
                  className="bg-[#047857] hover:bg-[#065F46] text-white font-bold inline-flex items-center gap-1.5"
                >
                  <span>Pay Remaining 50% (₹{(order.second_payment_amount || order.total_amount * 0.5).toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* EXPIRED PREVIEW NOTICE */}
      {isExpired && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3 text-xs text-red-800 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold">24-Hour Preview Window Expired</strong>
            <p>
              The temporary preview file has reached its 24-hour retention expiry. Creator can upload an updated preview to restart the review window.
            </p>
          </div>
        </div>
      )}

      {/* CREATOR UPLOAD / REPLACEMENT PREVIEW SECTION */}
      {isCreator && isFirstPaymentVerified && (!preview || isExpired || order.order_status === 'REVISION_REQUESTED' || order.order_status === 'WORK_STARTED' || order.order_status === 'IN_PROGRESS') && (
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#FF5416]" />
              <span>
                {order.order_status === 'REVISION_REQUESTED'
                  ? 'Upload Revised Preview (Watermarked)'
                  : 'Upload Campaign Preview (Watermarked)'}
              </span>
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
              Max 100MB • MP4, WebM, MOV
            </span>
          </div>

          {/* File Picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E5E5DE] dark:border-zinc-700 hover:border-[#FF5416] dark:hover:border-[#FF5416] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#FBFBFA] dark:bg-zinc-900"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
            />
            <Video className="w-8 h-8 text-[#FF5416] mx-auto mb-2 opacity-80" />
            {selectedFile ? (
              <div className="text-xs space-y-1">
                <span className="font-bold text-[#121214] dark:text-white block">
                  {selectedFile.name}
                </span>
                <span className="text-[#71717A] text-[11px]">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click to change
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#71717A] dark:text-zinc-400 space-y-1">
                <span className="font-bold text-[#121214] dark:text-white block">
                  Click to select watermarked video file
                </span>
                <span className="text-[11px]">
                  Supported formats: MP4, WebM, MOV (Under 100MB)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] text-[#71717A] dark:text-zinc-400 block mb-1">
              Notes or timestamp highlights for the brand (optional)
            </label>
            <textarea
              value={previewNotes}
              onChange={(e) => setPreviewNotes(e.target.value)}
              placeholder="e.g. Draft cut with audio track. Watermark applied across preview."
              rows={2}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          {/* Progress / Status / Action */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="w-full bg-[#ECECE6] dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF5416] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                Uploading watermarked preview... {uploadProgress}%
              </span>
            </div>
          )}

          {uploadError && (
            <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
          )}

          {uploadSuccessMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{uploadSuccessMsg}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
              ⚠️ Do not upload clean final video here. Clean deliverables unlock in Final Delivery section after final payment.
            </span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedFile || isUploading}
              className="bg-[#FF5416] hover:bg-[#E0440A] text-white"
            >
              {isUploading ? 'Uploading...' : 'Submit Preview (24h Expiry)'}
            </Button>
          </div>
        </form>
      )}

      {/* REQUEST REVISION MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <h4 className="font-bold text-sm sm:text-base text-[#121214] dark:text-white flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <span>Request Preview Revision ({revisionsUsed + 1}/{allowedRevisions})</span>
              </h4>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-xs text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-900 dark:text-amber-200">
                <span>
                  Please explain specifically what changes are required. The creator will upload a replacement preview. Revision allowance remaining: <strong>{revisionsRemaining}</strong>.
                </span>
              </div>

              <div>
                <label className="font-semibold text-[#121214] dark:text-white block mb-1">
                  Required Changes / Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Detail the specific modifications needed (e.g. voiceover pronunciation, caption edits, pacing, branding logo placement)..."
                  className="w-full text-xs font-mono p-3 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {revisionError && (
                <p className="text-red-600 dark:text-red-400 text-xs">{revisionError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRevisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingRevision || !revisionFeedback.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isSubmittingRevision ? 'Submitting...' : 'Submit Revision Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
