'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
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
  Bookmark,
  Smartphone,
  Sparkles,
} from 'lucide-react';

type TabKey = 'overview' | 'find' | 'saved' | 'orders' | 'messages' | 'profile';

interface DbBusinessState {
  user_id: string;
  company_name?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  app_name?: string | null;
  app_url?: string | null;
  website?: string | null;
  website_url?: string | null;
  industry?: string | null;
  city?: string | null;
  budget_range?: string | null;
  description?: string | null;
  logo_path?: string | null;
  created_at?: string | null;
}

export default function BusinessDashboardPage() {
  const { orders, businesses, creators, currentUser } = useMarketplace();
  const [dbBusiness, setDbBusiness] = useState<DbBusinessState | null>(null);

  useEffect(() => {
    async function loadDbBusiness() {
      if (!isSupabaseConfigured) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: bp } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (bp) {
          setDbBusiness(bp);
        }
      } catch (err) {
        console.error('Error loading business profile:', err);
      }
    }
    loadDbBusiness();
  }, []);

  const fallbackBusiness = businesses.find((b) => b.user_id === currentUser?.id) || businesses[0] || {
    id: 'b1',
    user_id: 'biz_01',
    business_name: 'DevPulse Mobile',
    business_type: 'app',
    industry: 'Technology & SaaS',
    city: 'Bengaluru',
    website: 'https://devpulse.app',
    app_url: 'https://play.google.com/store/apps/details?id=app.devpulse',
    budget_range: '₹25,000 - ₹50,000',
    description: 'DevPulse is a developer productivity app that tracks coding focus metrics and GitHub PR reviews.',
  };

  const currentBusiness = dbBusiness
    ? {
        ...fallbackBusiness,
        user_id: dbBusiness.user_id,
        business_name: dbBusiness.business_name || fallbackBusiness.business_name,
        business_type: dbBusiness.business_type || fallbackBusiness.business_type,
        industry: dbBusiness.industry || fallbackBusiness.industry,
        city: dbBusiness.city || fallbackBusiness.city,
        website: dbBusiness.website || fallbackBusiness.website,
        app_url: dbBusiness.app_url || fallbackBusiness.app_url,
        budget_range: dbBusiness.budget_range || fallbackBusiness.budget_range,
        description: dbBusiness.description || fallbackBusiness.description,
        logo_url: dbBusiness.logo_path || fallbackBusiness.logo_url,
      }
    : fallbackBusiness;

  const [activeTab, setActiveTab] = useState<'overview' | 'find' | 'saved' | 'orders' | 'messages' | 'profile'>('overview');
  const [savedCreatorIds, setSavedCreatorIds] = useState<string[]>([creators[0]?.user_id || 'c1']);

  const businessOrders = orders.filter(
    (o) => o.business_id === currentBusiness.user_id || o.business?.user_id === currentBusiness.user_id
  );

  const activeOrders = businessOrders.filter(
    (o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED'
  );

  const totalCommitted = businessOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const toggleSaveCreator = (id: string) => {
    if (savedCreatorIds.includes(id)) {
      setSavedCreatorIds(savedCreatorIds.filter((cid) => cid !== id));
    } else {
      setSavedCreatorIds([...savedCreatorIds, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Advertiser Workspace</span>
            <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800">
              Verified Brand
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] dark:text-white mt-1">
            {currentBusiness.business_name}
          </h1>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            {currentBusiness.industry} • {currentBusiness.city || 'India'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/discover">
            <Button variant="primary" size="sm">
              <Search className="w-3.5 h-3.5 mr-1" />
              <span>Find Influencers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-zinc-800 pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'find', label: 'Find Influencers' },
          { key: 'saved', label: `Saved Influencers (${savedCreatorIds.length})` },
          { key: 'orders', label: `My Orders (${businessOrders.length})` },
          { key: 'messages', label: 'Messages' },
          { key: 'profile', label: 'Business Profile' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-3 py-1.5 rounded transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white dark:bg-[#FF5416] dark:text-white font-bold'
                : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Promotions"
              value={activeOrders.length}
              subtext="Reels in production / review"
              badge="ACTIVE"
            />
            <StatCard
              label="Total Committed Budget"
              value={`₹${totalCommitted.toLocaleString('en-IN')}`}
              subtext="Platform collaboration protection"
            />
            <StatCard
              label="Pending Deliveries"
              value={businessOrders.filter((o) => o.order_status === 'DELIVERED').length}
              subtext="Drafts awaiting your review"
            />
            <StatCard
              label="Completed Campaigns"
              value={businessOrders.filter((o) => o.order_status === 'COMPLETED').length}
              subtext="Successfully published"
            />
          </div>

          {/* Quick Actions & Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
                <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Active Influencer Campaigns</h3>
                <Link href="/discover" className="text-xs font-mono text-[#FF5416] hover:underline">
                  + Find more creators
                </Link>
              </div>

              {activeOrders.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-xs font-mono text-[#71717A] dark:text-zinc-400">
                  No active orders at the moment. Browse influencers to launch your next campaign.
                </div>
              ) : (
                <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
                  {activeOrders.map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#121214] dark:text-white">{ord.order_number}</span>
                          <StatusBadge status={ord.order_status} size="sm" />
                        </div>
                        <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                          {ord.creator?.profile?.display_name} • {ord.package?.name}
                        </p>
                      </div>

                      <Link href={`/orders/${ord.id}`}>
                        <Button variant="outline" size="sm">
                          <span>View Details</span>
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
              <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Quick Discovery</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">
                Explore popular Indian niches with high app-install conversions:
              </p>
              <div className="flex flex-wrap gap-2">
                {['Technology', 'Gaming', 'AI & Tools', 'Finance', 'Education', 'Productivity'].map((cat) => (
                  <Link key={cat} href={`/discover?niche=${encodeURIComponent(cat)}`}>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#F4F4F0] dark:bg-zinc-800 text-[#121214] dark:text-zinc-200 hover:bg-[#FF5416] hover:text-white transition-colors cursor-pointer inline-block">
                      {cat}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FIND INFLUENCERS */}
      {activeTab === 'find' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Creator Discovery</span>
                <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                  Find the right creators for your app
                </h2>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                  Filter by niche, verified audience reach, and starting package pricing.
                </p>
              </div>

              <Link href="/discover">
                <Button variant="outline" size="sm">
                  <span>Open Full Discovery Page</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SAVED INFLUENCERS */}
      {activeTab === 'saved' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Bookmarked Creators</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
              Shortlisted Influencers
            </h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Creators you have bookmarked for upcoming app launches and promotional cycles.
            </p>
          </div>

          {creators.filter((c) => savedCreatorIds.includes(c.user_id)).length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No saved influencers yet. Browse creators and click bookmark to save them here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators
                .filter((c) => savedCreatorIds.includes(c.user_id))
                .map((creator) => (
                  <CreatorCard key={creator.user_id} creator={creator} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div>
              <span className="editorial-label text-[#71717A] dark:text-zinc-400">Campaign Tracking</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
                Promotion Orders
              </h3>
            </div>

            <Link href="/discover" className="text-xs font-mono text-[#FF5416] hover:underline">
              + Find more influencers
            </Link>
          </div>

          {businessOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No collaboration orders yet. Start by finding an influencer.
            </div>
          ) : (
            <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
              {businessOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/60 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <strong className="font-mono text-[#121214] dark:text-white text-base">
                        {ord.order_number}
                      </strong>
                      <StatusBadge status={ord.order_status} size="sm" />
                    </div>
                    <div className="text-xs text-[#52525B] dark:text-zinc-400 font-mono">
                      <span>Influencer: <strong>{ord.creator?.profile?.display_name}</strong></span>
                      <span className="mx-2">•</span>
                      <span>Package: {ord.package?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-[#121214] dark:text-white block">
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

      {/* TAB: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Communications</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Order Discussions
            </h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Messages are organized around active campaign orders so revision notes and app briefs are never lost.
            </p>
          </div>

          <div className="space-y-3">
            {businessOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
                No active discussions yet. Book an influencer to start a campaign conversation.
              </div>
            ) : (
              businessOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center text-[#121214] dark:text-white">
                      <MessageSquare className="w-4 h-4 text-[#FF5416]" />
                    </div>
                    <div>
                      <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                        {ord.creator?.profile?.display_name}
                      </h4>
                      <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
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
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB: BUSINESS PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4 flex items-center justify-between">
            <div>
              <span className="editorial-label text-[#FF5416]">App / Business Identity</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Profile Details</h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Influencers see this information when receiving your promotion requests.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Verified Advertiser</span>
            </div>
          </div>

          <div className="flex items-center gap-5 pt-2">
            <div className="w-16 h-16 rounded-xl bg-[#121214] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-xl border border-[#E5E5DE] dark:border-zinc-700">
              {currentBusiness.business_name.charAt(0)}
            </div>

            <div>
              <h4 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                {currentBusiness.business_name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#71717A] dark:text-zinc-400 mt-0.5">
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
            <span className="text-xs font-semibold text-[#121214] dark:text-white block">Description & Campaign Goals</span>
            <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-4">
              {currentBusiness.description || 'App developer seeking tech, gaming, and lifestyle creators to drive downloads across India.'}
            </p>
          </div>

          <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
            <span className="text-xs font-semibold text-[#121214] dark:text-white block mb-2">Campaign Budget</span>
            <div className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
              {currentBusiness.budget_range || '₹25,000 - ₹50,000 per month'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
