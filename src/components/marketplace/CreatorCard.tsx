'use client';

import React from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/types/marketplace';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CheckCircle2, ArrowRight, Play, Film, Sparkles } from 'lucide-react';

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
      : 2999);

  const primaryCity = creator.profile?.city || 'India';
  const featuredReel = creator.reels && creator.reels.length > 0 ? creator.reels[0] : null;
  const sampleImages = creator.samples && creator.samples.length > 0 ? creator.samples.slice(0, 2) : [];

  return (
    <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-5 flex flex-col justify-between hover:border-[#FF5416]/40 dark:hover:border-[#FF5416]/50 hover:shadow-lg dark:hover:shadow-black/50 transition-all duration-200 group relative">
      <div>
        {/* Creator Header with Avatar */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            {creator.profile?.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt={creator.profile.display_name}
                className="w-12 h-12 rounded-full object-cover border border-[#E5E5DE] dark:border-[#27272A] shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#F4F4F0] dark:bg-[#27272A] flex items-center justify-center font-mono font-bold text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] shrink-0">
                {(creator.profile?.display_name || 'I')[0]}
              </div>
            )}
            <div>
              <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
              <h3 className="font-mono text-base sm:text-lg font-bold text-[#121214] dark:text-white leading-tight group-hover:text-[#FF5416] transition-colors">
                {creator.profile?.display_name || 'Influencer'}
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">{primaryCity}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-[#065F46]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Platform</span>
          </div>
        </div>

        {/* WORK SAMPLE PREVIEW (Prominent Reels / Videos) */}
        <div className="mb-4">
          <Link href={`/creators/${creator.user_id}`} className="block relative group/preview">
            {featuredReel ? (
              <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#18181B] border border-[#27272A]">
                <ReelVideo
                  src={featuredReel.video_url}
                  poster={featuredReel.thumbnail_url}
                  title={featuredReel.title}
                  autoPlay={true}
                  loop={true}
                  muted={true}
                  interactive={false}
                  className="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white/90 drop-shadow z-10 pointer-events-none">
                  <span className="truncate max-w-[170px] font-semibold">{featuredReel.title}</span>
                  <span className="text-[10px] bg-black/80 backdrop-blur-xs px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10">
                    <Film className="w-2.5 h-2.5 text-[#FF5416]" />
                    <span>Sample</span>
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
              <div className="aspect-[16/9] w-full rounded-lg bg-[#F4F4F0] dark:bg-[#1C1C1F] border border-dashed border-[#E5E5DE] dark:border-[#27272A] flex items-center justify-center text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                Portfolio Available
              </div>
            )}
          </Link>
        </div>

        {/* Bio snippet */}
        <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] line-clamp-2 mb-3 leading-relaxed">
          {creator.bio}
        </p>

        {/* Metrics Row: Followers, Reach, Engagement */}
        <div className="flex items-center justify-between py-2 border-y border-[#ECECE6] dark:border-[#27272A] text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] mb-4">
          <div>
            <span className="font-bold text-[#121214] dark:text-white">{formatFollowers(creator.follower_count)}</span>
            <span className="text-[10px] ml-1 uppercase">Followers</span>
          </div>
          <div className="text-center">
            <span className="font-bold text-[#121214] dark:text-white">{(creator.average_reach / 1000).toFixed(0)}K</span>
            <span className="text-[10px] ml-1 uppercase">Reach</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#FF5416]">{creator.engagement_rate}%</span>
            <span className="text-[10px] ml-1 uppercase">Eng.</span>
          </div>
        </div>
      </div>

      {/* Card Footer: Starting Price & View CTA */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#71717A] dark:text-[#A1A1AA] block">Packages from</span>
          <span className="font-mono font-bold text-lg text-[#121214] dark:text-white">
            ₹{startingPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          href={`/creators/${creator.user_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#121214] dark:bg-white dark:text-[#121214] hover:bg-[#FF5416] dark:hover:bg-[#FF5416] dark:hover:text-white px-3.5 py-2 rounded-lg transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
