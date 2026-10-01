'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Conversation, ChatMessage, UserRole } from '@/types/marketplace';
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
  Package as PackageIcon,
  X,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface ConversationChatProps {
  role: UserRole;
  initialConversationId?: string | null;
}

export function ConversationChat({ role, initialConversationId }: ConversationChatProps) {
  const {
    currentUser,
    conversations,
    collaborationRequests,
    orders,
    messages,
    activeConversationId,
    setActiveConversationId,
    fetchConversationMessages,
    sendMessage,
    createOrderFromCollaboration,
    creators,
    businesses,
    campaigns,
  } = useMarketplace();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversationId || activeConversationId || null
  );
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // Deal finalization modal state
  const [isFinalizingDeal, setIsFinalizingDeal] = useState(false);
  const [dealPackageId, setDealPackageId] = useState<string>('');
  const [dealAmount, setDealAmount] = useState<number>(5000);
  const [dealObjective, setDealObjective] = useState<string>('');
  const [dealRequirements, setDealRequirements] = useState<string>('');
  const [dealDos, setDealDos] = useState<string>('');
  const [dealDonts, setDealDonts] = useState<string>('');
  const [dealDeadline, setDealDeadline] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations where the current user is a participant
  const userConversations = conversations.filter(
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
  }, [userConversations.length, selectedConvId]);

  const activeConversation = userConversations.find((c) => c.id === selectedConvId);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConvId) {
      fetchConversationMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Scroll to bottom when messages update
  const convMessages = (selectedConvId ? messages[selectedConvId] : []) || [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages.length]);

  // Pre-fill deal confirmation modal when opening
  useEffect(() => {
    if (activeConversation && isFinalizingDeal) {
      const linkedReq = collaborationRequests.find(
        (r) => r.id === activeConversation.request_id
      );
      const creator = creators.find(
        (c) => c.user_id === activeConversation.creator_user_id
      );

      if (linkedReq?.package_id) {
        setDealPackageId(linkedReq.package_id);
      } else if (creator?.packages && creator.packages.length > 0) {
        setDealPackageId(creator.packages[0].id);
      }

      if (linkedReq?.proposed_budget) {
        setDealAmount(linkedReq.proposed_budget);
      } else if (creator?.packages && creator.packages.length > 0) {
        setDealAmount(creator.packages[0].price);
      }

      if (linkedReq?.message && !dealObjective) {
        setDealObjective(`Collaboration: ${linkedReq.message.slice(0, 60)}`);
      } else if (!dealObjective) {
        setDealObjective('Sponsored Video Reel & Brand Promotion');
      }

      if (!dealRequirements) {
        setDealRequirements('Deliver 1 high-quality vertical 9:16 reel showcasing the app features.');
      }
      if (!dealDos) {
        setDealDos('Tag official brand handle and include download link in bio.');
      }
      if (!dealDonts) {
        setDealDonts('Do not mention competitor apps or products.');
      }
    }
  }, [isFinalizingDeal, activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId || isSending) return;

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

  const handleConfirmDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;

    setIsCreatingOrder(true);
    setDealError(null);

    try {
      const newOrder = await createOrderFromCollaboration({
        requestId: activeConversation.request_id || undefined,
        creatorId: activeConversation.creator_user_id,
        packageId: dealPackageId || undefined,
        agreedAmount: Number(dealAmount) || 0,
        brief: {
          objective: dealObjective,
          requirements: dealRequirements,
          dos: dealDos,
          donts: dealDonts,
          deadline: new Date(dealDeadline).toISOString(),
          additionalNotes: 'Deal agreed via private collaboration chat.',
        },
      });

      // Send confirmation message to the chat
      await sendMessage(
        activeConversation.id,
        `Deal confirmed! Order #${newOrder.order_number} has been created for ₹${Number(dealAmount).toLocaleString('en-IN')}. (Status: Payment Pending)`
      );

      setIsFinalizingDeal(false);
    } catch (err: any) {
      console.error('Failed to confirm deal:', err);
      setDealError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (userConversations.length === 0) {
    return (
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#FFF2EC] dark:bg-zinc-800 text-[#FF5416] flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-mono text-base font-bold text-[#121214] dark:text-white">
          No Conversations Yet
        </h4>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
          Private chat becomes available automatically when a creator accepts a collaboration request.
        </p>
      </div>
    );
  }

  // Find linked order for active conversation
  const activeOrder = activeConversation?.order_id
    ? orders.find((o) => o.id === activeConversation.order_id)
    : orders.find(
        (o) =>
          o.request_id === activeConversation?.request_id ||
          (o.creator_user_id === activeConversation?.creator_user_id &&
            o.business_user_id === activeConversation?.business_user_id)
      );

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[620px]">
      {/* SIDEBAR: Conversation List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#E5E5DE] dark:border-zinc-800 flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#121214] dark:text-white">
            Conversations ({userConversations.length})
          </span>
          <span className="editorial-label text-[#047857] flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Encrypted</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#ECECE6] dark:divide-zinc-800/60">
          {userConversations.map((conv) => {
            const isMeBusiness = conv.business_user_id === currentUser?.id;
            const otherName = isMeBusiness
              ? conv.creator?.display_name || 'Creator'
              : conv.business?.business_name || 'Advertiser';
            const otherAvatar = isMeBusiness
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
                  <div className="w-10 h-10 rounded-full bg-[#F4F4F0] dark:bg-zinc-800 font-mono font-bold text-sm text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700 shrink-0">
                    {otherName[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#121214] dark:text-white truncate">
                      {otherName}
                    </span>
                    <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-500 shrink-0">
                      {lastUpdated}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400 truncate">
                      {conv.order_id ? 'Order confirmed' : 'Active collaboration'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT PANE */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#18181B] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E5E5DE] dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
              <div>
                <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                  {activeConversation.business_user_id === currentUser?.id
                    ? activeConversation.creator?.display_name || 'Creator'
                    : activeConversation.business?.business_name || 'Advertiser'}
                </h4>
                <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                  Private Discussion & Negotiation
                </span>
              </div>
            </div>

            {/* Deal Status & Action */}
            <div className="flex items-center gap-2">
              {activeOrder ? (
                <Link href={`/orders/${activeOrder.id}`}>
                  <Button variant="outline" size="sm" className="font-mono text-xs">
                    <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#047857]" />
                    <span>Order #{activeOrder.order_number}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400 hidden sm:inline">
                    Deal pending:
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsFinalizingDeal(true)}
                    className="font-mono text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Confirm Deal & Order</span>
                  </Button>
                </div>
              )}
            </div>
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
                className="text-[10px] font-mono uppercase underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F5] dark:bg-zinc-950/40">
            {convMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#71717A] dark:text-zinc-400 p-6 space-y-2">
                <Lock className="w-8 h-8 text-[#A1A1AA] dark:text-zinc-600" />
                <p className="font-semibold text-[#121214] dark:text-white">
                  Collaboration Accepted
                </p>
                <p className="max-w-sm">
                  Discuss project deliverables, pricing, and deadlines directly. Once agreed, click &quot;Confirm Deal & Order&quot; to formalize the order.
                </p>
              </div>
            ) : (
              convMessages.map((msg) => {
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
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-mono font-semibold text-[#71717A] dark:text-zinc-400 uppercase">
                        {isMe
                          ? 'You'
                          : msg.sender_name || (msg.sender_role === 'creator' ? 'Creator' : 'Advertiser')}
                      </span>
                      <span className="text-[9px] font-mono text-[#A1A1AA] dark:text-zinc-500">
                        {timeStr}
                      </span>
                    </div>

                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs font-mono leading-relaxed shadow-sm break-words ${
                        isMe
                          ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] rounded-br-none'
                          : 'bg-white dark:bg-zinc-800 text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-zinc-700 rounded-bl-none'
                      }`}
                    >
                      {msg.body || msg.message}
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
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message, clarify deliverables, agree on budget..."
              className="flex-1 py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800/80 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg text-xs font-mono text-[#121214] dark:text-white placeholder-[#71717A] focus:outline-none focus:border-[#FF5416]"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSending || !inputText.trim()}
              className="shrink-0 px-4"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-xs font-mono text-[#71717A]">
          Select a conversation from the left to start chatting.
        </div>
      )}

      {/* DEAL FINALIZATION MODAL */}
      {isFinalizingDeal && activeConversation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5416]" />
                <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                  Confirm Deal & Create Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalizingDeal(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] p-3 rounded-lg text-xs font-mono text-[#C2410C] dark:text-[#F97316] space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Escrow Payment Information</span>
              </div>
              <p className="text-[11px]">
                Confirming the deal creates an official order in <strong>PAYMENT_PENDING</strong> status. Payment integration will be connected later.
              </p>
            </div>

            {dealError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 font-mono">
                {dealError}
              </div>
            )}

            <form onSubmit={handleConfirmDeal} className="space-y-4 text-xs font-mono">
              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Agreed Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#71717A]">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dealAmount}
                    onChange={(e) => setDealAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Campaign / Deliverable Objective
                </label>
                <input
                  type="text"
                  required
                  value={dealObjective}
                  onChange={(e) => setDealObjective(e.target.value)}
                  placeholder="e.g. 1 Instagram Reel showcasing App UI & Key Features"
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Specific Requirements
                </label>
                <textarea
                  rows={2}
                  required
                  value={dealRequirements}
                  onChange={(e) => setDealRequirements(e.target.value)}
                  placeholder="What must be included in the video or reel..."
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Do&apos;s
                  </label>
                  <input
                    type="text"
                    value={dealDos}
                    onChange={(e) => setDealDos(e.target.value)}
                    placeholder="e.g. Pin comment with download link"
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Don&apos;ts
                  </label>
                  <input
                    type="text"
                    value={dealDonts}
                    onChange={(e) => setDealDonts(e.target.value)}
                    placeholder="e.g. No competitor mentions"
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#121214] dark:text-white block mb-1">
                  Target Delivery Deadline
                </label>
                <input
                  type="date"
                  required
                  value={dealDeadline}
                  onChange={(e) => setDealDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFinalizingDeal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingOrder}
                >
                  {isCreatingOrder ? 'Creating Order...' : 'Confirm Order (Payment Pending)'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
