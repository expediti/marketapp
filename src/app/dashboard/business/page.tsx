'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import {
  ArrowRight,
  Search,
  Building,
  CheckCircle2,
  MessageSquare,
  Package,
  Globe,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function BusinessDashboardPage() {
  const { orders, businesses, creators } = useMarketplace();
  const currentBusiness = businesses[0]; // Kashi Craft Coffee

  const [activeTab, setActiveTab] = useState<'find' | 'orders' | 'messages' | 'profile'>('find');

  const businessOrders = orders.filter(
    (o) => o.business_id === currentBusiness.user_id || o.business?.user_id === currentBusiness.user_id
  );

  const activeOrders = businessOrders.filter(
    (o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED'
  );

  const totalCommitted = businessOrders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Business Workspace</span>
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
              <Search className="w-3.5 h-3.5 mr-1" />
              <span>Browse All Creators</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Collaborations"
          value={activeOrders.length}
          subtext="In production / review"
          badge="ACTIVE"
        />
        <StatCard
          label="Total Value Committed"
          value={`₹${totalCommitted.toLocaleString('en-IN')}`}
          subtext="Protected collaborative workflow"
        />
        <StatCard
          label="Pending Approvals"
          value={businessOrders.filter((o) => o.order_status === 'DELIVERED').length}
          subtext="Drafts awaiting your review"
        />
        <StatCard
          label="Completed Campaigns"
          value={businessOrders.filter((o) => o.order_status === 'COMPLETED').length}
          subtext="Successfully published"
        />
      </div>

      {/* 4 PRIMARY TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'find', label: 'Find Creators' },
          { key: 'orders', label: `My Orders (${businessOrders.length})` },
          { key: 'messages', label: 'Messages' },
          { key: 'profile', label: 'Business Profile' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white font-bold'
                : 'text-[#71717A] hover:text-[#121214] hover:bg-[#F4F4F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FIND CREATORS */}
      {activeTab === 'find' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Creator Discovery</span>
                <h2 className="font-mono text-xl font-bold text-[#121214]">What are you looking for?</h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Browse creators, watch their work, and book fixed packages.
                </p>
              </div>

              <Link href="/discover">
                <Button variant="outline" size="sm">
                  <span>Open Full Discovery & Filters</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Quick Creator Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.slice(0, 3).map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
            <div>
              <span className="editorial-label text-[#71717A]">Campaign Tracking</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">
                Collaboration Orders
              </h3>
            </div>

            <Link href="/discover" className="text-xs font-mono text-[#FF5416] hover:underline">
              + Book another creator
            </Link>
          </div>

          {businessOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] rounded-xl text-xs font-mono text-[#71717A]">
              No collaboration orders yet. Start by finding a creator.
            </div>
          ) : (
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
                      <span>Package: {ord.package?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-[#121214] block">
                        ₹{ord.total_amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-[#047857]">Protected</span>
                    </div>

                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm">
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-4">
            <span className="editorial-label text-[#FF5416]">Communications</span>
            <h3 className="font-mono text-lg font-bold text-[#121214]">Order Discussions</h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Conversations are linked directly to your collaboration orders to keep briefs and revisions organized.
            </p>
          </div>

          <div className="space-y-3">
            {businessOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5DE] flex items-center justify-center text-[#121214]">
                    <MessageSquare className="w-4 h-4 text-[#FF5416]" />
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214]">
                      {ord.creator?.profile?.display_name}
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A]">
                      Order #{ord.order_number} • {ord.package?.name}
                    </span>
                  </div>
                </div>

                <Link href={`/orders/${ord.id}`}>
                  <Button variant="outline" size="sm">
                    <span>Open Chat</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-4 flex items-center justify-between">
            <div>
              <span className="editorial-label text-[#FF5416]">Identity</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">Business Profile</h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Creators see this information when receiving your collaboration briefs.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] px-3 py-1 rounded border border-[#A7F3D0]">
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Verified Business</span>
            </div>
          </div>

          <div className="flex items-center gap-5 pt-2">
            <div className="w-16 h-16 rounded-xl bg-[#121214] text-white flex items-center justify-center font-mono font-bold text-xl border border-[#E5E5DE]">
              {currentBusiness.business_name.charAt(0)}
            </div>

            <div>
              <h4 className="font-mono text-xl font-bold text-[#121214]">
                {currentBusiness.business_name}
              </h4>
              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] mt-0.5">
                <span>{currentBusiness.industry}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF5416]" />
                  {currentBusiness.city}
                </span>
                {currentBusiness.website && (
                  <>
                    <span>•</span>
                    <a
                      href={currentBusiness.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF5416] hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{currentBusiness.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-[#121214] block">About the Business</span>
            <p className="text-xs text-[#52525B] leading-relaxed bg-[#FBFBFA] border border-[#E5E5DE] rounded-xl p-4">
              {currentBusiness.description || 'Specialty coffee roastery and cafe based in Varanasi, producing artisan pour-overs and single-origin beans.'}
            </p>
          </div>

          <div className="pt-2 border-t border-[#ECECE6]">
            <span className="text-xs font-semibold text-[#121214] block mb-2">Past Collaborations</span>
            <div className="text-xs font-mono text-[#71717A]">
              {businessOrders.length} total collaboration{businessOrders.length === 1 ? '' : 's'} managed on Marketur.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
