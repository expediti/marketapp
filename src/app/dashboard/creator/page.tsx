'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorReel, ReelType, CreatorPackage, Campaign } from '@/types/marketplace';
import { ConversationChat } from '@/components/chat/ConversationChat';
import {
  ArrowRight,
  Package,
  Film,
  Upload,
  Trash2,
  Star,
  Eye,
  EyeOff,
  User,
  Plus,
  MessageSquare,
  AlertCircle,
  Camera,
  CheckCircle2,
  Briefcase,
  Compass,
  ShoppingBag,
  ExternalLink,
  Edit2,
  X,
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

type TabKey = 'home' | 'discover' | 'orders' | 'messages' | 'profile' | 'settings';
type OrderFilter = 'all' | 'ongoing' | 'completed';

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
  payout_upi_id?: string | null;
  instagram_connected?: boolean | null;
  instagram_verified?: boolean | null;
  instagram_username?: string | null;
  metrics_source?: string | null;
}

function generatePackageId(): string {
  return `pkg_${Date.now()}`;
}

function safeFormatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const dynamic = 'force-dynamic';

function CreatorDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const {
    orders = [],
    currentUser,
    collaborationRequests = [],
    acceptCollaborationRequest,
    declineCollaborationRequest,
    campaigns = [],
    refreshData,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [dbCreator, setDbCreator] = useState<DbCreatorState | null>(null);
  const [packages, setPackages] = useState<CreatorPackage[]>([]);
  const [reels, setReels] = useState<CreatorReel[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string>('');
  const [igNotice, setIgNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reels management
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelType, setNewReelType] = useState<ReelType>('client_work');

  // Package creation/editing modal/state
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState(3000);
  const [newPkgDelivery, setNewPkgDelivery] = useState(4);
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [isSavingPkg, setIsSavingPkg] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Payment Details (Payout UPI ID)
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);
  const [upiSuccessMessage, setUpiSuccessMessage] = useState<string | null>(null);

  // Instagram Reel URL input state
  const [instagramReelUrl, setInstagramReelUrl] = useState('');
  const [reelUrlError, setReelUrlError] = useState<string | null>(null);
  const [isAddingReelUrl, setIsAddingReelUrl] = useState(false);
  const [isSavingReelUrl, setIsSavingReelUrl] = useState(false);

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteAccountError('Please type DELETE to confirm account deletion.');
      return;
    }
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      await supabase.auth.signOut();
      window.location.href = '/?account_deleted=true';
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Isolated stage data loader for the creator dashboard
  const loadDbCreator = useCallback(async () => {
    setIsLoadingAuth(true);
    setPageError(null);

    if (!isSupabaseConfigured) {
      setIsLoadingAuth(false);
      return;
    }

    let authUserId: string | null = null;
    let authUserEmail: string | null = null;
    let authUserMeta: any = {};

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/auth/login');
        return;
      }

      authUserId = user.id;
      authUserEmail = user.email || '';
      authUserMeta = user.user_metadata || {};
      setUserEmail(authUserEmail || '');
    } catch (authErr) {
      router.replace('/auth/login');
      return;
    }

    let userRole: string | null = null;
    let profileDisplayName: string = authUserMeta.full_name || authUserMeta.name || 'Creator';
    let profileCity: string = 'India';
    let profileAvatar: string | null = authUserMeta.avatar_url || authUserMeta.picture || null;

    try {
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('id, role, display_name, city, avatar_url')
        .eq('id', authUserId)
        .maybeSingle();

      if (profile) {
        userRole = profile.role ? profile.role.toLowerCase() : null;
        if (profile.display_name) profileDisplayName = profile.display_name;
        if (profile.city) profileCity = profile.city;
        if (profile.avatar_url) profileAvatar = profile.avatar_url;
      }

      if (!userRole) {
        router.replace('/auth/role-select');
        return;
      }

      if (userRole === 'business' || userRole === 'advertiser') {
        router.replace('/dashboard/business');
        return;
      }
    } catch (profErr) {
      console.error('Profile fetch error:', profErr);
    }

    let loadedCreatorProfile: any = null;
    try {
      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (cp) {
        loadedCreatorProfile = cp;
      } else {
        const { data: recoveredCp } = await supabase
          .from('creator_profiles')
          .upsert(
            {
              user_id: authUserId,
              display_name: profileDisplayName,
              bio: 'Content creator helping apps and websites reach targeted users.',
              profile_image_path: profileAvatar,
              country: 'India',
              city: profileCity || 'India',
              niche: 'Technology',
              categories: ['Technology'],
              languages: ['Hindi', 'English'],
              follower_count: 0,
              average_reach: 0,
              engagement_rate: 0.0,
              verification_status: 'unverified',
              metrics_source: 'platform_manual',
            },
            { onConflict: 'user_id' }
          )
          .select('*')
          .maybeSingle();

        if (recoveredCp) {
          loadedCreatorProfile = recoveredCp;
        }
      }
    } catch (cpExc) {
      console.error('Creator profile error:', cpExc);
    }

    let loadedPackages: CreatorPackage[] = [];
    try {
      const { data: pkgs } = await supabase
        .from('creator_packages')
        .select('*')
        .eq('creator_id', authUserId);

      if (pkgs) {
        loadedPackages = pkgs as unknown as CreatorPackage[];
      }
    } catch (pkgExc) {
      console.error('Packages error:', pkgExc);
    }

    let loadedReels: CreatorReel[] = [];
    try {
      const { data: reelsData } = await supabase
        .from('creator_reels')
        .select('*')
        .eq('creator_id', authUserId)
        .order('sort_order', { ascending: true });

      if (reelsData) {
        loadedReels = reelsData as unknown as CreatorReel[];
      }
    } catch (reelsExc) {
      console.error('Reels error:', reelsExc);
    }

    if (loadedCreatorProfile) {
      setDbCreator({
        ...loadedCreatorProfile,
        creator_packages: loadedPackages,
      });
      setPayoutUpiId(loadedCreatorProfile.payout_upi_id || '');
    } else {
      setDbCreator({
        user_id: authUserId || 'unknown',
        display_name: profileDisplayName,
        bio: '',
        country: 'India',
        city: profileCity,
        niche: 'Technology',
        follower_count: 0,
        average_reach: 0,
        engagement_rate: 0,
        creator_packages: loadedPackages,
      });
    }

    setPackages(loadedPackages);
    setReels(loadedReels);
    setIsLoadingAuth(false);
  }, [router]);

  useEffect(() => {
    loadDbCreator();
  }, [loadDbCreator]);

  // Synchronize URL tab parameter and Instagram OAuth status
  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'overview') setActiveTab('home');
      else if (['home', 'discover', 'orders', 'messages', 'profile', 'settings'].includes(tabParam)) {
        setActiveTab(tabParam as TabKey);
      }
    }

    const igErr = searchParams.get('ig_error');
    const igConnected = searchParams.get('ig_connected');
    const igUsername = searchParams.get('ig_username');

    if (igErr) {
      setIgNotice({
        type: 'error',
        message: decodeURIComponent(igErr),
      });
      setActiveTab('profile');
    } else if (igConnected === 'true') {
      setIgNotice({
        type: 'success',
        message: igUsername
          ? `Instagram account @${igUsername} connected and verified successfully!`
          : 'Instagram account connected successfully!',
      });
      setActiveTab('profile');
      loadDbCreator();
      if (refreshData) {
        refreshData().catch((e) => console.warn('refreshData note:', e));
      }
    }
  }, [tabParam, searchParams, loadDbCreator, refreshData]);

  const handleSavePayoutUpi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUpiError(null);
    setUpiSuccessMessage(null);

    const validation = validateAndNormalizeUpiId(payoutUpiId);
    if (!validation.isValid) {
      setUpiError(validation.error || 'Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }

    const cleanedValue = validation.value || null;
    setIsSavingUpi(true);

    try {
      if (isSupabaseConfigured && currentUser?.id) {
        const { error } = await supabase
          .from('creator_profiles')
          .update({
            payout_upi_id: cleanedValue,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', currentUser.id);

        if (error) throw new Error(error.message);
      }

      setPayoutUpiId(cleanedValue || '');
      setDbCreator((prev) => (prev ? { ...prev, payout_upi_id: cleanedValue } : null));
      setUpiSuccessMessage(
        cleanedValue
          ? 'Payout details saved. Payments will be transferred to this UPI ID upon delivery approval.'
          : 'Payment details cleared.'
      );
    } catch (err) {
      console.error('Error saving payout UPI ID:', err);
      setUpiError(err instanceof Error ? err.message : 'Failed to save payment details.');
    } finally {
      setIsSavingUpi(false);
    }
  };

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

  // Safe data pipelines
  const creatorOrders = (orders || []).filter(
    (o) =>
      o &&
      (o.creator_id === creatorId ||
        o.creator_user_id === creatorId ||
        o.creator?.user_id === creatorId)
  );

  const incomingRequests = (collaborationRequests || []).filter(
    (r) => r && r.creator_user_id === creatorId
  );
  const pendingRequests = incomingRequests.filter(
    (r) => r && (r.status === 'REQUESTED' || r.status === 'PENDING')
  );
  const activeOrders = creatorOrders.filter(
    (o) =>
      o &&
      o.order_status !== 'COMPLETED' &&
      o.order_status !== 'APPROVED' &&
      o.order_status !== 'AUTO_APPROVED' &&
      o.order_status !== 'CANCELLED'
  );
  const completedOrders = creatorOrders.filter(
    (o) => o && (o.order_status === 'COMPLETED' || o.order_status === 'APPROVED' || o.order_status === 'AUTO_APPROVED')
  );

  // Financial calculations
  const totalEarnings = completedOrders.reduce(
    (sum, o) => sum + (Number(o.subtotal) || Number(o.total_amount) || 0),
    0
  );
  const pendingEarnings = activeOrders.reduce(
    (sum, o) => sum + (Number(o.subtotal) || Number(o.total_amount) || 0),
    0
  );

  const creatorDisplayName = dbCreator?.display_name || currentUser?.display_name || 'Creator';
  const creatorNiche = dbCreator?.niche || 'Technology';
  const creatorCity = dbCreator?.city || currentUser?.city || 'India';
  const followerCount = Number(dbCreator?.follower_count) || 0;

  // Filtered orders for the primary Orders section
  const displayedOrders =
    orderFilter === 'ongoing'
      ? activeOrders
      : orderFilter === 'completed'
      ? completedOrders
      : creatorOrders;

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

  const handleAddInstagramReel = async (e: React.FormEvent) => {
    e.preventDefault();
    setReelUrlError(null);
    const parsed = parseInstagramUrl(instagramReelUrl);
    if (!parsed.isValid || !parsed.canonicalUrl) {
      setReelUrlError(
        parsed.error || 'Please enter a valid Instagram Reel URL (e.g. https://www.instagram.com/reel/...)'
      );
      return;
    }

    setIsSavingReelUrl(true);
    const reelPayload = {
      creator_id: creatorId,
      title: newReelTitle.trim() || 'Instagram Reel',
      video_url: parsed.canonicalUrl,
      reel_url: parsed.canonicalUrl,
      instagram_media_id: parsed.shortcode || undefined,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
    };

    try {
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
              id: `reel_ig_${Date.now()}`,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } else {
        setReels((prev) => [
          {
            ...reelPayload,
            id: `reel_ig_${Date.now()}`,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setInstagramReelUrl('');
      setNewReelTitle('');
      setIsAddingReelUrl(false);
    } catch (err: any) {
      setReelUrlError(err.message || 'Failed to save Instagram Reel');
    } finally {
      setIsSavingReelUrl(false);
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    setIsSavingPkg(true);
    const pkgPayload = {
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

    if (editingPkgId) {
      if (isSupabaseConfigured) {
        await supabase
          .from('creator_packages')
          .update(pkgPayload)
          .eq('id', editingPkgId)
          .eq('creator_id', creatorId);
      }
      setPackages((prev) =>
        prev.map((p) => (p.id === editingPkgId ? { ...p, ...pkgPayload } : p))
      );
    } else {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('creator_packages')
          .insert(pkgPayload)
          .select('*')
          .single();

        if (data) {
          setPackages((prev) => [...prev, data as unknown as CreatorPackage]);
        } else {
          setPackages((prev) => [
            ...prev,
            { ...pkgPayload, id: generatePackageId(), revisions: 1 } as CreatorPackage,
          ]);
        }
      } else {
        setPackages((prev) => [
          ...prev,
          { ...pkgPayload, id: generatePackageId(), revisions: 1 } as CreatorPackage,
        ]);
      }
    }

    setIsAddingPkg(false);
    setEditingPkgId(null);
    setNewPkgName('');
    setNewPkgDesc('');
    setIsSavingPkg(false);
  };

  const handleDeletePackage = async (pkgId: string) => {
    if (isSupabaseConfigured) {
      await supabase
        .from('creator_packages')
        .delete()
        .eq('id', pkgId)
        .eq('creator_id', creatorId);
    }
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading creator workspace...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4 font-mono">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#121214] dark:text-white">Workspace Error</h2>
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

  // Active opportunities (active campaigns posted by businesses)
  const activeOpportunities = (campaigns || []).filter((c) => c && c.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 font-mono">
      {/* Top Header & Role Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Creator Workspace</span>
            <span className="text-[10px] text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800">
              Active Influencer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#121214] dark:text-white mt-1">
            {creatorDisplayName}
          </h1>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            {creatorNiche} • {creatorCity} •{' '}
            {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} Followers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/creators/${creatorId}`}>
            <Button variant="outline" size="sm" className="text-xs">
              <span>View Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* PRIMARY NAVIGATION TABS (Simple Marketplace IA) */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] dark:border-zinc-800 pb-2 text-xs overflow-x-auto">
        {[
          { key: 'home', label: 'Home' },
          { key: 'discover', label: `Discover (${activeOpportunities.length})` },
          { key: 'orders', label: `Orders (${creatorOrders.length})` },
          { key: 'messages', label: `Messages` },
          { key: 'profile', label: 'Profile' },
          { key: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-3.5 py-1.5 rounded transition-colors shrink-0 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white dark:bg-[#FF5416] dark:text-white font-bold'
                : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. HOME TAB */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Active Orders"
              value={activeOrders.length}
              subtext="In production"
            />
            <StatCard
              label="Completed"
              value={completedOrders.length}
              subtext="Settled deliveries"
            />
            <StatCard
              label="Payout Pending"
              value={`₹${pendingEarnings.toLocaleString('en-IN')}`}
              subtext="Awaiting release"
            />
            <StatCard
              label="Total Earned"
              value={`₹${totalEarnings.toLocaleString('en-IN')}`}
              subtext="Settled to UPI"
            />
          </div>

          {/* Important Action Required Notice (if missing UPI ID for completed orders) */}
          {!dbCreator?.payout_upi_id && completedOrders.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Payout UPI ID Required</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    You have completed orders awaiting settlement. Add your UPI ID in Settings so your payout can be transferred.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs"
              >
                Add UPI ID
              </Button>
            </div>
          )}

          {/* Pending Requests Preview (if any) */}
          {pendingRequests.length > 0 && (
            <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5416] animate-pulse" />
                  <h3 className="font-bold text-sm text-[#121214] dark:text-white">
                    Action Required: Incoming Collaboration Requests ({pendingRequests.length})
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-lg bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="editorial-label text-[#FF5416] block">
                          {req.business?.business_name || 'Brand Partner'}
                        </span>
                        <h4 className="font-bold text-sm text-[#121214] dark:text-white">
                          {req.campaign?.campaign_name || req.campaign?.product_name || 'App Promotion'}
                        </h4>
                        <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
                          Package: {req.package?.name || 'Custom Package'} • {safeFormatDate(req.created_at)}
                        </p>
                      </div>

                      <span className="font-bold text-sm text-[#121214] dark:text-white shrink-0">
                        {req.proposed_budget != null
                          ? `₹${Number(req.proposed_budget).toLocaleString('en-IN')}`
                          : req.package
                          ? `₹${Number(req.package.price || 0).toLocaleString('en-IN')}`
                          : 'Budget Open'}
                      </span>
                    </div>

                    {req.message && (
                      <p className="text-xs text-[#52525B] dark:text-zinc-300 bg-white dark:bg-zinc-800 p-2.5 rounded border border-[#E5E5DE] dark:border-zinc-700">
                        &quot;{req.message}&quot;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={processingRequestId === req.id}
                        onClick={() => handleDeclineCollabRequest(req.id)}
                        className="text-[#71717A] text-xs"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={processingRequestId === req.id}
                        onClick={() => handleAcceptCollabRequest(req.id)}
                        className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white"
                      >
                        {processingRequestId === req.id ? 'Accepting...' : 'Accept & Chat'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Order Highlight */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-[#121214] dark:text-white">
                Active Order Summary
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className="text-xs text-[#FF5416] hover:underline cursor-pointer"
              >
                View all orders ({creatorOrders.length})
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-lg text-xs text-[#71717A] dark:text-zinc-400 space-y-2">
                <p className="font-bold text-[#121214] dark:text-white">No active orders in progress</p>
                <p>When a brand accepts your proposal or confirms an order, it will appear here.</p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('discover')}
                    className="text-xs"
                  >
                    <Compass className="w-3.5 h-3.5 mr-1" />
                    <span>Discover Opportunities</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-lg bg-[#FBFBFA] dark:bg-zinc-900 border border-[#ECECE6] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#121214] dark:text-white">
                          #{ord.order_number}
                        </span>
                        <StatusBadge status={ord.order_status} size="sm" />
                      </div>
                      <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-1">
                        Brand: <strong>{ord.business?.business_name || 'Brand Partner'}</strong> • Deliverable: {ord.package?.name || '1 × Instagram Reel'}
                      </p>
                      <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
                        Deadline: {ord.deadline ? new Date(ord.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'} • Price: ₹{Number(ord.subtotal || ord.total_amount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="primary" size="sm" className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white">
                        <span>Open Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 text-left hover:border-[#FF5416] transition-colors cursor-pointer group"
            >
              <Compass className="w-5 h-5 text-[#FF5416] mb-2" />
              <h4 className="font-bold text-xs text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                Discover Opportunities
              </h4>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                Browse open brand campaigns looking for influencers.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 text-left hover:border-[#FF5416] transition-colors cursor-pointer group"
            >
              <Film className="w-5 h-5 text-[#FF5416] mb-2" />
              <h4 className="font-bold text-xs text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                Manage Reels & Packages
              </h4>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                Update showcase reel links and pricing packages.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 text-left hover:border-[#FF5416] transition-colors cursor-pointer group"
            >
              <MessageSquare className="w-5 h-5 text-[#FF5416] mb-2" />
              <h4 className="font-bold text-xs text-[#121214] dark:text-white group-hover:text-[#FF5416]">
                Messages & Negotiations
              </h4>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                Chat with brands and confirm deal terms.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 2. DISCOVER OPPORTUNITIES TAB */}
      {activeTab === 'discover' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="editorial-label text-[#FF5416]">Marketplace Opportunities</span>
              <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
                Brand Campaigns & Collaboration Opportunities
              </h3>
            </div>
            <span className="text-xs text-[#71717A]">
              {activeOpportunities.length} opportunities available
            </span>
          </div>

          {activeOpportunities.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs text-[#71717A] dark:text-zinc-400 space-y-2">
              <Compass className="w-8 h-8 text-[#A1A1AA] mx-auto mb-1" />
              <p className="font-bold text-sm text-[#121214] dark:text-white">
                No collaboration opportunities available yet.
              </p>
              <p className="max-w-md mx-auto">
                When businesses post open campaigns or send you direct collaboration requests, they will appear here. In the meantime, make sure your profile, packages, and showcase reels are up to date.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setActiveTab('profile')} className="text-xs">
                  Update Creator Profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOpportunities.map((camp) => (
                <div
                  key={camp.id}
                  className="p-5 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="editorial-label text-[#FF5416] block">
                        {camp.category || camp.product_type}
                      </span>
                      <h4 className="font-bold text-base text-[#121214] dark:text-white">
                        {camp.campaign_name}
                      </h4>
                      <p className="text-xs text-[#71717A] dark:text-zinc-400">
                        Product: <strong>{camp.product_name}</strong>
                      </p>
                    </div>

                    {camp.budget > 0 && (
                      <span className="font-bold text-sm text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-[#A7F3D0] dark:border-emerald-800 shrink-0">
                        ₹{Number(camp.budget).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {camp.description && (
                    <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed line-clamp-3">
                      {camp.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#71717A]">
                      Posted {safeFormatDate(camp.created_at)}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveTab('messages')}
                      className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white"
                    >
                      <span>Inquire / Chat</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PRIMARY ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Header & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <div>
              <span className="editorial-label text-[#FF5416]">Collaboration Orders</span>
              <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
                My Orders ({creatorOrders.length})
              </h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'ongoing', 'completed'] as OrderFilter[]).map((flt) => (
                <button
                  key={flt}
                  type="button"
                  onClick={() => setOrderFilter(flt)}
                  className={`px-3 py-1 rounded capitalize transition-colors cursor-pointer ${
                    orderFilter === flt
                      ? 'bg-[#121214] dark:bg-white text-white dark:text-[#121214] font-bold'
                      : 'text-[#71717A] dark:text-zinc-400 hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
                  }`}
                >
                  {flt} (
                  {flt === 'all'
                    ? creatorOrders.length
                    : flt === 'ongoing'
                    ? activeOrders.length
                    : completedOrders.length}
                  )
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {displayedOrders.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs text-[#71717A] dark:text-zinc-400 space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#A1A1AA] mx-auto mb-1" />
              <p className="font-bold text-sm text-[#121214] dark:text-white">
                You don&apos;t have any {orderFilter !== 'all' ? orderFilter : ''} orders yet.
              </p>
              <p>When a business confirms an order or accepts terms with you, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map((ord) => {
                const isOrdPaid =
                  ord.payment_status === 'PAID' ||
                  ord.order_status === 'PAID' ||
                  ord.order_status === 'WORK_STARTED' ||
                  ord.order_status === 'IN_PROGRESS' ||
                  ord.order_status === 'DELIVERED' ||
                  ord.order_status === 'REVISION_REQUESTED' ||
                  ord.order_status === 'APPROVED' ||
                  ord.order_status === 'AUTO_APPROVED' ||
                  ord.order_status === 'COMPLETED';

                // Contextual Next Action guidance for the creator
                const nextActionGuidance = !isOrdPaid
                  ? 'Waiting for the business to complete payment.'
                  : ord.order_status === 'PAID'
                  ? 'Payment received. You can start working.'
                  : ord.order_status === 'WORK_STARTED' || ord.order_status === 'IN_PROGRESS'
                  ? 'In production. Submit your Instagram Reel URL when ready.'
                  : ord.order_status === 'DELIVERED'
                  ? 'Delivery submitted. Waiting for business review.'
                  : ord.order_status === 'REVISION_REQUESTED'
                  ? 'Business requested 1 revision. Please update and submit revised Reel.'
                  : 'Delivery accepted. Payout processing.';

                return (
                  <div
                    key={ord.id}
                    className="p-5 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 space-y-3.5 hover:border-[#FF5416]/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-[#121214] dark:text-white">
                            #{ord.order_number}
                          </span>
                          <StatusBadge status={ord.order_status} size="sm" />
                          {isOrdPaid ? (
                            <span className="text-[10px] text-[#047857] bg-[#ECFDF5] dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-[#A7F3D0] dark:border-emerald-800 font-semibold">
                              PAID ✓
                            </span>
                          ) : (
                            <span className="text-[10px] text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                              Payment Pending
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-1">
                          Brand: <strong>{ord.business?.business_name || 'Brand Partner'}</strong> • Deliverable: {ord.package?.name || '1 × Instagram Reel'}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="font-bold text-base text-[#121214] dark:text-white block">
                          ₹{Number(ord.subtotal || ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-[#71717A]">
                          Deadline: {ord.deadline ? new Date(ord.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Required Box */}
                    <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-[#ECECE6] dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#FF5416] shrink-0" />
                        <span className="text-[#121214] dark:text-zinc-200 font-medium">
                          {nextActionGuidance}
                        </span>
                      </div>

                      <Link href={`/orders/${ord.id}`}>
                        <Button variant="primary" size="sm" className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white shrink-0">
                          <span>Open Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#121214] dark:text-white">
              Collaboration Messages & Negotiations
            </h3>
          </div>
          <ConversationChat role="creator" />
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {igNotice && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                igNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              }`}
            >
              {igNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block">
                  {igNotice.type === 'success' ? 'Instagram Connected' : 'Instagram Connection Notice'}
                </span>
                <p className="text-[11px] mt-0.5 leading-relaxed">{igNotice.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setIgNotice(null)}
                className="text-xs text-[#71717A] hover:text-[#121214] dark:hover:text-white"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section A: Profile Information */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">Creator Information</span>
                <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
                  Public Profile
                </h3>
              </div>
              <Link href={`/creators/${creatorId}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  <span>View Public Page</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Display Name</span>
                <span className="font-bold text-[#121214] dark:text-white block mt-0.5">{creatorDisplayName}</span>
              </div>
              <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Primary City</span>
                <span className="font-bold text-[#121214] dark:text-white block mt-0.5">{creatorCity}</span>
              </div>
              <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Primary Niche</span>
                <span className="font-bold text-[#121214] dark:text-white block mt-0.5">{creatorNiche}</span>
              </div>
              <div className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase">Audience Reach</span>
                <span className="font-bold text-[#121214] dark:text-white block mt-0.5">
                  {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount} Followers
                </span>
              </div>

              {/* Instagram Connection */}
              <div className="sm:col-span-2 p-4 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#121214] dark:text-white">
                      {dbCreator?.instagram_connected
                        ? `@${dbCreator?.instagram_username || 'connected'}`
                        : 'Instagram Verification'}
                    </h4>
                    <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
                      {dbCreator?.instagram_connected
                        ? 'Meta Verified connection active'
                        : userEmail.toLowerCase().trim() === 'khormasti104@gmail.com'
                        ? 'Connect Instagram to auto-verify followers.'
                        : 'Coming soon — Instagram verification is currently being finalized.'}
                    </p>
                  </div>
                </div>

                <div>
                  {dbCreator?.instagram_connected ? (
                    <span className="text-[11px] px-2.5 py-1 rounded bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-[#A7F3D0] dark:border-emerald-800">
                      Connected ✓
                    </span>
                  ) : userEmail.toLowerCase().trim() === 'khormasti104@gmail.com' ? (
                    <a
                      href="/api/auth/instagram/authorize?returnTo=%2Fdashboard%2Fcreator"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF5416] text-white hover:bg-[#E04810] text-xs font-semibold transition-colors"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Connect Instagram</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E5E5DE] dark:bg-zinc-800 text-[#71717A] dark:text-zinc-400 text-xs font-semibold cursor-not-allowed border border-[#D4D4CE] dark:border-zinc-700"
                    >
                      <span>Coming Soon</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-[#FBFBFA] dark:bg-zinc-900 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                <span className="text-[#71717A] dark:text-zinc-400 block text-[10px] uppercase mb-1">Bio</span>
                <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
                  {dbCreator?.bio || 'Content creator helping apps and websites reach targeted audiences.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section B: Packages Management */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">Pricing & Deliverables</span>
                <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
                  Collaboration Packages ({packages.length})
                </h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingPkgId(null);
                  setNewPkgName('');
                  setNewPkgPrice(3000);
                  setNewPkgDelivery(4);
                  setNewPkgDesc('');
                  setIsAddingPkg(!isAddingPkg);
                }}
                className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>{isAddingPkg ? 'Cancel' : 'Create Package'}</span>
              </Button>
            </div>

            {/* Add / Edit Package Form */}
            {isAddingPkg && (
              <form onSubmit={handleSavePackage} className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-sm text-[#121214] dark:text-white">
                  {editingPkgId ? 'Edit Package' : 'Create Package'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Package Name</label>
                    <input
                      type="text"
                      required
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      placeholder="e.g. 1 Instagram Reel + Link in Bio"
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Price (₹ INR)</label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={newPkgPrice}
                      onChange={(e) => setNewPkgPrice(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Delivery Time (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={newPkgDelivery}
                      onChange={(e) => setNewPkgDelivery(Number(e.target.value))}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Description</label>
                  <textarea
                    rows={2}
                    value={newPkgDesc}
                    onChange={(e) => setNewPkgDesc(e.target.value)}
                    placeholder="Details about the reel format, features highlighted, and CTA..."
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingPkg(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={isSavingPkg} className="bg-[#FF5416] text-white">
                    {isSavingPkg ? 'Saving...' : editingPkgId ? 'Update Package' : 'Save Package'}
                  </Button>
                </div>
              </form>
            )}

            {packages.length === 0 ? (
              <p className="text-xs text-[#71717A] text-center py-6 border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-lg">
                No packages created yet. Create a package so businesses can book you directly.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 space-y-2.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-[#121214] dark:text-white">{pkg.name}</h4>
                        <span className="font-bold text-sm text-[#FF5416]">
                          ₹{Number(pkg.price || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs text-[#52525B] dark:text-zinc-300 mt-1 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-[11px] text-[#71717A]">
                      <span>{pkg.delivery_days} days delivery</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPkgId(pkg.id);
                            setNewPkgName(pkg.name);
                            setNewPkgPrice(pkg.price);
                            setNewPkgDelivery(pkg.delivery_days);
                            setNewPkgDesc(pkg.description);
                            setIsAddingPkg(true);
                          }}
                          className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
                          title="Edit package"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg.id)}
                          className="text-[#71717A] hover:text-red-600"
                          title="Delete package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section C: Showcase Reels Management */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="editorial-label text-[#FF5416]">Video Portfolio</span>
                <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
                  Showcase Reels ({reels.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingReelUrl(!isAddingReelUrl)}
                  className="text-xs"
                >
                  <InstagramIcon className="w-3.5 h-3.5 mr-1 text-[#FF5416]" />
                  <span>{isAddingReelUrl ? 'Cancel' : 'Add Instagram Reel'}</span>
                </Button>
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
                  className="text-xs bg-[#FF5416] hover:bg-[#E04810] text-white"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  <span>{isUploading ? `Uploading (${uploadProgress}%)` : 'Upload MP4'}</span>
                </Button>
              </div>
            </div>

            {/* Add Instagram Reel URL Form */}
            {isAddingReelUrl && (
              <form onSubmit={handleAddInstagramReel} className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Reel Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Fintech App UI Walkthrough"
                      value={newReelTitle}
                      onChange={(e) => setNewReelTitle(e.target.value)}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Sample Type</label>
                    <select
                      value={newReelType}
                      onChange={(e) => setNewReelType(e.target.value as ReelType)}
                      className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                    >
                      <option value="client_work">Promotional Campaign</option>
                      <option value="demo">Demo Reel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-[#121214] dark:text-white">Instagram Reel URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.instagram.com/reel/XXXXXXXX/"
                    value={instagramReelUrl}
                    onChange={(e) => {
                      setInstagramReelUrl(e.target.value);
                      if (reelUrlError) setReelUrlError(null);
                    }}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded"
                  />
                </div>

                {reelUrlError && (
                  <p className="text-xs text-red-600">{reelUrlError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingReelUrl(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSavingReelUrl} className="bg-[#FF5416] text-white">
                    Save Reel
                  </Button>
                </div>
              </form>
            )}

            {reels.length === 0 ? (
              <p className="text-xs text-[#71717A] text-center py-6 border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-lg">
                No showcase reels added yet. Add Instagram Reel URLs or upload short MP4 clips to display on your profile.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reels.map((reel) => {
                  const reelSrc = reel.video_url || reel.reel_url || '';
                  return (
                    <div
                      key={reel.id}
                      className="p-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex gap-2.5">
                        <div className="w-16 h-24 bg-black rounded-lg overflow-hidden shrink-0">
                          <ReelVideo
                            src={reelSrc}
                            poster={reel.thumbnail_url}
                            autoPlay={true}
                            loop={true}
                            muted={true}
                            playsInline={true}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-[#121214] dark:text-white truncate">
                            {reel.title || 'Showcase Reel'}
                          </h4>
                          {reel.is_featured && (
                            <span className="text-[10px] text-[#FF5416] font-bold block mt-1">★ Featured</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(reel.id)}
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              reel.is_featured ? 'bg-[#FFF2EC] text-[#FF5416]' : 'text-[#71717A]'
                            }`}
                          >
                            {reel.is_featured ? 'Featured' : 'Feature'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(reel.id)}
                            className="p-1 text-[#71717A]"
                            title={reel.is_visible ? 'Visible' : 'Hidden'}
                          >
                            {reel.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReel(reel.id)}
                          className="p-1 text-[#71717A] hover:text-red-600"
                          title="Delete reel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
            <span className="editorial-label text-[#FF5416]">Payouts & Preferences</span>
            <h3 className="text-base font-bold text-[#121214] dark:text-white mt-0.5">
              Creator Settings
            </h3>
          </div>

          {/* Payout Details */}
          <div className="space-y-3 max-w-md text-xs">
            <div>
              <h4 className="font-bold text-sm text-[#121214] dark:text-white">Payout Details (UPI ID)</h4>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                This UPI ID is used only for manual direct payouts. It is private, confidential, and never shown to businesses or on public discovery.
              </p>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-[#121214] dark:text-white">
                UPI ID (e.g. name@upi or phone@paytm)
              </label>
              <input
                type="text"
                value={payoutUpiId}
                onChange={(e) => {
                  setPayoutUpiId(e.target.value);
                  if (upiError) setUpiError(null);
                  if (upiSuccessMessage) setUpiSuccessMessage(null);
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
                  }
                }}
                placeholder="name@upi"
                className={`w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border ${
                  upiError ? 'border-red-500' : 'border-[#E5E5DE] dark:border-zinc-700'
                } rounded focus:outline-none focus:border-[#FF5416]`}
              />
            </div>

            {upiError && <p className="text-xs text-red-600">{upiError}</p>}
            {upiSuccessMessage && <p className="text-xs text-[#047857]">{upiSuccessMessage}</p>}

            <Button
              variant="primary"
              size="sm"
              disabled={isSavingUpi}
              onClick={handleSavePayoutUpi}
              className="bg-[#FF5416] hover:bg-[#E04810] text-white text-xs"
            >
              <span>{isSavingUpi ? 'Saving...' : 'Save Payout UPI ID'}</span>
            </Button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="pt-6 border-t border-red-200 dark:border-red-950/60 space-y-3">
            <div>
              <span className="editorial-label text-red-600 dark:text-red-400">Danger Zone</span>
              <h4 className="font-bold text-sm text-red-600 dark:text-red-400 mt-0.5">Delete Creator Account</h4>
              <p className="text-[11px] text-[#71717A] dark:text-zinc-400 mt-0.5 max-w-xl">
                Permanently deletes your creator profile, public listings, Instagram connection, and account credentials. Historical completed order records and invoices are retained where required by law.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteConfirmText('');
                setDeleteAccountError(null);
                setIsDeleteModalOpen(true);
              }}
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Delete Account</span>
            </Button>
          </div>

          {/* Account Deletion Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#18181B] border border-red-200 dark:border-red-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="w-5 h-5" />
                    <h3 className="font-mono text-base font-bold">Delete Account Permanently</h3>
                  </div>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed font-mono">
                  <p>
                    Are you sure you want to delete your <strong>Market My Idea</strong> creator account? This action is <strong>irreversible</strong>.
                  </p>
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-[11px] text-red-700 dark:text-red-300 space-y-1">
                    <p className="font-bold">• Your creator profile and portfolio will be removed from marketplace discovery.</p>
                    <p>• Your Instagram OAuth connection and token data will be cleared.</p>
                    <p>• Legally required financial, tax, and completed order dispute records will be retained in accordance with our retention policy.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#121214] dark:text-white mb-1">
                      Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-800 border border-red-300 dark:border-red-800 rounded focus:outline-none focus:border-red-600 uppercase"
                    />
                  </div>

                  {deleteAccountError && (
                    <p className="text-xs text-red-600 font-semibold">{deleteAccountError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeletingAccount}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDeleteAccount}
                    isLoading={isDeletingAccount}
                    disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Confirm Account Deletion</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-mono">Loading creator workspace...</div>}>
      <CreatorDashboardContent />
    </Suspense>
  );
}
