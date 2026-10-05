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

  // Step 6: Show Your Work (Reel Upload - Max 19MB)
  const [reels, setReels] = useState<CreatorReel[]>([]);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const handleReelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingReel(true);
    setUploadProgress(10);

    // Pre-validation of 19MB limit & video format
    const validation = reelStorageService.validateReelFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid video file');
      setIsUploadingReel(false);
      setUploadProgress(0);
      return;
    }

    const uploadRes = await reelStorageService.uploadReel(
      file,
      'temp_onboarding',
      (pct) => setUploadProgress(pct)
    );

    if (!uploadRes.success || !uploadRes.videoUrl) {
      setUploadError(uploadRes.error || 'Failed to upload video');
      setIsUploadingReel(false);
      setUploadProgress(0);
      return;
    }

    const newReel: CreatorReel = {
      id: `reel_${Date.now()}`,
      creator_id: 'temp',
      title: newReelTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
      video_url: uploadRes.videoUrl,
      storage_path: uploadRes.storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
      created_at: new Date().toISOString(),
    };

    setReels([...reels, newReel]);
    setNewReelTitle('');
    setIsUploadingReel(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          verification_status: isVerifiedIg ? 'verified' : 'unverified',
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

      {/* STEP 4: AUDIENCE METRICS & INSTAGRAM (OPTIONAL) */}
      {step === 4 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
                Audience Reach & Metrics
              </h2>
              <span className="text-[11px] font-mono text-[#71717A] bg-[#F4F4F0] dark:bg-zinc-800 px-2 py-0.5 rounded border border-[#E5E5DE] dark:border-zinc-700">
                Instagram Optional
              </span>
            </div>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Enter your follower and audience metrics. You can optionally connect Instagram for automatic verification or enter your numbers manually.
            </p>
          </div>

          {igError && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                <p className="font-semibold">Instagram Connection Notice</p>
                <p>
                  Instagram couldn&apos;t be connected right now ({igError}). You can enter your metrics manually below and finish onboarding, or connect Instagram anytime later from your Settings.
                </p>
              </div>
            </div>
          )}

          {/* Optional Instagram Connect Card */}
          <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-[#121214] dark:text-white font-mono">
                      {isInstagramConnected
                        ? `@${instagramUsername || 'connected'}`
                        : 'Instagram Verification'}
                    </h4>
                    {isInstagramConnected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5416]" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#71717A] dark:text-zinc-400">
                    {isInstagramConnected
                      ? 'Meta Graph API Verified & Connected'
                      : (currentUser?.email || '').toLowerCase().trim() === 'khormasti104@gmail.com'
                      ? 'Connect your professional creator account for verified badges.'
                      : 'Coming soon — Instagram verification is currently being finalized.'}
                  </span>
                </div>
              </div>

              <div>
                {isInstagramConnected ? (
                  <span className="text-xs px-2.5 py-1 rounded bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-mono font-medium border border-green-200 dark:border-green-800">
                    Verified ✓
                  </span>
                ) : (currentUser?.email || '').toLowerCase().trim() === 'khormasti104@gmail.com' ? (
                  <a
                    href="/api/auth/instagram/authorize?returnTo=%2Fauth%2Fonboarding%2Fcreator"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF5416] text-white hover:bg-[#E04408] text-xs font-semibold font-mono transition-colors"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    <span>Connect Instagram</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E5E5DE] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-400 text-xs font-semibold font-mono cursor-not-allowed border border-[#D4D4CE] dark:border-zinc-700"
                  >
                    <span>Coming Soon</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Core Metrics Entry (Self-Declared or Verified) */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#121214] dark:text-white uppercase tracking-wider">
                Platform Performance Metrics
              </span>
              <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                {isInstagramConnected ? 'Source: Meta Graph API (Verified)' : 'Source: Self-Declared (Manual)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Followers Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={followerCount}
                  onChange={(e) => setFollowerCount(Number(e.target.value) || 0)}
                  placeholder="e.g. 15000"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white font-mono focus:outline-none focus:border-[#FF5416]"
                />
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1 block">
                  Total followers across platforms
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Average Reach (Per Reel)
                </label>
                <input
                  type="number"
                  min={0}
                  value={averageReach}
                  onChange={(e) => setAverageReach(Number(e.target.value) || 0)}
                  placeholder="e.g. 8500"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white font-mono focus:outline-none focus:border-[#FF5416]"
                />
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1 block">
                  Estimated average views / impressions
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                  Engagement Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={engagementRate}
                  onChange={(e) => setEngagementRate(Number(e.target.value) || 0)}
                  placeholder="e.g. 4.5"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white font-mono focus:outline-none focus:border-[#FF5416]"
                />
                <span className="text-[10px] text-[#71717A] dark:text-zinc-400 mt-1 block">
                  Average likes & comments / views ratio
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
              <span>Next: Show Your Work (Upload Reel)</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: SHOW YOUR WORK (19MB REEL UPLOAD) */}
      {step === 6 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Show Your Work</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Upload at least one short reel sample (existing brand campaign or creative demo). Max file size: 19 MB.
            </p>
          </div>

          {/* Current Reels Preview */}
          {reels.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[#121214] dark:text-white block">Uploaded Video Samples:</span>
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className="flex items-center justify-between p-3.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-black rounded overflow-hidden relative shrink-0">
                      <ReelVideo src={reel.video_url} autoPlay={true} loop={true} muted={true} playsInline={true} className="w-full h-full" />
                    </div>

                    <div>
                      <h4 className="font-mono text-xs font-bold text-[#121214] dark:text-white">{reel.title}</h4>
                      <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-400 block mt-0.5">
                        {reel.file_size_bytes ? `${(reel.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '19MB limit verified'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeReel(reel.id)}
                    className="p-1.5 text-[#71717A] hover:text-red-600 transition-colors"
                    aria-label="Remove reel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Reel Upload Component with 19MB Enforcement */}
          <div className="p-5 bg-[#F4F4F0]/60 dark:bg-zinc-900/60 border border-dashed border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="editorial-label text-[#FF5416]">Upload Reel (Max 19 MB)</span>
              <span className="text-[11px] font-mono text-zinc-500">Short-form vertical video</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#121214] dark:text-white block mb-1">Reel Title / Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Fintech App UI Walkthrough"
                  value={newReelTitle}
                  onChange={(e) => setNewReelTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#121214] dark:text-white block mb-1">Content Sample Type</label>
                <select
                  value={newReelType}
                  onChange={(e) => setNewReelType(e.target.value as ReelType)}
                  className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-xs text-[#121214] dark:text-white"
                >
                  <option value="client_work">Promotional Campaign</option>
                  <option value="demo">Sample / Demo Reel</option>
                </select>
              </div>
            </div>

            {/* Upload Button & Progress */}
            <div className="space-y-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleReelUpload}
                className="hidden"
                id="reel-file-upload-step"
              />

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label
                  htmlFor="reel-file-upload-step"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF5416] text-white hover:bg-[#E04408] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingReel ? `Uploading (${uploadProgress}%)...` : 'Select Short Video (MP4 / WebM)'}</span>
                </label>

                <span className="text-[11px] text-[#71717A] dark:text-zinc-400 font-mono">
                  Strictly under 19 MB • 9:16 vertical recommended
                </span>
              </div>

              {isUploadingReel && (
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF5416] h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </p>
              )}

              {/* Or Add Instagram Reel Link directly without video file upload */}
              <div className="pt-3 border-t border-[#ECECE6] dark:border-zinc-800 space-y-2">
                <span className="text-xs font-semibold text-[#121214] dark:text-white flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-[#FF5416]" />
                  <span>Or Add Instagram Reel Link</span>
                </span>
                <div className="flex gap-2">
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
            </div>
          </div>

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
