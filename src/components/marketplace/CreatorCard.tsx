import React from 'react';
import Link from 'next/link';
import { CreatorProfile } from '@/types/marketplace';
import { CheckCircle2, ArrowRight } from 'lucide-react';

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
  const localReach = creator.local_reach_percentage || 30;

  return (
    <div className="retro-card bg-white border border-[#E5E5DE] rounded-lg p-5 flex flex-col justify-between hover:border-[#121214]/30 relative overflow-hidden group">
      {/* Top Banner & Verification */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="editorial-label text-[#FF5416] font-semibold">{creator.niche}</span>
            <h3 className="font-mono text-xl font-bold text-[#121214] mt-0.5 tracking-tight group-hover:text-[#FF5416] transition-colors">
              {creator.profile?.display_name || 'Creator'}
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">{primaryCity}</p>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
            <CheckCircle2 className="w-3 h-3 text-[#047857]" />
            <span>Verified metrics</span>
          </div>
        </div>

        {/* Bio snippet */}
        <p className="text-xs text-[#52525B] line-clamp-2 mb-4 leading-relaxed">
          {creator.bio}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#ECECE6] bg-[#FBFBFA] -mx-5 px-5 mb-4 text-center">
          <div>
            <div className="font-mono font-bold text-sm text-[#121214]">
              {formatFollowers(creator.follower_count)}
            </div>
            <div className="text-[10px] uppercase font-mono text-[#71717A]">Followers</div>
          </div>
          <div className="border-x border-[#E5E5DE]">
            <div className="font-mono font-bold text-sm text-[#121214]">
              {creator.engagement_rate}%
            </div>
            <div className="text-[10px] uppercase font-mono text-[#71717A]">Engagement</div>
          </div>
          <div>
            <div className="font-mono font-bold text-sm text-[#121214]">
              {localReach}%
            </div>
            <div className="text-[10px] uppercase font-mono text-[#71717A] truncate">
              In {primaryCity}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Price & Action */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#71717A] block">Starting at</span>
          <span className="font-mono font-bold text-base text-[#121214]">
            ₹{startingPrice.toLocaleString('en-IN')}
          </span>
        </div>

        <Link
          href={`/creators/${creator.user_id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#121214] hover:bg-[#FF5416] px-3.5 py-2 rounded transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
