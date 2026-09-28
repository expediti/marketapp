'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DisputeReason } from '@/types/marketplace';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { AlertTriangle } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const DISPUTE_REASONS: DisputeReason[] = [
  "Didn't follow brief",
  'Wrong content',
  'Late delivery',
  "Didn't publish",
  'Other',
];

export function DisputeModal({ isOpen, onClose, orderId }: DisputeModalProps) {
  const { disputeDelivery } = useMarketplace();
  const [selectedReason, setSelectedReason] = useState<DisputeReason>("Didn't follow brief");
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      disputeDelivery({
        orderId,
        reason: selectedReason,
        description: description.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Open Delivery Dispute"
      subtitle="Escrow funds will remain held securely until mediation is concluded."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-[#FFF2EC] border border-[#FFD2C1] rounded p-3 text-xs text-[#C2410C] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF5416] shrink-0 mt-0.5" />
          <p>
            Please provide specific details regarding which brief requirements were missed. A Marketur resolution admin will review the brief, chat thread, and deliverable.
          </p>
        </div>

        <div>
          <label className="editorial-label block mb-1.5">Dispute Reason</label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as DisputeReason)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="editorial-label block mb-1.5">Detailed Explanation</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain specifically what was wrong or missing with respect to the agreed campaign brief..."
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          />
        </div>

        <div>
          <label className="editorial-label block mb-1.5">Evidence / Screenshot Link (Optional)</label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... or cloud proof link"
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECECE6]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            disabled={!description.trim()}
          >
            Submit Formal Dispute
          </Button>
        </div>
      </form>
    </Modal>
  );
}
