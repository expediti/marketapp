'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorPackage, CreatorReel, ReelType } from '@/types/marketplace';
import {
  getAllIndianStates,
  getCitiesForIndianState,
} from '@/lib/data/locationsData';
import {
  CheckCircle2,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  Camera,
  AlertCircle,
  MapPin,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { validateAndNormalizeUpiId } from '@/lib/utils/upiValidation';
import { parseInstagramUrl } from '@/lib/utils/instagram';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const POPULAR_CATEGORIES = [
  'Technology',
  'Gaming',
  'AI & Tools',
  'Education & EdTech',
  'Finance & FinTech',
  'Fitness & Health',
  'Fashion & Apparel',
  'Beauty & Skincare',
  'Food & Dining',
  'Travel & Lifestyle',
  'Comedy & Entertainment',
  'Automotive',
  'Developer & Coding',
  'Students & Campus',
  'Productivity',
];

export const dynamic = 'force-dynamic';

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { onboardCreator, refreshData } = useMarketplace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Basic Information & Dedicated Location Section
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Uttar Pradesh');
  const [city, setCity] = useState('Varanasi');
  const [customCity, setCustomCity] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [upiError, setUpiError] = useState<string | null>(null);

  // Step 4: Audience Metrics & Optional Instagram Connection
  const [isInstagramConnected, setIsInstagramConnected] = useState<boolean>(false);
  const [instagramUsername, setInstagramUsername] = useState<string>('');
  const [followerCount, setFollowerCount] = useState<number>(10000);
  const [averageReach, setAverageReach] = useState<number>(5000);
  const [engagementRate, setEngagementRate] = useState<number>(4.2);
  const [igError, setIgError] = useState<string | null>(null);

  // Step 6: Reel link / upload state
  const [instagramReelUrl, setInstagramReelUrl] = useState('');
  const [reelUrlError, setReelUrlError] = useState<string | null>(null);

  // Handle URL query parameters from Instagram OAuth callback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    const igConnected = params.get('ig_connected');
    const igUser = params.get('ig_username');
    const igFollowers = params.get('ig_followers');
    const igErr = params.get('ig_error');

    if (igErr) {
      setIgError(decodeURIComponent(igErr));
      setStep(4);
    }
    if (igConnected === 'true') {
      setIsInstagramConnected(true);
      if (igUser) setInstagramUsername(igUser);
      if (igFollowers) setFollowerCount(Number(igFollowers));
      setStep(4);
    } else if (stepParam && ['1', '2', '3', '4', '5', '6'].includes(stepParam)) {
      setStep(Number(stepParam) as any);
    }
  }, []);

  // Prefill Google authenticated user data & check existing Instagram connection
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
          const name = meta.full_name || meta.name || meta.display_name || user.email?.split('@')[0] || '';
          const avatar = meta.avatar_url || meta.picture || '';

          // Check if profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, city')
            .eq('id', user.id)
            .maybeSingle();

          setDisplayName(profile?.display_name || name);
          if (profile?.avatar_url || avatar) {
            setProfileImage(profile?.avatar_url || avatar);
          }
          if (profile?.city) {
            setCity(profile.city);
          }

          // Check if creator_profiles exists to prefill verified Instagram connection
          const { data: creatorProf } = await supabase
            .from('creator_profiles')
            .select('instagram_connected, instagram_username, follower_count, average_reach, engagement_rate, payout_upi_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (creatorProf) {
            if (creatorProf.instagram_connected) {
              setIsInstagramConnected(true);
              if (creatorProf.instagram_username) {
                setInstagramUsername(creatorProf.instagram_username);
              }
              if (creatorProf.follower_count) {
                setFollowerCount(creatorProf.follower_count);
              }
              if (creatorProf.average_reach) {
                setAverageReach(creatorProf.average_reach);
              }
              if (creatorProf.engagement_rate) {
                setEngagementRate(Number(creatorProf.engagement_rate));
              }
            }
            if (creatorProf.payout_upi_id) {
              setPayoutUpiId(creatorProf.payout_upi_id);
            }
          }

          // Fetch any existing/synced Reels for this creator
          const { data: creatorReelsData } = await supabase
            .from('creator_reels')
            .select('*')
            .eq('creator_id', user.id)
            .order('sort_order', { ascending: true });

          if (creatorReelsData && creatorReelsData.length > 0) {
            setReels(creatorReelsData as unknown as CreatorReel[]);
          }
        }
      } catch (err) {
        console.error('Error fetching user for onboarding:', err);
      }
    }
    loadAuth();
  }, []);

  // Step 2: Categories (Multiple)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Technology']);

  // Step 3: Audience Information
  const [audienceLocation, setAudienceLocation] = useState('Delhi NCR, Mumbai, Bengaluru');
  const [audienceAge, setAudienceAge] = useState('18-24 (54%), 25-34 (36%)');
  const [audienceGender, setAudienceGender] = useState('65% Male / 35% Female');
  const [audienceInterests, setAudienceInterests] = useState('Mobile Apps, SaaS, Gadgets, Productivity');

  // Step 5: Packages
  const [packages, setPackages] = useState<CreatorPackage[]>([
    {
      id: 'p_init_1',
      creator_id: 'temp',
      name: 'Instagram Reel Promotion',
      platform: 'Instagram',
      content_type: 'Reel',
      description: '1 dedicated 30-45s vertical reel featuring your app/website with on-screen demo and bio link.',
      price: 3500,
      delivery_days: 4,
      revisions: 1,
      deliverables: ['1 9:16 Vertical Reel', 'Caption mention', 'Link in bio for 48h'],
      active: true,
    },
    {
      id: 'p_init_2',
      creator_id: 'temp',
      name: 'Reel + 2 Stories Bundle',
      platform: 'Instagram',
      content_type: 'Reel + Story',
      description: 'High-converting combo: 1 permanent reel demo plus 2 interactive stories with direct swipe-up/link sticker.',
      price: 4999,
      delivery_days: 5,
      revisions: 2,
      deliverables: ['1 Permanent Reel', '2 Instagram Stories with link sticker', 'App Store tag'],
      active: true,
    },
  ]);

  // Step 6: Choose Your Work (Synced Instagram Reels)
  const [reels, setReels] = useState<CreatorReel[]>([]);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelType, setNewReelType] = useState<ReelType>('client_work');

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const res = await reelStorageService.uploadProfileImage(file, 'creator_temp');
    if (res.success && res.imageUrl) {
      setProfileImage(res.imageUrl);
    }
    setIsUploadingAvatar(false);
  };

  const removeReel = (reelId: string) => {
    setReels(reels.filter((r) => r.id !== reelId));
  };

  const handleAddPackage = () => {
    const newPkg: CreatorPackage = {
      id: `p_${Date.now()}`,
      creator_id: 'temp',
      name: 'Custom Package',
      platform: 'Instagram',
      content_type: 'Reel',
      description: 'Tailored promotional content for your app.',
      price: 2500,
      delivery_days: 3,
      revisions: 1,
      deliverables: ['1 Custom Video', 'Call to Action'],
      active: true,
    };
    setPackages([...packages, newPkg]);
  };

  const handleAddInstagramReel = () => {
    setReelUrlError(null);
    const parsed = parseInstagramUrl(instagramReelUrl);
    if (!parsed.isValid || !parsed.canonicalUrl) {
      setReelUrlError(
        parsed.error || 'Please enter a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...)'
      );
      return;
    }

    const newReel: CreatorReel = {
      id: `reel_ig_${Date.now()}`,
      creator_id: 'temp',
      title: newReelTitle.trim() || 'Instagram Reel',
      video_url: parsed.canonicalUrl,
      reel_url: parsed.canonicalUrl,
      instagram_media_id: parsed.shortcode || undefined,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
      created_at: new Date().toISOString(),
    };

    setReels([...reels, newReel]);
    setInstagramReelUrl('');
    setNewReelTitle('');
  };

  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    setOnboardingError(null);
    const finalCity = customCity.trim() || city || 'Varanasi';

    try {
      let activeUser = currentUser;
      if (!activeUser && isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getUser();
        activeUser = authData?.user || null;
      }

      let uid = activeUser?.id || 'new_influencer';
      let userEmail =
        activeUser?.email ||
        `${(displayName || 'creator').toLowerCase().replace(/\s+/g, '')}@marketmyapp.in`;

      if (isSupabaseConfigured && activeUser) {
        uid = activeUser.id;
        userEmail = activeUser.email || userEmail;

        // 1. Update profiles table with creator role
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: uid,
              display_name: displayName || 'Creator',
              avatar_url: profileImage || null,
              city: finalCity,
              role: 'creator',
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.warn('Profile update note:', profileError.message);
        }

        // 2. Upsert creator_profiles (supports both Instagram connected & disconnected states)
        const isVerifiedIg = Boolean(isInstagramConnected && instagramUsername);
        const creatorProfilePayload = {
          user_id: uid,
          display_name: displayName || 'Creator',
          bio: bio || 'Indian content creator helping apps reach targeted users.',
          profile_image_path: profileImage || null,
          country: country || 'India',
          state: stateName || 'Uttar Pradesh',
          city: finalCity,
          niche: selectedCategories[0] || 'Technology',
          categories: selectedCategories.length > 0 ? selectedCategories : ['Technology'],
          languages: languages.length > 0 ? languages : ['Hindi', 'English'],
          follower_count: Number(followerCount) || 0,
          average_reach: Number(averageReach) || 0,
          engagement_rate: Number(engagementRate) || 0,
          instagram_connected: isVerifiedIg,
          instagram_username: isVerifiedIg ? instagramUsername : null,
          instagram_verified: isVerifiedIg,
          verification_status: isVerifiedIg ? 'verified_oauth' : 'unverified',
          metrics_source: isVerifiedIg ? 'instagram_meta_verified' : 'platform_manual',
          payout_upi_id: payoutUpiId.trim()
            ? validateAndNormalizeUpiId(payoutUpiId).value
            : null,
          updated_at: new Date().toISOString(),
        };

        const { error: creatorError } = await supabase
          .from('creator_profiles')
          .upsert(creatorProfilePayload, { onConflict: 'user_id' });

        if (creatorError) {
          console.error('creator_profiles upsert failed:', creatorError);
          throw new Error(`Failed to save creator profile: ${creatorError.message}`);
        }

        // 3. Upsert packages
        if (packages.length > 0) {
          await supabase.from('creator_packages').delete().eq('creator_id', uid);
          const pkgRows = packages.map((pkg) => ({
            creator_id: uid,
            name: pkg.name || 'Custom Package',
            platform: pkg.platform || 'Instagram',
            content_type: pkg.content_type || 'Reel',
            description: pkg.description || '',
            price: Number(pkg.price) || 0,
            currency: 'INR',
            delivery_days: Number(pkg.delivery_days) || 3,
            revision_count: Number(pkg.revisions) || 1,
            deliverables: Array.isArray(pkg.deliverables) ? pkg.deliverables : [pkg.deliverables || ''],
            active: true,
          }));
          const { error: pkgError } = await supabase.from('creator_packages').insert(pkgRows);
          if (pkgError) {
            console.warn('creator_packages insert note:', pkgError.message);
          }
        }

        // 4. Upsert reels (supports manual Instagram reel URLs & uploaded video samples)
        if (reels.length > 0) {
          await supabase.from('creator_reels').delete().eq('creator_id', uid);
          const reelRows = reels.map((r, idx) => ({
            creator_id: uid,
            title: r.title || 'Instagram Reel Work Sample',
            video_url: r.video_url,
            reel_url: r.reel_url || (r.video_url && r.video_url.includes('instagram.com') ? r.video_url : null),
            instagram_media_id: r.instagram_media_id || null,
            storage_path: r.storage_path || null,
            mime_type: r.mime_type || 'video/mp4',
            file_size_bytes: r.file_size_bytes || null,
            type: (r.type === 'client_work' || r.type === 'demo') ? r.type : 'client_work',
            sort_order: idx + 1,
            is_featured: r.is_featured ?? idx === 0,
            is_visible: true,
          }));
          const { error: reelError } = await supabase.from('creator_reels').insert(reelRows);
          if (reelError) {
            console.error('creator_reels insert error:', reelError);
            throw new Error(`Failed to save reel work samples: ${reelError.message}`);
          }
        }
      }

      onboardCreator({
        id: uid,
        user_id: uid,
        profile: {
          id: uid,
          role: 'creator',
          display_name: displayName || 'Creator',
          email: userEmail,
          avatar_url: profileImage || null,
          city: finalCity,
          created_at: new Date().toISOString(),
        },
        display_name: displayName || 'Creator',
        country: country || 'India',
        state: stateName || '',
        city: finalCity,
        niche: selectedCategories[0] || 'Technology',
        categories: selectedCategories,
        languages: languages,
        bio: bio || '',
        profile_image_path: profileImage || undefined,
        follower_count: Number(followerCount) || 0,
        average_reach: Number(averageReach) || 0,
        engagement_rate: Number(engagementRate) || 0,
        instagram_connected: Boolean(isInstagramConnected),
        instagram_verified: Boolean(isInstagramConnected),
        instagram_username: isInstagramConnected && instagramUsername ? instagramUsername : null,
        metrics_source: isInstagramConnected ? 'instagram_meta_verified' : 'platform_manual',
        packages,
        reels: reels || [],
        payout_upi_id: payoutUpiId.trim()
          ? validateAndNormalizeUpiId(payoutUpiId).value
          : undefined,
      });

      try {
        await refreshData();
      } catch (refErr) {
        console.warn('refreshData note after onboarding:', refErr);
      }

      router.push('/dashboard/creator');
    } catch (err: unknown) {
      console.error('Creator onboarding failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to save onboarding details. Please try again.';
      setOnboardingError(message);
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header & Steps Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="editorial-label text-[#FF5416]">Influencer Onboarding</span>
          <span className="text-xs font-mono text-[#71717A] dark:text-zinc-400">Step 0{step} of 06</span>
        </div>

        <div className="w-full bg-[#E5E5DE] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#FF5416] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: BASIC INFORMATION */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Basic Information</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Create your professional creator identity for advertisers looking to market their apps.
            </p>
          </div>

          <div className="space-y-5">
            {/* Profile Photo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-[#E5E5DE] dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              <div className="space-y-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-[#121214] dark:text-white hover:border-[#FF5416] cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Profile Photo'}</span>
                </label>
                <p className="text-[11px] text-[#71717A] dark:text-zinc-400">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Display Name / Creator Handle
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            {/* Dedicated Location Section */}
            <div className="pt-2 border-t border-[#ECECE6] dark:border-[#27272A] space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF5416]" />
                <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white uppercase tracking-wider">
                  Location
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Country */}
                <div>
                  <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                  >
                    <option value="India">India</option>
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                    State
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setStateName(newState);
                      const availableCities = getCitiesForIndianState(newState);
                      if (availableCities.length > 0) {
                        setCity(availableCities[0]);
                      }
                      setCustomCity('');
                    }}
                    className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                  >
                    {getAllIndianStates().map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                    City (Select or Search)
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setCustomCity('');
                    }}
                    className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                  >
                    {getCitiesForIndianState(stateName).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other City...</option>
                  </select>
                </div>
              </div>

              {/* If "Other" selected, allow custom city text */}
              {city === 'Other' && (
                <div className="pt-1">
                  <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                    Enter City Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Enter your city name in India"
                    className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              )}

              {/* Popular City Quick-Pick Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400 mr-1">
                  Quick select:
                </span>
                {['Varanasi', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Jaipur', 'Kochi'].map((pCity) => (
                  <button
                    key={pCity}
                    type="button"
                    onClick={() => {
                      if (pCity === 'Varanasi') setStateName('Uttar Pradesh');
                      else if (pCity === 'Bengaluru') setStateName('Karnataka');
                      else if (pCity === 'Mumbai') setStateName('Maharashtra');
                      else if (pCity === 'Delhi NCR') setStateName('Delhi NCR');
                      else if (pCity === 'Jaipur') setStateName('Rajasthan');
                      else if (pCity === 'Kochi') setStateName('Kerala');
                      setCity(pCity);
                      setCustomCity('');
                    }}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      (customCity || city) === pCity
                        ? 'bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] border-[#FFD2C1] dark:border-[#4D1F0E] font-bold'
                        : 'bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 border-[#E5E5DE] dark:border-zinc-700 hover:border-[#FF5416]/50'
                    }`}
                  >
                    {pCity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Languages (comma separated)
              </label>
              <input
                type="text"
                value={languages.join(', ')}
                onChange={(e) => setLanguages(e.target.value.split(',').map((s) => s.trim()))}
                placeholder="Hindi, English, Tamil, Telugu..."
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">Creator Bio</label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your content niche, promotional style, and how you help apps get user downloads..."
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            {/* Payment Details Section (Optional) */}
            <div className="pt-4 border-t border-[#ECECE6] dark:border-[#27272A] space-y-3">
              <div>
                <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white uppercase tracking-wider">
                  Payment Details
                </h3>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                  This is used only for creator payouts. It is never shown to businesses.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#121214] dark:text-white">
                    UPI ID <span className="text-[11px] font-normal text-[#71717A] dark:text-zinc-400">(Optional)</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                    Example: name@upi
                  </span>
                </div>
                <input
                  type="text"
                  value={payoutUpiId}
                  onChange={(e) => {
                    setPayoutUpiId(e.target.value);
                    if (upiError) setUpiError(null);
                  }}
                  onBlur={() => {
                    if (payoutUpiId.trim()) {
                      const res = validateAndNormalizeUpiId(payoutUpiId);
                      if (!res.isValid) {
                        setUpiError(res.error || 'Please enter a valid UPI ID (e.g., name@upi)');
                      } else {
                        setPayoutUpiId(res.value);
                        setUpiError(null);
                      }
                    } else {
                      setUpiError(null);
                    }
                  }}
                  placeholder="name@upi"
                  className={`w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border ${
                    upiError ? 'border-red-500' : 'border-[#E5E5DE] dark:border-zinc-700'
                  } rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416] font-mono`}
                />
                {upiError ? (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{upiError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-1">
                    This is used only for creator payouts. It is never shown to businesses.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button
              variant="primary"
              size="md"
              disabled={!displayName.trim()}
              onClick={() => {
                if (payoutUpiId.trim()) {
                  const res = validateAndNormalizeUpiId(payoutUpiId);
                  if (!res.isValid) {
                    setUpiError(res.error || 'Please enter a valid UPI ID (e.g., name@upi)');
                    return;
                  }
                  setPayoutUpiId(res.value);
                  setUpiError(null);
                }
                setStep(2);
              }}
            >
              <span>Next: Categories & Niches</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORIES (MULTIPLE) */}
      {step === 2 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Categories & Niches</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Select one or multiple categories that best match your content and target audience.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {POPULAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`p-3 rounded-lg border text-left text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'border-[#FF5416] bg-[#FFF2EC] dark:bg-[#FF5416]/10 text-[#FF5416]'
                      : 'border-[#E5E5DE] dark:border-zinc-700 bg-[#FBFBFA] dark:bg-zinc-900 text-[#121214] dark:text-zinc-200 hover:border-[#121214]/40 dark:hover:border-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{cat}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(3)}>
              <span>Next: Audience Information</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: AUDIENCE INFORMATION */}
      {step === 3 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Audience Information</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Help app and product founders understand who watches and engages with your content.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Top Audience Locations (Tier 1 & Tier 2 Cities)
              </label>
              <input
                type="text"
                value={audienceLocation}
                onChange={(e) => setAudienceLocation(e.target.value)}
                placeholder="e.g. Delhi NCR, Bengaluru, Mumbai, Pune"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Audience Age Breakdown
                </label>
                <input
                  type="text"
                  value={audienceAge}
                  onChange={(e) => setAudienceAge(e.target.value)}
                  placeholder="e.g. 18-24 (55%), 25-34 (35%)"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Gender Ratio
                </label>
                <input
                  type="text"
                  value={audienceGender}
                  onChange={(e) => setAudienceGender(e.target.value)}
                  placeholder="e.g. 60% Male / 40% Female"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Primary Audience Interests
              </label>
              <input
                type="text"
                value={audienceInterests}
                onChange={(e) => setAudienceInterests(e.target.value)}
                placeholder="e.g. Fintech apps, Mobile Gaming, Productivity tools, Gadgets"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(4)}>
              <span>Next: Connect Instagram</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

          {/* STEP 4: INSTAGRAM VERIFICATION */}
      {step === 4 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
                Instagram Connection & Verification
              </h2>
            </div>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Connect your professional Instagram creator or business account to automatically verify your identity, follower metrics, and showcase Reels.
            </p>
          </div>

          {igError && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                <p className="font-semibold">Instagram Connection Notice</p>
                <p>
                  Instagram couldn&apos;t be connected ({igError}). You can proceed to complete your profile and reconnect anytime from your creator settings.
                </p>
              </div>
            </div>
          )}

          {/* Instagram Connect & Status Card */}
          <div className="p-5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <InstagramIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#121214] dark:text-white font-mono">
                      {isInstagramConnected
                        ? `@${instagramUsername || 'connected'}`
                        : 'Instagram Verification'}
                    </h4>
                    {isInstagramConnected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                    {isInstagramConnected
                      ? 'Authenticated via Meta Graph API. Your metrics and Reels are automatically synced.'
                      : (currentUser?.email || '').toLowerCase().trim() === 'khormasti104@gmail.com'
                      ? 'Connect your professional creator account for instant verification.'
                      : 'Instagram verification is currently in pilot access.'}
                  </p>
                </div>
              </div>

              <div>
                {isInstagramConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Connected</span>
                  </span>
                ) : (currentUser?.email || '').toLowerCase().trim() === 'khormasti104@gmail.com' ? (
                  <a
                    href="/api/auth/instagram/authorize?returnTo=%2Fauth%2Fonboarding%2Fcreator"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF5416] text-white hover:bg-[#E04408] text-xs font-semibold font-mono transition-colors shadow-sm"
                  >
                    <InstagramIcon className="w-4 h-4" />
                    <span>Connect Instagram</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E5E5DE] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-400 text-xs font-semibold font-mono cursor-not-allowed border border-[#D4D4CE] dark:border-zinc-700"
                  >
                    <span>Pilot Access Only</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sourced Metrics Info */}
            <div className="pt-3 border-t border-[#ECECE6] dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-lg border border-[#E5E5DE] dark:border-zinc-700">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#71717A] dark:text-zinc-400 block">
                  Followers
                </span>
                <span className="font-mono text-sm font-bold text-[#121214] dark:text-white mt-0.5 block">
                  {isInstagramConnected && followerCount > 0
                    ? followerCount.toLocaleString('en-IN')
                    : isInstagramConnected
                    ? 'Synced from API'
                    : 'Requires Instagram'}
                </span>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-500 mt-0.5 block">
                  {isInstagramConnected ? 'Meta API Verified' : 'Auto-fetched on connection'}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-lg border border-[#E5E5DE] dark:border-zinc-700">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#71717A] dark:text-zinc-400 block">
                  Average Reach
                </span>
                <span className="font-mono text-sm font-bold text-[#121214] dark:text-white mt-0.5 block">
                  {isInstagramConnected && averageReach > 0
                    ? averageReach.toLocaleString('en-IN')
                    : isInstagramConnected
                    ? 'Calculated from media'
                    : 'Requires Instagram'}
                </span>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-500 mt-0.5 block">
                  {isInstagramConnected ? 'Meta API Verified' : 'Auto-fetched on connection'}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-zinc-800/60 rounded-lg border border-[#E5E5DE] dark:border-zinc-700">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#71717A] dark:text-zinc-400 block">
                  Engagement Rate
                </span>
                <span className="font-mono text-sm font-bold text-[#121214] dark:text-white mt-0.5 block">
                  {isInstagramConnected && engagementRate > 0
                    ? `${engagementRate.toFixed(1)}%`
                    : isInstagramConnected
                    ? 'Calculated from media'
                    : 'Requires Instagram'}
                </span>
                <span className="text-[10px] text-[#71717A] dark:text-zinc-500 mt-0.5 block">
                  {isInstagramConnected ? 'Meta API Verified' : 'Auto-fetched on connection'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(5)}>
              <span>Next: Create Packages</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: CREATE PACKAGES */}
      {step === 5 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <div>
              <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Promotion Packages</h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
                Define transparent deliverables and pricing for app and website founders.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddPackage}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Package</span>
            </Button>
          </div>

          <div className="space-y-4">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="p-4 bg-[#FBFBFA] dark:bg-zinc-900/60 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="editorial-label text-[#FF5416]">Package #{idx + 1}</span>
                  <span className="font-mono font-bold text-[#121214] dark:text-white">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#121214] dark:text-white block mb-1">Package Name</label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].name = e.target.value;
                        setPackages(updated);
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#121214] dark:text-white block mb-1">Price (₹ INR)</label>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].price = Number(e.target.value);
                        setPackages(updated);
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#121214] dark:text-white block mb-1">Delivery Time (Days)</label>
                    <input
                      type="number"
                      value={pkg.delivery_days}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].delivery_days = Number(e.target.value);
                        setPackages(updated);
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#121214] dark:text-white block mb-1">Revisions Allowed</label>
                    <input
                      type="number"
                      value={pkg.revisions ?? 1}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].revisions = Number(e.target.value);
                        setPackages(updated);
                      }}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1 text-xs">Description & Deliverables</label>
                  <textarea
                    rows={2}
                    value={pkg.description}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[idx].description = e.target.value;
                      setPackages(updated);
                    }}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs text-[#121214] dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(6)}>
              <span>Next: Choose Your Work</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: CHOOSE YOUR WORK (INSTAGRAM REEL SELECTION) */}
      {step === 6 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Choose Your Work</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Your recent Instagram Reels are fetched automatically. Choose which ones you want businesses to see on your profile, and select one primary Featured Reel.
            </p>
          </div>

          {/* Reels Selection Grid */}
          {reels.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-[#121214] dark:text-white">
                  Fetched Reels ({reels.length})
                </span>
                <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                  {reels.filter((r) => r.is_visible !== false).length} visible •{' '}
                  {reels.find((r) => r.is_featured)?.title || '1 featured'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reels.map((reel) => {
                  const isFeatured = Boolean(reel.is_featured);
                  const isVisible = reel.is_visible !== false;

                  return (
                    <div
                      key={reel.id}
                      className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all ${
                        isFeatured
                          ? 'border-[#FF5416] bg-[#FFF2EC]/30 dark:bg-[#FF5416]/10 ring-1 ring-[#FF5416]'
                          : isVisible
                          ? 'border-[#E5E5DE] dark:border-zinc-700 bg-[#FBFBFA] dark:bg-zinc-900/80'
                          : 'border-[#E5E5DE]/60 dark:border-zinc-800 bg-[#F4F4F0]/40 dark:bg-zinc-950/40 opacity-60'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-24 bg-black rounded-lg overflow-hidden shrink-0 relative">
                          <ReelVideo
                            src={reel.video_url || reel.reel_url || ''}
                            poster={reel.thumbnail_url}
                            autoPlay={false}
                            loop={false}
                            muted={true}
                            playsInline={true}
                            className="w-full h-full object-cover"
                          />
                          {isFeatured && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#FF5416] text-white text-[9px] font-mono font-bold tracking-wider uppercase shadow">
                              Featured
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="font-bold text-xs text-[#121214] dark:text-white line-clamp-2">
                            {reel.title || 'Instagram Reel'}
                          </h4>
                          {reel.view_count !== undefined && reel.view_count !== null && (
                            <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400 block">
                              {reel.view_count.toLocaleString('en-IN')} views
                            </span>
                          )}
                          {reel.like_count !== undefined && reel.like_count !== null && (
                            <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-500 block">
                              {reel.like_count.toLocaleString('en-IN')} likes
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 mt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setReels(
                              reels.map((r) => ({
                                ...r,
                                is_featured: r.id === reel.id,
                                is_visible: r.id === reel.id ? true : r.is_visible,
                              }))
                            );
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                            isFeatured
                              ? 'bg-[#FF5416] text-white'
                              : 'bg-[#F4F4F0] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300 hover:text-black dark:hover:text-white'
                          }`}
                        >
                          {isFeatured ? '★ Featured' : 'Set as Featured'}
                        </button>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            disabled={isFeatured}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReels(
                                reels.map((r) =>
                                  r.id === reel.id ? { ...r, is_visible: checked } : r
                                )
                              );
                            }}
                            className="rounded border-zinc-300 text-[#FF5416] focus:ring-[#FF5416]"
                          />
                          <span>Show in Portfolio</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-[#E5E5DE] dark:border-zinc-700 rounded-xl text-center space-y-3 bg-[#FBFBFA] dark:bg-zinc-900/40">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF2EC] dark:bg-[#FF5416]/10 flex items-center justify-center text-[#FF5416]">
                <InstagramIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#121214] dark:text-white font-mono">
                  No Instagram Reels Synced Yet
                </h4>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
                  Connect your Instagram in Step 4 to automatically fetch your recent Reels, or add an Instagram Reel link directly below.
                </p>
              </div>
            </div>
          )}

          {/* Add Instagram Reel Link directly */}
          <div className="p-4 bg-[#F4F4F0]/60 dark:bg-zinc-900/60 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-[#121214] dark:text-white flex items-center gap-1.5">
              <InstagramIcon className="w-3.5 h-3.5 text-[#FF5416]" />
              <span>Add Specific Instagram Reel by URL</span>
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Reel Title (e.g. App Walkthrough)"
                value={newReelTitle}
                onChange={(e) => setNewReelTitle(e.target.value)}
                className="w-full sm:w-1/3 py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-xs text-[#121214] dark:text-white"
              />
              <input
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={instagramReelUrl}
                onChange={(e) => {
                  setInstagramReelUrl(e.target.value);
                  if (reelUrlError) setReelUrlError(null);
                }}
                className="flex-1 py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-xs text-[#121214] dark:text-white font-mono focus:outline-none focus:border-[#FF5416]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddInstagramReel}
                disabled={!instagramReelUrl.trim()}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Reel</span>
              </Button>
            </div>
            {reelUrlError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-mono">{reelUrlError}</p>
            )}
          </div>

          {onboardingError && (
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{onboardingError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(5)} disabled={isSaving}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinishOnboarding}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Saving Creator Profile...</span>
                </>
              ) : (
                <>
                  <span>Publish Profile & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
