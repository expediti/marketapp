'use client';

import React from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ArrowRight, PlusCircle, Building, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function BusinessDashboardPage() {
  const { orders, businesses, activeRole } = useMarketplace();
  const currentBusiness = businesses[0]; // Kashi Craft Coffee

  const businessOrders = orders.filter(
    (o) => o.business_id === currentBusiness.user_id || o.business?.user_id === currentBusiness.user_id
  );

  const fundedOrders = businessOrders.filter(
    (o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED'
  );
  const totalEscrowFunded = businessOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Brand Workspace</span>
            <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              Verified Business
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">
            {currentBusiness.business_name}
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            {currentBusiness.industry} • {currentBusiness.city}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/discover">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book New Creator</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Escrow Committed"
          value={`₹${totalEscrowFunded.toLocaleString('en-IN')}`}
          subtext="Active & completed campaigns"
        />
        <StatCard
          label="Active Campaigns"
          value={fundedOrders.length}
          subtext="In production / review"
          badge="IN ESCROW"
        />
        <StatCard
          label="Pending Approvals"
          value={businessOrders.filter((o) => o.order_status === 'DELIVERED').length}
          subtext="Deliveries ready for signoff"
        />
        <StatCard
          label="Completed Campaigns"
          value={businessOrders.filter((o) => o.order_status === 'COMPLETED').length}
          subtext="Content published"
        />
      </div>

      {/* ORDERS LIST */}
      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
          <div>
            <span className="editorial-label text-[#71717A]">Campaign Management</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] mt-0.5">
              Creator Collaboration Orders
            </h3>
          </div>

          <Link href="/discover" className="text-xs font-mono text-[#FF5416] hover:underline">
            + Discover more creators
          </Link>
        </div>

        <div className="divide-y divide-[#ECECE6]">
          {businessOrders.map((ord) => (
            <div
              key={ord.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBFBFA] px-2 rounded-lg transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <strong className="font-mono text-[#121214] text-base">{ord.order_number}</strong>
                  <StatusBadge status={ord.order_status} size="sm" />
                </div>
                <div className="text-xs text-[#52525B] font-mono">
                  <span>Creator: <strong>{ord.creator?.profile?.display_name}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Deliverable: {ord.package?.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-[#121214] block">
                    ₹{ord.total_amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#047857]">Escrow Funded</span>
                </div>

                <Link href={`/orders/${ord.id}`}>
                  <Button variant="outline" size="sm">
                    <span>Manage Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
