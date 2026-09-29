'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_NICHES = [
  { name: 'Technology', desc: 'SaaS, Developer tools, Gadgets' },
  { name: 'Gaming', desc: 'Mobile games, PC, Esports' },
  { name: 'AI', desc: 'GenAI tools, Productivity, Automation' },
  { name: 'Finance', desc: 'Fintech, Investing, Trading apps' },
  { name: 'Education', desc: 'Edtech, Upskilling, Study apps' },
  { name: 'Fitness', desc: 'Health tracking, Workouts, Nutrition' },
  { name: 'Fashion', desc: 'Apparel, Footwear, Styling apps' },
  { name: 'Beauty', desc: 'Skincare, Cosmetics, Personal care' },
  { name: 'Food', desc: 'Food delivery, Gourmet, Dining apps' },
  { name: 'Travel', desc: 'Hotels, Flights, Itinerary planners' },
  { name: 'Lifestyle', desc: 'Daily productivity, Wellness' },
  { name: 'Comedy', desc: 'Entertainment, Memes, Sketch' },
  { name: 'Automotive', desc: 'EVs, Cars, Bike accessories' },
  { name: 'Developer', desc: 'Coding tutorials, APIs, Open source' },
  { name: 'Student', desc: 'College life, Exam prep, Campus apps' },
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSelectNiche = (niche: string) => {
    router.push(`/discover?niche=${encodeURIComponent(niche)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-[#ECECE6] dark:border-[#27272A]">
          <Search className="w-5 h-5 text-[#FF5416] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search influencers, niches (e.g. Technology, Gaming, AI, Mumbai)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#121214] dark:text-[#F4F4F5] placeholder-[#71717A] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono px-2 py-1 rounded bg-[#F4F4F0] dark:bg-[#27272A] text-[#71717A] hover:text-[#121214] dark:hover:text-white"
          >
            ESC
          </button>
        </form>

        {/* Popular Categories Grid */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF5416]" />
            <span className="editorial-label text-[#71717A] dark:text-[#A1A1AA]">
              Popular Influencer Niches for Apps & Products
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {POPULAR_NICHES.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSelectNiche(item.name)}
                className="p-3 text-left rounded-xl border border-[#E5E5DE] dark:border-[#27272A] bg-[#FBFBFA] dark:bg-[#18181B] hover:border-[#FF5416] dark:hover:border-[#FF5416] hover:bg-[#FFF2EC]/30 dark:hover:bg-[#27140B]/40 transition-all group"
              >
                <div className="font-mono text-xs font-bold text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                  {item.name}
                </div>
                <div className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] truncate mt-0.5">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Quick search CTA */}
          {query.trim() && (
            <div className="pt-2">
              <button
                type="submit"
                onClick={handleSubmit}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-mono text-xs font-bold transition-opacity hover:opacity-90"
              >
                <span>Search influencers for &quot;{query}&quot;</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
