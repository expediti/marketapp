'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedNiche: string;
  onNicheChange: (val: string) => void;
  selectedCity: string;
  onCityChange: (val: string) => void;
  selectedFollowerRange: string;
  onFollowerRangeChange: (val: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (val: string) => void;
  selectedPlatform: string;
  onPlatformChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedNiche,
  onNicheChange,
  selectedCity,
  onCityChange,
  selectedFollowerRange,
  onFollowerRangeChange,
  selectedPriceRange,
  onPriceRangeChange,
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categories = [
    'All Categories',
    'Technology',
    'Gaming',
    'AI',
    'Finance',
    'Education',
    'Fitness',
    'Fashion',
    'Beauty',
    'Food',
    'Travel',
    'Lifestyle',
    'Comedy',
    'Automotive',
    'Developer',
    'Student',
  ];

  const cities = [
    'All Cities',
    'Delhi NCR',
    'Bengaluru',
    'Mumbai',
    'Jaipur',
    'Varanasi',
    'Kochi',
    'Hyderabad',
    'Pune',
  ];

  const followerRanges = [
    'Any Reach',
    'Micro (10K - 25K)',
    'Mid (25K - 50K)',
    'Macro (50K - 100K)',
    'Mega (100K+)',
  ];

  const priceRanges = [
    'Any Budget',
    'Under ₹3,000',
    '₹3,000 - ₹5,000',
    '₹5,000 - ₹10,000',
    '₹10,000+',
  ];

  const platforms = [
    'All Platforms',
    'Instagram Reels',
    'YouTube Shorts',
  ];

  return (
    <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Search Input and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search influencers, niches or categories (e.g. Technology, Gaming, AI, Mumbai)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-xl focus:outline-none focus:border-[#FF5416] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono rounded-xl border border-[#E5E5DE] dark:border-[#27272A] bg-[#F4F4F0] dark:bg-[#18181B] text-[#121214] dark:text-white hover:border-[#121214]/40 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5416]" />
            <span>Filters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-mono uppercase tracking-wider text-[#71717A] hover:text-[#121214] dark:hover:text-white bg-[#F4F4F0] dark:bg-[#18181B] rounded-xl transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Primary Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Category */}
        <div>
          <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
            Category / Niche
          </label>
          <select
            value={selectedNiche}
            onChange={(e) => onNicheChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
          >
            {categories.map((c) => (
              <option key={c} value={c === 'All Categories' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
            Location / City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
          >
            {cities.map((city) => (
              <option key={city} value={city === 'All Cities' ? '' : city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
          >
            <option value="recommended">Recommended</option>
            <option value="followers">Followers (High to Low)</option>
            <option value="reach">Average Reach (High to Low)</option>
            <option value="engagement">Engagement Rate</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#ECECE6] dark:border-[#27272A] animate-in fade-in duration-150">
          {/* Follower Range */}
          <div>
            <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
              Audience / Followers
            </label>
            <select
              value={selectedFollowerRange}
              onChange={(e) => onFollowerRangeChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
            >
              {followerRanges.map((r) => (
                <option key={r} value={r === 'Any Reach' ? '' : r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
              Package Budget
            </label>
            <select
              value={selectedPriceRange}
              onChange={(e) => onPriceRangeChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
            >
              {priceRanges.map((p) => (
                <option key={p} value={p === 'Any Budget' ? '' : p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Platform */}
          <div>
            <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
              Content Platform
            </label>
            <select
              value={selectedPlatform}
              onChange={(e) => onPlatformChange(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
            >
              {platforms.map((pl) => (
                <option key={pl} value={pl === 'All Platforms' ? '' : pl}>
                  {pl}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
