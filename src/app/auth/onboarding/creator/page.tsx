'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { CreatorPackage, CreatorReel, ReelType } from '@/types/marketplace';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Film,
  Sparkles,
  Camera,
  AlertCircle,
  Video,
} from 'lucide-react';

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

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { onboardCreator } = useMarketplace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Basic Information
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [languages, setLanguages] = useState<string[]>(['Hindi', 'English']);
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Step 2: Categories (Multiple)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Technology']);

  // Step 3: Audience Information
  const [audienceLocation, setAudienceLocation] = useState('Delhi NCR, Mumbai, Bengaluru');
  const [audienceAge, setAudienceAge] = useState('18-24 (54%), 25-34 (36%)');
  const [audienceGender, setAudienceGender] = useState('65% Male / 35% Female');
  const [audienceInterests, setAudienceInterests] = useState('Mobile Apps, SaaS, Gadgets, Productivity');

  // Step 4: Social / Platform Metrics
  const [followerCount, setFollowerCount] = useState<number>(45000);
  const [averageReach, setAverageReach] = useState<number>(32000);
  const [engagementRate, setEngagementRate] = useState<number>(4.8);
  const [monthlyViews, setMonthlyViews] = useState<number>(120000);

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

  const handleFinishOnboarding = () => {
    onboardCreator({
      profile: {
        id: 'new_influencer',
        role: 'influencer',
        display_name: displayName || 'Creator',
        email: `${(displayName || 'creator').toLowerCase().replace(/\s+/g, '')}@marketmyapp.in`,
        city: city || 'Bengaluru',
        created_at: new Date().toISOString(),
      },
      niche: selectedCategories[0] || 'Technology',
      bio: bio || 'Indian content creator helping apps reach targeted users.',
      follower_count: followerCount,
      average_reach: averageReach,
      engagement_rate: engagementRate,
      packages,
      reels: reels.length > 0 ? reels : [
        {
          id: 'default_reel_sample',
          creator_id: 'temp',
          title: 'Sample App Walkthrough',
          video_url: '/reels/demo-reel-01.mp4',
          type: 'client_work',
          sort_order: 1,
          is_featured: true,
          is_visible: true,
          created_at: new Date().toISOString(),
        }
      ],
    });
    router.push('/dashboard/creator');
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Delhi, Mumbai"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Karnataka, Maharashtra"
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                />
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
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button
              variant="primary"
              size="md"
              disabled={!displayName.trim()}
              onClick={() => setStep(2)}
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
              <span>Next: Social & Platform Metrics</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: SOCIAL / PLATFORM METRICS */}
      {step === 4 && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Platform Metrics</h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1">
              Provide your current stats. Metrics are stored as platform metrics and can be verified via Instagram later.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Transparency Note:</strong> Metrics are labeled as creator-declared platform metrics until the official Meta Graph API connection is authorized.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Total Followers
              </label>
              <input
                type="number"
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-[#121214] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Average 30-Day Reach
              </label>
              <input
                type="number"
                value={averageReach}
                onChange={(e) => setAverageReach(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-[#121214] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={engagementRate}
                onChange={(e) => setEngagementRate(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-[#121214] dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] dark:text-white block mb-1">
                Avg Reel Views
              </label>
              <input
                type="number"
                value={monthlyViews}
                onChange={(e) => setMonthlyViews(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-[#121214] dark:text-white"
              />
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
                      <video src={reel.video_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Film className="w-3.5 h-3.5 text-white" />
                      </div>
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
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
            <Button variant="outline" size="sm" onClick={() => setStep(5)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleFinishOnboarding}
            >
              <span>Publish Profile & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
