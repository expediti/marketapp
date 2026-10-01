'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { AlertTriangle, Info } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const SYSTEM_REVIEW_REASONS = [
  'Agreed CTA was missing',
  'Wrong product information was used',
  'Required format was not followed',
  'Agreed deliverable was not provided',
  'Late or missed delivery',
  'Other agreed requirement not met',
];

export function DisputeModal({ isOpen, onClose, orderId }: DisputeModalProps) {
  const { requestSystemReview } = useMarketplace();
  const [selectedReason, setSelectedReason] = useState<string>('Agreed CTA was missing');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await requestSystemReview({
        orderId,
        reason: selectedReason,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit System Review request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request System Review"
      subtitle="Platform payments will remain held securely until the review is concluded."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        <div className="bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] rounded p-3 text-xs text-[#C2410C] dark:text-[#F97316] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF5416] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Objective Requirement Review</span>
            <p className="text-[11px] leading-relaxed">
              System Review evaluates whether the delivered work satisfied the agreed campaign brief requirements. Personal artistic preference is not grounds for cancellation if all agreed requirements were met.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 border border-red-200 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="editorial-label block mb-1.5 font-bold text-[#121214] dark:text-white">
            Primary Reason for System Review
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
          >
            {SYSTEM_REVIEW_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="editorial-label block mb-1.5 font-bold text-[#121214] dark:text-white">
            Detailed Explanation (Refer to Agreed Brief)
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain specifically which agreed deliverables, talking points, or formats were missing from the creator's delivery..."
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
          />
        </div>

        <div>
          <label className="editorial-label block mb-1.5 font-bold text-[#121214] dark:text-white">
            Evidence Link / Screenshot (Optional)
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://drive.google.com/... or cloud proof link"
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md focus:outline-none focus:border-[#FF5416]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            className="bg-[#B91C1C] hover:bg-[#991B1B] text-white"
          >
            Submit for System Review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
