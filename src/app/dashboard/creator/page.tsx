'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Layers,
  Sparkles,
  Wallet,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const { orders, acceptOrder, declineOrder, currentUser, creators } = useMarketplace();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'packages' | 'payouts'>('overview');

  const creatorProfile = creators[0]; // Creator 042

  // Orders for this creator
  const creatorOrders = orders.filter(
    (o) => o.creator_id === creatorProfile.user_id || o.creator?.user_id === creatorProfile.user_id
  );

  const pendingRequests = creatorOrders.filter((o) => o.order_status === 'FUNDED');
  const activeOrders = creatorOrders.filter(
    (o) =>
      o.order_status === 'ACCEPTED' ||
      o.order_status === 'IN_PROGRESS' ||
      o.order_status === 'DELIVERED'
  );
  const completedOrders = creatorOrders.filter(
    (o) => o.order_status === 'COMPLETED' || o.order_status === 'APPROVED'
  );

  const totalEarnings = 12400;
  const pendingEarnings = 2500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Creator Workspace</span>
            <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              Verified Studio
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">
            {creatorProfile.profile?.display_name || 'Creator Studio'}
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            {creatorProfile.niche} • {creatorProfile.profile?.city} • Verified Instagram Metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/creators/${creatorProfile.user_id}`}>
            <Button variant="outline" size="sm">
              <span>View Public Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Earnings"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          subtext="Direct UPI settlements"
          badge="SETTLED"
        />
        <StatCard
          label="Pending in Escrow"
          value={`₹${pendingEarnings.toLocaleString('en-IN')}`}
          subtext="Ready upon content delivery"
          badge="HELD IN ESCROW"
        />
        <StatCard
          label="Active Orders"
          value={activeOrders.length || 1}
          subtext="Deliverables in pipeline"
        />
        <StatCard
          label="Completed Collabs"
          value={completedOrders.length || 8}
          subtext="100% on-time rating"
        />
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs">
        {[
          { key: 'overview', label: 'Overview & Requests' },
          { key: 'orders', label: `All Orders (${creatorOrders.length})` },
          { key: 'packages', label: 'Rate Card Packages' },
          { key: 'payouts', label: 'Payout History' },
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

      {/* OVERVIEW CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 1. New Requests Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">Collaboration Inbound</span>
                <h3 className="font-mono text-lg font-bold text-[#121214]">
                  New Pre-Funded Requests
                </h3>
              </div>
              <span className="text-xs font-mono text-[#71717A]">
                {pendingRequests.length} pending decision
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E5E5DE] rounded-lg p-8 text-center text-xs text-[#71717A] font-mono">
                No new pending requests. Active orders are progressing.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border-2 border-[#121214] rounded-lg p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="editorial-label text-[#FF5416]">
                          {req.business?.business_name}
                        </span>
                        <h4 className="font-mono text-lg font-bold text-[#121214] mt-0.5">
                          {req.package?.name}
                        </h4>
                        <p className="text-xs text-[#71717A]">
                          Deadline: 5 days • {req.business?.city}
                        </p>
                      </div>
                      <span className="font-mono text-xl font-bold text-[#121214]">
                        ₹{req.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-[#52525B] line-clamp-2 bg-[#FBFBFA] p-2.5 rounded border border-[#E5E5DE]">
                      {req.brief?.objective || 'New collaboration brief received.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6]">
                      <Link href={`/orders/${req.id}`}>
                        <Button variant="outline" size="sm">
                          View Request
                        </Button>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => declineOrder(req.id, 'Creator schedule conflict')}
                          className="text-[#71717A]"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptOrder(req.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Active Orders Table */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 p-6">
            <div className="border-b border-[#ECECE6] pb-3">
              <span className="editorial-label text-[#71717A]">Pipeline</span>
              <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
                Active Collaborations
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#ECECE6] text-[#71717A] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Deliverable</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECE6]">
                  {creatorOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FBFBFA]">
                      <td className="py-3 px-3 font-bold text-[#121214]">{ord.order_number}</td>
                      <td className="py-3 px-3 text-[#52525B]">{ord.business?.business_name}</td>
                      <td className="py-3 px-3 text-[#121214]">{ord.package?.name}</td>
                      <td className="py-3 px-3 font-bold text-[#121214]">
                        ₹{ord.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={ord.order_status} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="outline" size="sm">
                            Open Workspace
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ALL ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
          <h3 className="font-mono text-base font-bold text-[#121214]">Complete Order Archive</h3>
          <div className="divide-y divide-[#ECECE6]">
            {creatorOrders.map((ord) => (
              <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-[#121214]">{ord.order_number}</strong>
                    <StatusBadge status={ord.order_status} size="sm" />
                  </div>
                  <p className="text-xs text-[#71717A] mt-1 font-mono">
                    Brand: {ord.business?.business_name} • Package: {ord.package?.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-sm text-[#121214]">
                    ₹{ord.subtotal.toLocaleString('en-IN')}
                  </span>
                  <Link href={`/orders/${ord.id}`}>
                    <Button variant="outline" size="sm">
                      Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PACKAGES TAB */}
      {activeTab === 'packages' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Rate Card</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">Configured Packages</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creatorProfile.packages?.map((pkg) => (
              <div key={pkg.id} className="p-5 border border-[#E5E5DE] rounded-lg bg-[#FBFBFA] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-mono font-bold text-sm text-[#121214]">{pkg.name}</h4>
                  <span className="font-mono font-bold text-base text-[#FF5416]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-[#52525B]">{pkg.description}</p>
                <div className="pt-2 border-t border-[#ECECE6] text-[11px] font-mono text-[#71717A]">
                  Delivery: {pkg.delivery_days} days • {pkg.revision_count} Revisions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAYOUTS TAB */}
      {activeTab === 'payouts' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
            <div>
              <span className="editorial-label text-[#047857]">UPI & Banking</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">Direct Bank Settlement Ledger</h3>
            </div>
            <span className="text-xs font-mono text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0]">
              Verified VPA Connected
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-[#121214] block">Settlement ORD-10480 (Sutra Organics)</span>
                <span className="text-[11px] text-[#71717A]">Reference: UTR89123849 • UPI IMPS Transfer</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-[#047857] block">+₹6,000.00</span>
                <span className="text-[10px] text-[#71717A]">Completed</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
