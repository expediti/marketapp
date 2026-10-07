'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { FilterBar } from '@/components/marketplace/FilterBar';
import { Users, Search, Sparkles } from 'lucide-react';
import { findStateForCity } from '@/lib/data/locationsData';

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialNiche = searchParams.get('niche') || '';
  const initialCity = searchParams.get('city') || '';
  const initialState = searchParams.get('state') || '';

  const { creators, isLoading } = useMarketplace();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedNiche, setSelectedNiche] = useState(initialNiche);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedFollowerRange, setSelectedFollowerRange] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const filteredInfluencers = useMemo(() => {
    let result = [...creators];

    // 1. Natural Language Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter((t) => !['in', 'for', 'the', 'and', 'with', 'creators', 'influencers', 'communities'].includes(t));

      result = result.filter((c) => {
        const creatorName = (c.profile?.display_name || '').toLowerCase();
        const creatorCity = (c.city || c.profile?.city || '').toLowerCase();
        const creatorState = (c.state || '').toLowerCase();
        const creatorCountry = (c.country || 'india').toLowerCase();
        const creatorNiche = (c.niche || '').toLowerCase();
        const creatorBio = (c.bio || '').toLowerCase();
        const categories = (c.categories || []).map((cat) => cat.toLowerCase()).join(' ');
        const audienceCities = (c.audience_locations || []).map((l) => l.city.toLowerCase()).join(' ');

        const searchableText = `${creatorName} ${creatorCity} ${creatorState} ${creatorCountry} ${creatorNiche} ${creatorBio} ${categories} ${audienceCities}`;

        if (searchableText.includes(q)) return true;

        if (tokens.length > 0) {
          return tokens.every((token) => searchableText.includes(token));
        }

        return false;
      });
    }

    // 2. Category / Niche filter
    if (selectedNiche && selectedNiche !== 'All Categories') {
      const n = selectedNiche.toLowerCase();
      result = result.filter(
        (c) =>
          c.niche.toLowerCase().includes(n) ||
          c.categories?.some((cat) => cat.toLowerCase().includes(n))
      );
    }

    // 3. State filter
    if (selectedState && selectedState !== 'All States') {
      const st = selectedState.toLowerCase();
      result = result.filter((c) => {
        const creatorState = (c.state || '').toLowerCase();
        if (creatorState === st) return true;
        const cityState = findStateForCity(c.city || c.profile?.city || '');
        if (cityState && cityState.toLowerCase() === st) return true;
        return false;
      });
    }

    // 4. City filter
    if (selectedCity && selectedCity !== 'All Cities' && !selectedCity.startsWith('All Cities in')) {
      const ct = selectedCity.toLowerCase();
      result = result.filter(
        (c) =>
          (c.city || c.profile?.city || '').toLowerCase() === ct ||
          c.audience_locations.some((loc) => loc.city.toLowerCase() === ct)
      );
    }

    // 5. Follower Range filter
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

    // 6. Price Range filter
    if (selectedPriceRange && selectedPriceRange !== 'Any Budget') {
      if (selectedPriceRange.includes('Under ₹3,000')) {
        result = result.filter((c) => (c.starting_price || 0) < 3000);
      } else if (selectedPriceRange.includes('₹3,000 - ₹5,000')) {
        result = result.filter((c) => (c.starting_price || 0) >= 3000 && (c.starting_price || 0) <= 5000);
      } else if (selectedPriceRange.includes('₹5,000 - ₹10,000')) {
        result = result.filter((c) => (c.starting_price || 0) >= 5000 && (c.starting_price || 0) <= 10000);
      } else if (selectedPriceRange.includes('₹10,000+')) {
        result = result.filter((c) => (c.starting_price || 0) > 10000);
      }
    }

    // 7. Sort
    if (sortBy === 'followers') {
      result.sort((a, b) => b.follower_count - a.follower_count);
    } else if (sortBy === 'reach') {
      result.sort((a, b) => b.average_reach - a.average_reach);
    } else if (sortBy === 'engagement') {
      result.sort((a, b) => b.engagement_rate - a.engagement_rate);
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.starting_price || 0) - (b.starting_price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.starting_price || 0) - (a.starting_price || 0));
    }

    return result;
  }, [
    creators,
    searchQuery,
    selectedNiche,
    selectedState,
    selectedCity,
    selectedFollowerRange,
    selectedPriceRange,
    sortBy,
  ]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedNiche('');
    setSelectedState('');
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
          <span className="editorial-label text-[#FF5416]">Audience Directory</span>
          <span className="text-[11px] font-mono text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-[#065F46]">
            Verified Distribution Partners
          </span>
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Find the audience that already exists for what you built.
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-2xl">
          Discover creators and communities that already reach your target demographic — filtered by category, location, audience reach, and fixed packages.
        </p>
      </div>

      {/* Filter Bar Component */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedNiche={selectedNiche}
        onNicheChange={setSelectedNiche}
        selectedState={selectedState}
        onStateChange={setSelectedState}
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
          SHOWING <strong className="text-[#121214] dark:text-white">{filteredInfluencers.length}</strong> DISTRIBUTION PARTNERS
        </span>
        <span className="text-[11px] text-[#A1A1AA]">
          Direct handles protected for partner privacy
        </span>
      </div>

      {/* Partners Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-16 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">Loading directory from database...</p>
        </div>
      ) : creators.length === 0 ? (
        <div className="bg-white dark:bg-[#121214] border border-dashed border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-16 text-center space-y-3">
          <Users className="w-10 h-10 text-[#A1A1AA] mx-auto" />
          <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
            No distribution partners yet
          </h3>
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
            Partners will appear here once they complete their onboarding.
          </p>
        </div>
      ) : filteredInfluencers.length === 0 ? (
        <div className="bg-white dark:bg-[#121214] border border-dashed border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-[#A1A1AA] mx-auto" />
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
            No partners match your current filters
          </h3>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
            Try adjusting your search query, switching cities, or resetting filters to browse all available distribution partners.
          </p>
          <button
            onClick={handleReset}
            className="text-xs font-mono font-semibold text-[#FF5416] hover:underline cursor-pointer"
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
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-mono">Loading audience directory...</div>}>
      <DiscoverContent />
    </Suspense>
  );
}
