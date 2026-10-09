'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReelCard } from '@/components/marketplace/ReelCard';
import { ShowcaseReelItem } from '@/lib/data/reelsData';

interface ReelCarouselProps {
  reels: ShowcaseReelItem[];
  title?: string;
  subtitle?: string;
}

export function ReelCarousel({
  reels,
  title = 'See the kind of content influencers create.',
  subtitle = 'Watch short-form promotional reels, app walkthroughs, and portfolio samples created by Indian influencers on Market My Idea.',
}: ReelCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!reels || reels.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Carousel Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="editorial-label text-[#FF5416]">Influencer Work Samples</span>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white mt-1 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] mt-1 max-w-xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors focus:outline-none"
            aria-label="Previous reel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-lg border border-[#E5E5DE] dark:border-[#27272A] bg-white dark:bg-[#18181B] text-[#121214] dark:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#27272A] transition-colors focus:outline-none"
            aria-label="Next reel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Reel Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reels.map((reel) => (
          <div
            key={reel.id}
            className="snap-start shrink-0 w-[240px] sm:w-[270px] md:w-[280px]"
          >
            <ReelCard reel={reel} showCreatorInfo={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
