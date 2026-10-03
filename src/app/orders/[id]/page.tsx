'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Order } from '@/types/marketplace';
import { OrderTimeline } from '@/components/order/OrderTimeline';
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
  History,
  AlertTriangle,
  Building,
  User,
  Info,
  RefreshCw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function OrderWorkspacePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { getOrder, acceptOrder, declineOrder, activeRole, isLoading: storeLoading } = useMarketplace();
  const storeOrder = getOrder(orderId);
  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'workspace' | 'brief' | 'chat' | 'events'>('workspace');

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
        <Link href="/discover">
          <Button variant="primary" size="sm">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <Link
          href={activeRole === 'creator' ? '/dashboard/creator' : '/dashboard/business'}
          className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#121214] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Contextual Status Indicator */}
        {(order.order_status === 'DEAL_CONFIRMED' || order.order_status === 'PAYMENT_PENDING') && (
          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 px-3 py-1.5 rounded-lg text-xs text-purple-700 dark:text-purple-300">
            <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold">
              {activeRole === 'business'
                ? 'Payment required to start this collaboration.'
                : 'Deal Confirmed ✓ — Awaiting Business Payment'}
            </span>
          </div>
        )}

        {order.order_status === 'PAID' && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-lg text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">
              {activeRole === 'creator'
                ? 'Payment received. You can now start the work.'
                : 'Payment received.'}
            </span>
          </div>
        )}
      </div>

      {/* ORDER HEADER */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-4 shadow-sm font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="editorial-label text-[#71717A] dark:text-zinc-400">Order Workspace</span>
              <StatusBadge status={order.order_status} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#121214] dark:text-white tracking-tight">
              {order.order_number}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-bold text-[#121214] dark:text-white">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#047857] sm:justify-end mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Payment Protection</span>
            </div>
          </div>
        </div>

        {/* CONTEXTUAL WORKFLOW NOTICES */}
        {(order.order_status === 'DEAL_CONFIRMED' || order.order_status === 'PAYMENT_PENDING') && (
          <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-3.5 rounded-lg text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-purple-600" />
            <p className="font-semibold">
              Payment required to start this collaboration.
            </p>
          </div>
        )}

        {order.order_status === 'PAID' && (
          <div className="bg-[#ECFDF5] dark:bg-emerald-950/30 border border-[#A7F3D0] dark:border-emerald-800 p-3.5 rounded-lg text-xs text-[#047857] dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#047857]" />
            <p className="font-semibold">
              {activeRole === 'creator'
                ? 'Payment received. You can now start the work.'
                : 'Payment received.'}
            </p>
          </div>
        )}

        {(order.order_status === 'WORK_STARTED' || order.order_status === 'IN_PROGRESS') && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3.5 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-blue-600" />
            <p>
              Work has started! Creator is actively preparing deliverable according to the agreed brief.
            </p>
          </div>
        )}

        {order.order_status === 'DELIVERED' && (
          <div className="bg-[#FFF2EC] dark:bg-[#27140B] border border-[#FFD2C1] dark:border-[#4D1F0E] p-3.5 rounded-lg text-xs text-[#C2410C] dark:text-[#F97316] flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-[#FF5416]" />
            <p>
              Please review the delivery within 4 days. If no action is taken, it will be automatically approved.
            </p>
          </div>
        )}

        {/* Parties involved & terms */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="flex items-center gap-3 p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg">
            <User className="w-4 h-4 text-[#FF5416]" />
            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400 block">Creator</span>
              <span className="font-bold text-[#121214] dark:text-white">
                {order.creator?.display_name || order.creator?.profile?.display_name || 'Creator'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg">
            <Building className="w-4 h-4 text-[#FF5416]" />
            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400 block">Business / Brand</span>
              <span className="font-bold text-[#121214] dark:text-white">
                {order.business?.business_name || 'Business'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-lg">
            <RefreshCw className="w-4 h-4 text-[#FF5416]" />
            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400 block">Included Revisions</span>
              <span className="font-bold text-[#121214] dark:text-white">
                {order.included_revisions ?? 1} revision(s) ({order.revisions_used ?? 0} used)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIFECYCLE TIMELINE */}
      <OrderTimeline currentStatus={order.order_status} />

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-zinc-800 pb-2 font-mono text-xs">
        {[
          { key: 'workspace', label: 'Delivery & Proofs' },
          { key: 'chat', label: 'Order Chat' },
          { key: 'brief', label: 'Campaign Brief' },
          { key: 'events', label: 'Activity Trail' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors ${activeTab === tab.key
                ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-bold'
                : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <DeliveryWorkspace
              order={order}
              onOpenDispute={() => setIsDisputeOpen(true)}
            />
            <OrderBriefView
              brief={order.brief}
              packageName={order.package?.name}
              totalAmount={order.total_amount}
            />
          </div>

          <div className="lg:col-span-5">
            <ChatWindow orderId={order.id} />
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="max-w-3xl mx-auto">
          <ChatWindow orderId={order.id} />
        </div>
      )}

      {activeTab === 'brief' && (
        <div className="max-w-3xl mx-auto">
          <OrderBriefView
            brief={order.brief}
            packageName={order.package?.name}
            totalAmount={order.total_amount}
          />
        </div>
      )}

      {activeTab === 'events' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm font-mono">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <span className="editorial-label text-[#FF5416]">Audit Trail</span>
            <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
              Collaboration Activity History
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {(!order.events || order.events.length === 0) ? (
              <p className="text-[#71717A] dark:text-zinc-400 text-xs py-4 text-center">
                No activity events recorded yet.
              </p>
            ) : (
              order.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#71717A] dark:text-zinc-400">{ev.from_status || 'INIT'}</span>
                      <span className="text-[#FF5416]">→</span>
                      <strong className="text-[#121214] dark:text-white">{ev.to_status}</strong>
                    </div>
                    <p className="text-[#52525B] dark:text-zinc-300 mt-1 text-[11px]">{ev.reason}</p>
                  </div>
                  <span className="text-[10px] text-[#A1A1AA] dark:text-zinc-500 shrink-0">
                    {new Date(ev.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SYSTEM REVIEW MODAL */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        orderId={order.id}
      />
    </div>
  );
}
