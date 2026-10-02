'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { CreatorProfile } from '@/types/marketplace';
import { PackageCard } from '@/components/marketplace/PackageCard';
import { ReelCard } from '@/components/marketplace/ReelCard';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Calendar,
  Sparkles,
  Film,
  ArrowRight,
  Package,
  Users,
  Info,
  X,
  Send,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    getCreator,
    isLoading: storeLoading,
    currentUser,
    campaigns,
    sendCollaborationRequest,
    collaborationRequests,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'work' | 'packages' | 'audience' | 'about'>('work');
  const [dbCreator, setDbCreator] = useState<CreatorProfile | null>(null);
  const [isFetchingDirect, setIsFetchingDirect] = useState(false);

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [proposedBudget, setProposedBudget] = useState<number>(0);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const creatorId = params.id as string;
  const storeCreator = getCreator(creatorId);

  useEffect(() => {
    if (!storeCreator && isSupabaseConfigured && creatorId) {
      setIsFetchingDirect(true);
      Promise.all([
        supabase
          .from('creator_profiles')
          .select(
            'id, user_id, display_name, bio, profile_image_path, country, state, city, languages, categories, niche, audience_age, audience_gender, audience_locations, follower_count, average_reach, engagement_rate, instagram_connected, instagram_user_id, instagram_verified, metrics_source, metrics_verified_at, verification_status, created_at, updated_at'
          )
          .eq('user_id', creatorId)
          .maybeSingle(),
        supabase.from('profiles').select('*').eq('id', creatorId).maybeSingle(),
        supabase.from('creator_packages').select('*').eq('creator_id', creatorId),
        supabase.from('creator_reels').select('*').eq('creator_id', creatorId).eq('is_visible', true),
      ])
        .then(([cpRes, profRes, pkgsRes, reelsRes]) => {
          if (cpRes.data) {
            const cp = cpRes.data;
            const prof = profRes.data;
            const pkgs = pkgsRes.data || [];
            const rls = reelsRes.data || [];
            setDbCreator({
              id: cp.id || cp.user_id,
              user_id: cp.user_id,
              profile: prof
                ? {
                    id: prof.id,
                    role: (prof.role as any) || 'creator',
                    display_name: cp.display_name || prof.display_name || 'Creator',
                    email: prof.email || '',
                    avatar_url: cp.profile_image_path || prof.avatar_url,
                    city: cp.city || prof.city || 'India',
                    created_at: prof.created_at,
                  }
                : undefined,
              display_name: cp.display_name || prof?.display_name || 'Creator',
              bio: cp.bio || '',
              profile_image_path: cp.profile_image_path || undefined,
              country: cp.country || 'India',
              state: cp.state || undefined,
              city: cp.city || prof?.city || 'India',
              languages: cp.languages || ['Hindi', 'English'],
              categories: cp.categories || [cp.niche],
              niche: cp.niche || 'Technology',
              audience_age: (cp.audience_age as any) || {},
              audience_gender: (cp.audience_gender as any) || {},
              audience_locations: Array.isArray(cp.audience_locations) ? (cp.audience_locations as any[]) : [],
              follower_count: cp.follower_count || 0,
              average_reach: cp.average_reach || 0,
              engagement_rate: Number(cp.engagement_rate) || 0,
              instagram_connected: cp.instagram_connected || false,
              instagram_verified: cp.instagram_verified || false,
              verification_status: cp.verification_status as any,
              packages: pkgs.map((p) => ({
                id: p.id,
                creator_id: p.creator_id,
                name: p.name,
                platform: p.platform as any,
                content_type: p.content_type as any,
                price: Number(p.price) || 0,
                currency: p.currency || 'INR',
                description: p.description || '',
                deliverables: p.deliverables || [],
                delivery_days: p.delivery_days || 5,
                revision_count: p.revision_count ?? 1,
                active: p.active ?? true,
              })),
              reels: rls.map((r) => ({
                id: r.id,
                creator_id: r.creator_id,
                title: r.title,
                description: r.description || undefined,
                video_url: r.video_url,
                thumbnail_url: r.thumbnail_url || undefined,
                type: r.type as any,
                sort_order: r.sort_order || 0,
                is_featured: r.is_featured || false,
                is_visible: r.is_visible !== false,
                created_at: r.created_at,
              })),
            });
          }
        })
        .finally(() => {
          setIsFetchingDirect(false);
        });
    }
  }, [storeCreator, creatorId]);

  const creator = storeCreator || dbCreator;

  if (storeLoading || isFetchingDirect) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading influencer profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">Influencer Not Found</h2>
        <p className="text-sm text-[#71717A] dark:text-[#A1A1AA]">
          The influencer profile you are looking for does not exist or has been removed.
        </p>
        <Link href="/discover">
          <Button variant="primary" size="sm">
            <span>Back to Discovery</span>
          </Button>
        </Link>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('en-IN');
  };

  const startingPrice =
    creator.starting_price ||
    (creator.packages && creator.packages.length > 0
      ? Math.min(...creator.packages.map((p) => p.price))
      : 0);

  const reels = creator.reels || [];

  const isOwnProfile = currentUser?.id === creator.user_id;
  const activePendingRequest = currentUser
    ? collaborationRequests.find(
        (r) =>
          r.business_user_id === currentUser.id &&
          r.creator_user_id === creator.user_id &&
          r.status === 'PENDING'
      )
    : null;

  const openRequestModal = (pkgId?: string) => {
    if (!currentUser) {
      router.push(`/auth/login?redirect=/creators/${creatorId}`);
      return;
    }
    const chosenPkg = pkgId
      ? creator.packages?.find((p) => p.id === pkgId)
      : creator.packages?.[0];

    if (chosenPkg) {
      setSelectedPackageId(chosenPkg.id);
      setProposedBudget(chosenPkg.price);
    } else {
      setSelectedPackageId('');
      setProposedBudget(startingPrice || 5000);
    }

    if (campaigns && campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }

    setRequestError(null);
    setRequestSuccess(false);
    setIsRequestModalOpen(true);
  };

  const handleSendCollaborationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/auth/login?redirect=/creators/${creatorId}`);
      return;
    }

    setIsSubmittingRequest(true);
    setRequestError(null);

    try {
      await sendCollaborationRequest({
        creatorUserId: creator.user_id,
        packageId: selectedPackageId || undefined,
        campaignId: selectedCampaignId || undefined,
        proposedBudget: Number(proposedBudget) || 0,
        message: initialMessage.trim() || undefined,
      });

      setRequestSuccess(true);
    } catch (err: any) {
      console.error('Error sending collaboration request:', err);
      setRequestError(err.message || 'Failed to send collaboration request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation breadcrumb */}
      <div>
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Influencer Directory</span>
        </Link>
      </div>

      {/* TOP SECTION: IDENTITY & METRICS */}
      <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {creator.profile?.avatar_url ? (
              <img
                src={creator.profile.avatar_url}
                alt={creator.profile.display_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#E5E5DE] dark:border-[#27272A] shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#F4F4F0] dark:bg-[#18181B] flex items-center justify-center font-mono font-bold text-2xl text-[#121214] dark:text-white border-2 border-[#E5E5DE] dark:border-[#27272A] shrink-0">
                {(creator.profile?.display_name || 'I')[0]}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="editorial-label text-[#FF5416]">{creator.niche}</span>
                <span className="text-[#D4D4D0] dark:text-[#3F3F46]">•</span>
                <span className="flex items-center gap-1 text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5416]" />
                  {creator.state
                    ? `${creator.city || creator.profile?.city}, ${creator.state}`
                    : (creator.city || creator.profile?.city || 'India')}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-mono text-[#047857] dark:text-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-[#065F46]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Platform Metrics</span>
                </div>
              </div>

              <h1 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#121214] dark:text-white tracking-tight">
                {creator.profile?.display_name}
              </h1>

              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] max-w-xl line-clamp-2 pt-0.5">
                {creator.bio}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
            {isOwnProfile ? (
              <Link href="/dashboard/creator">
                <Button variant="outline" size="md">
                  <span>Your Studio Dashboard</span>
                </Button>
              </Link>
            ) : activePendingRequest ? (
              <Link href="/dashboard/business">
                <Button variant="outline" size="md" className="border-[#047857] text-[#047857]">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Request Pending • View Status</span>
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('packages')}
                  className="w-full sm:w-auto"
                >
                  <span>View Packages</span>
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => openRequestModal()}
                  className="w-full sm:w-auto px-6"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>Send Request</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 4 CORE METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#ECECE6] dark:border-[#27272A]">
          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              {formatNumber(creator.follower_count)}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Followers</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              {formatNumber(creator.average_reach)}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Average Reach</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#FF5416]">
              {creator.engagement_rate}%
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Engagement</div>
          </div>

          <div className="bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl p-3.5 text-center">
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#121214] dark:text-white">
              ₹{startingPrice.toLocaleString('en-IN')}
            </div>
            <div className="editorial-label text-[#71717A] dark:text-[#A1A1AA] mt-1">Starting From</div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-[#27272A] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'work', label: `Work & Reels (${reels.length})`, icon: Film },
          { key: 'packages', label: `Packages (${creator.packages?.length || 0})`, icon: Package },
          { key: 'audience', label: 'Audience Demographics', icon: Users },
          { key: 'about', label: 'About & Details', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-bold'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-[#18181B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORK (RESPONSIVE REELS GRID) */}
      {activeTab === 'work' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <div>
              <span className="editorial-label text-[#FF5416]">Content Samples</span>
              <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
                Work & Video Reels
              </h2>
              <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Watch previous promotional videos, app walkthroughs, and sample reels.
              </p>
            </div>
            <span className="text-xs font-mono text-[#71717A] dark:text-[#A1A1AA]">
              {reels.length} video{reels.length === 1 ? '' : 's'} available
            </span>
          </div>

          {reels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {reels.map((reel) => (
                <div key={reel.id} className="w-full max-w-[300px] mx-auto sm:max-w-none">
                  <ReelCard reel={reel} showCreatorInfo={false} />
                  {reel.description && (
                    <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-2 font-mono line-clamp-2">
                      {reel.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#121214] border border-dashed border-[#E5E5DE] dark:border-[#27272A] rounded-2xl text-xs font-mono text-[#71717A]">
              Work samples coming soon.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Promotion Offerings</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              Available Collaboration Packages
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Standard deliverables with clear scope, timeline, and pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creator.packages?.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                creatorId={creator.user_id}
                onRequest={(pkgId) => openRequestModal(pkgId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIENCE DEMOGRAPHICS */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Audience Insights</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              Follower Distribution & Locations
            </h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Audience demographics to verify reach alignment for your app.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Locations */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Top Cities</h3>
              <div className="space-y-3">
                {creator.audience_locations.map((loc) => (
                  <div key={loc.city} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#121214] dark:text-white font-medium">{loc.city}</span>
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">{loc.percentage}%</span>
                    </div>
                    <div className="w-full bg-[#F4F4F0] dark:bg-[#27272A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FF5416] h-full rounded-full"
                        style={{ width: `${loc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Distribution */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Age Distribution</h3>
              <div className="space-y-3">
                {Object.entries(creator.audience_age).map(([range, pct]) => (
                  <div key={range} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#121214] dark:text-white font-medium">{range} years</span>
                      <span className="text-[#71717A] dark:text-[#A1A1AA]">{pct}%</span>
                    </div>
                    <div className="w-full bg-[#F4F4F0] dark:bg-[#27272A] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#121214] dark:bg-white h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Reach Intelligence</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Average Reach</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {formatNumber(creator.average_reach)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Estimated Views</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {formatNumber(Math.round(creator.average_reach * 1.35))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">Gender Split</span>
                  <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                    {creator.audience_gender.female}% F / {creator.audience_gender.male}% M
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ABOUT */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-[#121214] border border-[#E5E5DE] dark:border-[#27272A] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-[#27272A] pb-3">
            <span className="editorial-label text-[#FF5416]">Profile Summary</span>
            <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white mt-0.5">
              About {creator.profile?.display_name}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed">
              {creator.bio}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-mono">
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                <span className="text-[#71717A] dark:text-[#A1A1AA] block">Primary Niche:</span>
                <strong className="text-[#121214] dark:text-white text-sm">{creator.niche}</strong>
              </div>
              <div className="p-3 bg-[#FBFBFA] dark:bg-[#18181B] border border-[#E5E5DE] dark:border-[#27272A] rounded-xl">
                <span className="text-[#71717A] dark:text-[#A1A1AA] block">Location:</span>
                <strong className="text-[#121214] dark:text-white text-sm">
                  {creator.state
                    ? `${creator.city || creator.profile?.city}, ${creator.state}`
                    : (creator.city || creator.profile?.city || 'India')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND COLLABORATION REQUEST MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF5416]" />
                <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                  Send Collaboration Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestSuccess ? (
              <div className="text-center py-6 space-y-4 font-mono">
                <div className="w-12 h-12 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#047857] dark:text-[#34D399] flex items-center justify-center mx-auto border border-[#A7F3D0] dark:border-[#065F46]">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#121214] dark:text-white">
                    Request Sent Successfully!
                  </h4>
                  <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
                    {creator.profile?.display_name} has received your proposal. When they accept, private chat will unlock so you can discuss specifics and confirm the deal.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRequestModalOpen(false)}
                  >
                    Close
                  </Button>
                  <Link href="/dashboard/business">
                    <Button variant="primary" size="sm">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendCollaborationRequest} className="space-y-4 text-xs font-mono">
                {requestError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{requestError}</span>
                  </div>
                )}

                {/* Package selection */}
                {creator.packages && creator.packages.length > 0 && (
                  <div>
                    <label className="font-bold text-[#121214] dark:text-white block mb-1">
                      Choose Package (Optional)
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPackageId(val);
                        const pkg = creator.packages?.find((p) => p.id === val);
                        if (pkg) {
                          setProposedBudget(pkg.price);
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                    >
                      <option value="">-- Custom Collaboration / Open Discussion --</option>
                      {creator.packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} — ₹{pkg.price.toLocaleString('en-IN')} ({pkg.delivery_days} days delivery)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Campaign Selection if business has campaigns */}
                {campaigns && campaigns.length > 0 && (
                  <div>
                    <label className="font-bold text-[#121214] dark:text-white block mb-1">
                      Associate Campaign (Optional)
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                    >
                      <option value="">-- General / Direct Collaboration --</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.campaign_name} ({c.product_name})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Proposed Budget */}
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Proposed Budget (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#71717A]">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={proposedBudget || ''}
                      onChange={(e) => setProposedBudget(Number(e.target.value))}
                      placeholder="e.g. 5000"
                      className="w-full pl-7 pr-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                    />
                  </div>
                </div>

                {/* Initial Message */}
                <div>
                  <label className="font-bold text-[#121214] dark:text-white block mb-1">
                    Initial Message & Concept
                  </label>
                  <textarea
                    rows={3}
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    placeholder="Describe your app/website, target audience, and what you would like the influencer to create..."
                    className="w-full px-3 py-2 bg-[#FBFBFA] dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white placeholder-[#71717A]"
                  />
                </div>

                <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 rounded-lg text-[11px] text-[#71717A] dark:text-zinc-400">
                  Sending a request does NOT trigger an immediate charge. You will discuss specifics via private chat first, agree on deliverables, and finalize the deal.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRequestModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingRequest}
                  >
                    {isSubmittingRequest ? (
                      <span className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request</span>
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
