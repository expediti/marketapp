'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import {
  getAllIndianStates,
  getCitiesForIndianState,
  POPULAR_INDIAN_CITIES,
} from '@/lib/data/locationsData';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedNiche: string;
  onNicheChange: (val: string) => void;
  selectedCountry?: string;
  onCountryChange?: (val: string) => void;
  selectedState: string;
  onStateChange: (val: string) => void;
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
  selectedCountry = 'India',
  onCountryChange,
  selectedState,
  onStateChange,
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

  const states = ['All States', ...getAllIndianStates()];

  // Dynamically resolve cities based on selected state
  const availableCities = selectedState && selectedState !== 'All States'
    ? ['All Cities in ' + selectedState, ...getCitiesForIndianState(selectedState)]
    : ['All Cities', ...POPULAR_INDIAN_CITIES];

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

  const quickLocations = [
    { label: 'All India', state: '', city: '' },
    { label: 'Varanasi', state: 'Uttar Pradesh', city: 'Varanasi' },
    { label: 'Bengaluru', state: 'Karnataka', city: 'Bengaluru' },
    { label: 'Mumbai', state: 'Maharashtra', city: 'Mumbai' },
    { label: 'Delhi NCR', state: 'Delhi NCR', city: 'Delhi NCR' },
    { label: 'Jaipur', state: 'Rajasthan', city: 'Jaipur' },
    { label: 'Kochi', state: 'Kerala', city: 'Kochi' },
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
            placeholder="Search by category, city or keywords (e.g. food in Varanasi, fitness in Delhi, SaaS demo)..."
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

      {/* Primary Filters Row: Category + State + City + Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
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

        {/* State */}
        <div>
          <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
            State (India)
          </label>
          <select
            value={selectedState}
            onChange={(e) => {
              const newState = e.target.value;
              onStateChange(newState);
              // Reset city if not matching new state
              onCityChange('');
            }}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
          >
            {states.map((st) => (
              <option key={st} value={st === 'All States' ? '' : st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="editorial-label block mb-1 text-[#71717A] dark:text-[#A1A1AA]">
            City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-[#FBFBFA] dark:bg-[#18181B] text-[#121214] dark:text-white border border-[#E5E5DE] dark:border-[#27272A] rounded-lg focus:outline-none focus:border-[#FF5416]"
          >
            {availableCities.map((city) => (
              <option
                key={city}
                value={city.startsWith('All Cities') ? '' : city}
              >
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

      {/* Quick Location Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1 mr-1">
          <MapPin className="w-3 h-3 text-[#FF5416]" />
          <span>Location:</span>
        </span>
        {quickLocations.map((loc) => {
          const isSelected =
            (!loc.city && !loc.state && !selectedCity && !selectedState) ||
            (loc.city && selectedCity === loc.city) ||
            (loc.state && !loc.city && selectedState === loc.state && !selectedCity);

          return (
            <button
              key={loc.label}
              type="button"
              onClick={() => {
                onStateChange(loc.state);
                onCityChange(loc.city);
              }}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors ${
                isSelected
                  ? 'bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] border-[#FFD2C1] dark:border-[#4D1F0E] font-bold'
                  : 'bg-[#FBFBFA] dark:bg-[#18181B] text-[#52525B] dark:text-[#A1A1AA] border-[#E5E5DE] dark:border-[#27272A] hover:border-[#FF5416]/50'
              }`}
            >
              {loc.label}
            </button>
          );
        })}
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
