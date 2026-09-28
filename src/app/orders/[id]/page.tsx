'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
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
} from 'lucide-react';

export default function OrderWorkspacePage() {
  const params = useParams();
  const orderId = params.id as string;
  const { getOrder, acceptOrder, declineOrder, activeRole } = useMarketplace();
  const order = getOrder(orderId);

  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'workspace' | 'brief' | 'chat' | 'events'>('workspace');

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-mono text-2xl font-bold">Order not found</h2>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={activeRole === 'creator' ? '/dashboard/creator' : '/dashboard/business'}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] hover:text-[#121214]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Creator Accept / Decline Actions if in FUNDED state */}
        {order.order_status === 'FUNDED' && activeRole === 'creator' && (
          <div className="flex items-center gap-2 bg-[#FFF2EC] border border-[#FFD2C1] px-3 py-1.5 rounded-lg text-xs">
            <span className="font-mono text-[#C2410C] font-semibold">New Collaboration Request:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => declineOrder(order.id, 'Creator unavailable')}
            >
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => acceptOrder(order.id)}
            >
              Accept Collaboration
            </Button>
          </div>
        )}
      </div>

      {/* ORDER HEADER */}
      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="editorial-label text-[#71717A]">Order Workspace</span>
              <StatusBadge status={order.order_status} size="sm" />
            </div>
            <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#121214] tracking-tight">
              {order.order_number}
            </h1>
          </div>

          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-[#121214]">
              ₹{order.total_amount.toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] justify-end mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Escrow Funded</span>
            </div>
          </div>
        </div>

        {/* Parties involved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs">
          <div className="flex items-center gap-3 p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg">
            <User className="w-4 h-4 text-[#FF5416]" />
            <div>
              <span className="editorial-label text-[#71717A] block">Creator</span>
              <span className="font-mono font-bold text-[#121214]">{order.creator?.profile?.display_name}</span>
              <span className="text-[#71717A] ml-2">({order.creator?.profile?.city})</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg">
            <Building className="w-4 h-4 text-[#FF5416]" />
            <div>
              <span className="editorial-label text-[#71717A] block">Business / Brand</span>
              <span className="font-mono font-bold text-[#121214]">{order.business?.business_name}</span>
              <span className="text-[#71717A] ml-2">({order.business?.city})</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIFECYCLE TIMELINE */}
      <OrderTimeline currentStatus={order.order_status} />

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs">
        {[
          { key: 'workspace', label: 'Delivery & Proofs' },
          { key: 'chat', label: 'Order Chat' },
          { key: 'brief', label: 'Campaign Brief' },
          { key: 'events', label: 'State Machine Events' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white font-bold'
                : 'text-[#71717A] hover:text-[#121214] hover:bg-[#F4F4F0]'
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
        <div className="max-w-3xl mx-auto bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#FF5416]">Audit Trail</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              Immutable Order Events (order_events)
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {order.events?.map((ev) => (
              <div
                key={ev.id}
                className="p-3 bg-[#FBFBFA] border border-[#ECECE6] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#71717A]">{ev.from_status || 'INIT'}</span>
                    <span className="text-[#FF5416]">→</span>
                    <strong className="text-[#121214]">{ev.to_status}</strong>
                  </div>
                  <p className="text-[#52525B] mt-1 text-[11px]">{ev.reason}</p>
                </div>
                <span className="text-[10px] text-[#A1A1AA] shrink-0">
                  {new Date(ev.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DISPUTE MODAL */}
      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        orderId={order.id}
      />
    </div>
  );
}
