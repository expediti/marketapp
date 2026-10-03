'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { CreatorCard } from '@/components/marketplace/CreatorCard';
import { ConversationChat } from '@/components/chat/ConversationChat';
import {
  ArrowRight,
  Search,
  Building,
  CheckCircle2,
  MessageSquare,
  Package as PackageIcon,
  Globe,
  MapPin,
  Smartphone,
  Plus,
  Edit2,
  Save,
  Trash2,
  X,
  AlertCircle,
  ShoppingBag,
  Filter,
  Sparkles,
  Settings as SettingsIcon,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';

type TabKey = 'home' | 'discover' | 'orders' | 'messages' | 'profile' | 'settings';

interface DbBusinessProfile {
  user_id: string;
  business_name: string;
  business_type?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  app_url?: string | null;
  budget_range?: string | null;
  description?: string | null;
  logo_path?: string | null;
  verification_status?: string | null;
  created_at?: string | null;
}

export const dynamic = 'force-dynamic';

function BusinessDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    orders,
    creators,
    campaigns,
    createCampaign,
    deleteCampaign,
    updateBusinessProfile,
    collaborationRequests,
    cancelCollaborationRequest,
    conversations,
  } = useMarketplace();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [dbBusiness, setDbBusiness] = useState<DbBusinessProfile | null>(null);
  const [savedCreatorIds, setSavedCreatorIds] = useState<string[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Filter for orders tab
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');

  // Discover filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');

  // Campaign creation modal state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState<'app' | 'website' | 'saas' | 'product' | 'service'>('app');
  const [appUrl, setAppUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState('Technology');
  const [budget, setBudget] = useState('25000');
  const [description, setDescription] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  // Profile edit form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAppUrl, setEditAppUrl] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editState, setEditState] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudgetRange, setEditBudgetRange] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam && ['home', 'discover', 'orders', 'messages', 'profile', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Authenticate user & load real business data
  const initUser = async () => {
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

      // Verify profile and role
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profError) {
        console.error('Error fetching profile in business dashboard:', profError);
      }

      if (!profile?.role) {
        router.replace('/auth/role-select');
        return;
      }

      const normalizedRole = profile.role.toLowerCase();
      if (normalizedRole === 'creator' || normalizedRole === 'influencer') {
        router.replace('/dashboard/creator');
        return;
      }

      // Query business profile
      const { data: bp, error: bpError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (bpError) {
        console.error('Error fetching business profile:', bpError);
      }

      if (bp) {
        setDbBusiness(bp);
        setEditName(bp.business_name || '');
        setEditIndustry(bp.industry || 'Technology & SaaS');
        setEditWebsite(bp.website || '');
        setEditAppUrl(bp.app_url || '');
        setEditCountry(bp.country || 'India');
        setEditState(bp.state || '');
        setEditCity(bp.city || 'India');
        setEditDescription(bp.description || '');
        setEditBudgetRange(bp.budget_range || '');
      } else {
        // Safely recover / create business profile row
        const meta = user.user_metadata || {};
        const fallbackName = meta.full_name || meta.name || profile.display_name || 'My Business';
        const { data: newBp } = await supabase
          .from('business_profiles')
          .upsert(
            {
              user_id: user.id,
              business_name: fallbackName,
              business_type: 'app',
              industry: 'Technology & SaaS',
              city: 'India',
              country: 'India',
              verification_status: 'unverified',
            },
            { onConflict: 'user_id' }
          )
          .select('*')
          .maybeSingle();

        if (newBp) {
          setDbBusiness(newBp);
          setEditName(newBp.business_name || fallbackName);
        } else {
          router.replace('/auth/onboarding/business');
          return;
        }
      }
    } catch (err) {
      console.error('Error initializing business dashboard:', err);
      setPageError('Unable to load business dashboard. Please try again.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    initUser();
  }, [router]);

  // Real orders belonging to this authenticated business user
  const businessOrders = orders.filter(
    (o) =>
      o.business_id === currentUser?.id ||
      o.business_user_id === currentUser?.id ||
      o.business?.user_id === currentUser?.id
  );

  // Real collaboration requests sent by this authenticated business user
  const sentRequests = collaborationRequests.filter(
    (r) => r.business_user_id === currentUser?.id
  );
  const userConversations = conversations.filter(
    (c) => c.business_user_id === currentUser?.id || c.creator_user_id === currentUser?.id
  );

  const activeOrders = businessOrders.filter(
    (o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED'
  );
  const completedOrders = businessOrders.filter((o) => o.order_status === 'COMPLETED');
  const totalCommitted = businessOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const filteredOrders = businessOrders.filter((ord) => {
    if (orderFilter === 'ONGOING') {
      return ord.order_status !== 'COMPLETED' && ord.order_status !== 'CANCELLED';
    }
    if (orderFilter === 'COMPLETED') {
      return ord.order_status === 'COMPLETED';
    }
    return true;
  });

  const getOrderStatusGuide = (ord: any) => {
    const isPaid =
      ord.payment_status === 'PAID' ||
      ['PAID', 'WORK_STARTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED'].includes(ord.order_status);

    if (!isPaid) {
      return {
        tag: 'WAITING FOR PAYMENT',
        color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        action: 'Complete payment to start the collaboration.',
      };
    }

    if (ord.order_status === 'DELIVERED') {
      return {
        tag: 'DELIVERY SUBMITTED',
        color: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        action: "Review the creator's Instagram Reel delivery.",
      };
    }

    if (ord.order_status === 'REVISION_REQUESTED') {
      return {
        tag: 'REVISION REQUESTED',
        color: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        action: 'Creator is preparing the requested revision.',
      };
    }

    if (ord.order_status === 'COMPLETED') {
      return {
        tag: 'COMPLETED',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        action: 'Delivery accepted. Order fulfilled.',
      };
    }

    return {
      tag: 'IN PRODUCTION',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      action: 'Creator is working on your Reel.',
    };
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !productName.trim()) {
      setCampaignError('Campaign name and product name are required.');
      return;
    }

    setIsSubmittingCampaign(true);
    setCampaignError(null);

    try {
      await createCampaign({
        business_id: currentUser?.id || '',
        campaign_name: campaignName.trim(),
        product_name: productName.trim(),
        product_type: productType,
        app_url: appUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        category: category.trim() || null,
        description: description.trim() || null,
        campaign_brief: campaignBrief.trim() || null,
        budget: Number(budget) || 0,
        status: 'active',
      });

      setIsCampaignModalOpen(false);
      setCampaignName('');
      setProductName('');
      setAppUrl('');
      setWebsiteUrl('');
      setDescription('');
      setCampaignBrief('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create campaign';
      setCampaignError(msg);
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setProfileErrorMsg('Business name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await updateBusinessProfile({
        business_name: editName.trim(),
        industry: editIndustry.trim(),
        website: editWebsite.trim() || undefined,
        app_url: editAppUrl.trim() || undefined,
        country: editCountry.trim() || 'India',
        state: editState.trim() || undefined,
        city: editCity.trim() || 'India',
        description: editDescription.trim(),
        budget_range: editBudgetRange.trim() || undefined,
      });

      setDbBusiness((prev) => ({
        user_id: currentUser?.id || '',
        business_name: editName.trim(),
        industry: editIndustry.trim(),
        website: editWebsite.trim() || undefined,
        app_url: editAppUrl.trim() || undefined,
        country: editCountry.trim() || 'India',
        state: editState.trim() || undefined,
        city: editCity.trim() || 'India',
        description: editDescription.trim(),
        budget_range: editBudgetRange.trim() || undefined,
        verification_status: prev?.verification_status || 'unverified',
      }));

      setProfileSuccessMsg('Business profile saved successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save business profile';
      setProfileErrorMsg(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const filteredCreators = creators.filter((c) => {
    const displayName = c.display_name || c.profile?.display_name || '';
    const creatorNiche = c.niche || '';
    const matchesSearch =
      displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creatorNiche.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesNiche = selectedNiche === 'all' || creatorNiche.toLowerCase() === selectedNiche.toLowerCase();
    return matchesSearch && matchesNiche;
  });

  const uniqueNiches = Array.from(new Set(creators.map((c) => c.niche).filter(Boolean)));

  if (isLoadingAuth) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading your business workspace...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-mono text-lg font-bold text-[#121214] dark:text-white">Workspace Error</h2>
        <p className="text-xs text-[#71717A] dark:text-zinc-400">{pageError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="sm" onClick={() => initUser()}>
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

  const businessDisplayName = dbBusiness?.business_name || currentUser?.display_name || 'My Business';
  const businessIndustry = dbBusiness?.industry || 'Technology & SaaS';
  const businessLocation = `${dbBusiness?.city || currentUser?.city || 'India'}${
    dbBusiness?.state ? `, ${dbBusiness.state}` : ''
  }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Primary Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#E5E5DE] dark:border-zinc-800 pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'home', label: 'Home' },
          { key: 'discover', label: 'Discover' },
          { key: 'orders', label: `Orders (${businessOrders.length})` },
          { key: 'messages', label: `Messages (${userConversations.length})` },
          { key: 'profile', label: 'Business Profile' },
          { key: 'settings', label: `Campaigns & Settings (${campaigns.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as TabKey);
              router.push(`/dashboard/business?tab=${tab.key}`, { scroll: false });
            }}
            className={`px-3 py-2 rounded-lg transition-colors shrink-0 cursor-pointer font-medium ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white dark:bg-[#FF5416] dark:text-white font-bold shadow-sm'
                : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white hover:bg-[#F4F4F0] dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: HOME                                          */}
      {/* ==================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-[#121214] text-white dark:bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="editorial-label text-[#FF5416]">Business Portal</span>
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold">
                Welcome, {businessDisplayName}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Discover verified influencers, launch targeted Instagram Reel campaigns, and track deliverables safely with platform payment protection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setActiveTab('discover');
                  router.push('/dashboard/business?tab=discover', { scroll: false });
                }}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Find Influencers</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCampaignModalOpen(true)}
                className="text-white border-zinc-700 hover:bg-zinc-800 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-[#FF5416]" />
                <span>New Campaign</span>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Collaborations"
              value={activeOrders.length}
              subtext="Reels in production/review"
              badge="ACTIVE"
            />
            <StatCard
              label="Completed Deliveries"
              value={completedOrders.length}
              subtext="Approved and published"
            />
            <StatCard
              label="Committed Budget"
              value={`₹${totalCommitted.toLocaleString('en-IN')}`}
              subtext="Platform payment protection"
            />
            <StatCard
              label="Active Campaigns"
              value={campaigns.length}
              subtext="App & product promotions"
            />
          </div>

          {/* Active Orders Summary */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#FF5416]" />
                <h2 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                  Active Collaborations
                </h2>
              </div>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  router.push('/dashboard/business?tab=orders', { scroll: false });
                }}
                className="text-xs font-mono text-[#FF5416] hover:underline cursor-pointer"
              >
                View all orders →
              </button>
            </div>

            {activeOrders.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-3">
                <p className="font-mono text-xs text-[#71717A] dark:text-zinc-400">
                  No active influencer collaborations right now.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveTab('discover');
                    router.push('/dashboard/business?tab=discover', { scroll: false });
                  }}
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  <span>Discover Influencers</span>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
                {activeOrders.slice(0, 3).map((ord) => {
                  const guide = getOrderStatusGuide(ord);
                  return (
                    <div
                      key={ord.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#121214] dark:text-white">
                            #{ord.order_number}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${guide.color}`}
                          >
                            {guide.tag}
                          </span>
                        </div>
                        <p className="text-xs text-[#52525B] dark:text-zinc-300 font-mono">
                          Creator: <strong>{ord.creator?.profile?.display_name || 'Influencer'}</strong> • {ord.package?.name || 'Reel Delivery'}
                        </p>
                        <p className="text-[11px] text-[#71717A] dark:text-zinc-400">
                          Next step: {guide.action}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono text-xs font-bold text-[#121214] dark:text-white">
                          ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="outline" size="sm">
                            <span>Open Workspace</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: DISCOVER                                      */}
      {/* ==================================================== */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Marketplace Discovery</span>
                <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                  Discover Influencers
                </h2>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                  Find verified creators for app promotion and direct Instagram Reel collaborations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/discover">
                  <Button variant="outline" size="sm">
                    <span>Full Directory</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search creators by name, niche, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-mono border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
              >
                <option value="all">All Niches</option>
                {uniqueNiches.map((niche) => (
                  <option key={niche} value={niche}>
                    {niche}
                  </option>
                ))}
              </select>
            </div>

            {filteredCreators.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-3">
                <Search className="w-8 h-8 text-[#A1A1AA] mx-auto" />
                <p className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                  No creators found
                </p>
                <p className="text-xs text-[#71717A] dark:text-zinc-400">
                  Try another niche, location, or search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => (
                  <CreatorCard key={creator.user_id} creator={creator} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ORDERS                                        */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Order Management</span>
              <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                All Orders & Collaborations
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Track production progress, deliverable verification, and revision requests.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#F4F4F0] dark:bg-zinc-800 p-1 rounded-lg font-mono text-xs">
              {(['ALL', 'ONGOING', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOrderFilter(filter)}
                  className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                    orderFilter === filter
                      ? 'bg-white dark:bg-zinc-900 text-[#121214] dark:text-white font-bold shadow-xs'
                      : 'text-[#71717A] dark:text-zinc-400 hover:text-[#121214] dark:hover:text-white'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'ONGOING' ? 'Ongoing' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl space-y-3">
              <ShoppingBag className="w-8 h-8 text-[#A1A1AA] mx-auto" />
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                No collaborations yet
              </h3>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-sm mx-auto">
                Explore the marketplace and collaborate with verified creators for your app.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('discover');
                  router.push('/dashboard/business?tab=discover', { scroll: false });
                }}
              >
                Find Influencers
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
              {filteredOrders.map((ord) => {
                const guide = getOrderStatusGuide(ord);
                return (
                  <div
                    key={ord.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/60 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-[#121214] dark:text-white text-base">
                          #{ord.order_number}
                        </strong>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${guide.color}`}
                        >
                          {guide.tag}
                        </span>
                      </div>

                      <div className="text-xs text-[#52525B] dark:text-zinc-300 font-mono">
                        <span>Creator: <strong>{ord.creator?.profile?.display_name || 'Influencer'}</strong></span>
                        <span className="mx-2">•</span>
                        <span>Deliverable: {ord.package?.name || '1 × Instagram Reel'}</span>
                      </div>

                      <p className="text-[11px] text-[#71717A] dark:text-zinc-400 font-mono">
                        Action Required: {guide.action}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-[#121214] dark:text-white block">
                          ₹{Number(ord.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-[#047857]">Payment Protected</span>
                      </div>

                      <Link href={`/orders/${ord.id}`}>
                        <Button variant="outline" size="sm">
                          <span>Workspace</span>
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

      {/* ==================================================== */}
      {/* TAB 4: MESSAGES                                      */}
      {/* ==================================================== */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Messages & Collaboration Workspace
            </h2>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Chat directly with influencers, finalize requirements, and confirm collaboration details.
            </p>
          </div>
          <ConversationChat role="business" />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: BUSINESS PROFILE                              */}
      {/* ==================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="editorial-label text-[#FF5416]">App / Business Identity</span>
              <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                Business Profile
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Influencers view this information when receiving your collaboration requests.
              </p>
            </div>

            <div>
              {!isEditingProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileErrorMsg(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 rounded-lg text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Company / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Industry / Category
                  </label>
                  <input
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    placeholder="e.g. Technology & SaaS, D2C, Gaming"
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    App Store / Play Store URL
                  </label>
                  <input
                    type="url"
                    value={editAppUrl}
                    onChange={(e) => setEditAppUrl(e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                  Description & Campaign Goals
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe your brand, application, and target audience goals..."
                  className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                  Estimated Monthly Budget
                </label>
                <input
                  type="text"
                  value={editBudgetRange}
                  onChange={(e) => setEditBudgetRange(e.target.value)}
                  placeholder="e.g. ₹50,000 - ₹1,00,000"
                  className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button variant="primary" size="sm" type="submit" disabled={isSavingProfile}>
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-xl bg-[#121214] dark:bg-zinc-800 text-white flex items-center justify-center font-mono font-bold text-xl border border-[#E5E5DE] dark:border-zinc-700">
                  {businessDisplayName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h4 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                    {businessDisplayName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#71717A] dark:text-zinc-400 mt-0.5">
                    <span>{businessIndustry}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF5416]" />
                      {businessLocation}
                    </span>
                    {dbBusiness?.website && (
                      <>
                        <span>•</span>
                        <a
                          href={dbBusiness.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5416] hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>{dbBusiness.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      </>
                    )}
                    {dbBusiness?.app_url && (
                      <>
                        <span>•</span>
                        <a
                          href={dbBusiness.app_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5416] hover:underline flex items-center gap-1"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>App Store</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#121214] dark:text-white block font-mono">
                  Description & Campaign Goals
                </span>
                <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-4">
                  {dbBusiness?.description || 'No description provided yet. Click "Edit Profile" to add details.'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
                <span className="text-xs font-semibold text-[#121214] dark:text-white block mb-1 font-mono">
                  Campaign Budget
                </span>
                <div className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
                  {dbBusiness?.budget_range || 'Not specified'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: SETTINGS & CAMPAIGNS                          */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Promotional Campaigns</span>
              <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                Campaigns & App Promotions
              </h2>
              <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                Manage campaigns for multiple apps, SaaS platforms, websites, or products.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCampaignModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-2xl space-y-4">
              <PackageIcon className="w-10 h-10 text-[#A1A1AA] mx-auto" />
              <div className="space-y-1">
                <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                  No campaigns yet
                </h3>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 max-w-md mx-auto">
                  Create a campaign to start working with influencers for your apps or products.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCampaignModalOpen(true)}
              >
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-5 space-y-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono text-base font-bold text-[#121214] dark:text-white">
                          {camp.campaign_name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-[#ECFDF5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-400">
                          {camp.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                        Product: <strong>{camp.product_name}</strong> ({camp.product_type})
                      </p>
                    </div>

                    <button
                      onClick={() => deleteCampaign(camp.id)}
                      className="text-[#71717A] hover:text-red-500 transition-colors p-1"
                      title="Delete Campaign"
                      aria-label="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {camp.description && (
                    <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">
                      {camp.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#71717A] dark:text-zinc-400 border-t border-[#ECECE6] dark:border-zinc-800 pt-3">
                    {camp.budget > 0 && (
                      <span>
                        Budget: <strong>₹{Number(camp.budget).toLocaleString('en-IN')}</strong>
                      </span>
                    )}
                    {camp.category && (
                      <>
                        <span>•</span>
                        <span>{camp.category}</span>
                      </>
                    )}
                    {camp.app_url && (
                      <>
                        <span>•</span>
                        <a
                          href={camp.app_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5416] hover:underline flex items-center gap-1"
                        >
                          <Smartphone className="w-3 h-3" />
                          <span>App Link</span>
                        </a>
                      </>
                    )}
                    {camp.website_url && (
                      <>
                        <span>•</span>
                        <a
                          href={camp.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5416] hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Website</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ECECE6] dark:border-zinc-800 pb-3">
              <div>
                <span className="editorial-label text-[#FF5416]">New Promotion</span>
                <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
                  Create Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-[#71717A] hover:text-[#121214] dark:hover:text-white"
                aria-label="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {campaignError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 rounded-lg text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>{campaignError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Growth Launch"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Product / App Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FocusTimer App"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value as any)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  >
                    <option value="app">Mobile App</option>
                    <option value="website">Website</option>
                    <option value="saas">SaaS / Web App</option>
                    <option value="product">Physical Product</option>
                    <option value="service">Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    App URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://play.google.com/..."
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Website URL (optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://myproduct.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Target Niche / Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Productivity, Tech, Gaming"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                    Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="25000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[#121214] dark:text-white mb-1">
                  Campaign Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of the product and what creators should highlight..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#121214] dark:text-white rounded-lg focus:outline-none focus:border-[#FF5416]"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECE6] dark:border-zinc-800 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmittingCampaign}
                >
                  {isSubmittingCampaign ? 'Creating...' : 'Launch Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4 font-mono text-xs text-[#71717A] dark:text-zinc-400">
          <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading your business workspace...</p>
        </div>
      }
    >
      <BusinessDashboardContent />
    </Suspense>
  );
}
