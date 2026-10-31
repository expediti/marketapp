'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Order, CampaignFinalDelivery } from '@/types/marketplace';
import { Button } from '@/components/ui/Button';
import { parseInstagramUrl } from '@/lib/utils/instagram';
import {
  Sparkles,
  Lock,
  Upload,
  CheckCircle,
  ExternalLink,
  Video,
  FileCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
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

interface FinalDeliverySectionProps {
  order: Order;
  isCreator: boolean;
  isBusiness: boolean;
  onDeliveryUpdated?: () => void;
  onOpenDispute?: () => void;
  onPayFinal50?: () => void;
}

/**
 * Final Delivery and Instagram Publication Section
 * 
 * Strictly separated from Preview Room.
 * Unlocks only AFTER verified second 50% payment.
 */
export function FinalDeliverySection({
  order,
  isCreator,
  isBusiness,
  onDeliveryUpdated,
  onOpenDispute,
  onPayFinal50,
}: FinalDeliverySectionProps) {
  const [delivery, setDelivery] = useState<CampaignFinalDelivery | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State (Creator)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cleanFile, setCleanFile] = useState<File | null>(null);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Business Completion Confirmation State
  const [isConfirmingCompletion, setIsConfirmingCompletion] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Verification of 2nd payment
  const isFinalPaymentVerified = Boolean(
    order.final_paid_at ||
    (order.payment_status === 'PAID' &&
      order.order_status !== 'WORK_STARTED' &&
      order.order_status !== 'PREVIEW_SUBMITTED' &&
      order.order_status !== 'AWAITING_FINAL_PAYMENT') ||
    order.order_status === 'READY_FOR_FINAL_DELIVERY' ||
    order.order_status === 'READY_TO_PUBLISH' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'COMPLETED'
  );

  const fetchFinalDeliveryData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${order.id}/final-delivery`);
      const data = await res.json();
      if (res.ok) {
        setIsUnlocked(Boolean(data.is_unlocked));
        setDelivery(data.delivery || null);
      } else {
        setIsUnlocked(false);
        setDelivery(null);
      }
    } catch (err) {
      console.warn('Error fetching final delivery:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (order.id) {
      fetchFinalDeliveryData();
    }
  }, [order.id, order.order_status, order.final_paid_at]);

  // Handle Creator Final Delivery Submission
  const handleSubmitFinalDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    let canonicalIg: string | null = null;
    if (instagramUrl.trim()) {
      const parsed = parseInstagramUrl(instagramUrl.trim());
      if (parsed.isValid && parsed.canonicalUrl) {
        canonicalIg = parsed.canonicalUrl;
      } else {
        canonicalIg = instagramUrl.trim();
      }
    }

    if (!cleanFile && !canonicalIg) {
      setSubmitError('Please upload the clean video file or provide the live Instagram publication URL.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (cleanFile) {
        formData.append('file', cleanFile);
      }
      if (canonicalIg) {
        formData.append('instagram_url', canonicalIg);
      }
      if (deliveryNotes.trim()) {
        formData.append('notes', deliveryNotes.trim());
      }

      const res = await fetch(`/api/campaigns/${order.id}/final-delivery`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit final deliverables');
      }

      setSubmitSuccessMsg('Clean final deliverables submitted successfully!');
      setCleanFile(null);
      setInstagramUrl('');
      setDeliveryNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await fetchFinalDeliveryData();
      if (onDeliveryUpdated) onDeliveryUpdated();
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting deliverables');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Business Confirmation of Completion
  const handleConfirmCompletion = async () => {
    setIsConfirmingCompletion(true);
    setCompleteError(null);
    try {
      const res = await fetch(`/api/campaigns/${order.id}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete campaign');
      }

      await fetchFinalDeliveryData();
      if (onDeliveryUpdated) onDeliveryUpdated();
    } catch (err: any) {
      setCompleteError(err.message || 'Error completing campaign');
    } finally {
      setIsConfirmingCompletion(false);
    }
  };

  const isCompleted = order.order_status === 'COMPLETED';

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
        <div>
          <span className="editorial-label text-[#FF5416] block">
            Phase 2 Deliverable Fulfillment
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#121214] dark:text-white flex items-center gap-2 mt-0.5">
            <Sparkles className="w-5 h-5 text-[#FF5416]" />
            <span>Final Delivery & Instagram Publication</span>
          </h3>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            Clean, unwatermarked high-resolution content & live Instagram post URL.
          </p>
        </div>

        <div>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-3 py-1 rounded-md border border-[#A7F3D0] dark:border-emerald-800 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Campaign Completed</span>
            </span>
          ) : delivery ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-md border border-blue-200 dark:border-blue-900 font-semibold">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Deliverable Submitted</span>
            </span>
          ) : isFinalPaymentVerified ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-md border border-emerald-200 dark:border-emerald-900 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready for Final Delivery</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#71717A] bg-[#F4F4F5] dark:bg-zinc-800 px-3 py-1 rounded-md border border-[#E4E4E7] dark:border-zinc-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked (Second 50% Due)</span>
            </span>
          )}
        </div>
      </div>

      {/* LOCKED STATE BANNER */}
      {!isFinalPaymentVerified && (
        <div className="p-5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#121214] dark:text-white text-sm">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Final Delivery Section is Locked</span>
          </div>
          <p className="text-[#52525B] dark:text-zinc-300 leading-relaxed">
            The clean, full-quality video and live Instagram delivery section will unlock once the brand completes the remaining 50% payment.
          </p>

          {isBusiness && onPayFinal50 && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onPayFinal50}
                className="bg-[#047857] hover:bg-[#065F46] text-white font-bold inline-flex items-center gap-1.5"
              >
                <span>Pay Remaining 50% (₹{(order.second_payment_amount || order.total_amount * 0.5).toLocaleString('en-IN')})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* UNLOCKED: DISPLAY SUBMITTED DELIVERABLE */}
      {isFinalPaymentVerified && delivery && (
        <div className="space-y-4 bg-[#FBFBFA] dark:bg-zinc-900/60 border border-[#ECECE6] dark:border-zinc-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#121214] dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#047857]" />
              <span>Submitted Final Deliverables</span>
            </span>
            {delivery.uploaded_at && (
              <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                Delivered: {new Date(delivery.uploaded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Clean Video Playback (Signed URL) */}
          {delivery.signed_url && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#71717A] dark:text-zinc-400 block">
                Clean High-Resolution Video:
              </span>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-[420px] mx-auto flex items-center justify-center border border-zinc-700 shadow-md">
                <video
                  src={delivery.signed_url}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                />
              </div>
            </div>
          )}

          {/* Submitted Live Instagram Link */}
          {delivery.instagram_url && (
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <InstagramIcon className="w-5 h-5 text-[#E1306C] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Live Instagram Deliverable</span>
                  <a
                    href={delivery.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#121214] dark:text-white hover:text-[#FF5416] truncate block underline decoration-zinc-300"
                  >
                    {delivery.instagram_url}
                  </a>
                </div>
              </div>

              <a
                href={delivery.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#E1306C] hover:bg-[#C13584] px-3 py-1.5 rounded-lg shrink-0 transition-colors"
              >
                <span>View on Instagram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {delivery.notes && (
            <div className="text-xs bg-white dark:bg-zinc-800 p-3 rounded-lg border border-[#E5E5DE] dark:border-zinc-700">
              <span className="text-[10px] text-[#71717A] uppercase block font-semibold">Creator Delivery Notes</span>
              <p className="text-[#121214] dark:text-zinc-200 mt-0.5 whitespace-pre-wrap">{delivery.notes}</p>
            </div>
          )}

          {/* BUSINESS ACTIONS ON DELIVERABLE */}
          {isBusiness && !isCompleted && (
            <div className="pt-3 border-t border-[#ECECE6] dark:border-zinc-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-[#52525B] dark:text-zinc-300">
                  Please verify the deliverable and Instagram publication.
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onOpenDispute && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenDispute}
                      className="text-red-700 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      Raise Dispute
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmCompletion}
                    disabled={isConfirmingCompletion}
                    className="bg-[#047857] hover:bg-[#065F46] text-white text-xs font-bold"
                  >
                    {isConfirmingCompletion ? 'Confirming...' : 'Confirm Campaign Completion ✓'}
                  </Button>
                </div>
              </div>

              {completeError && (
                <p className="text-xs text-red-600 dark:text-red-400">{completeError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATOR SUBMISSION FORM (UNLOCKED AFTER SECOND PAYMENT) */}
      {isCreator && isFinalPaymentVerified && (!delivery || order.order_status !== 'COMPLETED') && (
        <form onSubmit={handleSubmitFinalDelivery} className="space-y-4 pt-2">
          <div className="p-3 bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-900 rounded-lg text-xs text-[#065F46] dark:text-emerald-300">
            <strong>Final Payment Received!</strong> You can now upload the clean final video and submit the live Instagram publication link.
          </div>

          {/* Clean Video Picker */}
          <div>
            <label className="text-xs font-bold text-[#121214] dark:text-white block mb-1">
              1. Upload Clean Final Video (Unwatermarked, Full Quality)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E5E5DE] dark:border-zinc-700 hover:border-[#FF5416] rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#FBFBFA] dark:bg-zinc-900"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCleanFile(e.target.files[0]);
                  }
                }}
                accept="video/mp4,video/webm,video/quicktime,application/zip"
                className="hidden"
              />
              <Video className="w-7 h-7 text-[#047857] mx-auto mb-1.5 opacity-80" />
              {cleanFile ? (
                <div className="text-xs space-y-0.5">
                  <span className="font-bold text-[#121214] dark:text-white block">{cleanFile.name}</span>
                  <span className="text-[#71717A] text-[11px]">{(cleanFile.size / (1024 * 1024)).toFixed(1)} MB • Click to replace</span>
                </div>
              ) : (
                <div className="text-xs text-[#71717A] dark:text-zinc-400">
                  <span className="font-bold text-[#121214] dark:text-white block">Click to upload clean final file</span>
                  <span className="text-[10px]">MP4, MOV, WebM, or ZIP (Max 500MB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Instagram Post Link Input */}
          <div>
            <label className="text-xs font-bold text-[#121214] dark:text-white block mb-1 flex items-center gap-1.5">
              <InstagramIcon className="w-4 h-4 text-[#E1306C]" />
              <span>2. Instagram Publication URL</span>
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/Cxxxxxx/ or https://www.instagram.com/p/Cxxxxxx/"
              className="w-full text-xs font-mono p-3 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#FF5416]"
            />
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1 block">
              Manually publish to Instagram, then paste the public Reel/Post link here for brand verification.
            </span>
          </div>

          {/* Delivery Notes */}
          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              3. Completion Notes (optional)
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Published at 6:00 PM IST. Tagged @brand_handle and pinned comments."
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          {submitError && (
            <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
          )}

          {submitSuccessMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{submitSuccessMsg}</p>
          )}

          <div className="flex items-center justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || (!cleanFile && !instagramUrl.trim())}
              className="bg-[#047857] hover:bg-[#065F46] text-white font-bold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Final Deliverable'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
