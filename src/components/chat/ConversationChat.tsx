'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import {
  Conversation,
  ChatMessage,
  DealProposal,
  UserRole,
  Order,
} from '@/types/marketplace';
import { parseInstagramUrl } from '@/lib/utils/instagram';
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
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
    payOrderWithRazorpay,
    markWorkStarted,
    submitDelivery,
    approveDelivery,
    requestRevision,
    creators,
  } = useMarketplace();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || activeConversationId || null
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compact Order panel state
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(false);

  // Delivery submission state within chat workspace
  const [reelUrlInput, setReelUrlInput] = useState('');
  const [isSubmittingReel, setIsSubmittingReel] = useState(false);
  const [reelSubmitError, setReelSubmitError] = useState<string | null>(null);
  const [reelSubmitSuccess, setReelSubmitSuccess] = useState<string | null>(null);

  // Revision modal state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotesInput, setRevisionNotesInput] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<DealProposal | null>(null);
  const [proposalDeliverable, setProposalDeliverable] = useState('');
  const [proposalPrice, setProposalPrice] = useState<number | string>(5000);
  const [proposalDeadline, setProposalDeadline] = useState('');
  const [proposalRevisions, setProposalRevisions] = useState<number | string>(1);
  const [proposalRequirements, setProposalRequirements] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Action states
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
  const [isEndingCollab, setIsEndingCollab] = useState(false);
  const [endCollabReason, setEndCollabReason] = useState('');
  const [isEndCollabModalOpen, setIsEndCollabModalOpen] = useState(false);
  const [isCancellingDeal, setIsCancellingDeal] = useState(false);
  const [cancelDealReason, setCancelDealReason] = useState('');
  const [isCancelDealModalOpen, setIsCancelDealModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isPayNowModalOpen, setIsPayNowModalOpen] = useState(false);

  // Filter conversations for the logged-in user
  const userConversations = conversations.filter(
    (c) =>
      c.business_user_id === currentUser?.id ||
      c.creator_user_id === currentUser?.id
  );

  // Auto-select first conversation on desktop if none selected
  useEffect(() => {
    if (!selectedConvId && userConversations.length > 0) {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setSelectedConvId(userConversations[0].id);
        setActiveConversationId(userConversations[0].id);
      }
    }
  }, [userConversations.length]);

  // Sync selected conversation with parent / store
  useEffect(() => {
    if (selectedConvId) {
      setActiveConversationId(selectedConvId);
      fetchConversationMessages(selectedConvId).catch(console.error);
      fetchConversationProposals(selectedConvId).catch(console.error);
    }
  }, [selectedConvId]);

  const activeConversation = userConversations.find(
    (c) => c.id === selectedConvId
  );

  const convMessages = (selectedConvId ? messages[selectedConvId] : []) || [];
  const convProposals = (selectedConvId ? dealProposals[selectedConvId] : []) || [];

  // Active proposal (latest ACTIVE)
  const activeProposal = convProposals.find((p) => p.status === 'ACTIVE');

  // Associated order (if deal was confirmed)
  const activeOrder = orders.find(
    (o) =>
      o.id === activeConversation?.order_id ||
      o.request_id === activeConversation?.request_id
  );

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

  // Submit live Instagram Reel delivery
  const handleSubmitReelDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || isSubmittingReel) return;

    setReelSubmitError(null);
    setReelSubmitSuccess(null);

    const parsed = parseInstagramUrl(reelUrlInput.trim());
    if (!parsed.isValid || !parsed.canonicalUrl) {
      setReelSubmitError(
        parsed.error || 'Please provide a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...)'
      );
      return;
    }

    setIsSubmittingReel(true);
    try {
      await submitDelivery(
        activeOrder.id,
        parsed.canonicalUrl,
        'Live Instagram Reel delivery submitted for review.',
        parsed.canonicalUrl
      );
      setReelSubmitSuccess('Instagram Reel submitted for business review!');
      setReelUrlInput('');
    } catch (err: any) {
      setReelSubmitError(err.message || 'Failed to submit delivery');
    } finally {
      setIsSubmittingReel(false);
    }
  };

  // Accept delivery (Business)
  const handleAcceptDelivery = async () => {
    if (!activeOrder) return;
    try {
      await approveDelivery(activeOrder.id);
    } catch (err: any) {
      alert(err.message || 'Failed to accept delivery');
    }
  };

  // Request revision (Business)
  const handleRequestRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !revisionNotesInput.trim() || isSubmittingRevision) return;

    setIsSubmittingRevision(true);
    try {
      await requestRevision(activeOrder.id, revisionNotesInput.trim());
      setIsRevisionModalOpen(false);
      setRevisionNotesInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to request revision');
    } finally {
      setIsSubmittingRevision(false);
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
          No active collaborations yet.
        </h4>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
          Private chat becomes available automatically when a collaboration request is accepted.
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

  const isOrderPaid = Boolean(
    activeOrder && (
      activeOrder.payment_status === 'PAID' ||
      activeOrder.order_status === 'PAID' ||
      activeOrder.order_status === 'WORK_STARTED' ||
      activeOrder.order_status === 'IN_PROGRESS' ||
      activeOrder.order_status === 'DELIVERED' ||
      activeOrder.order_status === 'REVISION_REQUESTED' ||
      activeOrder.order_status === 'APPROVED' ||
      activeOrder.order_status === 'AUTO_APPROVED' ||
      activeOrder.order_status === 'COMPLETED'
    )
  );

  // Status subtitle helper
  const getStatusSubtitle = () => {
    if (!activeOrder) return 'Active Negotiation';
    if (!isOrderPaid) return 'Waiting for payment';
    if (activeOrder.order_status === 'DELIVERED') return 'Delivery Submitted';
    if (activeOrder.order_status === 'REVISION_REQUESTED') return 'Revision Requested';
    if (activeOrder.order_status === 'COMPLETED') return 'Completed';
    return 'In Production';
  };

  const deliveryUrl =
    activeOrder?.delivery?.proof_url ||
    (activeOrder as any)?.proof_url ||
    (activeOrder as any)?.instagram_post_url;

  return (
    <div
      className={`bg-white dark:bg-[#18181B] font-mono ${
        selectedConvId
          ? 'fixed inset-0 z-50 h-[100dvh] w-full flex flex-col md:relative md:inset-auto md:h-[calc(100vh-6.5rem)] md:min-h-[600px] md:rounded-xl md:border md:border-[#E5E5DE] md:dark:border-zinc-800 md:shadow-sm md:flex-row overflow-hidden'
          : 'relative h-[calc(100vh-6.5rem)] min-h-[600px] rounded-xl border border-[#E5E5DE] dark:border-zinc-800 shadow-sm flex flex-col md:flex-row overflow-hidden'
      }`}
    >
      {/* SIDEBAR: Conversation List (hidden on mobile when a chat is open) */}
      <div
        className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E5E5DE] dark:border-zinc-800 flex flex-col shrink-0 h-full ${
          selectedConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-3.5 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-[#121214] dark:text-white">
            Conversations ({userConversations.length})
          </span>
          <span className="text-[10px] text-[#047857] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Protected</span>
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

      {/* COLLABORATION WORKSPACE PANE */}
      {activeConversation ? (
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-[#18181B] h-full min-h-0 overflow-hidden ${
            !selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* 1. COMPACT STICKY HEADER */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/90 shrink-0 flex items-center justify-between gap-2 pt-[max(0.625rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2 min-w-0">
              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setSelectedConvId(null)}
                className="md:hidden p-1.5 -ml-1 text-[#71717A] hover:text-[#121214] dark:hover:text-white rounded-lg hover:bg-[#ECECE6] dark:hover:bg-zinc-800 shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#047857]" />

              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[#121214] dark:text-white truncate">
                  {otherPartyName}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-[#71717A] dark:text-zinc-400 truncate">
                  {getStatusSubtitle()}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {activeOrder ? (
                <button
                  type="button"
                  onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-[#121214] dark:text-white hover:border-[#FF5416] transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-[#047857]" />
                  <span>#{activeOrder.order_number}</span>
                  {isOrderPanelOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-[#71717A]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
                  )}
                </button>
              ) : !isEnded ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenNewProposalModal}
                  className="text-xs h-7 px-2.5 bg-[#FF5416] hover:bg-[#E0450C] text-white"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  <span>Propose Deal</span>
                </Button>
              ) : null}

              {/* Pay Now shortcut if unpaid business */}
              {isMeBusiness && activeOrder && !isOrderPaid && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isPaying}
                  onClick={handleConfirmPayment}
                  className="text-xs h-7 px-2.5 bg-[#047857] hover:bg-[#065F46] text-white"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  <span>Pay ₹{activeOrder.total_amount.toLocaleString('en-IN')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* 2. COMPACT COLLAPSIBLE ORDER & DELIVERY PANEL */}
          {activeOrder && isOrderPanelOpen && (
            <div className="bg-[#FAF9F5] dark:bg-zinc-900 border-b border-[#E5E5DE] dark:border-zinc-800 p-3 sm:p-4 space-y-3 shrink-0 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#121214] dark:text-white">
                  Order Details — #{activeOrder.order_number}
                </span>
                <span className="text-[10px] text-[#047857] font-semibold bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800">
                  {isOrderPaid ? 'Payment Protected' : 'Awaiting Payment'}
                </span>
              </div>

              {/* Terms grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded border border-[#E5E5DE] dark:border-zinc-700">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block">Deliverable</span>
                  <span className="font-semibold text-[#121214] dark:text-white truncate block">
                    {activeOrder.package?.name || activeOrder.requirements || '1 × Instagram Reel'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded border border-[#E5E5DE] dark:border-zinc-700">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block">Agreed Price</span>
                  <span className="font-bold text-[#121214] dark:text-white">
                    ₹{activeOrder.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded border border-[#E5E5DE] dark:border-zinc-700">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block">Deadline</span>
                  <span className="font-semibold text-[#121214] dark:text-white">
                    {activeOrder.deadline ? new Date(activeOrder.deadline).toLocaleDateString('en-IN') : '7 Days'}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-zinc-800/80 rounded border border-[#E5E5DE] dark:border-zinc-700">
                  <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block">Revisions</span>
                  <span className="font-semibold text-[#121214] dark:text-white">
                    {Math.max(0, (activeOrder.included_revisions ?? 1) - (activeOrder.revisions_used ?? 0))} remaining
                  </span>
                </div>
              </div>

              {/* DELIVERY SECTION INSIDE PANEL */}
              <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-[#121214] dark:text-white block">
                  Delivery
                </span>

                {deliveryUrl ? (
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-[#E5E5DE] dark:border-zinc-700 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#121214] dark:text-white">
                          Instagram Reel:
                        </span>
                        <a
                          href={deliveryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#FF5416] hover:underline font-bold break-all"
                        >
                          <span>[ View on Instagram ]</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>

                      {activeOrder.order_status === 'COMPLETED' ? (
                        <span className="text-xs text-[#047857] font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Delivery accepted. Payout will be processed.</span>
                        </span>
                      ) : isMeBusiness ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAcceptDelivery}
                            className="bg-[#047857] hover:bg-[#065F46] text-white text-xs h-7 px-2.5"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            <span>Accept Delivery</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRevisionModalOpen(true)}
                            className="text-xs h-7 px-2.5"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            <span>Request Revision</span>
                          </Button>
                          <Link href={`/orders/${activeOrder.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-[#71717A]">
                              <span>System Review</span>
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs text-[#71717A] dark:text-zinc-400">
                          Waiting for business review
                        </span>
                      )}
                    </div>
                  </div>
                ) : isMeCreator && isOrderPaid ? (
                  <form onSubmit={handleSubmitReelDelivery} className="space-y-2">
                    {reelSubmitError && (
                      <p className="text-[11px] text-red-600 font-mono">{reelSubmitError}</p>
                    )}
                    {reelSubmitSuccess && (
                      <p className="text-[11px] text-[#047857] font-mono">{reelSubmitSuccess}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                        value={reelUrlInput}
                        onChange={(e) => setReelUrlInput(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingReel}
                        className="text-xs h-8 px-3 shrink-0"
                      >
                        {isSubmittingReel ? 'Submitting...' : 'Submit Reel'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-[#71717A] dark:text-zinc-400">
                    {isOrderPaid
                      ? 'Creator is working on the order.'
                      : 'Waiting for business payment to start work.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 3. MESSAGES SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-3.5 bg-[#FAF9F5] dark:bg-zinc-950/40 overscroll-contain">
            {feedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#71717A] dark:text-zinc-400 p-6 space-y-2">
                <Lock className="w-6 h-6 text-[#A1A1AA] mx-auto" />
                <p className="font-semibold text-[#121214] dark:text-white">
                  Collaboration Thread Ready
                </p>
                <p className="max-w-xs leading-relaxed">
                  Discuss content expectations, format details, and finalize terms directly here.
                </p>
              </div>
            ) : (
              feedItems.map((item) => {
                if (item.type === 'message') {
                  const msg = item.data;
                  const bodyText = msg.body || msg.message || '';
                  const isDealConfirmedMsg =
                    bodyText.startsWith('✓ Deal confirmed!') ||
                    bodyText.startsWith('Deal confirmed!');

                  if (isDealConfirmedMsg) {
                    // Strip any stale status suffix from historical system message
                    const cleanBodyText = bodyText
                      .replace(/\s*\(Status:\s*Deal Confirmed\s*-\s*Payment Pending\)\.?/gi, '.')
                      .replace(/\s*\(Status:\s*Payment Pending\)\.?/gi, '.')
                      .replace(/\s*\(Status:\s*Deal Confirmed\)\.?/gi, '.')
                      .replace(/\.\.+/g, '.')
                      .trim();

                    return (
                      <div key={`msg_${msg.id}`} className="w-full my-2 flex justify-center">
                        <div className="max-w-md w-full p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 shadow-xs flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="font-bold block text-xs text-purple-950 dark:text-purple-100">
                              Deal Confirmed
                            </span>
                            <p className="text-[11px] leading-relaxed text-purple-800 dark:text-purple-300 break-words">
                              {cleanBodyText}
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
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-[#71717A] dark:text-zinc-400 uppercase">
                          {isMe ? 'You' : msg.sender_name || (isMeBusiness ? 'Creator' : 'Business')}
                        </span>
                        <span className="text-[9px] text-[#A1A1AA] dark:text-zinc-500">
                          {timeStr}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed break-words shadow-xs ${
                          isMe
                            ? 'bg-[#18181B] dark:bg-zinc-800 text-white rounded-br-xs'
                            : 'bg-white dark:bg-zinc-900 text-[#121214] dark:text-zinc-100 border border-[#E5E5DE] dark:border-zinc-800 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.body || msg.message}</p>
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
                    className="max-w-md mx-auto w-full my-2"
                  >
                    <div
                      className={`rounded-xl border p-3.5 space-y-3 shadow-xs ${
                        prop.status === 'ACCEPTED'
                          ? 'bg-[#ECFDF5] dark:bg-emerald-950/30 border-[#A7F3D0] dark:border-emerald-800'
                          : prop.status === 'SUPERSEDED'
                          ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-75'
                          : prop.status === 'CANCELLED'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 opacity-80'
                          : 'bg-white dark:bg-zinc-900 border-[#FFD2C1] dark:border-[#4D1F0E]'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              prop.status === 'ACCEPTED'
                                ? 'text-[#047857]'
                                : 'text-[#FF5416]'
                            }`}
                          />
                          <span className="font-bold text-xs text-[#121214] dark:text-white truncate">
                            Deal Proposal v{prop.version}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
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

                      <div className="space-y-1.5 text-xs text-[#121214] dark:text-zinc-200">
                        <div className="font-semibold text-xs leading-snug break-words">
                          {prop.deliverable}
                        </div>
                        <div className="grid grid-cols-2 gap-2 py-1.5 border-y border-[#ECECE6] dark:border-zinc-800 text-[11px]">
                          <div>
                            <span className="text-[#71717A] dark:text-zinc-400 block text-[10px]">
                              Agreed Price
                            </span>
                            <span className="font-bold text-[#121214] dark:text-white">
                              ₹{prop.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#71717A] dark:text-zinc-400 block text-[10px]">
                              Deadline
                            </span>
                            <span className="font-medium text-[#121214] dark:text-white">
                              {new Date(prop.deadline).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {prop.key_requirements && (
                          <div className="text-[11px] text-[#52525B] dark:text-zinc-400 pt-0.5">
                            <span className="font-semibold text-[#121214] dark:text-white block text-[10px]">
                              Requirements:
                            </span>
                            <p className="line-clamp-2 break-words">{prop.key_requirements}</p>
                          </div>
                        )}
                      </div>

                      {canAct && (
                        <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenProposeChanges(prop)}
                            className="text-xs h-7 px-2"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            <span>Modify</span>
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={acceptingProposalId === prop.id}
                            onClick={() => handleAcceptTerms(prop.id)}
                            className="text-xs h-7 px-2.5 bg-[#047857] hover:bg-[#065F46] text-white"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            <span>
                              {acceptingProposalId === prop.id
                                ? 'Accepting...'
                                : 'Accept Terms'}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 4. COMPOSER (STICKY AT BOTTOM) */}
          <div className="shrink-0 border-t border-[#E5E5DE] dark:border-zinc-800 bg-white dark:bg-[#18181B] p-2.5 sm:p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 max-w-full"
            >
              <input
                type="text"
                disabled={isEnded || isSending}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isEnded
                    ? 'This collaboration has ended'
                    : `Message ${otherPartyName}...`
                }
                className="flex-1 text-xs px-3.5 py-2.5 bg-[#FBFBFA] dark:bg-zinc-800/80 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl text-[#121214] dark:text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF5416] transition-colors disabled:opacity-50 min-w-0"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputText.trim() || isSending || isEnded}
                className="bg-[#FF5416] hover:bg-[#E0450C] text-white h-10 px-3.5 rounded-xl shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline ml-1 text-xs">Send</span>
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8 text-center text-xs text-[#71717A] dark:text-zinc-400 font-mono">
          Select a conversation on the left to open the collaboration workspace.
        </div>
      )}

      {/* MODALS */}
      {/* 1. NEW / MODIFY PROPOSAL MODAL */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div>
                <span className="editorial-label text-[#FF5416]">Structured Agreement</span>
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  {editingProposal ? `Propose Changes (v${editingProposal.version + 1})` : 'Make Deal Proposal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {proposalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300 rounded-lg">
                {proposalError}
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Agreed Deliverable *
                </label>
                <input
                  type="text"
                  required
                  value={proposalDeliverable}
                  onChange={(e) => setProposalDeliverable(e.target.value)}
                  placeholder="e.g. 1 High-Quality Vertical Reel (9:16)"
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={proposalPrice}
                    onChange={(e) => setProposalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Included Revisions
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={proposalRevisions}
                    onChange={(e) => setProposalRevisions(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Delivery Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={proposalDeadline}
                  onChange={(e) => setProposalDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Key Requirements & Guidelines
                </label>
                <textarea
                  rows={3}
                  value={proposalRequirements}
                  onChange={(e) => setProposalRequirements(e.target.value)}
                  placeholder="Specify key CTA, hashtag, brand tags, and format specifications..."
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProposalModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingProposal}
                >
                  {isSubmittingProposal ? 'Sending...' : editingProposal ? 'Submit Changes' : 'Send Proposal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REQUEST REVISION MODAL */}
      {isRevisionModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#FF5416]" />
                <h3 className="text-base font-bold text-[#121214] dark:text-white">
                  Request Revision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestRevisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Specific Revision Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  value={revisionNotesInput}
                  onChange={(e) => setRevisionNotesInput(e.target.value)}
                  placeholder="Explain exactly what adjustments are required..."
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-[#121214] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  disabled={isSubmittingRevision}
                >
                  {isSubmittingRevision ? 'Submitting...' : 'Send Revision Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
