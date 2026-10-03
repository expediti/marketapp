'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import {
  Conversation,
  ChatMessage,
  DealProposal,
  UserRole,
} from '@/types/marketplace';
import { Button } from '@/components/ui/Button';
import {
  MessageSquare,
  Send,
  Lock,
  ShieldAlert,
  ArrowRight,
  CheckCircle,
  FileCheck2,
  Calendar,
  IndianRupee,
  X,
  Clock,
  Sparkles,
  Info,
  AlertTriangle,
  FileText,
  Check,
  Edit3,
  Ban,
  CreditCard,
  PlayCircle,
} from 'lucide-react';

interface ConversationChatProps {
  role: UserRole;
  initialConversationId?: string | null;
}

export function ConversationChat({
  role,
  initialConversationId,
}: ConversationChatProps) {
  const {
    currentUser,
    conversations,
    collaborationRequests,
    orders,
    messages,
    dealProposals,
    activeConversationId,
    setActiveConversationId,
    fetchConversationMessages,
    fetchConversationProposals,
    sendMessage,
    createDealProposal,
    acceptDealProposal,
    endCollaboration,
    cancelConfirmedDeal,
    simulatePaymentSuccess,
    payOrderWithRazorpay,
    markWorkStarted,
    creators,
    businesses,
  } = useMarketplace();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || activeConversationId || null
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<DealProposal | null>(
    null
  );
  const [proposalDeliverable, setProposalDeliverable] = useState('');
  const [proposalPrice, setProposalPrice] = useState<number>(5000);
  const [proposalDeadline, setProposalDeadline] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [proposalRevisions, setProposalRevisions] = useState<number>(1);
  const [proposalRequirements, setProposalRequirements] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Proposal accepting state
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(
    null
  );

  // End collaboration modal state
  const [isEndCollabModalOpen, setIsEndCollabModalOpen] = useState(false);
  const [endCollabReason, setEndCollabReason] = useState('');
  const [isEndingCollab, setIsEndingCollab] = useState(false);

  // Cancel deal modal state
  const [isCancelDealModalOpen, setIsCancelDealModalOpen] = useState(false);
  const [cancelDealReason, setCancelDealReason] = useState('');
  const [isCancellingDeal, setIsCancellingDeal] = useState(false);

  // Pay Now modal state
  const [isPayNowModalOpen, setIsPayNowModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations where the current user is a participant
  const userConversations = (conversations || []).filter(
    (c) =>
      c.business_user_id === currentUser?.id ||
      c.creator_user_id === currentUser?.id
  );

  // Set default selected conversation if none selected
  useEffect(() => {
    if (!selectedConvId && userConversations.length > 0) {
      setSelectedConvId(userConversations[0].id);
      setActiveConversationId(userConversations[0].id);
    } else if (selectedConvId) {
      setActiveConversationId(selectedConvId);
    }
  }, [userConversations.length, selectedConvId, setActiveConversationId]);

  const activeConversation = userConversations.find(
    (c) => c.id === selectedConvId
  );

  // Load messages and deal proposals for selected conversation
  useEffect(() => {
    if (selectedConvId) {
      fetchConversationMessages(selectedConvId);
      fetchConversationProposals(selectedConvId);
    }
  }, [selectedConvId]);

  const convMessages = (selectedConvId && messages ? messages[selectedConvId] : []) || [];
  const convProposals =
    (selectedConvId && dealProposals ? dealProposals[selectedConvId] : []) ||
    activeConversation?.proposals ||
    [];

  // Active proposal (the latest ACTIVE one)
  const activeProposal = convProposals
    .slice()
    .reverse()
    .find((p) => p.status === 'ACTIVE');

  // Accepted proposal (the latest ACCEPTED one)
  const acceptedProposal = convProposals
    .slice()
    .reverse()
    .find((p) => p.status === 'ACCEPTED');

  // Find linked order for active conversation
  const targetOrderId = activeConversation?.order_id || acceptedProposal?.order_id || activeProposal?.order_id;
  const activeOrder = targetOrderId
    ? (orders || []).find((o) => o.id === targetOrderId)
    : (orders || []).find(
        (o) =>
          (activeConversation?.request_id && o.request_id === activeConversation.request_id) ||
          (o.creator_user_id === activeConversation?.creator_user_id &&
            o.business_user_id === activeConversation?.business_user_id)
      );

  // Linked request
  const linkedRequest = (collaborationRequests || []).find(
    (r) => r.id === activeConversation?.request_id
  );

  // Check if conversation is ended
  const isEnded =
    linkedRequest?.status === 'ENDED' ||
    linkedRequest?.status === 'DECLINED' ||
    activeOrder?.order_status === 'CANCELLED';

  // Check if current user is business or creator in this conversation
  const isMeBusiness = activeConversation?.business_user_id === currentUser?.id || role === 'business';
  const isMeCreator = activeConversation?.creator_user_id === currentUser?.id || (!isMeBusiness && role === 'creator');
  const otherPartyName = isMeBusiness
    ? activeConversation?.creator?.display_name || 'Creator'
    : activeConversation?.business?.business_name || 'Advertiser';

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length, convProposals.length]);

  // Open proposal modal for brand new proposal
  const handleOpenNewProposalModal = () => {
    setEditingProposal(null);
    setProposalError(null);

    const req = linkedRequest;
    const creator = creators.find(
      (c) => c.user_id === activeConversation?.creator_user_id
    );

    if (req?.proposed_budget) {
      setProposalPrice(req.proposed_budget);
    } else if (creator?.packages && creator.packages.length > 0) {
      setProposalPrice(creator.packages[0].price);
    } else {
      setProposalPrice(5000);
    }

    if (req?.message) {
      setProposalDeliverable(`Deliverable: ${req.message.slice(0, 60)}`);
    } else {
      setProposalDeliverable('1 High-Quality Vertical Reel (9:16) with brand CTA');
    }

    setProposalRequirements(
      'Feature the app onboarding flow, demonstrate key features, and pin official link in bio.'
    );
    setProposalDeadline(
      new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    );
    setProposalRevisions(1);
    setIsProposalModalOpen(true);
  };

  // Open proposal modal pre-filled to propose changes
  const handleOpenProposeChanges = (prop: DealProposal) => {
    setEditingProposal(prop);
    setProposalError(null);
    setProposalDeliverable(prop.deliverable);
    setProposalPrice(prop.price);
    setProposalDeadline(
      new Date(prop.deadline).toISOString().split('T')[0] ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    );
    setProposalRevisions(prop.revisions_included);
    setProposalRequirements(prop.key_requirements);
    setIsProposalModalOpen(true);
  };

  // Submit deal proposal
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || isSubmittingProposal) return;

    setIsSubmittingProposal(true);
    setProposalError(null);

    try {
      await createDealProposal({
        conversationId: activeConversation.id,
        requestId: activeConversation.request_id || undefined,
        deliverable: proposalDeliverable.trim(),
        price: Number(proposalPrice) || 0,
        deadline: new Date(proposalDeadline).toISOString(),
        revisionsIncluded: Number(proposalRevisions) || 1,
        keyRequirements: proposalRequirements.trim(),
        supersedesProposalId: editingProposal?.id || undefined,
      });

      setIsProposalModalOpen(false);
      setEditingProposal(null);
    } catch (err: any) {
      console.error('Failed to submit deal proposal:', err);
      setProposalError(err.message || 'Failed to submit proposal');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Accept deal proposal (receiving participant only)
  const handleAcceptTerms = async (proposalId: string) => {
    setAcceptingProposalId(proposalId);
    try {
      await acceptDealProposal(proposalId);
    } catch (err: any) {
      console.error('Failed to accept terms:', err);
      alert(err.message || 'Failed to accept deal terms');
    } finally {
      setAcceptingProposalId(null);
    }
  };

  // End collaboration
  const handleConfirmEndCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;
    setIsEndingCollab(true);
    try {
      await endCollaboration(
        activeConversation.id,
        endCollabReason.trim() || 'Collaboration ended by mutual agreement.'
      );
      setIsEndCollabModalOpen(false);
      setEndCollabReason('');
    } catch (err: any) {
      console.error('Failed to end collaboration:', err);
      alert(err.message || 'Failed to end collaboration');
    } finally {
      setIsEndingCollab(false);
    }
  };

  // Cancel confirmed unpaid deal
  const handleConfirmCancelDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setIsCancellingDeal(true);
    try {
      await cancelConfirmedDeal(
        activeOrder.id,
        cancelDealReason.trim() || 'Business cancelled deal before payment.'
      );
      setIsCancelDealModalOpen(false);
      setCancelDealReason('');
    } catch (err: any) {
      console.error('Failed to cancel deal:', err);
      alert(err.message || 'Failed to cancel deal');
    } finally {
      setIsCancellingDeal(false);
    }
  };

  // Confirm platform payment via Razorpay Standard Checkout
  const handleConfirmPayment = async () => {
    if (!activeOrder) return;
    setIsPaying(true);
    try {
      const res = await payOrderWithRazorpay(
        activeOrder.id,
        currentUser?.display_name,
        currentUser?.email
      );
      if (res.success) {
        setIsPayNowModalOpen(false);
      } else if (res.status !== 'CANCELLED') {
        alert(res.error || 'Payment failed. You can retry payment.');
      }
    } catch (err: any) {
      console.error('Failed to process payment:', err);
      alert(err.message || 'Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || isSending || isEnded) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await sendMessage(selectedConvId, text);
      if (res.warning) {
        setWarning(res.warning);
      } else {
        setWarning(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (userConversations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-12 text-center space-y-3 font-mono">
        <div className="w-12 h-12 rounded-full bg-[#FFF2EC] dark:bg-zinc-800 text-[#FF5416] flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-[#121214] dark:text-white">
          No Conversations Yet
        </h4>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
          Private chat becomes available automatically when a creator accepts a
          collaboration request.
        </p>
      </div>
    );
  }

  // Combine messages and proposals for the chronological paper trail
  type FeedItem =
    | { type: 'message'; data: ChatMessage; timestamp: number }
    | { type: 'proposal'; data: DealProposal; timestamp: number };

  const feedItems: FeedItem[] = [
    ...convMessages.map((m) => ({
      type: 'message' as const,
      data: m,
      timestamp: new Date(m.created_at).getTime(),
    })),
    ...convProposals.map((p) => ({
      type: 'proposal' as const,
      data: p,
      timestamp: new Date(p.created_at).getTime(),
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[660px] font-mono">
      {/* SIDEBAR: Conversation List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E5E5DE] dark:border-zinc-800 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs font-bold text-[#121214] dark:text-white">
            Conversations ({userConversations.length})
          </span>
          <span className="editorial-label text-[#047857] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#ECECE6] dark:divide-zinc-800/60">
          {userConversations.map((conv) => {
            const isMeBiz = conv.business_user_id === currentUser?.id;
            const otherName = isMeBiz
              ? conv.creator?.display_name || 'Creator'
              : conv.business?.business_name || 'Advertiser';
            const otherAvatar = isMeBiz
              ? conv.creator?.profile_image_path
              : conv.business?.logo_path;
            const isSelected = conv.id === selectedConvId;
            const lastUpdated = conv.updated_at
              ? new Date(conv.updated_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  setSelectedConvId(conv.id);
                  setActiveConversationId(conv.id);
                }}
                className={`w-full text-left p-3.5 transition-colors flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF2EC]/60 dark:bg-[#27140B]/50 border-l-4 border-l-[#FF5416]'
                    : 'hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/60'
                }`}
              >
                {otherAvatar ? (
                  <img
                    src={otherAvatar}
                    alt={otherName}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E5DE] dark:border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#F4F4F0] dark:bg-zinc-800 font-bold text-sm text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700 shrink-0">
                    {otherName[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#121214] dark:text-white truncate">
                      {otherName}
                    </span>
                    <span className="text-[10px] text-[#71717A] dark:text-zinc-500 shrink-0">
                      {lastUpdated}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-[#71717A] dark:text-zinc-400 truncate">
                      {conv.order_id
                        ? 'Order confirmed'
                        : conv.active_proposal
                        ? 'Proposal pending'
                        : 'Active negotiation'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT & PROPOSAL PANE */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#18181B] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isEnded ? 'bg-zinc-400' : 'bg-[#047857]'
                }`}
              />
              <div>
                <h4 className="text-sm font-bold text-[#121214] dark:text-white flex items-center gap-2">
                  <span>{otherPartyName}</span>
                  {isEnded && (
                    <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded font-normal">
                      Ended
                    </span>
                  )}
                </h4>
                <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                  {isEnded
                    ? 'Negotiation Closed'
                    : 'Private Negotiation & Terms Agreement'}
                </span>
              </div>
            </div>

            {/* Contextual Action Bar */}
            <div className="flex items-center flex-wrap gap-2">
              {/* DEAL CONFIRMED STATE */}
              {activeOrder && (activeOrder.order_status === 'DEAL_CONFIRMED' || activeOrder.order_status === 'PAYMENT_PENDING') && activeOrder.payment_status !== 'PAID' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                    <span>Payment required to start this collaboration.</span>
                  </span>

                  {isMeBusiness && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isPaying}
                        onClick={handleConfirmPayment}
                        className="text-xs bg-[#FF5416] hover:bg-[#E0450C] text-white"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1" />
                        <span>
                          {isPaying
                            ? 'Processing payment...'
                            : `Pay Now — ₹${activeOrder.total_amount.toLocaleString('en-IN')}`}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPaying}
                        onClick={() => setIsCancelDealModalOpen(true)}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <span>Cancel Deal</span>
                      </Button>
                    </>
                  )}

                  <Link href={`/orders/${activeOrder.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#047857]" />
                      <span>Order #{activeOrder.order_number}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : activeOrder && (activeOrder.order_status === 'PAID' || activeOrder.payment_status === 'PAID') && activeOrder.order_status !== 'WORK_STARTED' && activeOrder.order_status !== 'DELIVERED' && activeOrder.order_status !== 'COMPLETED' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#047857] flex items-center gap-1 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>
                      {isMeCreator
                        ? 'Payment received. You can now start the work.'
                        : 'Payment received.'}
                    </span>
                  </span>

                  {isMeCreator && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => markWorkStarted(activeOrder.id)}
                      className="text-xs bg-[#FF5416] hover:bg-[#E0450C] text-white"
                    >
                      <PlayCircle className="w-3.5 h-3.5 mr-1" />
                      <span>Mark as Started</span>
                    </Button>
                  )}

                  <Link href={`/orders/${activeOrder.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#047857]" />
                      <span>Order #{activeOrder.order_number}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : activeOrder && activeOrder.order_status !== 'CANCELLED' ? (
                // Order already created and past confirmation
                <Link href={`/orders/${activeOrder.id}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#047857]" />
                    <span>Order #{activeOrder.order_number}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : !isEnded ? (
                // NEGOTIATING STATE: Both can make proposals or end collaboration
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEndCollabModalOpen(true)}
                    className="text-xs text-[#71717A] hover:text-red-600"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    <span>End Collaboration</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenNewProposalModal}
                    className="text-xs bg-[#FF5416] hover:bg-[#E0450C] text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Make Deal Proposal</span>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Safety & Traceability Notice */}
          <div className="bg-[#FAF9F6] dark:bg-zinc-900 border-b border-[#E5E5DE] dark:border-zinc-800 px-4 py-2 flex items-center gap-2 text-[11px] text-[#52525B] dark:text-zinc-400">
            <Info className="w-3.5 h-3.5 text-[#FF5416] shrink-0" />
            <p className="leading-tight">
              Keep collaboration details and payments within Market My App so your
              order, delivery and transaction records remain protected and
              traceable. Avoid sharing personal phone numbers, emails, or
              external payment details.
            </p>
          </div>

          {/* Warning Banner */}
          {warning && (
            <div className="bg-[#FFF2EC] dark:bg-[#27140B] border-b border-[#FFD2C1] dark:border-[#4D1F0E] px-4 py-2 text-xs text-[#C2410C] dark:text-[#F97316] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#FF5416]" />
                <span>{warning}</span>
              </div>
              <button
                type="button"
                onClick={() => setWarning(null)}
                className="text-[10px] uppercase underline ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Proposal Pinned Notice */}
          {activeProposal && !activeOrder && !isEnded && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-amber-900 dark:text-amber-300">
                  <strong>Proposal v{activeProposal.version} Active:</strong>{' '}
                  {activeProposal.deliverable} • ₹
                  {activeProposal.price.toLocaleString('en-IN')}
                </span>
              </div>

              {currentUser?.id !== activeProposal.proposed_by ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenProposeChanges(activeProposal)}
                    className="text-xs h-7 px-2.5"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    <span>Propose Changes</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={acceptingProposalId === activeProposal.id}
                    onClick={() => handleAcceptTerms(activeProposal.id)}
                    className="text-xs h-7 px-2.5 bg-[#047857] hover:bg-[#065F46] text-white"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    <span>
                      {acceptingProposalId === activeProposal.id
                        ? 'Confirming...'
                        : 'Accept Terms'}
                    </span>
                  </Button>
                </div>
              ) : (
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  Waiting for {otherPartyName} to accept or propose changes
                </span>
              )}
            </div>
          )}

          {/* Messages & Proposals Scroll Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF9F5] dark:bg-zinc-950/40">
            {feedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#71717A] dark:text-zinc-400 p-6 space-y-2">
                <Lock className="w-8 h-8 text-[#A1A1AA] dark:text-zinc-600" />
                <p className="font-semibold text-[#121214] dark:text-white">
                  Collaboration Accepted & Ready for Negotiation
                </p>
                <p className="max-w-sm">
                  Discuss deliverables, price, and deadlines. Use &quot;Make Deal
                  Proposal&quot; to formalize structured terms for both parties to
                  agree on.
                </p>
              </div>
            ) : (
              feedItems.map((item) => {
                if (item.type === 'message') {
                  const msg = item.data;
                  const bodyText = msg.body || msg.message || '';
                  const isDealConfirmedMsg = bodyText.startsWith('✓ Deal confirmed!');

                  if (isDealConfirmedMsg) {
                    return (
                      <div key={`msg_${msg.id}`} className="w-full my-2 flex justify-center">
                        <div className="max-w-lg w-full p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 shadow-sm flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <span className="font-bold block text-xs text-purple-950 dark:text-purple-100">
                              Deal Confirmed
                            </span>
                            <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300">
                              {bodyText}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isMe =
                    msg.sender_id === currentUser?.id ||
                    msg.sender_user_id === currentUser?.id;
                  const timeStr = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <div
                      key={`msg_${msg.id}`}
                      className={`flex flex-col ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-[#71717A] dark:text-zinc-400 uppercase">
                          {isMe
                            ? 'You'
                            : msg.sender_name ||
                              (msg.sender_role === 'creator'
                                ? 'Creator'
                                : 'Advertiser')}
                        </span>
                        <span className="text-[9px] text-[#A1A1AA] dark:text-zinc-500">
                          {timeStr}
                        </span>
                      </div>

                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm break-words ${
                          isMe
                            ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] rounded-br-none'
                            : 'bg-white dark:bg-zinc-800 text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-zinc-700 rounded-bl-none'
                        }`}
                      >
                        {msg.body || msg.message}
                      </div>
                    </div>
                  );
                }

                // DEDICATED PROPOSAL CARD IN FEED
                const prop = item.data;
                const isProposerMe = prop.proposed_by === currentUser?.id;
                const canAct =
                  prop.status === 'ACTIVE' &&
                  !isProposerMe &&
                  !isEnded &&
                  !activeOrder;

                return (
                  <div
                    key={`prop_${prop.id}`}
                    className="max-w-lg mx-auto w-full my-2"
                  >
                    <div
                      className={`rounded-xl border p-4 space-y-3 shadow-sm ${
                        prop.status === 'ACCEPTED'
                          ? 'bg-[#ECFDF5] dark:bg-emerald-950/30 border-[#A7F3D0] dark:border-emerald-800'
                          : prop.status === 'SUPERSEDED'
                          ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-75'
                          : prop.status === 'CANCELLED'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 opacity-80'
                          : 'bg-white dark:bg-zinc-900 border-[#FFD2C1] dark:border-[#4D1F0E]'
                      }`}
                    >
                      {/* Proposal Header */}
                      <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 ${
                              prop.status === 'ACCEPTED'
                                ? 'text-[#047857]'
                                : 'text-[#FF5416]'
                            }`}
                          />
                          <span className="font-bold text-xs text-[#121214] dark:text-white">
                            Deal Proposal v{prop.version}
                          </span>
                          <span className="text-[10px] text-[#71717A] dark:text-zinc-400">
                            • by {isProposerMe ? 'You' : prop.proposer_name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            prop.status === 'ACCEPTED'
                              ? 'bg-[#047857] text-white'
                              : prop.status === 'SUPERSEDED'
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                              : prop.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-[#FF5416] text-white'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>

                      {/* Proposal Terms */}
                      <div className="space-y-1.5 text-xs text-[#121214] dark:text-zinc-200">
                        <div className="font-semibold text-sm">
                          {prop.deliverable}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-[#ECECE6] dark:border-zinc-800 text-[11px]">
                          <div>
                            <span className="text-[#71717A] dark:text-zinc-400 block text-[10px]">
                              Agreed Price
                            </span>
                            <span className="font-bold text-[#121214] dark:text-white text-xs">
                              ₹{prop.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#71717A] dark:text-zinc-400 block text-[10px]">
                              Deadline
                            </span>
                            <span className="font-medium text-[#121214] dark:text-white text-xs">
                              {new Date(prop.deadline).toLocaleDateString(
                                'en-IN'
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#71717A] dark:text-zinc-400 block text-[10px]">
                              Revisions
                            </span>
                            <span className="font-medium text-[#121214] dark:text-white text-xs">
                              {prop.revisions_included} included
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#52525B] dark:text-zinc-400 pt-1">
                          <span className="font-semibold text-[#121214] dark:text-white block text-[10px]">
                            Requirements:
                          </span>
                          <p className="line-clamp-3">{prop.key_requirements}</p>
                        </div>
                      </div>

                      {/* Action buttons on Active proposal */}
                      {canAct && (
                        <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenProposeChanges(prop)}
                            className="text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                            <span>Propose Changes</span>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={acceptingProposalId === prop.id}
                            onClick={() => handleAcceptTerms(prop.id)}
                            className="text-xs bg-[#047857] hover:bg-[#065F46] text-white"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            <span>
                              {acceptingProposalId === prop.id
                                ? 'Accepting...'
                                : 'Accept Terms'}
                            </span>
                          </Button>
                        </div>
                      )}

                      {prop.status === 'ACTIVE' && isProposerMe && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 italic pt-1 border-t border-[#ECECE6] dark:border-zinc-800">
                          Waiting for {otherPartyName} to accept or propose
                          changes.
                        </div>
                      )}

                      {prop.status === 'ACCEPTED' && (
                        <div className="space-y-3 pt-2 border-t border-[#A7F3D0] dark:border-emerald-800">
                          <div className="text-[11px] text-[#047857] dark:text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Terms locked & deal confirmed.</span>
                          </div>

                          {/* PAYMENT REQUIRED ACTION (Business) OR WAITING STATUS (Creator) */}
                          {(!activeOrder || ((activeOrder.order_status === 'DEAL_CONFIRMED' || activeOrder.order_status === 'PAYMENT_PENDING') && activeOrder.payment_status !== 'PAID')) && (
                            <div className="p-3.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-3">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="font-bold text-xs text-purple-950 dark:text-purple-200">
                                    {isMeBusiness
                                      ? 'Deal Confirmed — Payment Required'
                                      : 'Deal Confirmed — Waiting for Business Payment'}
                                  </h5>
                                  <p className="text-[11px] text-purple-800 dark:text-purple-300 mt-0.5">
                                    {isMeBusiness
                                      ? 'Deal confirmed. Payment is required before the creator can start working.'
                                      : 'Deal confirmed. Waiting for business payment. You can start working once payment is completed.'}
                                  </p>
                                </div>
                              </div>

                              {/* Agreed Terms Breakdown */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-purple-200 dark:border-purple-900/60 text-[11px]">
                                <div>
                                  <span className="text-purple-700 dark:text-purple-400 block text-[10px]">Agreed Deliverable</span>
                                  <span className="font-semibold text-purple-950 dark:text-purple-100 truncate block">{prop.deliverable}</span>
                                </div>
                                <div>
                                  <span className="text-purple-700 dark:text-purple-400 block text-[10px]">Agreed Price</span>
                                  <span className="font-bold text-purple-950 dark:text-purple-100 block">₹{prop.price.toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-purple-700 dark:text-purple-400 block text-[10px]">Deadline</span>
                                  <span className="font-semibold text-purple-950 dark:text-purple-100 block">{new Date(prop.deadline).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-purple-700 dark:text-purple-400 block text-[10px]">Included Revisions</span>
                                  <span className="font-semibold text-purple-950 dark:text-purple-100 block">{prop.revisions_included} included</span>
                                </div>
                              </div>

                              {/* Business Pay Now Button */}
                              {isMeBusiness ? (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                                    Total: ₹{(activeOrder?.total_amount || Math.round(prop.price * 1.05)).toLocaleString('en-IN')}
                                  </span>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={isPaying}
                                    onClick={handleConfirmPayment}
                                    className="bg-[#FF5416] hover:bg-[#E0450C] text-white font-bold shadow-sm text-xs"
                                  >
                                    <CreditCard className="w-3.5 h-3.5 mr-1" />
                                    <span>
                                      {isPaying
                                        ? 'Opening Checkout...'
                                        : `Pay Now — ₹${(activeOrder?.total_amount || Math.round(prop.price * 1.05)).toLocaleString('en-IN')}`}
                                    </span>
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-purple-800 dark:text-purple-300 font-medium">
                                  You can start working once payment is completed.
                                </div>
                              )}
                            </div>
                          )}

                          {/* PAYMENT RECEIVED / START WORK */}
                          {activeOrder && (activeOrder.order_status === 'PAID' || activeOrder.payment_status === 'PAID') && (
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-[#047857] shrink-0" />
                                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                    {isMeCreator
                                      ? 'Payment received. You can now start working.'
                                      : 'Payment confirmed! Order is funded.'}
                                  </span>
                                </div>

                                {isMeCreator && activeOrder.order_status === 'PAID' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => markWorkStarted(activeOrder.id)}
                                    className="text-xs bg-[#FF5416] hover:bg-[#E0450C] text-white font-bold"
                                  >
                                    <PlayCircle className="w-3.5 h-3.5 mr-1" />
                                    <span>Mark as Started</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-[#E5E5DE] dark:border-zinc-800 bg-white dark:bg-[#18181B] flex items-center gap-2"
          >
            <input
              type="text"
              disabled={isEnded}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isEnded
                  ? 'Collaboration has ended. Messages are read-only.'
                  : 'Type message, discuss deliverables, clarify brief specs...'
              }
              className="flex-1 py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800/80 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-xs text-[#121214] dark:text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF5416] disabled:opacity-60"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSending || !inputText.trim() || isEnded}
              className="shrink-0 px-4 bg-[#FF5416] hover:bg-[#E0450C] text-white"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-[#71717A]">
          Select a conversation from the left to start chatting.
        </div>
      )}

      {/* DEAL PROPOSAL MODAL (FOR MAKE PROPOSAL OR PROPOSE CHANGES) */}
      {isProposalModalOpen && activeConversation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF5416]" />
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  {editingProposal
                    ? `Propose Changes (v${editingProposal.version + 1})`
                    : 'Make Structured Deal Proposal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              {editingProposal
                ? `Modify terms. Submitting will supersede proposal v${editingProposal.version} and notify ${otherPartyName}.`
                : `Submit formal collaboration terms to ${otherPartyName}. Once accepted, these terms become the locked deal.`}
            </p>

            {proposalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 font-mono">
                {proposalError}
              </div>
            )}

            <form
              onSubmit={handleSubmitProposal}
              className="space-y-3.5 text-xs font-mono"
            >
              <fieldset disabled={isSubmittingProposal} className="space-y-3.5">
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Deliverable Package / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={proposalDeliverable}
                    onChange={(e) => setProposalDeliverable(e.target.value)}
                    placeholder="e.g. 1 Instagram Reel (9:16) showcasing App Features"
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#121214] dark:text-white block mb-1">
                      Agreed Price (₹ INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#71717A]">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min={1}
                        value={proposalPrice}
                        onChange={(e) => setProposalPrice(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-[#121214] dark:text-white block mb-1">
                      Target Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={proposalDeadline}
                      onChange={(e) => setProposalDeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Included Revisions
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={5}
                    value={proposalRevisions}
                    onChange={(e) => setProposalRevisions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Key Requirements & Guidelines
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={proposalRequirements}
                    onChange={(e) => setProposalRequirements(e.target.value)}
                    placeholder="Specify key CTA, hashtag, brand tags, and format specifications..."
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white disabled:opacity-60"
                  />
                </div>
              </fieldset>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmittingProposal}
                  onClick={() => setIsProposalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingProposal}
                  className="bg-[#FF5416] hover:bg-[#E0450C] text-white disabled:opacity-50"
                >
                  {isSubmittingProposal
                    ? 'Submitting...'
                    : editingProposal
                    ? 'Submit Modified Proposal'
                    : 'Send Proposal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* END COLLABORATION CONFIRMATION MODAL */}
      {isEndCollabModalOpen && activeConversation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Ban className="w-4 h-4" />
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  End Collaboration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEndCollabModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              Ending collaboration will terminate this negotiation. The
              conversation will become read-only and any active proposals will be
              cancelled. No payment or obligation will occur.
            </p>

            <form onSubmit={handleConfirmEndCollab} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Reason for Ending (Optional)
                </label>
                <textarea
                  rows={2}
                  value={endCollabReason}
                  onChange={(e) => setEndCollabReason(e.target.value)}
                  placeholder="e.g. Budget mismatch, timeline conflict..."
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEndCollabModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isEndingCollab}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isEndingCollab ? 'Ending...' : 'Confirm End Collaboration'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMED DEAL MODAL */}
      {isCancelDealModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  Cancel Confirmed Deal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCancelDealModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              Cancelling before payment will close Order #{activeOrder.order_number}.
              No payment has been charged. An audit event will be recorded and the
              creator will be notified.
            </p>

            <form onSubmit={handleConfirmCancelDeal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Cancellation Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelDealReason}
                  onChange={(e) => setCancelDealReason(e.target.value)}
                  placeholder="e.g. Campaign cancelled or schedule changed..."
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDealModalOpen(false)}
                >
                  Keep Deal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCancellingDeal}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isCancellingDeal ? 'Cancelling...' : 'Confirm Cancel Deal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY NOW MODAL (PLATFORM PAYMENT CONFIRMATION) */}
      {isPayNowModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#FF5416]" />
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  Platform Payment Checkout
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPayNowModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF9F5] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#71717A] dark:text-zinc-400">Order</span>
                <span className="font-bold text-[#121214] dark:text-white">
                  #{activeOrder.order_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A] dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="font-medium text-[#121214] dark:text-white">
                  ₹{activeOrder.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A] dark:text-zinc-400">
                  Platform Fee (5%)
                </span>
                <span className="font-medium text-[#121214] dark:text-white">
                  ₹{activeOrder.platform_fee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-sm font-bold">
                <span className="text-[#121214] dark:text-white">
                  Total Payable
                </span>
                <span className="text-[#FF5416]">
                  ₹{activeOrder.total_amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="bg-[#FFF2EC] dark:bg-[#27140B] p-3 rounded-lg text-xs text-[#C2410C] dark:text-[#F97316] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-[#FF5416] mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Payment is protected by Market My App. Once confirmed, the
                creator will be notified to start work immediately.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPayNowModalOpen(false)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isPaying}
                onClick={handleConfirmPayment}
                className="bg-[#047857] hover:bg-[#065F46] text-white"
              >
                {isPaying
                  ? 'Processing payment...'
                  : `Pay Now — ₹${activeOrder.total_amount.toLocaleString('en-IN')}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
