'use client';

import React from 'react';
import { CreatorReel } from '@/types/marketplace';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { Film } from 'lucide-react';

interface ReelCardProps {
  reel: CreatorReel & {
    creator_name?: string;
    creator_city?: string;
    category?: string;
  };
  showCreatorInfo?: boolean;
  className?: string;
}

export function ReelCard({ reel, showCreatorInfo = true, className = '' }: ReelCardProps) {
  return (
    <div
      className={`group relative aspect-[9/16] w-full max-w-[280px] sm:max-w-[300px] rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-md transition-all duration-200 hover:border-[#FF5416]/50 hover:shadow-lg ${className}`}
    >
      {/* Autoplaying looping short-form reel video */}
      <ReelVideo
        src={reel.video_url || reel.reel_url || ''}
        poster={reel.thumbnail_url}
        title={reel.title}
        autoPlay={true}
        loop={true}
        muted={true}
        showMuteToggle={true}
        interactive={true}
        className="w-full h-full"
      />

      {/* Subtle Bottom Gradient and Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1 pointer-events-none">
        {showCreatorInfo && (reel.creator_name || reel.category) && (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#D4D4D8]">
            <span className="font-semibold text-white truncate max-w-[160px]">
              {reel.creator_name}
            </span>
            {reel.creator_city && (
              <span className="text-[#A1A1AA] text-[10px] shrink-0">
                {reel.creator_city}
              </span>
            )}
          </div>
        )}

        <h4 className="font-mono text-xs font-bold text-white line-clamp-1">
          {reel.title}
        </h4>

        {reel.category && (
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#FF5416] bg-black/60 px-2 py-0.5 rounded border border-[#FF5416]/30">
              <Film className="w-2.5 h-2.5" />
              <span>{reel.category}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
