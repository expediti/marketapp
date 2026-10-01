'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorReel, ReelType, CreatorPackage } from '@/types/marketplace';
import { ConversationChat } from '@/components/chat/ConversationChat';
import {
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Layers,
  Sparkles,
  Film,
  Upload,
  Trash2,
  Star,
  Eye,
  EyeOff,
  User,
  Edit2,
  Plus,
  MessageSquare,
  Settings,
  AlertCircle,
  Camera,
} from 'lucide-react';

type TabKey =
  | 'overview'
  | 'profile'
  | 'reels'
  | 'packages'
  | 'requests'
  | 'active'
  | 'completed'
  | 'messages'
  | 'settings';

interface DbCreatorState {
  user_id: string;
  display_name?: string | null;
  profile_image_path?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  created_at?: string | null;
  niche?: string | null;
  bio?: string | null;
  follower_count?: number | null;
  average_reach?: number | null;
  engagement_rate?: number | null;
  creator_packages?: CreatorPackage[];
}

function generatePackageId(): string {
  return `pkg_${Date.now()}`;
}

export const dynamic = 'force-dynamic';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const {
    orders,
    acceptOrder,
    declineOrder,
    currentUser,
    collaborationRequests,
    acceptCollaborationRequest,
    declineCollaborationRequest,
    conversations,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dbCreator, setDbCreator] = useState<DbCreatorState | null>(null);
  const [packages, setPackages] = useState<CreatorPackage[]>([]);
  const [reels, setReels] = useState<CreatorReel[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Reels management
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelType, setNewReelType] = useState<ReelType>('client_work');

  // Package creation modal/state
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState(3000);
  const [newPkgDelivery, setNewPkgDelivery] = useState(4);
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [isSavingPkg, setIsSavingPkg] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const loadDbCreator = async () => {
    setIsLoadingAuth(true);
    setPageError(null);

    if (!isSupabaseConfigured) {
      setIsLoadingAuth(false);
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/auth/login');
        return;
      }

      // 1. Verify profile and role
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('id, role, display_name, city, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profError) {
        console.error('Error loading profile in creator dashboard:', profError);
      }

      if (!profile?.role) {
        router.replace('/auth/role-select');
        return;
      }

      const normalizedRole = profile.role.toLowerCase();
      if (normalizedRole === 'business' || normalizedRole === 'advertiser') {
        router.replace('/dashboard/business');
        return;
      }

      // 2. Query creator data using exact auth UUID
      const [cpRes, pkgsRes, reelsRes] = await Promise.all([
        supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('creator_packages').select('*').eq('creator_id', user.id),
        supabase.from('creator_reels').select('*').eq('creator_id', user.id).order('sort_order', { ascending: true }),
      ]);

      if (cpRes.error) {
        console.error('Error loading creator profile:', cpRes.error);
      }

      if (cpRes.data) {
        setDbCreator({
          ...cpRes.data,
          creator_packages: (pkgsRes.data as unknown as CreatorPackage[]) || [],
        });
        setPackages((pkgsRes.data as unknown as CreatorPackage[]) || []);
      } else {
        // Safe recovery if creator profile does not exist yet (matches business dashboard pattern)
        const meta = user.user_metadata || {};
        const fallbackName = meta.full_name || meta.name || profile.display_name || 'Creator';
        const fallbackAvatar = meta.avatar_url || meta.picture || profile.avatar_url || null;
        const { data: newCp, error: newCpErr } = await supabase
          .from('creator_profiles')
          .upsert(
            {
              user_id: user.id,
              display_name: fallbackName,
              bio: 'Content creator helping apps reach targeted users.',
              profile_image_path: fallbackAvatar,
              country: 'India',
              city: profile.city || 'India',
              niche: 'Technology',
              categories: ['Technology'],
              languages: ['Hindi', 'English'],
              follower_count: 0,
              average_reach: 0,
              engagement_rate: 0,
              verification_status: 'unverified',
              metrics_source: 'platform_manual',
            },
            { onConflict: 'user_id' }
          )
          .select('*')
          .maybeSingle();

        if (newCp) {
          setDbCreator({
            ...newCp,
            creator_packages: (pkgsRes.data as unknown as CreatorPackage[]) || [],
          });
          setPackages((pkgsRes.data as unknown as CreatorPackage[]) || []);
        } else {
          console.error('Failed to auto-recover creator profile:', newCpErr);
          router.replace('/auth/onboarding/creator');
          return;
        }
      }

      if (reelsRes.data) {
        setReels(reelsRes.data as unknown as CreatorReel[]);
      } else {
        setReels([]);
      }
    } catch (err) {
      console.error('Error loading creator dashboard:', err);
      setPageError('Unable to load influencer studio. Please try again.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadDbCreator();
  }, [router]);

  const creatorId = dbCreator?.user_id || currentUser?.id || '';

  const handleAcceptCollabRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await acceptCollaborationRequest(requestId);
      setActiveTab('messages');
    } catch (err) {
      console.error('Failed to accept collaboration request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineCollabRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await declineCollaborationRequest(requestId, 'Declined by creator');
    } catch (err) {
      console.error('Failed to decline collaboration request:', err);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Real orders for this creator (query by creator_id OR creator_user_id)
  const creatorOrders = (orders || []).filter(
    (o) =>
      o.creator_id === creatorId ||
      o.creator_user_id === creatorId ||
      o.creator?.user_id === creatorId
  );

  // Incoming collaboration requests where creator_user_id = auth.uid()
  const incomingRequests = (collaborationRequests || []).filter(
    (r) => r.creator_user_id === creatorId
  );
  const pendingRequests = incomingRequests.filter((r) => r.status === 'PENDING');
  const userConversations = (conversations || []).filter(
    (c) => c.creator_user_id === creatorId || c.business_user_id === creatorId
  );

  const activeOrders = creatorOrders.filter(
    (o) =>
      o.order_status !== 'COMPLETED' &&
      o.order_status !== 'CANCELLED'
  );
  const completedOrders = creatorOrders.filter(
    (o) => o.order_status === 'COMPLETED' || o.order_status === 'APPROVED'
  );

  // Real financial calculations from actual orders
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (Number(o.subtotal) || Number(o.total_amount) || 0), 0);
  const pendingEarnings = activeOrders.reduce((sum, o) => sum + (Number(o.subtotal) || Number(o.total_amount) || 0), 0);

  const creatorDisplayName = dbCreator?.display_name || currentUser?.display_name || 'Creator';
  const creatorNiche = dbCreator?.niche || 'Technology';
  const creatorCity = dbCreator?.city || currentUser?.city || 'India';
  const followerCount = Number(dbCreator?.follower_count) || 0;

  if (isLoadingAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading your influencer studio...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Studio Error</h2>
        <p className="text-xs text-[#71717A] dark:text-zinc-400">{pageError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="sm" onClick={() => loadDbCreator()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If creator profile doesn't exist in Supabase, show onboarding CTA
  if (!dbCreator) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FFF2EC] dark:bg-[#27140B] text-[#FF5416] flex items-center justify-center mx-auto border border-[#FFD2C1] dark:border-[#4D1F0E]">
          <Camera className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-mono text-2xl font-bold text-[#121214] dark:text-white">
            Complete Your Influencer Profile
          </h2>
          <p className="text-sm text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
            You haven&apos;t set up your creator profile yet. Complete onboarding to showcase your packages, upload portfolio reels, and start earning from app campaigns.
          </p>
        </div>
        <Link href="/auth/onboarding/creator">
          <Button variant="primary" size="lg">
            Complete Influencer Onboarding
          </Button>
        </Link>
      </div>
    );
  }

  const handleUploadReel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    const validation = reelStorageService.validateReelFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format');
      setIsUploading(false);
      setUploadProgress(0);
      return;
    }

    const res = await reelStorageService.uploadReel(file, creatorId, (pct) =>
      setUploadProgress(pct)
    );
    if (!res.success || !res.videoUrl) {
      setUploadError(res.error || 'Failed to upload video');
      setIsUploading(false);
      setUploadProgress(0);
      return;
    }

    const reelPayload = {
      creator_id: creatorId,
      title: newReelTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
      video_url: res.videoUrl,
      storage_path: res.storagePath,
      mime_type: file.type,
      file_size_bytes: file.size,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('creator_reels')
        .insert(reelPayload)
        .select('*')
        .single();

      if (!error && data) {
        setReels((prev) => [data as unknown as CreatorReel, ...prev]);
      } else {
        setReels((prev) => [
          {
            ...reelPayload,
            id: `reel_${Date.now()}`,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } else {
      setReels((prev) => [
        {
          ...reelPayload,
          id: `reel_${Date.now()}`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setNewReelTitle('');
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteReel = async (reelId: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('creator_reels').delete().eq('id', reelId).eq('creator_id', creatorId);
    }
    setReels((prev) => prev.filter((r) => r.id !== reelId));
  };

  const handleToggleFeatured = async (reelId: string) => {
    const current = reels.find((r) => r.id === reelId);
    if (!current) return;
    const nextFeatured = !current.is_featured;

    if (isSupabaseConfigured) {
      await supabase
        .from('creator_reels')
        .update({ is_featured: nextFeatured })
        .eq('id', reelId)
        .eq('creator_id', creatorId);
    }
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, is_featured: nextFeatured } : r))
    );
  };

  const handleToggleVisibility = async (reelId: string) => {
    const current = reels.find((r) => r.id === reelId);
    if (!current) return;
    const nextVisible = !current.is_visible;

    if (isSupabaseConfigured) {
      await supabase
        .from('creator_reels')
        .update({ is_visible: nextVisible })
        .eq('id', reelId)
        .eq('creator_id', creatorId);
    }
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, is_visible: nextVisible } : r))
    );
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    setIsSavingPkg(true);
    const newPkgPayload = {
      creator_id: creatorId,
      name: newPkgName.trim(),
      platform: 'Instagram',
      content_type: 'Reel',
      price: newPkgPrice,
      delivery_days: newPkgDelivery,
      revision_count: 1,
      description: newPkgDesc.trim() || 'Promotional app video package.',
      deliverables: ['1 Vertical Reel', 'Link in bio'],
      active: true,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('creator_packages')
        .insert(newPkgPayload)
        .select('*')
        .single();

      if (!error && data) {
        setPackages((prev) => [...prev, data as unknown as CreatorPackage]);
      } else {
        setPackages((prev) => [
          ...prev,
          {
            ...newPkgPayload,
            id: generatePackageId(),
            revisions: 1,
          } as CreatorPackage,
        ]);
      }
    } else {
      setPackages((prev) => [
        ...prev,
        {
          ...newPkgPayload,
          id: generatePackageId(),
          revisions: 1,
        } as CreatorPackage,
      ]);
    }

    setIsAddingPkg(false);
    setNewPkgName('');
    setNewPkgDesc('');
    setIsSavingPkg(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Influencer Studio</span>
            <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800">
              Active Creator
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] dark:text-white mt-1">
            {creatorDisplayName}
          </h1>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            {creatorNiche} • {creatorCity} •{' '}
            {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} Followers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/creators/${creatorId}`}>
            <Button variant="outline" size="sm">
              <span>View Public Profile</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Settlements"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          subtext="Direct bank transfers"
          badge="SETTLED"
        />
        <StatCard
          label="Active Orders Value"
          value={`₹${pendingEarnings.toLocaleString('en-IN')}`}
          subtext="Payable upon approved delivery"
          badge="PROTECTED"
        />
        <StatCard
          label="Active Collaborations"
          value={activeOrders.length}
          subtext="Campaigns in production"
        />
        <StatCard
          label="Showcase Reels"
          value={reels.length}
          subtext="Visible on profile"
        />
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-zinc-800 pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'profile', label: 'Profile' },
          { key: 'reels', label: `My Reels (${reels.length})` },
          { key: 'packages', label: `Packages (${packages.length})` },
          { key: 'requests', label: `Collaboration Requests (${pendingRequests.length})` },
          { key: 'active', label: `Active Orders (${activeOrders.length})` },
          { key: 'completed', label: `Completed Orders (${completedOrders.length})` },
          { key: 'messages', label: `Messages (${creatorOrders.length})` },
          { key: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-3 py-1.5 rounded transition-colors shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white dark:bg-[#FF5416] dark:text-white font-bold'
                : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Pending Requests Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">Incoming Requests</span>
                <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
                  App Collaboration Requests
                </h3>
              </div>
              <span className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
                {pendingRequests.length} pending review
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white dark:bg-[#18181B] border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-8 text-center text-xs text-[#71717A] dark:text-zinc-400 font-mono">
                No collaboration requests yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#18181B] border-2 border-[#121214] dark:border-zinc-700 rounded-xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {req.business?.logo_path ? (
                          <img
                            src={req.business.logo_path}
                            alt={req.business.business_name}
                            className="w-10 h-10 rounded-xl object-cover border border-[#E5E5DE] dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#F4F4F0] dark:bg-zinc-800 font-mono font-bold text-sm text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700 shrink-0">
                            {(req.business?.business_name || 'B')[0]}
                          </div>
                        )}
                        <div>
                          <span className="editorial-label text-[#FF5416]">
                            {req.business?.business_name || 'Brand Partner'}
                          </span>
                          <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                            {req.campaign?.campaign_name || req.campaign?.product_name || 'App Collaboration'}
                          </h4>
                          <p className="text-[11px] text-[#71717A] dark:text-zinc-400 font-mono">
                            Package: {req.package?.name || 'Custom Package'} • {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Recent'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-bold text-[#121214] dark:text-white block">
                          {req.proposed_budget != null ? `₹${Number(req.proposed_budget).toLocaleString('en-IN')}` : (req.package ? `₹${Number(req.package.price).toLocaleString('en-IN')}` : 'Budget Open')}
                        </span>
                        <span className="editorial-label text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded text-[9px]">
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-xs text-[#52525B] dark:text-zinc-300 bg-[#FBFBFA] dark:bg-zinc-900 p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 font-mono leading-relaxed">
                        &quot;{req.message}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingRequestId === req.id}
                        onClick={() => handleDeclineCollabRequest(req.id)}
                        className="text-[#71717A]"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={processingRequestId === req.id}
                        onClick={() => handleAcceptCollabRequest(req.id)}
                      >
                        {processingRequestId === req.id ? 'Accepting...' : 'Accept'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Campaigns Table */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm space-y-4 p-6">
            <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#71717A] dark:text-zinc-400">Work in Progress</span>
                <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white mt-0.5">
                  Active Promotions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className="text-xs font-mono text-[#FF5416] hover:underline cursor-pointer"
              >
                View all ({activeOrders.length})
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono py-4 text-center">
                No promotions currently in progress.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#ECECE6] dark:border-zinc-800 text-[#71717A] dark:text-zinc-400 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Advertiser</th>
                      <th className="py-2.5 px-3">Package</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
                    {activeOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/60">
                        <td className="py-3 px-3 font-bold text-[#121214] dark:text-white">{ord.order_number}</td>
                        <td className="py-3 px-3 text-[#52525B] dark:text-zinc-300">
                          {ord.business?.business_name || 'Brand'}
                        </td>
                        <td className="py-3 px-3 text-[#121214] dark:text-white">{ord.package?.name}</td>
                        <td className="py-3 px-3 font-bold text-[#121214] dark:text-white">
                          ₹{Number(ord.subtotal || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={ord.order_status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/orders/${ord.id}`}>
                            <Button variant="outline" size="sm">
                              Workspace
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Profile Settings</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Creator Profile Information
            </h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              This data is visible to advertisers on your public creator page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Display Name</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {creatorDisplayName}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Primary City</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {creatorCity}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Primary Niche</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {creatorNiche}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Audience Reach</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} Followers
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Bio</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#52525B] dark:text-zinc-300 leading-relaxed">
                {dbCreator.bio || 'Content creator helping brands reach target audiences.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6] dark:border-zinc-800">
            <Link href={`/creators/${creatorId}`}>
              <Button variant="primary" size="sm">
                <span>View Public Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* TAB 3: MY REELS (19MB REEL UPLOAD) */}
      {activeTab === 'reels' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Video Portfolio</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
                Promotional Showcase Reels
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Upload short vertical reels (max 19 MB) demonstrating your app review style and video quality.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleUploadReel}
                disabled={isUploading}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>{isUploading ? `Uploading (${uploadProgress}%)` : 'Upload New Reel'}</span>
              </Button>
            </div>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 rounded-lg text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {reels.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400 space-y-3">
              <Film className="w-10 h-10 text-[#A1A1AA] mx-auto" />
              <p className="font-bold text-sm text-[#121214] dark:text-white">No reels uploaded yet</p>
              <p>Upload a short vertical demo or client work reel to showcase your style to app founders.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Upload Reel (Max 19 MB)
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className="border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-4 bg-[#FBFBFA] dark:bg-zinc-900 flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-32 bg-black rounded-lg overflow-hidden relative shrink-0">
                      <ReelVideo
                        src={reel.video_url}
                        poster={reel.thumbnail_url}
                        autoPlay={true}
                        loop={true}
                        muted={true}
                        playsInline={true}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {reel.is_featured && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FFF2EC] dark:bg-[#FF5416]/10 border border-[#FFD2C1] dark:border-[#FF5416]/30 text-[#FF5416] font-bold flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-[#FF5416]" />
                            Featured
                          </span>
                        )}
                        {!reel.is_visible && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            Hidden
                          </span>
                        )}
                      </div>

                      <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white truncate">
                        {reel.title}
                      </h4>

                      <p className="text-[11px] text-[#71717A] dark:text-zinc-400 font-mono">
                        {reel.file_size_bytes
                          ? `${(reel.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
                          : '19MB limit compliant'}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(reel.id)}
                        className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
                          reel.is_featured
                            ? 'border-[#FF5416] bg-[#FFF2EC] dark:bg-[#FF5416]/10 text-[#FF5416]'
                            : 'border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#71717A] dark:text-zinc-300'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                        <span>{reel.is_featured ? 'Featured' : 'Make Featured'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(reel.id)}
                        className="px-2 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {reel.is_visible ? (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel.id)}
                      className="p-1.5 text-[#71717A] hover:text-red-600 transition-colors cursor-pointer"
                      aria-label="Delete reel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Packages & Pricing</span>
              <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
                Promotion Packages
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Standard packages that app and website founders can book directly.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingPkg(!isAddingPkg)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{isAddingPkg ? 'Close' : 'Add Package'}</span>
            </Button>
          </div>

          {/* Add Package Form */}
          {isAddingPkg && (
            <form onSubmit={handleCreatePackage} className="p-5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-4">
              <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Create New Package</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="e.g. 1 Reel + Bio Link"
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newPkgPrice}
                    onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">Delivery Time (Days)</label>
                  <input
                    type="number"
                    required
                    value={newPkgDelivery}
                    onChange={(e) => setNewPkgDelivery(Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-[#121214] dark:text-white block mb-1 text-xs">Description & Deliverables</label>
                <textarea
                  rows={2}
                  value={newPkgDesc}
                  onChange={(e) => setNewPkgDesc(e.target.value)}
                  placeholder="Detail what is included: vertical reel, caption, app mention..."
                  className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded text-xs text-[#121214] dark:text-white"
                />
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={isSavingPkg}>
                {isSavingPkg ? 'Saving...' : 'Save Package'}
              </Button>
            </form>
          )}

          {packages.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400 space-y-2">
              <p className="font-bold text-sm text-[#121214] dark:text-white">No packages created yet</p>
              <p>Add at least one reel promotion package so brands can book collaborations with you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg: CreatorPackage) => (
                <div
                  key={pkg.id}
                  className="p-5 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-mono font-bold text-sm text-[#121214] dark:text-white">{pkg.name}</h4>
                    <span className="font-mono font-bold text-base text-[#FF5416]">
                      ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">{pkg.description}</p>
                  <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                    Delivery: {pkg.delivery_days} days • {pkg.revisions ?? pkg.revision_count ?? 1} Revisions
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COLLABORATION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Collaboration Requests</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Incoming Advertiser Requests
            </h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Review campaign goals, app links, and proposed budgets. Once accepted, private chat unlocks.
            </p>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No collaboration requests yet.
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {req.business?.logo_path ? (
                        <img
                          src={req.business.logo_path}
                          alt={req.business.business_name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E5E5DE] dark:border-zinc-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#F4F4F0] dark:bg-zinc-800 font-mono font-bold text-base text-[#121214] dark:text-white flex items-center justify-center border border-[#E5E5DE] dark:border-zinc-700 shrink-0">
                          {(req.business?.business_name || 'B')[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="editorial-label text-[#FF5416]">
                            {req.business?.business_name || 'Brand Partner'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            req.status === 'ACCEPTED'
                              ? 'bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : req.status === 'DECLINED'
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <h4 className="font-mono text-base font-bold text-[#121214] dark:text-white mt-0.5">
                          {req.campaign?.campaign_name || req.campaign?.product_name || 'App Promotion'}
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-zinc-400 font-mono">
                          Proposed Package: {req.package?.name || 'Custom Package'} • Sent {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400 block">Proposed Budget:</span>
                      <span className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                        {req.proposed_budget != null ? `₹${Number(req.proposed_budget).toLocaleString('en-IN')}` : (req.package ? `₹${Number(req.package.price).toLocaleString('en-IN')}` : 'Budget Open')}
                      </span>
                    </div>
                  </div>

                  {req.message && (
                    <div className="p-3 bg-white dark:bg-zinc-800/80 rounded-lg border border-[#ECECE6] dark:border-zinc-800 text-xs font-mono text-[#3F3F46] dark:text-zinc-300 leading-relaxed">
                      &quot;{req.message}&quot;
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECECE6] dark:border-zinc-800">
                    {req.status === 'PENDING' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={processingRequestId === req.id}
                          onClick={() => handleDeclineCollabRequest(req.id)}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={processingRequestId === req.id}
                          onClick={() => handleAcceptCollabRequest(req.id)}
                        >
                          {processingRequestId === req.id ? 'Accepting...' : 'Accept Request'}
                        </Button>
                      </>
                    ) : req.status === 'ACCEPTED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveTab('messages')}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        <span>Open Chat</span>
                      </Button>
                    ) : (
                      <span className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
                        Request {req.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ACTIVE ORDERS */}
      {activeTab === 'active' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <span className="editorial-label text-[#FF5416]">Active Collaborations</span>
              <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white mt-0.5">
                Orders in Progress
              </h3>
            </div>
            <span className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
              {activeOrders.length} active
            </span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No active orders yet.
            </div>
          ) : (
            <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
              {activeOrders.map((ord) => (
                <div key={ord.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-sm text-[#121214] dark:text-white">
                          #{ord.order_number}
                        </strong>
                        <StatusBadge status={ord.order_status} size="sm" />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          {ord.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-mono">
                        Brand: <strong>{ord.business?.business_name || 'Brand Partner'}</strong> • Campaign: {ord.campaign?.campaign_name || ord.brief?.objective || 'App Promotion'}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-zinc-500 font-mono">
                        Package: {ord.package?.name || 'Custom Package'} • Created {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-[#71717A] dark:text-zinc-500 block">Agreed Amount:</span>
                        <span className="font-mono font-bold text-base text-[#121214] dark:text-white">
                          ₹{Number(ord.subtotal || ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Link href={`/orders/${ord.id}`}>
                        <Button variant="outline" size="sm">
                          Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: COMPLETED ORDERS */}
      {activeTab === 'completed' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Completed Promotions</h3>
          {completedOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No completed promotions yet.
            </div>
          ) : (
            <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
              {completedOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-[#121214] dark:text-white">#{ord.order_number}</strong>
                      <StatusBadge status={ord.order_status} size="sm" />
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {ord.payment_status}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-mono">
                      Brand: {ord.business?.business_name || 'Brand'} • Package: {ord.package?.name}
                    </p>
                    <p className="text-[11px] text-[#71717A] dark:text-zinc-500 font-mono">
                      Completed {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{Number(ord.subtotal || ord.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Messages & Negotiations</h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400">
              Private chat with advertisers for accepted collaboration requests.
            </p>
          </div>
          <ConversationChat role="creator" />
        </div>
      )}

      {/* TAB 9: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Account & Integrations</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Creator Settings
            </h3>
          </div>

          <div className="space-y-6">
            {/* Instagram Verification Architecture */}
            <div className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                      Instagram Official Insights Integration
                    </h4>
                    <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
                      OAuth 2.0 readiness for Meta Graph API follower and reach verification.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Ready for Meta OAuth
                </span>
              </div>
              <p className="text-xs text-[#71717A] dark:text-zinc-400">
                Handle confidentiality: Your Instagram username is protected and never publicly exposed. Metrics are currently maintained as platform metrics.
              </p>
            </div>

            {/* Payout Information */}
            <div className="space-y-3">
              <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Bank / UPI Payout Account</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">UPI ID for Settlements</label>
                  <input
                    type="text"
                    placeholder="yourhandle@okhdfcbank"
                    className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">PAN Verification</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
