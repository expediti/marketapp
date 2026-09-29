'use client';

import React from 'react';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorReel } from '@/types/marketplace';

interface HeroWorkflowVisualProps {
  heroReel?: CreatorReel & {
    category?: string;
  };
}

export function HeroWorkflowVisual({ heroReel }: HeroWorkflowVisualProps) {
  const videoSource = heroReel?.video_url || '/reels/demo-reel-01.mp4';
  const videoPoster =
    heroReel?.thumbnail_url ||
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full max-w-[300px] sm:max-w-[320px] flex flex-col items-center">
      {/* Clean 9:16 Vertical Reel Frame */}
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] shadow-2xl transition-all">
        {/* Autoplaying looping muted reel */}
        <ReelVideo
          src={videoSource}
          poster={videoPoster}
          title={heroReel?.title || 'Short-Form Influencer Reel'}
          autoPlay={true}
          loop={true}
          muted={true}
          playsInline={true}
          className="w-full h-full"
        />

        {/* Content Badge Overlay (No creator names, no fake metrics) */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent text-white pointer-events-none">
          <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-[#FF5416] bg-black/70 px-2 py-0.5 rounded border border-[#FF5416]/30 mb-1">
            {heroReel?.category || 'App Walkthrough'}
          </span>
          <h4 className="font-mono text-xs font-bold text-white line-clamp-1">
            {heroReel?.title || 'Short-form promotional content'}
          </h4>
        </div>

        {/* Subtle Looping Line Animation across bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/10 overflow-hidden z-30">
          <div className="h-full w-24 bg-gradient-to-r from-transparent via-[#FF5416] to-transparent animate-subtle-sweep" />
        </div>
      </div>

      {/* Minimal caption below reel */}
      <div className="mt-3 text-center">
        <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
          Authentic short-form creator content
        </p>
      </div>
    </div>
  );
}
