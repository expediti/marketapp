'use client';

import React, { useState, useMemo } from 'react';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { FilterBar } from '@/components/marketplace/FilterBar';
import { Users, Sparkles } from 'lucide-react';

export default function DiscoverPage() {
  const { creators } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const filteredCreators = useMemo(() => {
    let result = [...creators];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.profile?.display_name.toLowerCase().includes(q) ||
          c.niche.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.profile?.city.toLowerCase().includes(q)
      );
    }

    // Niche filter
    if (selectedNiche) {
      result = result.filter((c) => c.niche === selectedNiche);
    }

    // City filter
    if (selectedCity) {
      result = result.filter(
        (c) =>
          c.profile?.city === selectedCity ||
          c.audience_locations.some((loc) => loc.city === selectedCity)
      );
    }

    // Sort order
    if (sortBy === 'followers_desc') {
      result.sort((a, b) => b.follower_count - a.follower_count);
    } else if (sortBy === 'engagement_desc') {
      result.sort((a, b) => b.engagement_rate - a.engagement_rate);
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
    }

    return result;
  }, [creators, searchQuery, selectedNiche, selectedCity, sortBy]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedNiche('');
    setSelectedCity('');
    setSortBy('recommended');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="editorial-label text-[#FF5416]">Marketplace Discovery</span>
          <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
            Verified Analytics Only
          </span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] tracking-tight">
          Find creators who fit your brand.
        </h1>
        <p className="text-sm text-[#71717A] max-w-2xl">
          Discover verified Indian creators by city, audience reach, engagement rate, and fixed collaboration packages.
        </p>
      </div>

      {/* Filter Component */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedNiche={selectedNiche}
        onNicheChange={setSelectedNiche}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-[#71717A] border-b border-[#ECECE6] pb-3">
        <span>
          SHOWING <strong className="text-[#121214]">{filteredCreators.length}</strong> VERIFIED CREATORS
        </span>
        <span className="text-[11px] text-[#A1A1AA]">
          Handles protected for privacy
        </span>
      </div>

      {/* Creators Grid */}
      {filteredCreators.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E5DE] rounded-lg p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-[#A1A1AA] mx-auto" />
          <h3 className="font-mono text-base font-bold text-[#121214]">
            No creators match your current filters
          </h3>
          <p className="text-xs text-[#71717A] max-w-md mx-auto">
            Try adjusting your search criteria, switching cities, or resetting filters to browse all verified creators.
          </p>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-[#FF5416] hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <CreatorCard key={creator.user_id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
