'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { Button } from '@/components/ui/Button';
import { instagramService } from '@/lib/services/instagramService';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import { CreatorPackage } from '@/types/marketplace';

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { onboardCreator } = useMarketplace();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('Ananya Verma');
  const [displayName, setDisplayName] = useState('Creator 099');
  const [city, setCity] = useState('Varanasi');
  const [niche, setNiche] = useState('Food • Lifestyle');
  const [bio, setBio] = useState(
    'Culinary trails and heritage food stories across Uttar Pradesh. Dedicated to slow-cooked regional recipes and artisanal kitchen craft.'
  );

  // Step 2: Instagram connection
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);
  const [isConnectingIG, setIsConnectingIG] = useState(false);

  // Step 3: Verified Metrics
  const [followerCount, setFollowerCount] = useState(24600);
  const [averageReach, setAverageReach] = useState(48200);
  const [engagementRate, setEngagementRate] = useState(5.1);

  // Step 4: Packages
  const [packages, setPackages] = useState<CreatorPackage[]>([
    {
      id: 'p_custom_1',
      creator_id: 'temp',
      name: '1 Reel',
      description: '30-45s vertical video featuring your product on-location.',
      price: 2500,
      delivery_days: 5,
      revision_count: 1,
      active: true,
    },
    {
      id: 'p_custom_2',
      creator_id: 'temp',
      name: '3 Stories',
      description: 'Sequential vertical frames with interactive sticker and link.',
      price: 1200,
      delivery_days: 3,
      revision_count: 1,
      active: true,
    },
  ]);

  const handleConnectInstagram = async () => {
    setIsConnectingIG(true);
    const metrics = await instagramService.mockDevelopmentConnect('temp_id');
    setTimeout(() => {
      setIsInstagramConnected(true);
      setFollowerCount(metrics.followerCount);
      setAverageReach(metrics.averageReach);
      setEngagementRate(metrics.engagementRate);
      setIsConnectingIG(false);
    }, 600);
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
    });
    router.push('/dashboard/creator');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header & Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="editorial-label text-[#FF5416]">Creator Onboarding</span>
          <span className="text-xs font-mono text-[#71717A]">Step 0{step} of 05</span>
        </div>

        <div className="w-full bg-[#E5E5DE] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#FF5416] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: BASIC INFORMATION */}
      {step === 1 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Basic Information</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Your real name remains private. Businesses identify you by your anonymized creator ID.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Full Legal Name (Private)</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#121214] block mb-1">Marketplace Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#121214] block mb-1">Primary City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Category / Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              >
                <option value="Food • Lifestyle">Food • Lifestyle</option>
                <option value="Tech • Productivity">Tech • Productivity</option>
                <option value="Fashion • Editorial">Fashion • Editorial</option>
                <option value="Design • Architecture">Design • Architecture</option>
                <option value="Fitness • Calisthenics">Fitness • Calisthenics</option>
                <option value="Travel • Coastal Living">Travel • Coastal Living</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#121214] block mb-1">Creator Bio</label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-[#FBFBFA] border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#ECECE6]">
            <Button variant="primary" size="md" onClick={() => setStep(2)}>
              <span>Continue to Step 2</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: INSTAGRAM CONNECTION */}
      {step === 2 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Instagram Verification</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Connect your account to sync verified metrics. Your handle is strictly confidential and never displayed publicly.
            </p>
          </div>

          <div className="p-6 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E5E5DE] flex items-center justify-center mx-auto text-[#FF5416] shadow-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>

            <div>
              <h3 className="font-mono text-base font-bold text-[#121214]">
                Meta Graph API OAuth Connection
              </h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto mt-1">
                Authorizes read-only access to follower analytics and audience demographics.
              </p>
            </div>

            {isInstagramConnected ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md text-xs font-mono text-[#047857] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Instagram account connected ✓</span>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                isLoading={isConnectingIG}
                onClick={handleConnectInstagram}
              >
                <span>Authorize & Sync Instagram Metrics</span>
              </Button>
            )}

            <div className="text-[11px] text-[#A1A1AA] font-mono">
              Development sample verification mode ready
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!isInstagramConnected}
              onClick={() => setStep(3)}
            >
              <span>Next: Review Metrics</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: CREATOR STATISTICS */}
      {step === 3 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-2xl font-bold text-[#121214]">Verified Creator Metrics</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Automatically pulled from connected account analytics.
              </p>
            </div>
            <span className="text-xs font-mono text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0]">
              Verified metrics ✓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
              <span className="editorial-label text-[#71717A]">Followers</span>
              <div className="font-mono text-2xl font-bold text-[#121214] mt-1">
                {(followerCount / 1000).toFixed(1)}K
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
              <span className="editorial-label text-[#71717A]">30-Day Reach</span>
              <div className="font-mono text-2xl font-bold text-[#121214] mt-1">
                {(averageReach / 1000).toFixed(1)}K
              </div>
            </div>

            <div className="bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg p-4 text-center">
              <span className="editorial-label text-[#71717A]">Engagement</span>
              <div className="font-mono text-2xl font-bold text-[#FF5416] mt-1">
                {engagementRate}%
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded-lg text-xs font-mono space-y-2 text-[#52525B]">
            <div className="flex justify-between">
              <span>Audience Location:</span>
              <strong className="text-[#121214]">{city} (38%)</strong>
            </div>
            <div className="flex justify-between">
              <span>Age Demographic:</span>
              <strong className="text-[#121214]">18–24 (48%)</strong>
            </div>
            <div className="flex justify-between">
              <span>Gender Split:</span>
              <strong className="text-[#121214]">58% Female / 42% Male</strong>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(4)}>
              <span>Next: Set Rate Card</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: RATE CARD */}
      {step === 4 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <h2 className="font-mono text-2xl font-bold text-[#121214]">Collaboration Rate Card</h2>
            <p className="text-xs text-[#71717A] mt-1">
              Configure fixed packages for businesses to purchase directly without back-and-forth negotiations.
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

                <div className="text-xs">
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
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={() => setStep(5)}>
              <span>Next: Preview Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: PROFILE PREVIEW */}
      {step === 5 && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#047857]">Step 05 of 05</span>
            <h2 className="font-mono text-2xl font-bold text-[#121214] mt-1">Profile Preview</h2>
            <p className="text-xs text-[#71717A] mt-1">
              This is exactly how Indian brands and agencies will see your marketplace listing.
            </p>
          </div>

          {/* Card preview */}
          <div className="border-2 border-[#121214] rounded-lg p-6 bg-[#FBFBFA] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">{niche}</span>
                <h3 className="font-mono text-2xl font-bold text-[#121214] mt-0.5">{displayName}</h3>
                <p className="text-xs text-[#71717A]">{city}</p>
              </div>

              <span className="text-xs font-mono text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded border border-[#A7F3D0]">
                Verified metrics ✓
              </span>
            </div>

            <p className="text-xs text-[#52525B] leading-relaxed">{bio}</p>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#ECECE6] text-center font-mono text-xs">
              <div>
                <strong className="block text-sm text-[#121214]">{(followerCount / 1000).toFixed(1)}K</strong>
                <span className="text-[10px] text-[#71717A]">Followers</span>
              </div>
              <div className="border-x border-[#E5E5DE]">
                <strong className="block text-sm text-[#121214]">{engagementRate}%</strong>
                <span className="text-[10px] text-[#71717A]">Engagement</span>
              </div>
              <div>
                <strong className="block text-sm text-[#121214]">₹{packages[0]?.price.toLocaleString('en-IN')}</strong>
                <span className="text-[10px] text-[#71717A]">Starting</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#ECECE6]">
            <Button variant="outline" size="sm" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={handleFinishOnboarding}>
              <span>Launch Creator Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
