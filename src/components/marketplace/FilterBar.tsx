'use client';

import React from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedNiche: string;
  onNicheChange: (val: string) => void;
  selectedCity: string;
  onCityChange: (val: string) => void;
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
  sortBy,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const niches = [
    'All Niches',
    'Food • Lifestyle',
    'Tech • Productivity',
    'Fashion • Editorial',
    'Design • Architecture',
    'Fitness • Calisthenics',
    'Travel • Coastal Living',
  ];

  const cities = ['All Cities', 'Varanasi', 'Bengaluru', 'Mumbai', 'Jaipur', 'Delhi NCR', 'Kochi'];

  return (
    <div className="bg-white border border-[#E5E5DE] rounded-lg p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      {/* Top Search & Reset Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by niche, city, or focus (e.g. Varanasi, tech, coffee)..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416] transition-colors"
          />
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#71717A] hover:text-[#121214] bg-[#F4F4F0] hover:bg-[#ECECE6] rounded-md transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#ECECE6]">
        {/* Niche Filter */}
        <div>
          <label className="editorial-label block mb-1.5">Category / Niche</label>
          <select
            value={selectedNiche}
            onChange={(e) => onNicheChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          >
            {niches.map((n) => (
              <option key={n} value={n === 'All Niches' ? '' : n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="editorial-label block mb-1.5">Audience Location / City</label>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          >
            {cities.map((c) => (
              <option key={c} value={c === 'All Cities' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="editorial-label block mb-1.5">Sort Results By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
          >
            <option value="recommended">Recommended & Verified</option>
            <option value="followers_desc">Most Followers</option>
            <option value="engagement_desc">Highest Engagement Rate</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
