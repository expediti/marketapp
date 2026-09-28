'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DisputeResolution } from '@/types/marketplace';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Layers,
  History,
  Lock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    orders,
    creators,
    businesses,
    adminActions,
    resolveDispute,
    adminReleasePayout,
    adminRefundOrder,
    adminToggleCreatorStatus,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'disputes' | 'orders' | 'creators' | 'audit'>('overview');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Financial aggregations
  const totalGMV = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const platformRevenue = orders.reduce((sum, o) => sum + o.platform_fee, 0);
  const activeOrdersCount = orders.filter((o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED').length;
  const completedOrdersCount = orders.filter((o) => o.order_status === 'COMPLETED').length;
  const disputedOrders = orders.filter((o) => o.order_status === 'DISPUTED' || o.order_status === 'ADMIN_REVIEW');

  const handleResolve = async (orderId: string, resolution: DisputeResolution) => {
    setIsProcessing(true);
    await resolveDispute(orderId, resolution, resolutionNotes || 'Mediation concluded by Platform Ops');
    setIsProcessing(false);
    setSelectedDisputeId(null);
    setResolutionNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#B91C1C]">Restricted Access</span>
            <span className="text-[11px] font-mono text-white bg-[#121214] px-2 py-0.5 rounded">
              Platform Admin Operations
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">
            Marketur Governance & Escrow Ops
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Manual dispute resolution, escrow disbursements, verified creator auditing, and compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
          <span>System Health: Nominal • Escrow Active</span>
        </div>
      </div>

      {/* ADMIN STATS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Merchandise Value (GMV)"
          value={`₹${totalGMV.toLocaleString('en-IN')}`}
          subtext="Total transaction volume"
          badge="ESCROW"
        />
        <StatCard
          label="Platform Commission (5%)"
          value={`₹${platformRevenue.toLocaleString('en-IN')}`}
          subtext="Net platform revenue"
          trend="+5.0% take"
        />
        <StatCard
          label="Active Collaborations"
          value={activeOrdersCount}
          subtext={`${completedOrdersCount} completed historically`}
        />
        <StatCard
          label="Pending Disputes"
          value={disputedOrders.length}
          subtext={disputedOrders.length > 0 ? 'Requires immediate mediation' : 'All clear'}
          badge={disputedOrders.length > 0 ? 'ATTENTION' : 'CLEAR'}
        />
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'overview', label: 'Operations Overview' },
          { key: 'disputes', label: `Disputes Queue (${disputedOrders.length})` },
          { key: 'orders', label: `All Orders (${orders.length})` },
          { key: 'creators', label: `Creators Directory (${creators.length})` },
          { key: 'audit', label: `Audit Actions (${adminActions.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white font-bold'
                : 'text-[#71717A] hover:text-[#121214] hover:bg-[#F4F4F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DISPUTES QUEUE TAB */}
      {(activeTab === 'overview' || activeTab === 'disputes') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-3">
            <div>
              <span className="editorial-label text-[#B91C1C]">Escrow Mediation</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">
                Disputed Deliverables Requiring Admin Resolution
              </h3>
            </div>
            <span className="text-xs font-mono text-[#71717A]">
              {disputedOrders.length} pending mediation
            </span>
          </div>

          {disputedOrders.length === 0 ? (
            <div className="bg-white border border-dashed border-[#E5E5DE] rounded-lg p-8 text-center text-xs text-[#71717A] font-mono">
              Zero active disputes. All current orders are running smoothly.
            </div>
          ) : (
            <div className="space-y-4">
              {disputedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border-2 border-[#B91C1C]/40 rounded-xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-base text-[#121214]">{ord.order_number}</strong>
                        <span className="text-xs font-mono bg-[#FEF2F2] text-[#B91C1C] px-2 py-0.5 rounded border border-[#FECACA]">
                          Reason: {ord.dispute?.reason || 'Deliverable conflict'}
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A] font-mono mt-1">
                        Brand: {ord.business?.business_name} vs. Creator: {ord.creator?.profile?.display_name}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-bold text-[#121214] block">
                        ₹{ord.total_amount.toLocaleString('en-IN')} Held
                      </span>
                      <span className="text-[10px] text-[#B91C1C]">Escrow payout frozen</span>
                    </div>
                  </div>

                  {/* Dispute Details */}
                  <div className="bg-[#FEF2F2]/40 border border-[#FECACA] rounded-lg p-4 text-xs space-y-2 text-[#7F1D1D]">
                    <div className="font-semibold">Brand Claim:</div>
                    <p className="leading-relaxed">{ord.dispute?.description}</p>
                    {ord.dispute?.evidence_url && (
                      <div className="pt-2">
                        <a
                          href={ord.dispute.evidence_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[#FF5416] underline"
                        >
                          <span>Review Dispute Evidence</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Deliverable info */}
                  <div className="text-xs font-mono text-[#52525B] bg-[#FBFBFA] p-3 rounded border border-[#E5E5DE]">
                    <span>Brief Objective: </span>
                    <strong className="text-[#121214]">{ord.brief?.objective}</strong>
                  </div>

                  {/* Resolution Controls */}
                  <div className="pt-3 border-t border-[#ECECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm">
                        Inspect Order Workspace & Chat
                      </Button>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolve(ord.id, 'refund_business')}
                        className="text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                      >
                        Refund Business (₹{ord.total_amount.toLocaleString('en-IN')})
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolve(ord.id, 'release_payment')}
                        className="bg-[#047857] hover:bg-[#065F46]"
                      >
                        Release Payout to Creator (₹{ord.subtotal.toLocaleString('en-IN')})
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALL ORDERS TABLE TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#71717A]">Ledger</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              All Collaboration Transactions
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#ECECE6] text-[#71717A] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Creator</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Order Status</th>
                  <th className="py-2.5 px-3">Payout Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECE6]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FBFBFA]">
                    <td className="py-3 px-3 font-bold text-[#121214]">{ord.order_number}</td>
                    <td className="py-3 px-3 text-[#52525B]">{ord.business?.business_name}</td>
                    <td className="py-3 px-3 text-[#121214]">{ord.creator?.profile?.display_name}</td>
                    <td className="py-3 px-3 font-bold text-[#121214]">
                      ₹{ord.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.order_status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.payout_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {ord.payout_status === 'UNRELEASED' && ord.order_status !== 'DISPUTED' && (
                          <button
                            onClick={() => adminReleasePayout(ord.id)}
                            className="px-2 py-1 bg-[#F4F4F0] hover:bg-[#ECECE6] rounded text-[10px] text-[#047857] font-semibold"
                          >
                            Release Payout
                          </button>
                        )}
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATORS DIRECTORY TAB */}
      {activeTab === 'creators' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#71717A]">Verification Governance</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              Creator Metrics & Verification Status
            </h3>
          </div>

          <div className="divide-y divide-[#ECECE6]">
            {creators.map((c) => (
              <div key={c.user_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-sm text-[#121214]">{c.profile?.display_name}</strong>
                    <span className="text-xs font-mono text-[#71717A]">({c.profile?.city})</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        c.verification_status === 'verified'
                          ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                      }`}
                    >
                      {c.verification_status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#52525B] mt-1">
                    {c.niche} • {c.follower_count.toLocaleString('en-IN')} Followers • {c.engagement_rate}% Engagement
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/creators/${c.user_id}`}>
                    <Button variant="outline" size="sm">
                      Profile
                    </Button>
                  </Link>

                  {c.verification_status === 'verified' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => adminToggleCreatorStatus(c.user_id, false)}
                      className="text-[#B91C1C]"
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => adminToggleCreatorStatus(c.user_id, true)}
                    >
                      Approve Metrics
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#FF5416]">Audit Trail</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              Platform Admin Actions (admin_actions)
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {adminActions.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-[#FBFBFA] border border-[#ECECE6] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF5416] font-bold">{act.action}</span>
                    <span className="text-[#71717A]">• Target: {act.target_type} ({act.target_id.slice(0, 10)})</span>
                  </div>
                  {act.metadata && (
                    <p className="text-[#71717A] text-[11px] mt-1 truncate max-w-lg">
                      {JSON.stringify(act.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[#A1A1AA] shrink-0">
                  {new Date(act.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
