'use client';

import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { PackageCard } from '@/components/marketplace/PackageCard';
import { ReelCard } from '@/components/marketplace/ReelCard';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Calendar,
  Sparkles,
  Film,
  ArrowRight,
  Package,
  Users,
  Info,
} from 'lucide-react';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCreator } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'work' | 'packages' | 'audience' | 'about'>('work');

  const creatorId = params.id as string;
  const creator = getCreator(creatorId);

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Influencer Not Found</h2>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
          The influencer profile you are looking for does not exist or has been removed.
        </p>
        <Link href="/discover">
          <Button variant="primary" size="sm">
            <span>Back to Discovery</span>
          </Button>
        </Link>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('en-IN');
  };

  const startingPrice =
    creator.starting_price ||
    (creator.packages && creator.packages.length > 0
      ? Math.min(...creator.packages.map((p) => p.price))
      : 2999);

  const reels = creator.reels || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Influencer Directory</span>
        </Link>
      </div>

      {/* TOP SECTION: IDENTITY & METRICS */}
      <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {creator.profile?.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt={creator.profile.display_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E5E5DE] dark:border-[#27272A] shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#F4F4F0] dark:bg-[#18181B] flex items-center justify-center font-mono font-bold text-2xl text-[#121214] dark:text-white border-2 border-[#E5E5DE] dark:border-[#27272A] shrink-0">
                {(creator.profile?.display_name || 'I')[0]}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
                <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
                <span className="flex items-center gap-1 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5416]" />
                  {creator.profile?.city || 'India'}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-[#065F46]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Platform Metrics</span>
                </div>
              </div>

              <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
                {creator.profile?.display_name}
              </h1>

              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] max-w-xl line-clamp-2 pt-0.5">
                {creator.bio}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setActiveTab('packages')}
              className="w-full sm:w-auto px-6"
            >
              <span>Choose a Package</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* 4 CORE METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              {formatNumber(creator.follower_count)}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Followers</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              {formatNumber(creator.average_reach)}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Average Reach</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#FF5416]">
              {creator.engagement_rate}%
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Engagement</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              ₹{startingPrice.toLocaleString('en-IN')}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Starting From</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-[#27272A] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'work', label: `Work & Reels (${reels.length})`, icon: Film },
          { key: 'packages', label: `Packages (${creator.packages?.length || 0})`, icon: Package },
          { key: 'audience', label: 'Audience Demographics', icon: Users },
          { key: 'about', label: 'About & Details', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-bold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORK (RESPONSIVE REELS GRID) */}
      {activeTab === 'work' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <div>
              <span className="editorial-label text-[#FF5416]">Content Samples</span>
              <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
                Work & Video Reels
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Watch previous promotional videos, app walkthroughs, and sample reels.
              </p>
            </div>
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              {reels.length} video{reels.length === 1 ? '' : 's'} available
            </span>
          </div>

          {reels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {reels.map((reel) => (
                <div key={reel.id} className="w-full max-w-[300px] mx-auto sm:max-w-none">
                  <ReelCard reel={reel} showCreatorInfo={false} />
                  {reel.description && (
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2 font-mono line-clamp-2">
                      {reel.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#121214] border border-dashed border-[#E5E5DE] dark:border-[#27272A] rounded-2xl text-xs font-mono text-[#71717A]">
              No reels uploaded yet for this influencer.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Promotion Offerings</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              Available Collaboration Packages
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Standard deliverables with clear scope, timeline, and pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creator.packages?.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} creatorId={creator.user_id} />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIENCE DEMOGRAPHICS */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Audience Insights</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              Follower Distribution & Locations
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Audience demographics to verify reach alignment for your app.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Locations */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Top Cities</h3>
              <div className="space-y-3">
                {creator.audience_locations.map((loc) => (
                  <div key={loc.city} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#121214] dark:text-white font-medium">{loc.city}</span>
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">{loc.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#F4F4F0] dark:bg-[#27272A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FF5416] h-full rounded-full"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Age Distribution</h3>
              <div className="space-y-3">
                {Object.entries(creator.audience_age).map(([range, pct]) => (
                  <div key={range} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#121214] dark:text-white font-medium">{range} years</span>
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#F4F4F0] dark:bg-[#27272A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#121214] dark:bg-white h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Reach Intelligence</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Average Reach</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {formatNumber(creator.average_reach)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Estimated Views</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {formatNumber(Math.round(creator.average_reach * 1.35))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Gender Split</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {creator.audience_gender.female}% F / {creator.audience_gender.male}% M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ABOUT */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Profile Summary</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              About {creator.profile?.display_name}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed">
              {creator.bio}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-mono">
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                <span className="text-[#71717A] dark:text-[#A1A1AA] block">Primary Niche:</span>
                <strong className="text-[#121214] dark:text-white text-sm">{creator.niche}</strong>
              </div>
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                <span className="text-[#71717A] dark:text-[#A1A1AA] block">Base City:</span>
                <strong className="text-[#121214] dark:text-white text-sm">{creator.profile?.city || 'India'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
