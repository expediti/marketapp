'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import {
  Building2,
  ArrowRight,
  Smartphone,
  Globe,
  Package,
  Briefcase,
  AlertCircle,
  Loader2,
} from 'lucide-react';

const PROMOTION_TYPES = [
  {
    id: 'app',
    label: 'Mobile App',
    description: 'iOS & Android mobile applications looking for installs & active users',
    icon: Smartphone,
  },
  {
    id: 'website',
    label: 'Website / Web App',
    description: 'SaaS platforms, developer tools, web applications, and portals',
    icon: Globe,
  },
  {
    id: 'product',
    label: 'Physical / D2C Product',
    description: 'Consumer hardware, apparel, wellness, food & beverage products',
    icon: Package,
  },
  {
    id: 'service',
    label: 'Service / Agency',
    description: 'Consulting, educational courses, financial services, or agencies',
    icon: Briefcase,
  },
];

const INDUSTRIES = [
  'Technology & SaaS',
  'Fintech & Banking',
  'Gaming & Esports',
  'EdTech & Learning',
  'Health & Fitness',
  'E-commerce & D2C',
  'Food & Beverages',
  'Fashion & Apparel',
  'Travel & Hospitality',
  'Productivity Tools',
  'AI & Automation',
];

const BUDGET_RANGES = [
  '₹5,000 - ₹15,000',
  '₹15,000 - ₹35,000',
  '₹35,000 - ₹75,000',
  '₹75,000 - ₹1,50,000',
  '₹1,50,000+',
];

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { onboardBusiness, switchUser } = useMarketplace();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [promotionType, setPromotionType] = useState<'app' | 'website' | 'product' | 'service'>('app');
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [industry, setIndustry] = useState('Technology & SaaS');
  const [targetAudience, setTargetAudience] = useState('Tech-savvy Gen-Z and young professionals (18-32)');
  const [targetLocations, setTargetLocations] = useState('Metro & Tier-1 cities (Delhi NCR, Bengaluru, Mumbai)');
  const [budgetRange, setBudgetRange] = useState('₹15,000 - ₹35,000');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Prefill Google authenticated user data
  useEffect(() => {
    async function loadAuth() {
      if (!isSupabaseConfigured) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUser(user);
          const meta = user.user_metadata || {};
          const fallbackName = meta.full_name || meta.name || '';

          // Check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.display_name && profile.display_name !== 'User') {
            setBusinessName(profile.display_name);
          } else if (fallbackName) {
            setBusinessName(`${fallbackName}'s Brand`);
          }

          if (profile?.avatar_url) {
            setLogoUrl(profile.avatar_url);
          }
        }
      } catch (err) {
        console.error('Error fetching user for business onboarding:', err);
      }
    }
    loadAuth();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const res = await reelStorageService.uploadBusinessLogo(file, currentUser?.id || 'biz_temp');
    if (res.success && res.logoUrl) {
      setLogoUrl(res.logoUrl);
    }
    setIsUploadingLogo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    const finalBizName = businessName.trim() || 'My Application';
    let uid = currentUser?.id || 'biz_new';

    try {
      if (isSupabaseConfigured && currentUser) {
        uid = currentUser.id;

        // 1. Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: uid,
              display_name: finalBizName,
              avatar_url: logoUrl || null,
              role: 'business',
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.warn('Profile update note:', profileError.message);
        }

        // 2. Upsert business_profiles table
        const parsedLocations = targetLocations
          ? targetLocations.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        const { error: bizError } = await supabase
          .from('business_profiles')
          .upsert(
            {
              user_id: uid,
              business_name: finalBizName,
              business_type: promotionType,
              industry,
              category: industry,
              website: website || null,
              app_url: appUrl || null,
              target_audience: targetAudience,
              target_locations: parsedLocations,
              budget_range: budgetRange,
              description: description || 'Promoting our product via targeted Indian influencers.',
              logo_path: logoUrl || null,
              city: 'India',
              verification_status: 'unverified',
            },
            { onConflict: 'user_id' }
          );

        if (bizError) {
          throw new Error(`Failed to save business profile: ${bizError.message}`);
        }
      }

      onboardBusiness({
        business_name: finalBizName,
        business_type: promotionType,
        industry,
        category: industry,
        website: website || 'https://example.com',
        app_url: appUrl,
        target_audience: targetAudience,
        target_locations: targetLocations.split(',').map((s) => s.trim()),
        budget_range: budgetRange,
        description: description || 'Promoting our product via targeted Indian influencers.',
        logo_url: logoUrl,
      });

      switchUser('business');
      router.push('/dashboard/business');
    } catch (err: unknown) {
      console.error('Business onboarding error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save business profile. Please try again.';
      setErrorMessage(message);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="editorial-label text-[#FF5416]">Advertiser Onboarding</span>
        <h1 className="font-mono text-3xl font-extrabold text-[#121214] dark:text-white tracking-tight">
          Market Your App or Product
        </h1>
        <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
          Tell creators what you are building so we can match you with influencers whose audiences actually convert.
        </p>
      </div>

      <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: What are you promoting? */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#121214] dark:text-white block">
              1. What are you promoting?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROMOTION_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = promotionType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPromotionType(type.id as 'app' | 'website' | 'product' | 'service')}
                    className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#FF5416] bg-[#FFF2EC] dark:bg-[#FF5416]/10 text-[#FF5416]'
                        : 'border-[#E5E5DE] dark:border-zinc-700 bg-[#FBFBFA] dark:bg-zinc-900 text-[#121214] dark:text-zinc-200 hover:border-[#121214]/40'
                    }`}
                  >
                    <div className={`p-2 rounded-md shrink-0 ${isSelected ? 'bg-[#FF5416] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold leading-tight">{type.label}</h4>
                      <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5 leading-snug">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logo Upload + Business Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3 sm:col-span-1">
              <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="text-[11px] font-mono font-semibold text-[#FF5416] hover:underline cursor-pointer block"
                >
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Max 5MB</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                App / Business Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. DevPulse App"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          {/* Website & App Store URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Website / Landing Page URL
              </label>
              <input
                type="url"
                required
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourapp.in"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Play Store / App Store URL {promotionType !== 'app' && '(Optional)'}
              </label>
              <input
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/..."
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          {/* Industry & Target Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">Industry / Category</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">Campaign Budget Range</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              >
                {BUDGET_RANGES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Audience & Target Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Target User Demographic
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. College students, Gamers, Android users"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Target Regions / Cities
              </label>
              <input
                type="text"
                value={targetLocations}
                onChange={(e) => setTargetLocations(e.target.value)}
                placeholder="e.g. All India, Bengaluru, Mumbai, Pune"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
              App / Campaign Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell influencers what your app does, its primary value proposition, and the call to action you want (e.g. install from link in bio, use discount coupon, signup)..."
              className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 border-t border-[#ECECE6] dark:border-[#27272A] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
              Matches you with vetted Indian influencers in your category
            </span>
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Saving Business Profile...</span>
                </>
              ) : (
                <>
                  <span>Save & Enter Business Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
