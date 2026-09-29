'use client';

import React, { useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { PackageCard } from '@/components/marketplace/PackageCard';
import { ReelCard } from '@/components/marketplace/ReelCard';
import { SampleGallery } from '@/components/marketplace/SampleGallery';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Calendar,
  Sparkles,
  Film,
  ArrowRight,
} from 'lucide-react';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCreator } = useMarketplace();
  const packagesRef = useRef<HTMLDivElement>(null);

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

  const startingPrice =
    creator.starting_price ||
    (creator.packages && creator.packages.length > 0
      ? Math.min(...creator.packages.map((p) => p.price))
      : 2500);

  const scrollToPackages = () => {
    if (packagesRef.current) {
      packagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const reels = creator.reels || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] hover:text-[#121214] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Creators</span>
        </Link>
      </div>

      {/* 1. CREATOR IDENTITY */}
      <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {creator.profile?.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt={creator.profile.display_name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#E5E5DE] shrink-0"
              />
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#F4F4F0] flex items-center justify-center font-mono font-bold text-2xl text-[#121214] border-2 border-[#E5E5DE] shrink-0">
                {(creator.profile?.display_name || 'C')[0]}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
                <span className="text-[#D4D4D0]">•</span>
                <span className="flex items-center gap-1 text-xs font-mono text-[#71717A]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5416]" />
                  {creator.profile?.city || 'India'}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                  <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                  <span>Verified</span>
                </div>
              </div>

              <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#121214] tracking-tight">
                {creator.profile?.display_name}
              </h1>

              <div className="flex items-center gap-4 text-xs font-mono text-[#71717A] pt-1">
                <span>
                  <strong className="text-[#121214] font-semibold">{formatNumber(creator.follower_count)}</strong> Followers
                </span>
                <span>•</span>
                <span>
                  <strong className="text-[#121214] font-semibold">{creator.engagement_rate}%</strong> Engagement
                </span>
                <span>•</span>
                <span>
                  From <strong className="text-[#121214] font-semibold">₹{startingPrice.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="w-full md:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={scrollToPackages}
              className="w-full md:w-auto px-6"
            >
              <span>Choose a Package</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Bio */}
        <div className="pt-2 border-t border-[#ECECE6]">
          <p className="text-sm text-[#3F3F46] max-w-3xl leading-relaxed">
            {creator.bio}
          </p>
        </div>
      </div>

      {/* 2. PORTFOLIO / WORK (PROMINENT VERTICAL REELS) */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#ECECE6] pb-3">
          <div>
            <span className="editorial-label text-[#FF5416]">Portfolio</span>
            <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">
              Work & Video Samples
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              Watch real promotional and creative reels to see production quality and storytelling style.
            </p>
          </div>

          <span className="text-xs font-mono text-[#71717A]">
            {reels.length} video {reels.length === 1 ? 'sample' : 'samples'} available
          </span>
        </div>

        {reels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reels.map((reel) => (
              <div key={reel.id} className="w-full max-w-[320px] mx-auto sm:max-w-none">
                <ReelCard reel={reel} showCreatorInfo={false} />
              </div>
            ))}
          </div>
        ) : creator.samples && creator.samples.length > 0 ? (
          <SampleGallery samples={creator.samples} />
        ) : (
          <div className="p-8 text-center bg-[#FBFBFA] border border-dashed border-[#E5E5DE] rounded-xl text-xs font-mono text-[#71717A]">
            Portfolio videos are being updated by the creator.
          </div>
        )}
      </section>

      {/* 3. AUDIENCE OVERVIEW */}
      <section className="space-y-4">
        <div className="border-b border-[#ECECE6] pb-3">
          <span className="editorial-label text-[#FF5416]">Audience</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">
            Audience Demographics
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Verified follower distribution and estimated reach metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Locations */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-[#121214]">Top Locations</h3>
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

          {/* Age Distribution */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-[#121214]">Age Distribution</h3>
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

          {/* Performance Averages */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-[#121214]">Performance Averages</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg">
                <span className="text-xs text-[#71717A]">Average Reach</span>
                <span className="font-mono font-bold text-sm text-[#121214]">
                  {formatNumber(creator.average_reach)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg">
                <span className="text-xs text-[#71717A]">Est. Reel Views</span>
                <span className="font-mono font-bold text-sm text-[#121214]">
                  {formatNumber(Math.round(creator.average_reach * 1.35))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg">
                <span className="text-xs text-[#71717A]">Gender Ratio</span>
                <span className="font-mono font-bold text-sm text-[#121214]">
                  {creator.audience_gender.female}% F / {creator.audience_gender.male}% M
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PACKAGES & COLLABORATION REQUEST */}
      <section ref={packagesRef} className="space-y-6 pt-4">
        <div className="border-b border-[#ECECE6] pb-3">
          <span className="editorial-label text-[#FF5416]">Collaboration Packages</span>
          <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">
            Choose a Package
          </h2>
          <p className="text-xs text-[#71717A] mt-0.5">
            Select a package to start your collaboration brief with clear scope and protected workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creator.packages?.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} creatorId={creator.user_id} />
          ))}
        </div>
      </section>
    </div>
  );
}
