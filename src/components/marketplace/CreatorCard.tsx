'use client';

import React from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/types/marketplace';
import { CheckCircle2, ArrowRight, Play, Film } from 'lucide-react';

interface CreatorCardProps {
  creator: CreatorProfile;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const formatFollowers = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const startingPrice =
    creator.starting_price ||
    (creator.packages && creator.packages.length > 0
      ? Math.min(...creator.packages.map((p) => p.price))
      : 2500);

  const primaryCity = creator.profile?.city || 'India';
  const featuredReel = creator.reels && creator.reels.length > 0 ? creator.reels[0] : null;
  const sampleImages = creator.samples && creator.samples.length > 0 ? creator.samples.slice(0, 2) : [];

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-xl p-5 flex flex-col justify-between hover:border-[#121214]/40 hover:shadow-md transition-all duration-200 group relative">
      <div>
        {/* Creator Header with Avatar */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {creator.profile?.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt={creator.profile.display_name}
                className="w-12 h-12 rounded-full object-cover border border-[#E5E5DE] shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#F4F4F0] flex items-center justify-center font-mono font-bold text-[#121214] border border-[#E5E5DE] shrink-0">
                {(creator.profile?.display_name || 'C')[0]}
              </div>
            )}
            <div>
              <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] leading-tight group-hover:text-[#FF5416] transition-colors">
                {creator.profile?.display_name || 'Creator'}
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">{primaryCity}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
            <CheckCircle2 className="w-3 h-3 text-[#047857]" />
            <span>Verified</span>
          </div>
        </div>

        {/* WORK SAMPLE PREVIEW (Prominent) */}
        <div className="mb-4">
          <Link href={`/creators/${creator.user_id}`} className="block relative group/preview">
            {featuredReel ? (
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#18181B] border border-[#27272A]">
                {featuredReel.thumbnail_url && (
                  <img
                    src={featuredReel.thumbnail_url}
                    alt={featuredReel.title}
                    className="w-full h-full object-cover opacity-80 group-hover/preview:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-[#121214] flex items-center justify-center shadow group-hover/preview:scale-110 transition-transform">
                    <Play className="w-4 h-4 ml-0.5 fill-[#121214]" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white/90 drop-shadow">
                  <span className="truncate max-w-[180px] font-semibold">{featuredReel.title}</span>
                  <span className="text-[10px] bg-black/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Film className="w-2.5 h-2.5" />
                    <span>Watch Reel</span>
                  </span>
                </div>
              </div>
            ) : sampleImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 aspect-[16/9] w-full rounded-lg overflow-hidden">
                {sampleImages.map((s, idx) => (
                  <div key={idx} className="relative h-full bg-[#18181B]">
                    <img
                      src={s.image_url}
                      alt={s.title || 'Work sample'}
                      className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[16/9] w-full rounded-lg bg-[#F4F4F0] border border-dashed border-[#E5E5DE] flex items-center justify-center text-xs font-mono text-[#71717A]">
                Portfolio Available
              </div>
            )}
          </Link>
        </div>

        {/* Bio snippet */}
        <p className="text-xs text-[#52525B] line-clamp-2 mb-3 leading-relaxed">
          {creator.bio}
        </p>

        {/* Secondary Audience Metrics */}
        <div className="flex items-center justify-between py-2 border-y border-[#ECECE6] text-xs font-mono text-[#71717A] mb-4">
          <div>
            <span className="font-bold text-[#121214]">{formatFollowers(creator.follower_count)}</span>
            <span className="text-[10px] ml-1 uppercase">Followers</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-[#121214]">{creator.engagement_rate}%</span>
            <span className="text-[10px] ml-1 uppercase">Eng.</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#121214]">{creator.local_reach_percentage || 35}%</span>
            <span className="text-[10px] ml-1 uppercase">in {primaryCity}</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Starting Price & View CTA */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#71717A] block">Packages from</span>
          <span className="font-mono font-bold text-lg text-[#121214]">
            ₹{startingPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          href={`/creators/${creator.user_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#121214] hover:bg-[#FF5416] px-3.5 py-2 rounded-lg transition-colors"
        >
          <span>View Work</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
