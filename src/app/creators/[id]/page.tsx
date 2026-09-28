'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { PackageCard } from '@/components/marketplace/PackageCard';
import { SampleGallery } from '@/components/marketplace/SampleGallery';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  MapPin,
  Users,
  Eye,
  TrendingUp,
  ArrowLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCreator } = useMarketplace();

  const creatorId = params.id as string;
  const creator = getCreator(creatorId);

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-mono text-2xl font-bold text-[#121214]">Creator Not Found</h2>
        <p className="text-sm text-[#71717A]">
          The creator profile you are looking for does not exist or has been removed.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] hover:text-[#121214] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creator Directory</span>
        </Link>
      </div>

      {/* CREATOR PROFILE HEADER */}
      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
              <span className="text-[#D4D4D0]">•</span>
              <span className="flex items-center gap-1 text-xs font-mono text-[#71717A]">
                <MapPin className="w-3.5 h-3.5 text-[#FF5416]" />
                {creator.profile?.city}
              </span>
            </div>

            <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
              {creator.profile?.display_name}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#047857] bg-[#ECFDF5] px-3 py-1.5 rounded-md border border-[#A7F3D0]">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>Verified metrics ✓</span>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-[#3F3F46] max-w-3xl leading-relaxed">
          {creator.bio}
        </p>

        {/* Highlight Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214]">
              {formatNumber(creator.follower_count)}
            </div>
            <div className="editorial-label text-[#71717A] mt-1">Verified Followers</div>
          </div>

          <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#FF5416]">
              {creator.engagement_rate}%
            </div>
            <div className="editorial-label text-[#71717A] mt-1">Engagement Rate</div>
          </div>

          <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214]">
              {creator.audience_gender.female}%
            </div>
            <div className="editorial-label text-[#71717A] mt-1">Female Audience</div>
          </div>

          <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214]">
              {creator.audience_age['18-24']}%
            </div>
            <div className="editorial-label text-[#71717A] mt-1">Age 18–24 Segment</div>
          </div>
        </div>
      </div>

      {/* AUDIENCE DEMOGRAPHICS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City / Location Breakdown */}
        <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 space-y-4">
          <span className="editorial-label text-[#FF5416]">Audience Breakdown</span>
          <h3 className="font-mono text-base font-bold text-[#121214]">Top Locations</h3>
          <div className="space-y-3">
            {creator.audience_locations.map((loc) => (
              <div key={loc.city} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#121214] font-medium">{loc.city}</span>
                  <span className="text-[#71717A]">{loc.percentage}%</span>
                </div>
                <div className="w-full bg-[#F4F4F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#121214] h-full rounded-full"
                    style={{ width: `${loc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Age Breakdown */}
        <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 space-y-4">
          <span className="editorial-label text-[#FF5416]">Audience Breakdown</span>
          <h3 className="font-mono text-base font-bold text-[#121214]">Age Distribution</h3>
          <div className="space-y-3">
            {Object.entries(creator.audience_age).map(([range, pct]) => (
              <div key={range} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#121214] font-medium">{range} years</span>
                  <span className="text-[#71717A]">{pct}%</span>
                </div>
                <div className="w-full bg-[#F4F4F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF5416] h-full rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reach & Views */}
        <div className="bg-white border border-[#E5E5DE] rounded-lg p-6 space-y-4">
          <span className="editorial-label text-[#FF5416]">Reach Intelligence</span>
          <h3 className="font-mono text-base font-bold text-[#121214]">Performance Averages</h3>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded">
              <span className="text-xs text-[#71717A]">Average Reach</span>
              <span className="font-mono font-bold text-sm text-[#121214]">
                {formatNumber(creator.average_reach)} accounts
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded">
              <span className="text-xs text-[#71717A]">Estimated Reel Views</span>
              <span className="font-mono font-bold text-sm text-[#121214]">
                {formatNumber(Math.round(creator.average_reach * 1.35))} views
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded">
              <span className="text-xs text-[#71717A]">Gender Ratio</span>
              <span className="font-mono font-bold text-sm text-[#121214]">
                {creator.audience_gender.female}% F / {creator.audience_gender.male}% M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SAMPLE WORK SHOWCASE */}
      <div className="space-y-4">
        <div className="border-b border-[#ECECE6] pb-3">
          <span className="editorial-label text-[#FF5416]">Portfolio</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">
            Sample Work & Aesthetic Direction
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Curated internal thumbnails with watermarking. Direct social handles remain private.
          </p>
        </div>

        <SampleGallery samples={creator.samples || []} />
      </div>

      {/* PACKAGES & RATE CARD */}
      <div className="space-y-6 pt-4">
        <div className="border-b border-[#ECECE6] pb-3">
          <span className="editorial-label text-[#FF5416]">Collaboration Rate Card</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">
            Available Collaboration Packages
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Fixed deliverables funded via escrow. Select a package to customize your campaign brief.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creator.packages?.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} creatorId={creator.user_id} />
          ))}
        </div>
      </div>
    </div>
  );
}
