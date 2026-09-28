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
} from 'lucide-react';

interface DeliveryWorkspaceProps {
  order: Order;
  onOpenDispute: () => void;
}

export function DeliveryWorkspace({ order, onOpenDispute }: DeliveryWorkspaceProps) {
  const {
    activeRole,
    startOrderProgress,
    submitDelivery,
    approveDelivery,
  } = useMarketplace();

  const [proofUrl, setProofUrl] = useState(
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80'
  );
  const [deliveryNotes, setDeliveryNotes] = useState(
    'Completed video reel adhering to all talking points and natural daylight requirements. Uploaded draft ready for review.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      submitDelivery(order.id, proofUrl, deliveryNotes);
      setIsSubmitting(false);
    }, 400);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await approveDelivery(order.id);
    setIsApproving(false);
  };

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between pb-4 border-b border-[#ECECE6]">
        <div>
          <span className="editorial-label text-[#71717A]">Content Delivery & Verification</span>
          <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
            Deliverable State: {order.order_status}
          </h3>
        </div>

        {order.order_status === 'COMPLETED' && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] px-3 py-1 rounded border border-[#A7F3D0]">
            <CheckCircle className="w-4 h-4" />
            <span>Escrow Payment Released</span>
          </div>
        )}
      </div>

      {/* 1. When Delivery Has Been Submitted */}
      {order.delivery && (
        <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="editorial-label text-[#047857] flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              Delivery Proof Available
            </span>
            <span className="text-[11px] font-mono text-[#71717A]">
              Submitted on {new Date(order.delivery.submitted_at).toLocaleDateString('en-IN')}
            </span>
          </div>

          <div className="bg-white border border-[#ECECE6] rounded p-4 text-xs text-[#27272A] space-y-3">
            <p className="font-medium text-[#121214]">{order.delivery.notes}</p>
            <div className="pt-2 border-t border-[#ECECE6] flex items-center justify-between">
              <span className="text-[#71717A] font-mono truncate max-w-sm">
                Proof Asset: {order.delivery.proof_url}
              </span>
              <a
                href={order.delivery.proof_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#FF5416] font-semibold hover:underline"
              >
                <span>Inspect Media</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Business Review Controls */}
          {order.order_status === 'DELIVERED' && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFF2EC]/50 border border-[#FFD2C1] p-4 rounded-md">
              <div>
                <h4 className="text-xs font-bold text-[#121214]">Review & Decision</h4>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Approving releases ₹{order.subtotal.toLocaleString('en-IN')} from escrow to the creator&apos;s verified bank account.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDispute}
                  className="w-full sm:w-auto text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C]" />
                  <span>Dispute Delivery</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isApproving}
                  onClick={handleApprove}
                  className="w-full sm:w-auto bg-[#047857] hover:bg-[#065F46]"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve & Release Payment</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. When in Progress or Creator Submission Flow */}
      {(order.order_status === 'ACCEPTED' || order.order_status === 'IN_PROGRESS') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#F4F4F0] p-4 rounded-md text-xs text-[#52525B]">
            <div>
              <span className="font-semibold text-[#121214] block">Campaign In Production</span>
              The creator is preparing the deliverable according to your brief specs.
            </div>

            {order.order_status === 'ACCEPTED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => startOrderProgress(order.id)}
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#FF5416]" />
                <span>Mark In Progress</span>
              </Button>
            )}
          </div>

          {/* Submission Form for Creator */}
          <form
            onSubmit={handleSubmitProof}
            className="border border-[#E5E5DE] rounded-lg p-5 space-y-4 bg-white"
          >
            <h4 className="editorial-label text-[#121214] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#FF5416]" />
              Submit Delivery Draft (Creator Workspace)
            </h4>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">
                Content Proof / Video Preview Link
              </label>
              <input
                type="url"
                required
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/... or video proof URL"
                className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">
                Submission Notes & Timestamps
              </label>
              <textarea
                rows={3}
                required
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Mention any specific timestamps, music choices, or tagged handles for brand verification..."
                className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Content for Brand Approval</span>
            </Button>
          </form>
        </div>
      )}

      {/* 3. When Disputed */}
      {order.order_status === 'DISPUTED' && order.dispute && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#B91C1C]">
            <AlertTriangle className="w-4 h-4" />
            <span>Active Dispute Filed: {order.dispute.reason}</span>
          </div>
          <p className="text-xs text-[#7F1D1D] leading-relaxed">
            {order.dispute.description}
          </p>
          <div className="pt-2 border-t border-[#FECACA] flex items-center justify-between text-[11px] font-mono text-[#991B1B]">
            <span>Escrow status: ₹{order.subtotal.toLocaleString('en-IN')} held by platform</span>
            <span>Awaiting Admin resolution</span>
          </div>
        </div>
      )}
    </div>
  );
}
