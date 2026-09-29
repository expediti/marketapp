'use client';

import React from 'react';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { ShowcaseReelItem, SHOWCASE_REELS } from '@/lib/data/reelsData';
import { Film } from 'lucide-react';

interface InfiniteReelShowcaseProps {
  reels?: ShowcaseReelItem[];
  title?: string;
  subtitle?: string;
  speedSeconds?: number;
  className?: string;
}

export function InfiniteReelShowcase({
  reels = SHOWCASE_REELS,
  title = 'Influencer content, built for reach.',
  subtitle = 'Authentic short-form video content created by Indian influencers for apps, products, and websites.',
  speedSeconds = 34,
  className = '',
}: InfiniteReelShowcaseProps) {
  const displayReels = reels && reels.length > 0 ? reels : SHOWCASE_REELS;

  // Duplicate items for seamless continuous looping (Right -> Left with zero jump)
  const duplicatedReels = [...displayReels, ...displayReels];

  return (
    <section className={`w-full overflow-hidden py-4 sm:py-8 ${className}`}>
      {/* Section Header - Clean, modern, open */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="editorial-label text-[#FF5416] block mb-1">
              Short-Form Content Showcase
            </span>
            <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#52525B] dark:text-[#A1A1AA] mt-1.5 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
            <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse" />
            <span>Continuous stream</span>
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Reel Strip (No giant container frame, open & spacious) */}
      <div className="relative w-full overflow-hidden py-2">
        {/* Soft edge gradient fades for smooth visual emergence */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-r from-[#FBFBFA] dark:from-[#09090B] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-20 bg-gradient-to-l from-[#FBFBFA] dark:from-[#09090B] to-transparent" />

        <div
          className="animate-marquee-scroll flex gap-4 sm:gap-6 pl-4"
          style={
            {
              '--marquee-speed': `${speedSeconds}s`,
            } as React.CSSProperties
          }
        >
          {duplicatedReels.map((reel, index) => {
            const uniqueKey = `${reel.id}_${index}`;
            const videoSource = reel.video_url || '/reels/demo-reel-01.mp4';
            const videoPoster =
              reel.thumbnail_url ||
              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80';

            return (
              <div
                key={uniqueKey}
                className="group relative aspect-[9/16] w-[220px] sm:w-[250px] md:w-[270px] shrink-0 rounded-2xl overflow-hidden bg-black border border-[#E5E5DE] dark:border-[#27272A] shadow-md hover:shadow-xl hover:border-[#FF5416]/50 transition-all duration-300"
              >
                {/* Autoplaying muted looping short-form reel (IntersectionObserver paused offscreen) */}
                <ReelVideo
                  src={videoSource}
                  poster={videoPoster}
                  title={reel.title}
                  autoPlay={true}
                  loop={true}
                  muted={true}
                  playsInline={true}
                  showMuteToggle={true}
                  interactive={true}
                  className="w-full h-full"
                />

                {/* Subtle Content Category Badge & Caption (NO creator names, NO fake metrics) */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent text-white space-y-1 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#FF5416] bg-black/70 px-2 py-0.5 rounded border border-[#FF5416]/30">
                      <Film className="w-2.5 h-2.5" />
                      <span>{reel.content_category || 'Product demo'}</span>
                    </span>
                  </div>

                  <h3 className="font-mono text-xs font-bold text-white line-clamp-1 pt-0.5">
                    {reel.title}
                  </h3>

                  {reel.caption && (
                    <p className="text-[11px] text-[#A1A1AA] line-clamp-1 leading-snug">
                      {reel.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
