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
  Play,
  Film,
  Sparkles,
} from 'lucide-react';

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { onboardCreator } = useMarketplace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Basic profile
  const [displayName, setDisplayName] = useState('Priya Sharma');
  const [city, setCity] = useState('Varanasi');
  const [bio, setBio] = useState(
    'Artisanal coffee and heritage lifestyle storyteller. Creating authentic vertical reels for hospitality, food, and culture brands.'
  );

  // Step 2: Categories / niche
  const [niche, setNiche] = useState('Food & Hospitality');

  // Step 3: Audience information
  const [followerCount, setFollowerCount] = useState(24000);
  const [averageReach, setAverageReach] = useState(48000);
  const [engagementRate, setEngagementRate] = useState(4.8);
  const [topAudienceCity, setTopAudienceCity] = useState('Varanasi');

  // Step 4: Upload work (Reels)
  const [reels, setReels] = useState<CreatorReel[]>([
    {
      id: 'onboard_reel_1',
      creator_id: 'temp',
      title: 'Cafe Pour-Over & Pastry Tasting',
      video_url: '/reels/demo-reel-01.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      type: 'client_work',
      sort_order: 1,
      is_featured: true,
      is_visible: true,
      created_at: new Date().toISOString(),
    },
  ]);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelType, setNewReelType] = useState<ReelType>('client_work');

  // Step 5: Packages
  const [packages, setPackages] = useState<CreatorPackage[]>([
    {
      id: 'p_onboard_1',
      creator_id: 'temp',
      name: '1 Promotional Reel',
      description: '30-45s vertical reel filmed on-location with organic storytelling.',
      price: 3500,
      delivery_days: 5,
      revision_count: 1,
      active: true,
    },
    {
      id: 'p_onboard_2',
      creator_id: 'temp',
      name: '1 Reel + 3 Stories',
      description: 'Full promotional package with on-site reel and interactive story tags.',
      price: 5500,
      delivery_days: 6,
      revision_count: 2,
      active: true,
    },
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploadingReel(true);

    const validation = reelStorageService.validateReelFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      setIsUploadingReel(false);
      return;
    }

    const uploadRes = await reelStorageService.uploadReel(file, 'onboarding_temp');
    if (!uploadRes.success || !uploadRes.videoUrl) {
      setUploadError(uploadRes.error || 'Failed to upload video');
      setIsUploadingReel(false);
      return;
    }

    const newReel: CreatorReel = {
      id: `reel_${Date.now()}`,
      creator_id: 'temp',
      title: newReelTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
      video_url: uploadRes.videoUrl,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
      created_at: new Date().toISOString(),
    };

    setReels([...reels, newReel]);
    setNewReelTitle('');
    setIsUploadingReel(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeReel = (reelId: string) => {
    setReels(reels.filter((r) => r.id !== reelId));
  };

  const handleFinishOnboarding = () => {
    onboardCreator({
      profile: {
        id: 'new_creator',
        role: 'creator',
        display_name: displayName,
        email: `${displayName.toLowerCase().replace(/\s+/g, '')}@marketur.local`,
        city,
        created_at: new Date().toISOString(),
      },
      niche,
      bio,
      follower_count: followerCount,
      average_reach: averageReach,
      engagement_rate: engagementRate,
      packages,
      reels,
    });
    router.push('/dashboard/creator');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header & Steps Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="editorial-label text-[#FF5416]">Creator Onboarding</span>
          <span className="text-xs font-mono text-[#71717A]">Step 0{step} of 06</span>
        </div>

        <div className="w-full bg-[#E5E5DE] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#FF5416] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: BASIC PROFILE */}
      {step === 1 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Basic Profile</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Introduce yourself to businesses looking for creators in your region.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">City / Region</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Varanasi, Bengaluru, Mumbai"
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Creator Bio</label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell brands what kind of content you specialize in..."
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ECECE6]">
            <Button variant="primary" size="md" onClick={() => setStep(2)}>
              <span>Next: Categories & Niche</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: CATEGORIES / NICHE */}
      {step === 2 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Categories & Niche</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Select the primary category that matches the audience and content you produce.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Food & Hospitality',
              'Fitness & Wellness',
              'Fashion & Style',
              'Travel & Heritage',
              'Tech & Gadgets',
              'Art & Handcraft',
              'Beauty & Skincare',
              'Business & Finance',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setNiche(cat)}
                className={`p-3.5 rounded-lg border text-left text-xs font-mono font-medium transition-all ${
                  niche === cat
                    ? 'border-[#FF5416] bg-[#FFF2EC] text-[#FF5416]'
                    : 'border-[#E5E5DE] bg-[#FBFBFA] text-[#121214] hover:border-[#121214]/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
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
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Audience Information</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Provide your audience numbers. Brands use these as secondary indicators alongside your work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Total Followers</label>
              <input
                type="number"
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Average 30-Day Reach</label>
              <input
                type="number"
                value={averageReach}
                onChange={(e) => setAverageReach(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Engagement Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={engagementRate}
                onChange={(e) => setEngagementRate(Number(e.target.value))}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Primary Audience City</label>
              <input
                type="text"
                value={topAudienceCity}
                onChange={(e) => setTopAudienceCity(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(4)}>
              <span>Next: Upload Work</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: UPLOAD WORK (REELS) */}
      {step === 4 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Show businesses what you can create.</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Upload a reel you've made for a client or a sample/demo of your work.
            </p>
          </div>

          {/* Current Reels List */}
          <div className="space-y-3">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="flex items-center justify-between p-3.5 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-16 bg-[#18181B] rounded overflow-hidden relative shrink-0">
                    {reel.thumbnail_url ? (
                      <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <video src={reel.video_url} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Film className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-mono text-xs font-bold text-[#121214]">{reel.title}</h4>
                    <span className="text-[10px] font-mono text-[#71717A] block mt-0.5">
                      {reel.type === 'client_work' ? 'Previous Work' : 'Creative Demo'}
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

          {/* Upload Reel Box */}
          <div className="p-4 bg-[#F4F4F0]/60 border border-dashed border-[#E5E5DE] rounded-xl space-y-3">
            <span className="editorial-label text-[#FF5416]">Add a Reel</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#121214] block mb-1">Reel Title</label>
                <input
                  type="text"
                  placeholder="e.g. Artisanal Cafe Walkthrough"
                  value={newReelTitle}
                  onChange={(e) => setNewReelTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-[#E5E5DE] rounded-md"
                />
              </div>

              <div>
                <label className="font-semibold text-[#121214] block mb-1">Work Type</label>
                <select
                  value={newReelType}
                  onChange={(e) => setNewReelType(e.target.value as ReelType)}
                  className="w-full py-2 px-3 bg-white border border-[#E5E5DE] rounded-md font-mono text-xs"
                >
                  <option value="client_work">Client Work</option>
                  <option value="demo">Demo / Sample Reel</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileUpload}
                className="hidden"
                id="reel-file-upload"
              />

              <label
                htmlFor="reel-file-upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#121214] bg-[#121214] text-white hover:bg-[#FF5416] hover:border-[#FF5416] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingReel ? 'Uploading Video...' : 'Upload Video (MP4 / WebM)'}</span>
              </label>

              <span className="text-[11px] text-[#71717A] font-mono">
                Vertical 9:16 recommended (max 100MB)
              </span>
            </div>

            {uploadError && (
              <p className="text-xs text-red-600 font-mono">{uploadError}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={reels.length === 0}
              onClick={() => setStep(5)}
            >
              <span>Next: Create Packages</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: CREATE PACKAGES */}
      {step === 5 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Create Packages</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Set clear fixed packages so businesses can book without friction.
            </p>
          </div>

          <div className="space-y-4">
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="editorial-label text-[#FF5416]">Package #{idx + 1}</span>
                  <span className="font-mono font-bold text-[#121214]">₹{pkg.price.toLocaleString('en-IN')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#121214] block mb-1">Package Name</label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].name = e.target.value;
                        setPackages(updated);
                      }}
                      className="w-full py-1.5 px-2 bg-white border border-[#E5E5DE] rounded"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#121214] block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].price = Number(e.target.value);
                        setPackages(updated);
                      }}
                      className="w-full py-1.5 px-2 bg-white border border-[#E5E5DE] rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-[#121214] block mb-1">Description</label>
                    <input
                      type="text"
                      value={pkg.description}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].description = e.target.value;
                        setPackages(updated);
                      }}
                      className="w-full py-1.5 px-2 bg-white border border-[#E5E5DE] rounded"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#121214] block mb-1">Delivery Time (Days)</label>
                    <input
                      type="number"
                      value={pkg.delivery_days}
                      onChange={(e) => {
                        const updated = [...packages];
                        updated[idx].delivery_days = Number(e.target.value);
                        setPackages(updated);
                      }}
                      className="w-full py-1.5 px-2 bg-white border border-[#E5E5DE] rounded font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(6)}>
              <span>Next: Review Profile</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 6: REVIEW PROFILE */}
      {step === 6 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#047857]">Step 06 of 06</span>
            <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">Review Your Profile</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Your profile is ready. Here is a preview of how businesses will see your listing.
            </p>
          </div>

          {/* Profile Card Preview */}
          <div className="border border-[#121214] rounded-xl p-6 bg-[#FBFBFA] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">{niche}</span>
                <h3 className="font-mono text-2xl font-bold text-[#121214] mt-0.5">{displayName}</h3>
                <p className="text-xs text-[#71717A]">{city}</p>
              </div>

              <span className="text-xs font-mono text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0]">
                Verified profile ✓
              </span>
            </div>

            <p className="text-xs text-[#52525B] leading-relaxed">{bio}</p>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#ECECE6] text-center font-mono text-xs">
              <div>
                <strong className="block text-sm text-[#121214]">{(followerCount / 1000).toFixed(1)}K</strong>
                <span className="text-[10px] text-[#71717A]">Followers</span>
              </div>
              <div className="border-x border-[#E5E5DE]">
                <strong className="block text-sm text-[#121214]">{reels.length}</strong>
                <span className="text-[10px] text-[#71717A]">Reels</span>
              </div>
              <div>
                <strong className="block text-sm text-[#121214]">₹{packages[0]?.price.toLocaleString('en-IN')}</strong>
                <span className="text-[10px] text-[#71717A]">Starting</span>
              </div>
            </div>

            <div className="text-xs font-mono text-[#71717A]">
              <span>Featured Work: </span>
              <strong className="text-[#121214]">{reels[0]?.title || 'Portfolio Reel'}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(5)}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={handleFinishOnboarding}>
              <span>Publish Profile & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
