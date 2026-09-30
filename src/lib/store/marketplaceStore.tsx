'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CreatorProfile,
  BusinessProfile,
  Order,
  OrderStatus,
  ChatMessage,
  DisputeReason,
  DisputeResolution,
  AdminAction,
  Profile,
  UserRole,
  CreatorReel,
  Campaign,
} from '@/types/marketplace';
import { moderationService } from '@/lib/services/moderationService';
import { payoutService } from '@/lib/services/payoutService';
import { paymentService } from '@/lib/services/paymentService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface MarketplaceContextType {
  currentUser: Profile | null;
  activeRole: UserRole;
  isLoading: boolean;
  switchUser: (role: UserRole) => void;
  signOut: () => Promise<void>;
  creators: CreatorProfile[];
  businesses: BusinessProfile[];
  orders: Order[];
  campaigns: Campaign[];
  messages: Record<string, ChatMessage[]>;
  adminActions: AdminAction[];
  
  // State Machine Actions
  getOrder: (id: string) => Order | undefined;
  getCreator: (id: string) => CreatorProfile | undefined;
  createOrder: (params: {
    creatorId: string;
    packageId: string;
    brief: {
      objective: string;
      requirements: string;
      dos: string;
      donts: string;
      deadline: string;
      additionalNotes?: string;
    };
  }) => Promise<Order>;
  acceptOrder: (orderId: string) => void;
  declineOrder: (orderId: string, reason?: string) => void;
  startOrderProgress: (orderId: string) => void;
  submitDelivery: (orderId: string, proofUrl: string, notes: string) => void;
  approveDelivery: (orderId: string) => Promise<void>;
  disputeDelivery: (params: {
    orderId: string;
    reason: DisputeReason;
    description: string;
    evidenceUrl?: string;
  }) => void;
  
  // Campaign Actions
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Profile update actions
  updateBusinessProfile: (data: Partial<BusinessProfile>) => Promise<void>;
  updateCreatorProfile: (data: Partial<CreatorProfile>) => Promise<void>;
  
  // Chat Actions
  sendMessage: (orderId: string, body: string) => { warning?: string };
  
  // Admin Actions
  resolveDispute: (orderId: string, resolution: DisputeResolution, notes?: string) => Promise<void>;
  adminReleasePayout: (orderId: string) => Promise<void>;
  adminRefundOrder: (orderId: string) => Promise<void>;
  adminToggleCreatorStatus: (creatorId: string, verify: boolean) => void;
  
  // Reel / Work Portfolio Actions
  addCreatorReel: (creatorId: string, reel: Omit<CreatorReel, 'id' | 'created_at'>) => void;
  deleteCreatorReel: (creatorId: string, reelId: string) => void;
  toggleFeaturedReel: (creatorId: string, reelId: string) => void;
  toggleReelVisibility: (creatorId: string, reelId: string) => void;
  adminModerateReel: (creatorId: string, reelId: string, action: 'remove' | 'feature' | 'unfeature' | 'toggle_visibility') => void;
  
  // Onboarding
  onboardCreator: (profile: Partial<CreatorProfile>) => void;
  onboardBusiness: (profile: Partial<BusinessProfile>) => void;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<UserRole>('business');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Switch role without using fake demo profiles
  const switchUser = (role: UserRole) => {
    setActiveRole(role);
  };

  // Fetch all public creator profiles from Supabase
  const fetchCreators = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [creatorsRes, profilesRes, packagesRes, reelsRes] = await Promise.all([
        supabase.from('creator_profiles').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('creator_packages').select('*'),
        supabase.from('creator_reels').select('*').eq('is_visible', true),
      ]);

      if (creatorsRes.error) {
        console.error('Error fetching creator profiles:', creatorsRes.error);
        return;
      }

      const creatorRows = creatorsRes.data || [];
      const profileRows = profilesRes.data || [];
      const packageRows = packagesRes.data || [];
      const reelRows = reelsRes.data || [];

      const mappedCreators: CreatorProfile[] = creatorRows.map((cp) => {
        const prof = profileRows.find((p) => p.id === cp.user_id);
        const pkgs = packageRows.filter((pkg) => pkg.creator_id === cp.user_id);
        const rls = reelRows.filter((r) => r.creator_id === cp.user_id);

        return {
          id: cp.id || cp.user_id,
          user_id: cp.user_id,
          profile: prof
            ? {
                id: prof.id,
                role: (prof.role as UserRole) || 'creator',
                display_name: cp.display_name || prof.display_name || 'Creator',
                email: prof.email || '',
                avatar_url: cp.profile_image_path || prof.avatar_url,
                city: cp.city || prof.city || 'India',
                created_at: prof.created_at,
                updated_at: prof.updated_at,
              }
            : undefined,
          display_name: cp.display_name || prof?.display_name || 'Creator',
          bio: cp.bio || '',
          profile_image_path: cp.profile_image_path || undefined,
          country: cp.country || 'India',
          state: cp.state || '',
          city: cp.city || prof?.city || 'India',
          languages: cp.languages || ['Hindi', 'English'],
          categories: cp.categories || [cp.niche],
          niche: cp.niche || 'Technology',
          audience_age: (cp.audience_age as { '18-24': number; '25-34': number; '35+': number }) || { '18-24': 50, '25-34': 35, '35+': 15 },
          audience_gender: (cp.audience_gender as { female: number; male: number }) || { female: 45, male: 55 },
          audience_locations: Array.isArray(cp.audience_locations) ? (cp.audience_locations as any[]) : [],
          follower_count: cp.follower_count || 0,
          average_reach: cp.average_reach || 0,
          engagement_rate: Number(cp.engagement_rate) || 0,
          instagram_connected: cp.instagram_connected || false,
          instagram_verified: cp.instagram_verified || false,
          verification_status: (cp.verification_status as any) || 'unverified',
          packages: pkgs.map((p) => ({
            id: p.id,
            creator_id: p.creator_id,
            name: p.name,
            platform: (p.platform as any) || 'Instagram',
            content_type: (p.content_type as any) || 'Reel',
            price: Number(p.price) || 0,
            currency: p.currency || 'INR',
            description: p.description || '',
            deliverables: p.deliverables || [],
            delivery_days: p.delivery_days || 5,
            revision_count: p.revision_count ?? 1,
            active: p.active !== false,
          })),
          reels: rls.map((r) => ({
            id: r.id,
            creator_id: r.creator_id,
            title: r.title,
            description: r.description || undefined,
            video_url: r.video_url,
            thumbnail_url: r.thumbnail_url || undefined,
            type: (r.type as 'client_work' | 'demo') || 'demo',
            sort_order: r.sort_order || 0,
            is_featured: r.is_featured || false,
            is_visible: r.is_visible !== false,
            created_at: r.created_at,
          })),
        };
      });

      setCreators(mappedCreators);
    } catch (err) {
      console.error('Failed to load creators from Supabase:', err);
    }
  }, []);

  // Fetch real data for current authenticated user
  const fetchUserData = useCallback(async (userId: string, role: UserRole | null) => {
    if (!isSupabaseConfigured) return;
    try {
      const normalizedRole = role ? role.toLowerCase() : null;

      if (normalizedRole === 'business' || normalizedRole === 'advertiser') {
        const [bizRes, campaignsRes, ordersRes] = await Promise.all([
          supabase.from('business_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('campaigns').select('*').eq('business_id', userId).order('created_at', { ascending: false }),
          supabase.from('orders').select('*, brief:order_briefs(*)').eq('business_id', userId).order('created_at', { ascending: false }),
        ]);

        if (bizRes.data) {
          const bp = bizRes.data;
          setBusinesses([{
            user_id: bp.user_id,
            business_name: bp.business_name,
            industry: bp.industry || 'Technology & SaaS',
            city: bp.city || 'India',
            state: bp.state || undefined,
            country: bp.country || 'India',
            logo_path: bp.logo_path || undefined,
            website: bp.website || undefined,
            app_url: bp.app_url || undefined,
            description: bp.description || '',
            business_type: bp.business_type as any,
            category: bp.category || undefined,
            target_audience: bp.target_audience || undefined,
            target_locations: bp.target_locations || undefined,
            budget_range: bp.budget_range || undefined,
            verification_status: bp.verification_status as any,
          }]);
        } else {
          setBusinesses([]);
        }

        if (campaignsRes.data) {
          setCampaigns(campaignsRes.data as Campaign[]);
        } else {
          setCampaigns([]);
        }

        if (ordersRes.data) {
          setOrders(ordersRes.data as unknown as Order[]);
        } else {
          setOrders([]);
        }
      } else if (normalizedRole === 'creator' || normalizedRole === 'influencer') {
        const [creatorRes, ordersRes] = await Promise.all([
          supabase.from('creator_profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('orders').select('*, brief:order_briefs(*)').eq('creator_id', userId).order('created_at', { ascending: false }),
        ]);

        if (creatorRes.data) {
          // creator profile handled in creator tab
        }

        if (ordersRes.data) {
          setOrders(ordersRes.data as unknown as Order[]);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    }
  }, []);

  // Main initial loader
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchCreators();

      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            const r = (profile.role as UserRole) || 'business';
            setActiveRole(r);
            setCurrentUser({
              id: profile.id,
              role: (profile.role as UserRole) || null,
              display_name: profile.display_name || user.user_metadata?.full_name || 'User',
              email: profile.email || user.email || '',
              avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
              city: profile.city || 'India',
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });

            await fetchUserData(profile.id, r);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          setBusinesses([]);
          setCampaigns([]);
          setOrders([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchCreators, fetchUserData]);

  // Sync authenticated user on mount and subscribe to auth changes
  useEffect(() => {
    refreshData();

    if (!isSupabaseConfigured) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const r = (profile.role as UserRole) || 'business';
          setActiveRole(r);
          setCurrentUser({
            id: profile.id,
            role: (profile.role as UserRole) || null,
            display_name: profile.display_name || session.user.user_metadata?.full_name || 'User',
            email: profile.email || session.user.email || '',
            avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || null,
            city: profile.city || 'India',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          });

          await fetchUserData(profile.id, r);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setBusinesses([]);
        setCampaigns([]);
        setOrders([]);
        setMessages({});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshData, fetchUserData]);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    setCurrentUser(null);
    setBusinesses([]);
    setCampaigns([]);
    setOrders([]);
    setMessages({});

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('marketur_user');
        localStorage.removeItem('marketur_active_role');
        sessionStorage.clear();
        document.cookie = 'marketur_role_intent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch {}
    }
  };

  const getOrder = (id: string) => orders.find((o) => o.id === id || o.order_number === id);
  const getCreator = (id: string) => creators.find((c) => c.user_id === id);

  const createCampaign = async (
    campaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Campaign> => {
    if (!currentUser) throw new Error('Must be logged in to create a campaign');

    const newRow = {
      business_id: currentUser.id,
      campaign_name: campaignData.campaign_name,
      product_name: campaignData.product_name,
      product_type: campaignData.product_type,
      app_url: campaignData.app_url || null,
      website_url: campaignData.website_url || null,
      category: campaignData.category || null,
      description: campaignData.description || null,
      campaign_brief: campaignData.campaign_brief || null,
      target_locations: campaignData.target_locations || [],
      budget: campaignData.budget || 0,
      status: campaignData.status || 'active',
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(newRow)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Failed to save campaign in database');
      }

      const created = data as Campaign;
      setCampaigns((prev) => [created, ...prev]);
      return created;
    }

    const localCampaign: Campaign = {
      ...newRow,
      id: `camp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCampaigns((prev) => [localCampaign, ...prev]);
    return localCampaign;
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    if (!currentUser) throw new Error('Must be logged in to update campaign');

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', currentUser.id);

      if (error) throw new Error(error.message);
    }

    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCampaign = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to delete campaign');

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)
        .eq('business_id', currentUser.id);

      if (error) throw new Error(error.message);
    }

    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const updateBusinessProfile = async (data: Partial<BusinessProfile>) => {
    if (!currentUser) throw new Error('Must be logged in to update profile');

    const updates: Record<string, any> = {};
    if (data.business_name !== undefined) updates.business_name = data.business_name;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.city !== undefined) updates.city = data.city;
    if (data.state !== undefined) updates.state = data.state;
    if (data.country !== undefined) updates.country = data.country;
    if (data.website !== undefined) updates.website = data.website;
    if (data.app_url !== undefined) updates.app_url = data.app_url;
    if (data.description !== undefined) updates.description = data.description;
    if (data.logo_path !== undefined) updates.logo_path = data.logo_path;
    if (data.business_type !== undefined) updates.business_type = data.business_type;
    if (data.category !== undefined) updates.category = data.category;
    if (data.target_audience !== undefined) updates.target_audience = data.target_audience;
    if (data.target_locations !== undefined) updates.target_locations = data.target_locations;
    if (data.budget_range !== undefined) updates.budget_range = data.budget_range;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('business_profiles')
        .upsert(
          {
            user_id: currentUser.id,
            business_name: data.business_name || 'My Business',
            ...updates,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw new Error(`Failed to update business profile: ${error.message}`);

      if (data.business_name || data.city) {
        await supabase
          .from('profiles')
          .update({
            display_name: data.business_name || currentUser.display_name,
            city: data.city || currentUser.city,
          })
          .eq('id', currentUser.id);
      }
    }

    setBusinesses((prev) => {
      const existing = prev.find((b) => b.user_id === currentUser.id);
      if (existing) {
        return prev.map((b) => (b.user_id === currentUser.id ? { ...b, ...data } : b));
      }
      return [
        {
          user_id: currentUser.id,
          business_name: data.business_name || currentUser.display_name || 'My Business',
          industry: data.industry || 'Technology & SaaS',
          city: data.city || currentUser.city || 'India',
          description: data.description || '',
          verification_status: 'unverified',
          ...data,
        },
        ...prev,
      ];
    });

    if (data.business_name || data.city) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              display_name: data.business_name || prev.display_name,
              city: data.city || prev.city,
            }
          : prev
      );
    }
  };

  const updateCreatorProfile = async (data: Partial<CreatorProfile>) => {
    if (!currentUser) throw new Error('Must be logged in to update creator profile');

    const updates: Record<string, any> = {};
    if (data.display_name !== undefined) updates.display_name = data.display_name;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.niche !== undefined) updates.niche = data.niche;
    if (data.city !== undefined) updates.city = data.city;
    if (data.state !== undefined) updates.state = data.state;
    if (data.country !== undefined) updates.country = data.country;
    if (data.follower_count !== undefined) updates.follower_count = data.follower_count;
    if (data.average_reach !== undefined) updates.average_reach = data.average_reach;
    if (data.engagement_rate !== undefined) updates.engagement_rate = data.engagement_rate;
    if (data.profile_image_path !== undefined) updates.profile_image_path = data.profile_image_path;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('creator_profiles')
        .upsert(
          {
            user_id: currentUser.id,
            niche: data.niche || 'Technology',
            ...updates,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw new Error(`Failed to update creator profile: ${error.message}`);

      if (data.display_name || data.city) {
        await supabase
          .from('profiles')
          .update({
            display_name: data.display_name || currentUser.display_name,
            city: data.city || currentUser.city,
          })
          .eq('id', currentUser.id);
      }
    }

    setCreators((prev) =>
      prev.map((c) => (c.user_id === currentUser.id ? { ...c, ...data } : c))
    );
  };

  const createOrder = async (params: {
    creatorId: string;
    packageId: string;
    brief: {
      objective: string;
      requirements: string;
      dos: string;
      donts: string;
      deadline: string;
      additionalNotes?: string;
    };
  }): Promise<Order> => {
    if (!currentUser) throw new Error('Must be logged in to place an order');

    const creator = creators.find((c) => c.user_id === params.creatorId);
    if (!creator) throw new Error('Creator not found');
    const pkg = creator.packages?.find((p) => p.id === params.packageId);
    if (!pkg) throw new Error('Package not found');

    const business = businesses.find((b) => b.user_id === currentUser.id) || {
      user_id: currentUser.id,
      business_name: currentUser.display_name,
      industry: 'Technology & SaaS',
      city: currentUser.city || 'India',
      description: '',
      verification_status: 'unverified' as const,
    };

    const platformFee = paymentService.calculatePlatformFee(pkg.price);
    const totalAmount = pkg.price + platformFee;
    const orderId = `o_${Date.now()}`;
    const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      order_number: orderNum,
      business_id: currentUser.id,
      business,
      creator_id: creator.user_id,
      creator,
      package_id: pkg.id,
      package: pkg,
      order_status: 'FUNDED',
      payment_status: 'FUNDED',
      payout_status: 'UNRELEASED',
      subtotal: pkg.price,
      platform_fee: platformFee,
      total_amount: totalAmount,
      deadline: params.brief.deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      brief: {
        id: `b_${orderId}`,
        order_id: orderId,
        objective: params.brief.objective,
        requirements: params.brief.requirements,
        dos: params.brief.dos,
        donts: params.brief.donts,
        deadline: params.brief.deadline,
        additional_notes: params.brief.additionalNotes,
        created_at: new Date().toISOString(),
      },
      events: [
        {
          id: `ev_${Date.now()}_1`,
          order_id: orderId,
          from_status: 'DRAFT',
          to_status: 'FUNDED',
          actor_id: currentUser.id,
          reason: 'Collaboration package purchased and escrow funded',
          created_at: new Date().toISOString(),
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    setMessages((prev) => ({
      ...prev,
      [orderId]: [
        {
          id: `msg_init_${orderId}`,
          conversation_id: orderId,
          sender_id: currentUser.id,
          sender_name: business.business_name,
          sender_role: 'business',
          body: `Order initiated: ${pkg.name}. Looking forward to collaborating with you!`,
          moderation_status: 'clean',
          created_at: new Date().toISOString(),
        },
      ],
    }));

    return newOrder;
  };

  const acceptOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const fromStatus = o.order_status;
        const newEvents = [
          ...(o.events || []),
          {
            id: `ev_${Date.now()}`,
            order_id: orderId,
            from_status: fromStatus,
            to_status: 'ACCEPTED' as OrderStatus,
            reason: 'Creator accepted collaboration and confirmed deliverables',
            created_at: new Date().toISOString(),
          },
        ];
        return {
          ...o,
          order_status: 'ACCEPTED',
          updated_at: new Date().toISOString(),
          events: newEvents,
        };
      })
    );
  };

  const declineOrder = (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newEvents = [
          ...(o.events || []),
          {
            id: `ev_${Date.now()}`,
            order_id: orderId,
            from_status: o.order_status,
            to_status: 'CANCELLED' as OrderStatus,
            reason: reason || 'Creator declined collaboration request',
            created_at: new Date().toISOString(),
          },
        ];
        return {
          ...o,
          order_status: 'CANCELLED',
          payment_status: 'REFUNDED',
          updated_at: new Date().toISOString(),
          events: newEvents,
        };
      })
    );
  };

  const startOrderProgress = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          order_status: 'IN_PROGRESS',
          updated_at: new Date().toISOString(),
          events: [
            ...(o.events || []),
            {
              id: `ev_${Date.now()}`,
              order_id: orderId,
              from_status: o.order_status,
              to_status: 'IN_PROGRESS',
              reason: 'Creator started production/filming',
              created_at: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const submitDelivery = (orderId: string, proofUrl: string, notes: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const delivery = {
          id: `del_${Date.now()}`,
          order_id: orderId,
          submitted_by: o.creator_id,
          proof_url: proofUrl,
          notes,
          submitted_at: new Date().toISOString(),
          status: 'pending_review' as const,
        };
        return {
          ...o,
          order_status: 'DELIVERED',
          delivery,
          updated_at: new Date().toISOString(),
          events: [
            ...(o.events || []),
            {
              id: `ev_${Date.now()}`,
              order_id: orderId,
              from_status: o.order_status,
              to_status: 'DELIVERED',
              reason: 'Content delivery proof submitted by creator',
              created_at: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const approveDelivery = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await payoutService.initiatePayout({
      orderId,
      creatorId: order.creator_id,
      amount: order.subtotal,
    });

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          order_status: 'COMPLETED',
          payout_status: 'PAID',
          delivery: o.delivery ? { ...o.delivery, status: 'approved' } : undefined,
          updated_at: new Date().toISOString(),
          events: [
            ...(o.events || []),
            {
              id: `ev_${Date.now()}_app`,
              order_id: orderId,
              from_status: o.order_status,
              to_status: 'APPROVED',
              reason: 'Business approved content delivery',
              created_at: new Date().toISOString(),
            },
            {
              id: `ev_${Date.now()}_comp`,
              order_id: orderId,
              from_status: 'APPROVED',
              to_status: 'COMPLETED',
              reason: `Escrow payout of ₹${order.subtotal.toLocaleString('en-IN')} released to creator via UPI`,
              created_at: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const disputeDelivery = (params: {
    orderId: string;
    reason: DisputeReason;
    description: string;
    evidenceUrl?: string;
  }) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== params.orderId) return o;
        const dispute = {
          id: `dsp_${Date.now()}`,
          order_id: params.orderId,
          opened_by: o.business_id,
          reason: params.reason,
          description: params.description,
          evidence_url: params.evidenceUrl,
          status: 'open' as const,
          created_at: new Date().toISOString(),
        };
        return {
          ...o,
          order_status: 'DISPUTED',
          payout_status: 'HELD',
          dispute,
          delivery: o.delivery ? { ...o.delivery, status: 'disputed' } : undefined,
          updated_at: new Date().toISOString(),
          events: [
            ...(o.events || []),
            {
              id: `ev_${Date.now()}_disp`,
              order_id: params.orderId,
              from_status: o.order_status,
              to_status: 'DISPUTED',
              reason: `Dispute opened: ${params.reason}`,
              metadata: { description: params.description },
              created_at: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const sendMessage = (orderId: string, body: string): { warning?: string } => {
    const moderation = moderationService.inspectMessage(body);

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversation_id: orderId,
      sender_id: currentUser?.id || 'guest',
      sender_name: currentUser?.display_name || 'User',
      sender_role: activeRole,
      body,
      moderation_status: moderation.status,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newMsg],
    }));

    return { warning: moderation.warningMessage };
  };

  const resolveDispute = async (orderId: string, resolution: DisputeResolution, notes?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    let nextOrderStatus: OrderStatus = 'COMPLETED';
    let nextPayoutStatus = order.payout_status;
    let nextPaymentStatus = order.payment_status;

    if (resolution === 'release_payment') {
      nextOrderStatus = 'COMPLETED';
      nextPayoutStatus = 'PAID';
      await payoutService.initiatePayout({
        orderId,
        creatorId: order.creator_id,
        amount: order.subtotal,
      });
    } else if (resolution === 'refund_business') {
      nextOrderStatus = 'REFUNDED';
      nextPaymentStatus = 'REFUNDED';
      nextPayoutStatus = 'CANCELLED';
      await paymentService.initiateRefund({
        orderId,
        amount: order.total_amount,
        reason: notes || 'Admin dispute refund to business',
      });
    } else if (resolution === 'cancelled') {
      nextOrderStatus = 'CANCELLED';
      nextPayoutStatus = 'CANCELLED';
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          order_status: nextOrderStatus,
          payment_status: nextPaymentStatus,
          payout_status: nextPayoutStatus,
          dispute: o.dispute
            ? {
                ...o.dispute,
                status: 'resolved',
                resolution,
                resolved_by: currentUser?.id,
                resolved_at: new Date().toISOString(),
              }
            : undefined,
          updated_at: new Date().toISOString(),
          events: [
            ...(o.events || []),
            {
              id: `ev_${Date.now()}_res`,
              order_id: orderId,
              from_status: o.order_status,
              to_status: nextOrderStatus,
              reason: `Admin resolved dispute: ${resolution}. ${notes || ''}`,
              created_at: new Date().toISOString(),
            },
          ],
        };
      })
    );

    setAdminActions((prev) => [
      {
        id: `act_${Date.now()}`,
        admin_id: currentUser?.id || 'admin_lead',
        action: `RESOLVE_DISPUTE_${resolution.toUpperCase()}`,
        target_type: 'orders',
        target_id: orderId,
        metadata: { resolution, notes },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const adminReleasePayout = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await payoutService.initiatePayout({
      orderId,
      creatorId: order.creator_id,
      amount: order.subtotal,
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payout_status: 'PAID' } : o))
    );

    setAdminActions((prev) => [
      {
        id: `act_${Date.now()}`,
        admin_id: currentUser?.id || 'admin',
        action: 'MANUAL_RELEASE_PAYOUT',
        target_type: 'orders',
        target_id: orderId,
        metadata: { amount: order.subtotal },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const adminRefundOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    await paymentService.initiateRefund({
      orderId,
      amount: order.total_amount,
      reason: 'Admin initiated manual escrow refund',
    });

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'REFUNDED',
              payment_status: 'REFUNDED',
              payout_status: 'CANCELLED',
            }
          : o
      )
    );

    setAdminActions((prev) => [
      {
        id: `act_${Date.now()}`,
        admin_id: currentUser?.id || 'admin',
        action: 'MANUAL_REFUND_ORDER',
        target_type: 'orders',
        target_id: orderId,
        metadata: { amount: order.total_amount },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const adminToggleCreatorStatus = (creatorId: string, verify: boolean) => {
    setCreators((prev) =>
      prev.map((c) =>
        c.user_id === creatorId
          ? {
              ...c,
              verification_status: verify ? 'verified' : 'rejected',
              instagram_verified: verify,
            }
          : c
      )
    );

    setAdminActions((prev) => [
      {
        id: `act_${Date.now()}`,
        admin_id: currentUser?.id || 'admin',
        action: verify ? 'VERIFY_CREATOR' : 'REJECT_CREATOR',
        target_type: 'creator_profiles',
        target_id: creatorId,
        metadata: { status: verify ? 'verified' : 'rejected' },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const onboardCreator = (profileData: Partial<CreatorProfile>) => {
    if (!currentUser) return;
    const newCreator: CreatorProfile = {
      id: currentUser.id,
      user_id: currentUser.id,
      profile: currentUser,
      display_name: profileData.display_name || currentUser.display_name || 'Creator',
      country: profileData.country || 'India',
      state: profileData.state,
      city: profileData.city || currentUser.city || 'India',
      niche: profileData.niche || 'Technology',
      categories: profileData.categories || ['Technology'],
      languages: profileData.languages || ['Hindi', 'English'],
      bio: profileData.bio || '',
      follower_count: profileData.follower_count || 0,
      average_reach: profileData.average_reach || 0,
      engagement_rate: profileData.engagement_rate || 0,
      instagram_connected: profileData.instagram_connected || false,
      instagram_verified: profileData.instagram_verified || false,
      audience_age: profileData.audience_age || { '18-24': 50, '25-34': 35, '35+': 15 },
      audience_gender: profileData.audience_gender || { female: 45, male: 55 },
      audience_locations: profileData.audience_locations || [],
      verification_status: 'unverified',
      packages: profileData.packages || [],
      samples: profileData.samples || [],
      reels: profileData.reels || [],
    };

    setCreators((prev) => {
      const filtered = prev.filter((c) => c.user_id !== currentUser.id);
      return [newCreator, ...filtered];
    });
    setActiveRole('creator');
  };

  const onboardBusiness = (businessData: Partial<BusinessProfile>) => {
    if (!currentUser) return;
    const newBus: BusinessProfile = {
      user_id: currentUser.id,
      profile: currentUser,
      business_name: businessData.business_name || currentUser.display_name || 'Brand Partner',
      industry: businessData.industry || 'Technology & SaaS',
      city: businessData.city || currentUser.city || 'India',
      state: businessData.state,
      country: businessData.country || 'India',
      website: businessData.website || '',
      app_url: businessData.app_url,
      description: businessData.description || '',
      verification_status: 'unverified',
    };

    setBusinesses((prev) => {
      const filtered = prev.filter((b) => b.user_id !== currentUser.id);
      return [newBus, ...filtered];
    });
    setActiveRole('business');
  };

  const addCreatorReel = (creatorId: string, newReel: Omit<CreatorReel, 'id' | 'created_at'>) => {
    const reel: CreatorReel = {
      ...newReel,
      id: `reel_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setCreators((prev) =>
      prev.map((c) => {
        if (c.user_id === creatorId) {
          const currentReels = c.reels || [];
          return {
            ...c,
            reels: [reel, ...currentReels],
          };
        }
        return c;
      })
    );
  };

  const deleteCreatorReel = (creatorId: string, reelId: string) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (c.user_id === creatorId) {
          return {
            ...c,
            reels: (c.reels || []).filter((r) => r.id !== reelId),
          };
        }
        return c;
      })
    );
  };

  const toggleFeaturedReel = (creatorId: string, reelId: string) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (c.user_id === creatorId) {
          return {
            ...c,
            reels: (c.reels || []).map((r) =>
              r.id === reelId ? { ...r, is_featured: !r.is_featured } : r
            ),
          };
        }
        return c;
      })
    );
  };

  const toggleReelVisibility = (creatorId: string, reelId: string) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (c.user_id === creatorId) {
          return {
            ...c,
            reels: (c.reels || []).map((r) =>
              r.id === reelId ? { ...r, is_visible: !r.is_visible } : r
            ),
          };
        }
        return c;
      })
    );
  };

  const adminModerateReel = (
    creatorId: string,
    reelId: string,
    action: 'remove' | 'feature' | 'unfeature' | 'toggle_visibility'
  ) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (c.user_id === creatorId) {
          if (action === 'remove') {
            return {
              ...c,
              reels: (c.reels || []).filter((r) => r.id !== reelId),
            };
          }
          return {
            ...c,
            reels: (c.reels || []).map((r) => {
              if (r.id === reelId) {
                if (action === 'feature') return { ...r, is_featured: true };
                if (action === 'unfeature') return { ...r, is_featured: false };
                if (action === 'toggle_visibility') return { ...r, is_visible: !r.is_visible };
              }
              return r;
            }),
          };
        }
        return c;
      })
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        currentUser,
        activeRole,
        isLoading,
        switchUser,
        signOut,
        creators,
        businesses,
        orders,
        campaigns,
        messages,
        adminActions,
        getOrder,
        getCreator,
        createOrder,
        acceptOrder,
        declineOrder,
        startOrderProgress,
        submitDelivery,
        approveDelivery,
        disputeDelivery,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        updateBusinessProfile,
        updateCreatorProfile,
        sendMessage,
        resolveDispute,
        adminReleasePayout,
        adminRefundOrder,
        adminToggleCreatorStatus,
        addCreatorReel,
        deleteCreatorReel,
        toggleFeaturedReel,
        toggleReelVisibility,
        adminModerateReel,
        onboardCreator,
        onboardBusiness,
        refreshData,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
