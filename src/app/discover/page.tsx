'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { FilterBar } from '@/components/marketplace/FilterBar';
import { Users, Search, Sparkles } from 'lucide-react';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialNiche = searchParams.get('niche') || '';

  const { creators } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedNiche, setSelectedNiche] = useState(initialNiche);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFollowerRange, setSelectedFollowerRange] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const filteredInfluencers = useMemo(() => {
    let result = [...creators];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.profile?.display_name.toLowerCase().includes(q) ||
          c.niche.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.profile?.city.toLowerCase().includes(q) ||
          c.categories?.some((cat) => cat.toLowerCase().includes(q))
      );
    }

    // Category / Niche filter
    if (selectedNiche && selectedNiche !== 'All Categories') {
      const n = selectedNiche.toLowerCase();
      result = result.filter(
        (c) =>
          c.niche.toLowerCase().includes(n) ||
          c.categories?.some((cat) => cat.toLowerCase().includes(n))
      );
    }

    // City / Location filter
    if (selectedCity && selectedCity !== 'All Cities') {
      result = result.filter(
        (c) =>
          c.profile?.city === selectedCity ||
          c.audience_locations.some((loc) => loc.city === selectedCity)
      );
    }

    // Follower Range filter
    if (selectedFollowerRange && selectedFollowerRange !== 'Any Reach') {
      if (selectedFollowerRange.includes('Micro')) {
        result = result.filter((c) => c.follower_count >= 10000 && c.follower_count < 25000);
      } else if (selectedFollowerRange.includes('Mid')) {
        result = result.filter((c) => c.follower_count >= 25000 && c.follower_count < 50000);
      } else if (selectedFollowerRange.includes('Macro')) {
        result = result.filter((c) => c.follower_count >= 50000 && c.follower_count < 100000);
      } else if (selectedFollowerRange.includes('Mega')) {
        result = result.filter((c) => c.follower_count >= 100000);
      }
    }

    // Price Range filter
    if (selectedPriceRange && selectedPriceRange !== 'Any Budget') {
      if (selectedPriceRange.includes('Under ₹3,000')) {
        result = result.filter((c) => (c.starting_price || 2500) < 3000);
      } else if (selectedPriceRange.includes('₹3,000 - ₹5,000')) {
        result = result.filter((c) => {
          const p = c.starting_price || 2500;
          return p >= 3000 && p <= 5000;
        });
      } else if (selectedPriceRange.includes('₹5,000 - ₹10,000')) {
        result = result.filter((c) => {
          const p = c.starting_price || 2500;
          return p >= 5000 && p <= 10000;
        });
      } else if (selectedPriceRange.includes('₹10,000+')) {
        result = result.filter((c) => (c.starting_price || 2500) >= 10000);
      }
    }

    // Sort order
    if (sortBy === 'followers') {
      result.sort((a, b) => b.follower_count - a.follower_count);
    } else if (sortBy === 'reach') {
      result.sort((a, b) => b.average_reach - a.average_reach);
    } else if (sortBy === 'engagement') {
      result.sort((a, b) => b.engagement_rate - a.engagement_rate);
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.starting_price || 2500) - (b.starting_price || 2500));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.starting_price || 2500) - (a.starting_price || 2500));
    }

    return result;
  }, [
    creators,
    searchQuery,
    selectedNiche,
    selectedCity,
    selectedFollowerRange,
    selectedPriceRange,
    sortBy,
  ]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedNiche('');
    setSelectedCity('');
    setSelectedFollowerRange('');
    setSelectedPriceRange('');
    setSelectedPlatform('');
    setSortBy('recommended');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="editorial-label text-[#FF5416]">Market My App Discovery</span>
          <span className="text-[11px] font-mono text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-[#065F46]">
            Verified Creators
          </span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Find the right influencer for your app.
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-2xl">
          Discover vetted Indian influencers by niche, audience reach, engagement rate, and fixed collaboration packages.
        </p>
      </div>

      {/* Filter Bar Component */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedNiche={selectedNiche}
        onNicheChange={setSelectedNiche}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedFollowerRange={selectedFollowerRange}
        onFollowerRangeChange={setSelectedFollowerRange}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={setSelectedPriceRange}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleReset}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
        <span>
          SHOWING <strong className="text-[#121214] dark:text-white">{filteredInfluencers.length}</strong> INFLUENCERS
        </span>
        <span className="text-[11px] text-[#A1A1AA]">
          Social handles protected for creator privacy
        </span>
      </div>

      {/* Influencers Grid */}
      {filteredInfluencers.length === 0 ? (
        <div className="bg-white dark:bg-[#121214] border border-dashed border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-[#A1A1AA] mx-auto" />
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            No influencers match your current filters
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
            Try adjusting your search query, switching cities, or resetting filters to browse all available influencers.
          </p>
          <button
            onClick={handleReset}
            className="text-xs font-mono font-semibold text-[#FF5416] hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInfluencers.map((influencer) => (
            <CreatorCard key={influencer.user_id} creator={influencer} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-mono">Loading marketplace...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
