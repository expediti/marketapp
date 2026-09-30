'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '@/types/marketplace';
import {
  INITIAL_CREATORS,
  INITIAL_BUSINESSES,
  INITIAL_ORDERS,
  INITIAL_MESSAGES,
  INITIAL_ADMIN_ACTIONS,
} from '@/lib/supabase/mockData';
import { moderationService } from '@/lib/services/moderationService';
import { payoutService } from '@/lib/services/payoutService';
import { paymentService } from '@/lib/services/paymentService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface MarketplaceContextType {
  currentUser: Profile | null;
  activeRole: UserRole;
  switchUser: (role: UserRole) => void;
  signOut: () => Promise<void>;
  creators: CreatorProfile[];
  businesses: BusinessProfile[];
  orders: Order[];
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
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<UserRole>('business');
  const [currentUser, setCurrentUser] = useState<Profile | null>(INITIAL_BUSINESSES[0].profile!);
  const [creators, setCreators] = useState<CreatorProfile[]>(INITIAL_CREATORS);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>(INITIAL_BUSINESSES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [adminActions, setAdminActions] = useState<AdminAction[]>(INITIAL_ADMIN_ACTIONS);

  // Sync current user when active role changes
  const switchUser = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'business') {
      setCurrentUser(INITIAL_BUSINESSES[0].profile!);
    } else if (role === 'creator') {
      setCurrentUser(INITIAL_CREATORS[0].profile!);
    } else if (role === 'admin') {
      setCurrentUser({
        id: 'a0000000-0000-0000-0000-000000000001',
        role: 'admin',
        display_name: 'Marketur Lead Admin',
        email: 'ops@marketur.com',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
        city: 'Bengaluru',
        created_at: '2026-09-01T10:00:00Z',
      });
    } else {
      setCurrentUser(null);
    }
  };

  // Sync authenticated user from Supabase session
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Initial user session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              const r = (profile.role || 'business') as UserRole;
              setActiveRole(r);
              setCurrentUser({
                id: profile.id,
                role: (profile.role as UserRole) || null,
                display_name: profile.display_name,
                email: profile.email,
                avatar_url: profile.avatar_url || undefined,
                city: profile.city || 'India',
                created_at: profile.created_at,
                updated_at: profile.updated_at,
              });
            }
          });
      }
    });

    // 2. Auth state change listener
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
          const r = (profile.role || 'business') as UserRole;
          setActiveRole(r);
          setCurrentUser({
            id: profile.id,
            role: (profile.role as UserRole) || null,
            display_name: profile.display_name,
            email: profile.email,
            avatar_url: profile.avatar_url || undefined,
            city: profile.city || 'India',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
  };

  const getOrder = (id: string) => orders.find((o) => o.id === id || o.order_number === id);
  const getCreator = (id: string) => creators.find((c) => c.user_id === id);

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
    const creator = creators.find((c) => c.user_id === params.creatorId);
    if (!creator) throw new Error('Creator not found');
    const pkg = creator.packages?.find((p) => p.id === params.packageId);
    if (!pkg) throw new Error('Package not found');

    const business = businesses[0];
    const platformFee = paymentService.calculatePlatformFee(pkg.price);
    const totalAmount = pkg.price + platformFee;
    const orderId = `o${Date.now()}`;
    const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      order_number: orderNum,
      business_id: business.user_id,
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
          actor_id: business.user_id,
          reason: 'Collaboration package purchased and escrow funded',
          created_at: new Date().toISOString(),
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Initialize conversation thread
    setMessages((prev) => ({
      ...prev,
      [orderId]: [
        {
          id: `msg_init_${orderId}`,
          conversation_id: orderId,
          sender_id: business.user_id,
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

    // Trigger payout service
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
      sender_name: currentUser?.display_name || 'Guest User',
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

  // Admin Actions
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

    // Record admin action
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
    const newCreatorId = `c${Date.now()}`;
    const newCreator: CreatorProfile = {
      user_id: newCreatorId,
      profile: {
        id: newCreatorId,
        role: 'creator',
        display_name: profileData.profile?.display_name || 'Creator New',
        email: profileData.profile?.email || 'newcreator@marketur.local',
        city: profileData.city || profileData.profile?.city || 'Varanasi',
        created_at: new Date().toISOString(),
      },
      country: profileData.country || 'India',
      state: profileData.state || 'Uttar Pradesh',
      city: profileData.city || profileData.profile?.city || 'Varanasi',
      niche: profileData.niche || 'Lifestyle',
      bio: profileData.bio || 'Verified content creator.',
      instagram_connected: true,
      instagram_verified: true,
      follower_count: profileData.follower_count || 22000,
      average_reach: profileData.average_reach || 45000,
      engagement_rate: profileData.engagement_rate || 4.5,
      starting_price: profileData.packages?.[0]?.price || 3000,
      local_reach_percentage: 38,
      audience_gender: profileData.audience_gender || { female: 55, male: 45 },
      audience_age: profileData.audience_age || { '18-24': 45, '25-34': 40, '35+': 15 },
      audience_locations: profileData.audience_locations || [{ city: 'Delhi NCR', percentage: 40 }],
      verification_status: 'verified',
      packages: profileData.packages || [
        {
          id: `pkg_${Date.now()}`,
          creator_id: newCreatorId,
          name: '1 Reel',
          description: '30-45s vertical video featuring your product.',
          price: 3000,
          delivery_days: 5,
          revision_count: 1,
          active: true,
        },
      ],
      samples: [],
      reels: profileData.reels || [],
    };

    setCreators((prev) => [newCreator, ...prev]);
    setCurrentUser(newCreator.profile!);
    setActiveRole('creator');
  };

  const onboardBusiness = (businessData: Partial<BusinessProfile>) => {
    const newBusId = `b${Date.now()}`;
    const newBus: BusinessProfile = {
      user_id: newBusId,
      profile: {
        id: newBusId,
        role: 'business',
        display_name: businessData.business_name || 'Brand Partner',
        email: businessData.profile?.email || 'brand@marketur.local',
        city: businessData.city || 'Mumbai',
        created_at: new Date().toISOString(),
      },
      business_name: businessData.business_name || 'Brand Partner',
      industry: businessData.industry || 'Direct-to-Consumer',
      city: businessData.city || 'Mumbai',
      website: businessData.website || 'https://brand.local',
      description: businessData.description || 'Modern consumer brand.',
      verification_status: 'verified',
    };

    setBusinesses((prev) => [newBus, ...prev]);
    setCurrentUser(newBus.profile!);
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
        switchUser,
        signOut,
        creators,
        businesses,
        orders,
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
