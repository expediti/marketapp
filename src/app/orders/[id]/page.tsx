'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Order } from '@/types/marketplace';
import { OrderBriefView } from '@/components/order/OrderBriefView';
import { ChatWindow } from '@/components/order/ChatWindow';
import { DeliveryWorkspace } from '@/components/order/DeliveryWorkspace';
import { DisputeModal } from '@/components/order/DisputeModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Clock,
  Building,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function OrderWorkspacePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { getOrder, activeRole, currentUser, isLoading: storeLoading } = useMarketplace();
  const storeOrder = getOrder(orderId);
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  useEffect(() => {
    if (!storeOrder && isSupabaseConfigured && orderId) {
      setIsFetchingDirect(true);
      Promise.all([
        supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
        supabase.from('order_briefs').select('*').eq('order_id', orderId).maybeSingle(),
        supabase.from('order_events').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
        supabase.from('deliveries').select('*').eq('order_id', orderId).order('submitted_at', { ascending: true }),
      ])
        .then(([ordRes, briefRes, eventsRes, delivRes]) => {
          if (ordRes.data) {
            const o = ordRes.data;
            const b = briefRes.data;
            const evs = eventsRes.data || [];
            const delivs = delivRes.data || [];
            const lastDeliv = delivs.length > 0 ? delivs[delivs.length - 1] : undefined;

            setDbOrder({
              id: o.id,
              order_number: o.order_number,
              business_id: o.business_id || o.business_user_id,
              business_user_id: o.business_user_id || o.business_id,
              creator_id: o.creator_id || o.creator_user_id,
              creator_user_id: o.creator_user_id || o.creator_id,
              package_id: o.package_id,
              campaign_id: o.campaign_id,
              request_id: o.request_id,
              order_status: o.order_status as any,
              payment_status: o.payment_status as any,
              subtotal: Number(o.subtotal || 0),
              platform_fee: Number(o.platform_fee || 0),
              total_amount: Number(o.total_amount || 0),
              payout_status: (o.payout_status as any) || 'UNRELEASED',
              deadline: b?.deadline || o.deadline || o.created_at,
              included_revisions: o.included_revisions ?? 1,
              revisions_used: o.revisions_used ?? 0,
              delivered_at: o.delivered_at,
              auto_approve_deadline: o.auto_approve_deadline,
              waiting_reason: o.waiting_reason,
              extension_requested_deadline: o.extension_requested_deadline,
              extension_reason: o.extension_reason,
              extension_status: (o.extension_status as any) || 'NONE',
              system_review_reason: o.system_review_reason,
              system_review_description: o.system_review_description,
              system_review_evidence_url: o.system_review_evidence_url,
              created_at: o.created_at,
              updated_at: o.updated_at,
              brief: b
                ? {
                  id: b.id,
                  order_id: b.order_id,
                  objective: b.objective || '',
                  requirements: b.requirements || '',
                  dos: b.dos || '',
                  donts: b.donts || '',
                  deadline: b.deadline || o.deadline || o.created_at,
                  additional_notes: b.additional_notes || undefined,
                }
                : undefined,
              delivery: lastDeliv
                ? {
                  id: lastDeliv.id,
                  order_id: o.id,
                  submitted_by: lastDeliv.submitted_by || o.creator_id,
                  proof_url: lastDeliv.proof_url,
                  notes: lastDeliv.notes || '',
                  submitted_at: lastDeliv.submitted_at || o.delivered_at || o.updated_at,
                  status: (lastDeliv.status as any) || 'pending_review',
                }
                : undefined,
              events: (evs as any[]).map((ev) => ({
                id: ev.id,
                order_id: ev.order_id,
                event_type: ev.event_type as any,
                from_status: ev.from_status,
                to_status: ev.to_status,
                actor_id: ev.actor_id,
                reason: ev.reason,
                created_at: ev.created_at,
              })),
            });
          }
        })
        .finally(() => {
          setIsFetchingDirect(false);
        });
    }
  }, [storeOrder, orderId]);

  const order = storeOrder || dbOrder;
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  const isMeCreator =
    currentUser?.id === order?.creator_user_id ||
    currentUser?.id === order?.creator_id ||
    activeRole === 'creator' ||
    activeRole === 'influencer';

  const isMeBusiness =
    currentUser?.id === order?.business_user_id ||
    currentUser?.id === order?.business_id ||
    activeRole === 'business' ||
    activeRole === 'advertiser';

  if (storeLoading || isFetchingDirect) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading order workspace...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4 font-mono">
        <h2 className="text-2xl font-bold text-[#121214] dark:text-white">Order not found</h2>
        <Link href={isMeCreator ? '/dashboard/creator?tab=orders' : '/dashboard/business?tab=orders'}>
          <Button variant="primary" size="sm">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const isPaid =
    order.payment_status === 'PAID' ||
    order.order_status === 'PAID' ||
    order.order_status === 'WORK_STARTED' ||
    order.order_status === 'IN_PROGRESS' ||
    order.order_status === 'DELIVERED' ||
    order.order_status === 'REVISION_REQUESTED' ||
    order.order_status === 'APPROVED' ||
    order.order_status === 'AUTO_APPROVED' ||
    order.order_status === 'COMPLETED';

  const otherPartyName = isMeCreator
    ? order.business?.business_name || 'Brand Partner'
    : order.creator?.display_name || order.creator?.profile?.display_name || 'Creator';

  const deliverableText = order.package?.name || order.brief?.objective || '1 × Instagram Reel';
  const revisionsLeft = Math.max(0, (order.included_revisions ?? 1) - (order.revisions_used ?? 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-mono">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={isMeCreator ? '/dashboard/creator?tab=orders' : '/dashboard/business?tab=orders'}
          className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#121214] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>

        {isPaid ? (
          <span className="text-[11px] text-[#047857] dark:text-emerald-400 bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Payment Protected ✓</span>
          </span>
        ) : (
          <span className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
            Awaiting Payment
          </span>
        )}
      </div>

      {/* COMPACT ORDER HEADER */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
          <div>
            <span className="editorial-label text-[#FF5416] block">
              {isMeCreator ? 'Business Partner' : 'Creator'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#121214] dark:text-white mt-0.5">
              {otherPartyName}
            </h1>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Order #{order.order_number}
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
            <StatusBadge status={order.order_status} size="sm" />
            <span className="font-bold text-lg sm:text-xl text-[#121214] dark:text-white">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Essential Terms Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block uppercase">Deliverable</span>
            <span className="font-bold text-[#121214] dark:text-white truncate block mt-0.5">
              {deliverableText}
            </span>
          </div>

          <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block uppercase">Price</span>
            <span className="font-bold text-[#121214] dark:text-white block mt-0.5">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block uppercase">Deadline</span>
            <span className="font-bold text-[#121214] dark:text-white block mt-0.5">
              {order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
            <span className="text-[10px] text-[#71717A] dark:text-zinc-400 block uppercase">Revisions</span>
            <span className="font-bold text-[#121214] dark:text-white block mt-0.5">
              {revisionsLeft} remaining
            </span>
          </div>
        </div>
      </div>

      {/* PRIMARY WORKSPACE: DELIVERY & CHAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery */}
        <div className="lg:col-span-6 space-y-4">
          <DeliveryWorkspace
            order={order}
            onOpenDispute={() => setIsDisputeOpen(true)}
          />
        </div>

        {/* Right Column: Chat */}
        <div className="lg:col-span-6">
          <ChatWindow orderId={order.id} />
        </div>
      </div>

      {/* SECONDARY COLLAPSIBLE SECTIONS */}
      <div className="space-y-3 pt-2">
        {/* Collapsible Campaign Brief */}
        <div className="border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-white dark:bg-[#18181B] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowBrief(!showBrief)}
            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-[#121214] dark:text-white hover:bg-[#FBFBFA] dark:hover:bg-zinc-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#FF5416]" />
              <span>Campaign Brief & Requirements</span>
            </span>
            {showBrief ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showBrief && (
            <div className="p-4 border-t border-[#ECECE6] dark:border-zinc-800">
              <OrderBriefView
                brief={order.brief}
                packageName={order.package?.name}
                totalAmount={order.total_amount}
              />
            </div>
          )}
        </div>

        {/* Collapsible Activity Trail */}
        <div className="border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-white dark:bg-[#18181B] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEvents(!showEvents)}
            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-[#121214] dark:text-white hover:bg-[#FBFBFA] dark:hover:bg-zinc-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#71717A]" />
              <span>Activity History ({order.events?.length || 0})</span>
            </span>
            {showEvents ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showEvents && (
            <div className="p-4 border-t border-[#ECECE6] dark:border-zinc-800 space-y-2 text-xs">
              {(!order.events || order.events.length === 0) ? (
                <p className="text-[#71717A] text-center py-2">No activity events recorded yet.</p>
              ) : (
                order.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-[#121214] dark:text-white">{ev.to_status}</span>
                      {ev.reason && <p className="text-[#71717A] mt-0.5">{ev.reason}</p>}
                    </div>
                    <span className="text-[10px] text-[#A1A1AA] shrink-0">
                      {new Date(ev.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM REVIEW MODAL */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        orderId={order.id}
      />
    </div>
  );
}
