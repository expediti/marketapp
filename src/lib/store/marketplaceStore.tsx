'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  CollaborationRequest,
  Conversation,
  DealProposal,
  DealProposalStatus,
} from '@/types/marketplace';
import { moderationService } from '@/lib/services/moderationService';
import { payoutService } from '@/lib/services/payoutService';
import { paymentService } from '@/lib/services/paymentService';
import { startRazorpayPayment } from '@/lib/services/razorpayClient';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface MarketplaceContextType {
  currentUser: Profile | null;
  activeRole: UserRole | null;
  authInitialized: boolean;
  isLoading: boolean;
  switchUser: (role: UserRole) => void;
  signOut: () => Promise<void>;
  creators: CreatorProfile[];
  businesses: BusinessProfile[];
  orders: Order[];
  campaigns: Campaign[];
  collaborationRequests: CollaborationRequest[];
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Record<string, ChatMessage[]>;
  dealProposals: Record<string, DealProposal[]>;
  adminActions: AdminAction[];
  
  // Collaboration Request Actions
  sendCollaborationRequest: (params: {
    creatorUserId: string;
    packageId?: string;
    campaignId?: string;
    message?: string;
    proposedBudget?: number;
  }) => Promise<CollaborationRequest>;
  acceptCollaborationRequest: (requestId: string) => Promise<Conversation>;
  declineCollaborationRequest: (requestId: string, reason?: string) => Promise<void>;
  cancelCollaborationRequest: (requestId: string) => Promise<void>;
  fetchConversationMessages: (conversationId: string) => Promise<ChatMessage[]>;
  fetchConversationProposals: (conversationId: string) => Promise<DealProposal[]>;
  createDealProposal: (params: {
    conversationId: string;
    requestId?: string;
    deliverable: string;
    price: number;
    deadline: string;
    revisionsIncluded?: number;
    keyRequirements: string;
    supersedesProposalId?: string;
  }) => Promise<DealProposal>;
  acceptDealProposal: (proposalId: string) => Promise<Order>;
  endCollaboration: (conversationId: string, reason?: string) => Promise<void>;
  cancelConfirmedDeal: (orderId: string, reason?: string) => Promise<void>;
  simulatePaymentSuccess: (orderId: string) => Promise<void>;
  payOrderWithRazorpay: (
    orderId: string,
    customerName?: string,
    customerEmail?: string
  ) => Promise<{ success: boolean; status: string; error?: string }>;
  markWorkStarted: (orderId: string) => Promise<void>;
  uploadDeliveryProofFile: (file: File) => Promise<{ publicUrl: string; storagePath: string }>;
  createOrderFromCollaboration: (params: {
    requestId?: string;
    creatorId: string;
    packageId?: string;
    campaignId?: string;
    agreedAmount: number;
    includedRevisions?: number;
    brief: {
      objective: string;
      requirements: string;
      dos: string;
      donts: string;
      deadline: string;
      additionalNotes?: string;
    };
  }) => Promise<Order>;

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
  acceptOrder: (orderId: string) => Promise<void>;
  declineOrder: (orderId: string, reason?: string) => Promise<void>;
  startOrderProgress: (orderId: string) => Promise<void>;
  submitDelivery: (orderId: string, proofUrl: string, notes: string, instagramPostUrl?: string) => Promise<void>;
  approveDelivery: (orderId: string) => Promise<void>;
  requestRevision: (orderId: string, notes: string) => Promise<void>;
  requestSystemReview: (params: {
    orderId: string;
    reason: string;
    description: string;
    evidenceUrl?: string;
  }) => Promise<void>;
  markWaitingForBusiness: (orderId: string, reason: string) => Promise<void>;
  resumeFromWaiting: (orderId: string) => Promise<void>;
  requestDeadlineExtension: (orderId: string, requestedDeadline: string, reason: string) => Promise<void>;
  respondDeadlineExtension: (orderId: string, accept: boolean) => Promise<void>;
  checkAutoApprovals: () => Promise<void>;
  disputeDelivery: (params: {
    orderId: string;
    reason: DisputeReason;
    description: string;
    evidenceUrl?: string;
  }) => Promise<void>;
  
  // Campaign Actions
  createCampaign: (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Profile update actions
  updateBusinessProfile: (data: Partial<BusinessProfile>) => Promise<void>;
  updateCreatorProfile: (data: Partial<CreatorProfile>) => Promise<void>;
  
  // Chat Actions
  sendMessage: (conversationOrOrderId: string, body: string) => Promise<{ warning?: string; message?: ChatMessage }>;
  
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
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [dealProposals, setDealProposals] = useState<Record<string, DealProposal[]>>({});
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronization refs for stable callbacks without infinite re-fetch loops
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const dealProposalsRef = useRef(dealProposals);
  useEffect(() => {
    dealProposalsRef.current = dealProposals;
  }, [dealProposals]);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Switch role without using fake demo profiles
  const switchUser = (role: UserRole) => {
    setActiveRole(role);
  };

  // Fetch all public creator profiles from Supabase
  const fetchCreators = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [creatorsRes, profilesRes, packagesRes, reelsRes] = await Promise.all([
        supabase
          .from('creator_profiles')
          .select(
            'id, user_id, display_name, bio, profile_image_path, country, state, city, languages, categories, niche, audience_age, audience_gender, audience_locations, follower_count, average_reach, engagement_rate, instagram_connected, instagram_user_id, instagram_verified, instagram_username, metrics_source, metrics_verified_at, verification_status, created_at, updated_at'
          ),
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
          instagram_username: cp.instagram_username || null,
          metrics_source: (cp.metrics_source as any) || 'platform_manual',
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
            reel_url: r.reel_url || undefined,
            instagram_media_id: r.instagram_media_id || undefined,
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
      // 1. Fetch business profile & campaigns
      const [bizRes, campaignsRes] = await Promise.all([
        supabase.from('business_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('campaigns').select('*').eq('business_id', userId).order('created_at', { ascending: false }),
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
      }

      if (campaignsRes.data) {
        setCampaigns(campaignsRes.data as Campaign[]);
      }

      // 2. Fetch collaboration requests (both sent by user or received by user)
      const [sentReqsRes, recvReqsRes] = await Promise.all([
        supabase
          .from('collaboration_requests')
          .select('*')
          .eq('business_user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('collaboration_requests')
          .select('*')
          .eq('creator_user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      const allReqRows = [
        ...(sentReqsRes.data || []),
        ...(recvReqsRes.data || []),
      ];

      // Remove duplicate rows by id
      const uniqueReqRows = Array.from(new Map(allReqRows.map((r) => [r.id, r])).values());

      // 3. Fetch orders (where user is business OR creator)
      const { data: orderRows, error: ordersErr } = await supabase
        .from('orders')
        .select('*, brief:order_briefs(*), events:order_events(*), deliveries(*)')
        .or(`business_id.eq.${userId},business_user_id.eq.${userId},creator_id.eq.${userId},creator_user_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (ordersErr) {
        console.error('Error fetching orders:', ordersErr);
      }

      // 4. Fetch conversations
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .or(`business_user_id.eq.${userId},creator_user_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (convErr) {
        console.error('Error fetching conversations:', convErr);
      }

      // 5. Gather all related user IDs to fetch their profile display details
      const userIdsToFetch = new Set<string>();
      uniqueReqRows.forEach((r) => {
        if (r.business_user_id) userIdsToFetch.add(r.business_user_id);
        if (r.creator_user_id) userIdsToFetch.add(r.creator_user_id);
      });
      (orderRows || []).forEach((o) => {
        if (o.business_id) userIdsToFetch.add(o.business_id);
        if (o.business_user_id) userIdsToFetch.add(o.business_user_id);
        if (o.creator_id) userIdsToFetch.add(o.creator_id);
        if (o.creator_user_id) userIdsToFetch.add(o.creator_user_id);
      });
      (convRows || []).forEach((c) => {
        if (c.business_user_id) userIdsToFetch.add(c.business_user_id);
        if (c.creator_user_id) userIdsToFetch.add(c.creator_user_id);
      });

      const userIdsList = Array.from(userIdsToFetch);
      let relatedProfiles: any[] = [];
      let relatedBizProfiles: any[] = [];
      let relatedPackages: any[] = [];

      if (userIdsList.length > 0) {
        const [profRes, bprofRes, pkgRes] = await Promise.all([
          supabase.from('profiles').select('*').in('id', userIdsList),
          supabase.from('business_profiles').select('*').in('user_id', userIdsList),
          supabase.from('creator_packages').select('*').in('creator_id', userIdsList),
        ]);
        relatedProfiles = profRes.data || [];
        relatedBizProfiles = bprofRes.data || [];
        relatedPackages = pkgRes.data || [];
      }

      // Helper to build BusinessProfile
      const resolveBusiness = (bId: string): BusinessProfile => {
        const bp = relatedBizProfiles.find((b) => b.user_id === bId);
        const p = relatedProfiles.find((pr) => pr.id === bId);
        return {
          user_id: bId,
          business_name: bp?.business_name || p?.display_name || 'Business',
          industry: bp?.industry || 'Technology & SaaS',
          city: bp?.city || p?.city || 'India',
          state: bp?.state || undefined,
          country: bp?.country || 'India',
          logo_path: bp?.logo_path || undefined,
          logo_url: bp?.logo_path || undefined,
          website: bp?.website || undefined,
          app_url: bp?.app_url || undefined,
          description: bp?.description || '',
          verification_status: (bp?.verification_status as any) || 'unverified',
        };
      };

      // Helper to build CreatorProfile
      const resolveCreator = (cId: string): CreatorProfile => {
        const p = relatedProfiles.find((pr) => pr.id === cId);
        const pkgs = relatedPackages.filter((pkg) => pkg.creator_id === cId);
        return {
          user_id: cId,
          id: cId,
          profile: p
            ? {
                id: p.id,
                role: (p.role as any) || 'creator',
                display_name: p.display_name || 'Creator',
                email: p.email || '',
                avatar_url: p.avatar_url,
                city: p.city || 'India',
                created_at: p.created_at,
              }
            : undefined,
          display_name: p?.display_name || 'Creator',
          bio: '',
          profile_image_path: p?.avatar_url || undefined,
          country: 'India',
          city: p?.city || 'India',
          niche: 'Technology',
          follower_count: 0,
          average_reach: 0,
          engagement_rate: 0,
          instagram_connected: false,
          instagram_verified: false,
          verification_status: 'unverified',
          audience_age: { '18-24': 50, '25-34': 35, '35+': 15 },
          audience_gender: { female: 50, male: 50 },
          audience_locations: [],
          packages: pkgs.map((pkg) => ({
            id: pkg.id,
            creator_id: pkg.creator_id,
            name: pkg.name,
            platform: pkg.platform as any,
            content_type: pkg.content_type as any,
            price: Number(pkg.price) || 0,
            currency: pkg.currency || 'INR',
            description: pkg.description || '',
            delivery_days: pkg.delivery_days || 5,
            active: pkg.active !== false,
          })),
        };
      };

      // Map collaboration requests
      const mappedRequests: CollaborationRequest[] = uniqueReqRows.map((r) => {
        const b = resolveBusiness(r.business_user_id);
        const c = resolveCreator(r.creator_user_id);
        const pkg = relatedPackages.find((p) => p.id === r.package_id);
        const camp = (campaignsRes.data || []).find((cp) => cp.id === r.campaign_id);

        return {
          id: r.id,
          business_user_id: r.business_user_id,
          business: b,
          creator_user_id: r.creator_user_id,
          creator: c,
          campaign_id: r.campaign_id,
          campaign: camp as any,
          package_id: r.package_id,
          package: pkg ? {
            id: pkg.id,
            creator_id: pkg.creator_id,
            name: pkg.name,
            price: Number(pkg.price) || 0,
            delivery_days: pkg.delivery_days || 5,
            description: pkg.description || '',
            active: pkg.active !== false,
          } : undefined,
          message: r.message,
          proposed_budget: r.proposed_budget != null ? Number(r.proposed_budget) : null,
          status: r.status as any,
          responded_at: r.responded_at,
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      });

      setCollaborationRequests(mappedRequests);

      // Map orders
      const mappedOrders: Order[] = (orderRows || []).map((o: any) => {
        const bUserId = o.business_user_id || o.business_id;
        const cUserId = o.creator_user_id || o.creator_id;
        const b = resolveBusiness(bUserId);
        const c = resolveCreator(cUserId);
        const pkg = relatedPackages.find((p) => p.id === o.package_id);
        const camp = (campaignsRes.data || []).find((cp) => cp.id === o.campaign_id);
        const deliveriesList = Array.isArray(o.deliveries) ? o.deliveries : [];
        const lastDelivery = deliveriesList.length > 0 ? deliveriesList[deliveriesList.length - 1] : undefined;

        return {
          id: o.id,
          order_number: o.order_number,
          campaign_id: o.campaign_id,
          campaign: camp as any,
          request_id: o.request_id,
          business_id: bUserId,
          business_user_id: bUserId,
          business: b,
          creator_id: cUserId,
          creator_user_id: cUserId,
          creator: c,
          package_id: o.package_id,
          package: pkg ? {
            id: pkg.id,
            creator_id: pkg.creator_id,
            name: pkg.name,
            price: Number(pkg.price) || 0,
            delivery_days: pkg.delivery_days || 5,
            description: pkg.description || '',
            active: pkg.active !== false,
          } : undefined,
          order_status: o.order_status as any,
          payment_status: o.payment_status as any,
          payout_status: o.payout_status as any,
          subtotal: Number(o.subtotal) || 0,
          platform_fee: Number(o.platform_fee) || 0,
          total_amount: Number(o.total_amount) || 0,
          deadline: o.deadline,
          included_revisions: o.included_revisions ?? 1,
          revisions_used: o.revisions_used ?? 0,
          work_started_at: o.work_started_at || null,
          agreed_price: o.agreed_price ? Number(o.agreed_price) : Number(o.subtotal) || 0,
          agreed_deadline: o.agreed_deadline || o.deadline,
          requirements: o.requirements || o.brief?.requirements || undefined,
          delivered_at: o.delivered_at,
          auto_approve_deadline: o.auto_approve_deadline,
          waiting_reason: o.waiting_reason,
          extension_requested_deadline: o.extension_requested_deadline,
          extension_reason: o.extension_reason,
          extension_status: o.extension_status || 'NONE',
          system_review_reason: o.system_review_reason,
          system_review_description: o.system_review_description,
          system_review_evidence_url: o.system_review_evidence_url,
          created_at: o.created_at,
          updated_at: o.updated_at,
          brief: (Array.isArray(o.brief) ? o.brief[0] : o.brief) as any,
          delivery: lastDelivery ? {
            id: lastDelivery.id,
            order_id: o.id,
            submitted_by: lastDelivery.submitted_by || cUserId,
            proof_url: lastDelivery.proof_url,
            notes: lastDelivery.notes || '',
            submitted_at: lastDelivery.submitted_at || o.delivered_at || o.updated_at,
            status: lastDelivery.status || 'pending_review',
          } : undefined,
          events: Array.isArray(o.events) ? o.events : [],
        };
      });

      setOrders(mappedOrders);

      // Check for any orders that reached the 4-day auto-approval threshold
      if (isSupabaseConfigured) {
        try {
          (supabase as any).rpc('process_auto_approvals').then(() => {}).catch(() => {});
        } catch {}
      }

      // Map conversations
      const mappedConvs: Conversation[] = (convRows || []).map((cv) => {
        const b = resolveBusiness(cv.business_user_id);
        const c = resolveCreator(cv.creator_user_id);

        return {
          id: cv.id,
          request_id: cv.request_id,
          order_id: cv.order_id,
          business_user_id: cv.business_user_id,
          business: b,
          creator_user_id: cv.creator_user_id,
          creator: c,
          created_at: cv.created_at,
          updated_at: cv.updated_at,
        };
      });

      setConversations(mappedConvs);

      // Fetch messages for all conversations
      if (mappedConvs.length > 0) {
        const convIds = mappedConvs.map((cv) => cv.id);
        const { data: msgsData } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });

        if (msgsData) {
          const grouped: Record<string, ChatMessage[]> = {};
          msgsData.forEach((m) => {
            const senderProf = relatedProfiles.find((p) => p.id === m.sender_id || p.id === m.sender_user_id);
            const chatMsg: ChatMessage = {
              id: m.id,
              conversation_id: m.conversation_id,
              sender_id: m.sender_id || m.sender_user_id || '',
              sender_user_id: m.sender_user_id || undefined,
              sender_name: senderProf?.display_name || (m.sender_role === 'creator' ? 'Creator' : 'Business'),
              sender_role: m.sender_role as any,
              body: m.body || m.message || '',
              message: m.message || m.body || '',
              moderation_status: (m.moderation_status as any) || 'clean',
              created_at: m.created_at,
              read_at: m.read_at || undefined,
            };
            if (!grouped[m.conversation_id]) {
              grouped[m.conversation_id] = [];
            }
            grouped[m.conversation_id].push(chatMsg);

            // Also index by order_id if conversation is tied to an order
            const conv = mappedConvs.find((c) => c.id === m.conversation_id);
            if (conv?.order_id) {
              if (!grouped[conv.order_id]) {
                grouped[conv.order_id] = [];
              }
              grouped[conv.order_id].push(chatMsg);
            }
          });

          setMessages(grouped);
        }

        // Fetch deal proposals for all conversations
        const { data: propsData } = await supabase
          .from('deal_proposals')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });

        if (propsData) {
          const propsGrouped: Record<string, DealProposal[]> = {};
          (propsData || []).forEach((p: any) => {
            const conv = mappedConvs.find((c) => c.id === p.conversation_id);
            const isBiz = p.proposed_by === conv?.business_user_id;
            const proposal: DealProposal = {
              id: p.id,
              request_id: p.request_id,
              conversation_id: p.conversation_id,
              order_id: p.order_id,
              proposed_by: p.proposed_by,
              proposer_name: isBiz
                ? conv?.business?.business_name || 'Business'
                : conv?.creator?.display_name || 'Creator',
              proposer_role: isBiz ? 'business' : 'creator',
              deliverable: p.deliverable,
              price: Number(p.price) || 0,
              deadline: p.deadline,
              revisions_included: p.revisions_included ?? 1,
              key_requirements: p.key_requirements,
              status: p.status as DealProposalStatus,
              version: p.version || 1,
              supersedes_proposal_id: p.supersedes_proposal_id,
              accepted_by: p.accepted_by,
              accepted_at: p.accepted_at,
              created_at: p.created_at,
              updated_at: p.updated_at,
            };
            if (!propsGrouped[p.conversation_id]) {
              propsGrouped[p.conversation_id] = [];
            }
            propsGrouped[p.conversation_id].push(proposal);
          });

          setDealProposals(propsGrouped);

          // Attach proposals to mappedConvs
          mappedConvs.forEach((c) => {
            const plist = propsGrouped[c.id] || [];
            c.proposals = plist;
            c.active_proposal = plist.slice().reverse().find((p) => p.status === 'ACTIVE') || plist[plist.length - 1];
          });
          setConversations([...mappedConvs]);
        }
      }
    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    }
  }, []);

  // Clears all private user and dashboard data immediately
  const clearUserData = useCallback(() => {
    setCurrentUser(null);
    setActiveRole(null);
    setBusinesses([]);
    setCampaigns([]);
    setOrders([]);
    setCollaborationRequests([]);
    setConversations([]);
    setActiveConversationId(null);
    setMessages({});
    setDealProposals({});
  }, []);

  // Main loader for manual data refresh
  const refreshData = useCallback(async () => {
    await fetchCreators();

    if (!isSupabaseConfigured) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const r = (profile.role as UserRole) || null;
          setActiveRole(r);
          setCurrentUser({
            id: profile.id,
            role: r,
            display_name: profile.display_name || user.user_metadata?.full_name || 'User',
            email: profile.email || user.email || '',
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || null,
            city: profile.city || 'India',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          });

          await fetchUserData(profile.id, r);
        } else {
          setCurrentUser({
            id: user.id,
            role: null,
            display_name: user.user_metadata?.full_name || 'User',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            city: 'India',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setActiveRole(null);
        }
      } else {
        clearUserData();
      }
    } catch (err) {
      console.error('Error refreshing marketplace store:', err);
    }
  }, [fetchCreators, fetchUserData, clearUserData]);

  // Single source of truth: Supabase auth state change listener
  useEffect(() => {
    fetchCreators();

    if (!isSupabaseConfigured) {
      setAuthInitialized(true);
      setIsLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle SIGNED_OUT or missing session
      if (event === 'SIGNED_OUT' || !session?.user) {
        clearUserData();
        setAuthInitialized(true);
        setIsLoading(false);
        return;
      }

      // Handle INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
      if (session?.user) {
        try {
          const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profError) {
            console.error('Error loading user profile:', profError);
          }

          if (profile) {
            const r = (profile.role as UserRole) || null;
            setActiveRole(r);
            setCurrentUser({
              id: profile.id,
              role: r,
              display_name: profile.display_name || session.user.user_metadata?.full_name || 'User',
              email: profile.email || session.user.email || '',
              avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || null,
              city: profile.city || 'India',
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });

            await fetchUserData(profile.id, r);
          } else {
            setCurrentUser({
              id: session.user.id,
              role: null,
              display_name: session.user.user_metadata?.full_name || 'User',
              email: session.user.email || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              city: 'India',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setActiveRole(null);
          }
        } catch (err) {
          console.error('Error synchronizing auth state:', err);
        } finally {
          setAuthInitialized(true);
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCreators, fetchUserData, clearUserData]);

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Error signing out of Supabase:', error);
          throw error;
        }
      }
    } finally {
      clearUserData();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.clear();
          document.cookie = 'marketur_role_intent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        } catch {}
      }
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
    if (data.payout_upi_id !== undefined) updates.payout_upi_id = data.payout_upi_id;

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

  // --------------------------------------------------------------------------
  // Realtime subscriptions for active conversation (messages, deal_proposals, conversation)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !activeConversationId) return;

    const convChannel = supabase
      .channel(`realtime_conv_${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          const mapped: ChatMessage = {
            id: newRow.id,
            conversation_id: newRow.conversation_id,
            sender_id: newRow.sender_id || newRow.sender_user_id,
            sender_user_id: newRow.sender_user_id,
            sender_name: newRow.sender_role === 'creator' ? 'Creator' : 'Business',
            sender_role: newRow.sender_role as any,
            body: newRow.body || newRow.message || '',
            message: newRow.message || newRow.body || '',
            moderation_status: newRow.moderation_status || 'clean',
            created_at: newRow.created_at,
            read_at: newRow.read_at,
          };

          setMessages((prev) => {
            const currentList = prev[activeConversationId] || [];
            if (currentList.some((m) => m.id === mapped.id)) return prev;
            return {
              ...prev,
              [activeConversationId]: [...currentList, mapped],
            };
          });

          // If message links to order, link conversation to order
          if (newRow.order_id) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId && !c.order_id
                  ? { ...c, order_id: newRow.order_id }
                  : c
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deal_proposals',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row || !row.id) return;

          if (payload.eventType === 'DELETE') {
            setDealProposals((prev) => ({
              ...prev,
              [activeConversationId]: (prev[activeConversationId] || []).filter((p) => p.id !== row.id),
            }));
            return;
          }

          setConversations((prev) => {
            const conv = prev.find((c) => c.id === activeConversationId);
            const isBiz = row.proposed_by === conv?.business_user_id;
            const mappedProposal: DealProposal = {
              id: row.id,
              request_id: row.request_id,
              conversation_id: row.conversation_id,
              order_id: row.order_id,
              proposed_by: row.proposed_by,
              proposer_name: isBiz
                ? conv?.business?.business_name || 'Business'
                : conv?.creator?.display_name || 'Creator',
              proposer_role: isBiz ? 'business' : 'creator',
              deliverable: row.deliverable,
              price: Number(row.price) || 0,
              deadline: row.deadline,
              revisions_included: row.revisions_included ?? 1,
              key_requirements: row.key_requirements,
              status: row.status as DealProposalStatus,
              version: row.version || 1,
              supersedes_proposal_id: row.supersedes_proposal_id,
              accepted_by: row.accepted_by,
              accepted_at: row.accepted_at,
              created_at: row.created_at,
              updated_at: row.updated_at,
            };

            setDealProposals((propPrev) => {
              const list = propPrev[activeConversationId] || [];
              const exists = list.some((p) => p.id === mappedProposal.id);
              const updated = exists
                ? list.map((p) => (p.id === mappedProposal.id ? mappedProposal : p))
                : [...list, mappedProposal];
              return {
                ...propPrev,
                [activeConversationId]: updated,
              };
            });

            return prev.map((c) => {
              if (c.id === activeConversationId) {
                const list = c.proposals || [];
                const exists = list.some((p) => p.id === mappedProposal.id);
                const updated = exists
                  ? list.map((p) => (p.id === mappedProposal.id ? mappedProposal : p))
                  : [...list, mappedProposal];
                const activeP =
                  updated.slice().reverse().find((p) => p.status === 'ACTIVE') ||
                  (mappedProposal.status === 'ACCEPTED' ? mappedProposal : updated[updated.length - 1]);
                return {
                  ...c,
                  proposals: updated,
                  active_proposal: activeP,
                  order_id: row.order_id || c.order_id,
                };
              }
              return c;
            });
          });

          if (row.status === 'ACCEPTED' && currentUser?.id) {
            fetchUserData(currentUser.id, activeRole).catch(console.error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${activeConversationId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row || !row.id) return;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === row.id
                ? {
                    ...c,
                    order_id: row.order_id || c.order_id,
                    updated_at: row.updated_at,
                  }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, [activeConversationId, currentUser?.id, activeRole, fetchUserData]);

  // --------------------------------------------------------------------------
  // Realtime subscription for user-level entities (orders, requests, notifications)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser?.id) return;

    const userChannel = supabase
      .channel(`realtime_user_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row || !row.id) return;

          if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== row.id));
            return;
          }

          setOrders((prev) => {
            const existing = prev.find((o) => o.id === row.id);
            if (existing) {
              return prev.map((o) =>
                o.id === row.id
                  ? {
                      ...o,
                      order_status: row.order_status || o.order_status,
                      payment_status: row.payment_status || o.payment_status,
                      payout_status: row.payout_status || o.payout_status,
                      total_amount: row.total_amount ? Number(row.total_amount) : o.total_amount,
                      included_revisions: row.included_revisions ?? o.included_revisions,
                      revisions_used: row.revisions_used ?? o.revisions_used,
                      work_started_at: row.work_started_at || o.work_started_at,
                      delivered_at: row.delivered_at || o.delivered_at,
                      updated_at: row.updated_at || new Date().toISOString(),
                    }
                  : o
              );
            } else {
              const bUserId = row.business_user_id || row.business_id;
              const cUserId = row.creator_user_id || row.creator_id;
              const synthesized: Order = {
                id: row.id,
                order_number: row.order_number,
                campaign_id: row.campaign_id,
                request_id: row.request_id,
                business_id: bUserId,
                business_user_id: bUserId,
                creator_id: cUserId,
                creator_user_id: cUserId,
                package_id: row.package_id,
                order_status: row.order_status,
                payment_status: row.payment_status,
                payout_status: row.payout_status || 'UNRELEASED',
                subtotal: Number(row.subtotal) || Number(row.agreed_price) || 0,
                platform_fee: Number(row.platform_fee) || 0,
                total_amount: Number(row.total_amount) || 0,
                deadline: row.deadline,
                included_revisions: row.included_revisions ?? 1,
                revisions_used: row.revisions_used ?? 0,
                work_started_at: row.work_started_at || null,
                agreed_price: Number(row.agreed_price) || Number(row.subtotal) || 0,
                agreed_deadline: row.agreed_deadline || row.deadline,
                requirements: row.requirements,
                created_at: row.created_at,
                updated_at: row.updated_at,
              };
              return [synthesized, ...prev];
            }
          });

          // Ensure active conversation links to this order if applicable
          if (row.request_id || row.id) {
            setConversations((prev) =>
              prev.map((c) =>
                (c.request_id === row.request_id || c.order_id === row.id) && !c.order_id
                  ? { ...c, order_id: row.id }
                  : c
              )
            );
          }

          fetchUserData(currentUser.id, activeRole).catch(console.error);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_requests',
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (!row || !row.id) return;

          setCollaborationRequests((prev) =>
            prev.map((r) =>
              r.id === row.id
                ? {
                    ...r,
                    status: row.status || r.status,
                    responded_at: row.responded_at || r.responded_at,
                    updated_at: row.updated_at || r.updated_at,
                  }
                : r
            )
          );

          if (payload.eventType === 'INSERT') {
            fetchUserData(currentUser.id, activeRole).catch(console.error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          fetchUserData(currentUser.id, activeRole).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [currentUser?.id, activeRole, fetchUserData]);

  // --------------------------------------------------------------------------
  // COLLABORATION REQUESTS
  // --------------------------------------------------------------------------
  const sendCollaborationRequest = async (params: {
    creatorUserId: string;
    packageId?: string;
    campaignId?: string;
    message?: string;
    proposedBudget?: number;
  }): Promise<CollaborationRequest> => {
    if (!currentUser) throw new Error('Must be logged in to send a request');

    // Prevent duplicate active pending requests
    const existing = collaborationRequests.find(
      (r) =>
        r.business_user_id === currentUser.id &&
        r.creator_user_id === params.creatorUserId &&
        r.status === 'PENDING' &&
        (params.packageId ? r.package_id === params.packageId : true)
    );

    if (existing) {
      throw new Error('You already have a pending collaboration request with this creator.');
    }

    const creator = creators.find((c) => c.user_id === params.creatorUserId);
    const pkg = creator?.packages?.find((p) => p.id === params.packageId);
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    const business = businesses.find((b) => b.user_id === currentUser.id) || {
      user_id: currentUser.id,
      business_name: currentUser.display_name,
      industry: 'Technology & SaaS',
      city: currentUser.city || 'India',
      description: '',
      verification_status: 'unverified' as const,
    };

    const newReqData = {
      business_user_id: currentUser.id,
      creator_user_id: params.creatorUserId,
      campaign_id: params.campaignId || null,
      package_id: params.packageId || null,
      message: params.message || null,
      proposed_budget: params.proposedBudget != null ? params.proposedBudget : (pkg ? pkg.price : null),
      status: 'REQUESTED' as const,
    };

    let createdId = `req_${Date.now()}`;
    let createdAt = new Date().toISOString();

    if (isSupabaseConfigured) {
      let insertRes = await supabase
        .from('collaboration_requests')
        .insert(newReqData)
        .select('*')
        .single();

      // If remote database still has old constraint rejecting REQUESTED, gracefully fallback to PENDING
      if (insertRes.error && insertRes.error.message?.includes('collaboration_requests_status_check')) {
        console.warn('Remote database constraint requires migration 025 to enable REQUESTED. Retrying with PENDING.');
        insertRes = await supabase
          .from('collaboration_requests')
          .insert({ ...newReqData, status: 'PENDING' as any })
          .select('*')
          .single();
      }

      if (insertRes.error || !insertRes.data) {
        console.error('Failed to create collaboration request:', insertRes.error);
        throw new Error(insertRes.error?.message || 'Failed to send collaboration request');
      }

      createdId = insertRes.data.id;
      createdAt = insertRes.data.created_at;
    }

    const createdReq: CollaborationRequest = {
      id: createdId,
      ...newReqData,
      business,
      creator,
      package: pkg,
      campaign,
      created_at: createdAt,
      updated_at: createdAt,
    };

    setCollaborationRequests((prev) => [createdReq, ...prev]);
    return createdReq;
  };

  const acceptCollaborationRequest = async (requestId: string): Promise<Conversation> => {
    if (!currentUser) throw new Error('Must be logged in to accept request');
    const req = collaborationRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');

    const now = new Date().toISOString();

    let convId = `conv_${Date.now()}`;

    if (isSupabaseConfigured) {
      // 1. Update request status in Supabase
      const { error: reqErr } = await supabase
        .from('collaboration_requests')
        .update({
          status: 'ACCEPTED',
          responded_at: now,
          updated_at: now,
        })
        .eq('id', requestId);

      if (reqErr) {
        console.error('Error accepting request in Supabase:', reqErr);
        throw new Error(reqErr.message);
      }

      // 2. Check if a conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        // Create conversation linking the two users
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            request_id: requestId,
            business_user_id: req.business_user_id,
            creator_user_id: currentUser.id,
          })
          .select('*')
          .single();

        if (convErr || !newConv) {
          console.error('Error creating conversation in Supabase:', convErr);
          throw new Error(convErr?.message || 'Failed to create conversation');
        }
        convId = newConv.id;

        // If request included initial message, create initial message in the conversation
        if (req.message) {
          await supabase.from('messages').insert({
            conversation_id: convId,
            sender_id: req.business_user_id,
            sender_user_id: req.business_user_id,
            body: req.message,
            message: req.message,
            sender_role: 'business',
            moderation_status: 'clean',
          });
        }
      }
    }

    // Update local request state
    setCollaborationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'ACCEPTED', responded_at: now } : r))
    );

    // Create or find local conversation
    const newConvObj: Conversation = {
      id: convId,
      request_id: requestId,
      business_user_id: req.business_user_id,
      business: req.business,
      creator_user_id: currentUser.id,
      creator: req.creator,
      created_at: now,
      updated_at: now,
    };

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === convId || c.request_id === requestId);
      if (exists) return prev;
      return [newConvObj, ...prev];
    });

    setActiveConversationId(convId);

    // If initial message existed, populate in local messages
    if (req.message) {
      setMessages((prev) => ({
        ...prev,
        [convId]: [
          {
            id: `msg_init_${Date.now()}`,
            conversation_id: convId,
            sender_id: req.business_user_id,
            sender_user_id: req.business_user_id,
            sender_name: req.business?.business_name || 'Business',
            sender_role: 'business',
            body: req.message || '',
            message: req.message || '',
            moderation_status: 'clean',
            created_at: now,
          },
        ],
      }));
    }

    return newConvObj;
  };

  const declineCollaborationRequest = async (requestId: string, reason?: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to decline request');
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('collaboration_requests')
        .update({
          status: 'DECLINED',
          responded_at: now,
          updated_at: now,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error declining request:', error);
        throw new Error(error.message);
      }
    }

    setCollaborationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'DECLINED', responded_at: now } : r))
    );
  };

  const cancelCollaborationRequest = async (requestId: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to cancel request');
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('collaboration_requests')
        .update({
          status: 'CANCELLED',
          updated_at: now,
        })
        .eq('id', requestId)
        .eq('business_user_id', currentUser.id)
        .in('status', ['REQUESTED', 'PENDING']);

      if (error) {
        console.error('Error cancelling request:', error);
        throw new Error(error.message);
      }
    }

    setCollaborationRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'CANCELLED', updated_at: now } : r))
    );
  };

  const fetchConversationMessages = useCallback(
    async (conversationId: string): Promise<ChatMessage[]> => {
      if (!isSupabaseConfigured) {
        return messagesRef.current[conversationId] || [];
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages from Supabase:', error);
          return messagesRef.current[conversationId] || [];
        }

        const mapped: ChatMessage[] = (data || []).map((m) => ({
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id || m.sender_user_id || '',
          sender_user_id: m.sender_user_id || undefined,
          sender_name: m.sender_role === 'creator' ? 'Creator' : 'Business',
          sender_role: m.sender_role as any,
          body: m.body || m.message || '',
          message: m.message || m.body || '',
          moderation_status: m.moderation_status as any,
          created_at: m.created_at,
          read_at: m.read_at || undefined,
        }));

        setMessages((prev) => ({
          ...prev,
          [conversationId]: mapped,
        }));

        return mapped;
      } catch (err) {
        console.error('Error loading conversation messages:', err);
        return messagesRef.current[conversationId] || [];
      }
    },
    []
  );

  const detectContactInfoLeakage = (text: string): { allowed: boolean; reason?: string } => {
    const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/;
    if (emailRegex.test(text) || phoneRegex.test(text)) {
      return {
        allowed: false,
        reason: 'Keep collaboration details and payments within Market My App so your order, delivery and transaction records remain protected and traceable. Avoid sharing external personal contact information.',
      };
    }
    return { allowed: true };
  };

  const sendMessage = async (
    conversationOrOrderId: string,
    body: string
  ): Promise<{ warning?: string; message?: ChatMessage }> => {
    if (!currentUser) throw new Error('Must be logged in to send messages');

    let warning: string | undefined;
    let moderationStatus: 'clean' | 'flagged' | 'blocked' = 'clean';
    const cleanCheck = detectContactInfoLeakage(body);
    if (!cleanCheck.allowed) {
      warning = cleanCheck.reason;
      moderationStatus = 'flagged';
    }

    let targetConvId = conversationOrOrderId;
    let targetOrderId: string | null = null;

    const directConv = conversations.find((c) => c.id === conversationOrOrderId);
    if (directConv) {
      targetConvId = directConv.id;
      targetOrderId = directConv.order_id || null;
    } else {
      const orderMatch = orders.find((o) => o.id === conversationOrOrderId);
      if (orderMatch) {
        targetOrderId = orderMatch.id;
        const convForOrder = conversations.find((c) => c.order_id === orderMatch.id);
        if (convForOrder) {
          targetConvId = convForOrder.id;
        }
      }
    }

    const now = new Date().toISOString();
    let msgId = `msg_${Date.now()}`;

    if (isSupabaseConfigured) {
      if (!directConv && targetOrderId) {
        const { data: convRow } = await supabase
          .from('conversations')
          .select('id')
          .eq('order_id', targetOrderId)
          .maybeSingle();
        if (convRow) {
          targetConvId = convRow.id;
        }
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: targetConvId,
          order_id: targetOrderId,
          sender_id: currentUser.id,
          sender_user_id: currentUser.id,
          sender_role: ((currentUser.role || activeRole || 'business') as any),
          body,
          message: body,
          moderation_status: moderationStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message to Supabase:', error);
      } else if (data) {
        msgId = data.id;
      }

      await supabase
        .from('conversations')
        .update({ updated_at: now })
        .eq('id', targetConvId);
    }

    const newMsg: ChatMessage = {
      id: msgId,
      conversation_id: targetConvId,
      order_id: targetOrderId || undefined,
      sender_id: currentUser.id,
      sender_user_id: currentUser.id,
      sender_name: currentUser.display_name,
      sender_role: ((currentUser.role || activeRole || 'business') as any),
      body,
      message: body,
      moderation_status: moderationStatus,
      created_at: now,
    };

    setMessages((prev) => {
      const convList = prev[targetConvId] || [];
      const orderList = targetOrderId && targetOrderId !== targetConvId ? prev[targetOrderId] || [] : [];
      return {
        ...prev,
        [targetConvId]: [...convList, newMsg],
        ...(targetOrderId ? { [targetOrderId]: [...orderList, newMsg] } : {}),
      };
    });

    return { warning, message: newMsg };
  };

  // --------------------------------------------------------------------------
  // STRUCTURED DEAL PROPOSALS & NEGOTIATION
  // --------------------------------------------------------------------------
  const fetchConversationProposals = useCallback(
    async (conversationId: string): Promise<DealProposal[]> => {
      if (!isSupabaseConfigured) {
        return dealProposalsRef.current[conversationId] || [];
      }

      try {
        const { data, error } = await supabase
          .from('deal_proposals')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching deal proposals:', error);
          return dealProposalsRef.current[conversationId] || [];
        }

        const conv = conversationsRef.current.find((c) => c.id === conversationId);

        const mapped: DealProposal[] = (data || []).map((p: any) => {
          const isBiz = p.proposed_by === conv?.business_user_id;
          const proposerName = isBiz
            ? conv?.business?.business_name || 'Business'
            : conv?.creator?.display_name || 'Creator';
          const proposerRole: UserRole = isBiz ? 'business' : 'creator';

          return {
            id: p.id,
            request_id: p.request_id,
            conversation_id: p.conversation_id,
            order_id: p.order_id,
            proposed_by: p.proposed_by,
            proposer_name: proposerName,
            proposer_role: proposerRole,
            deliverable: p.deliverable,
            price: Number(p.price) || 0,
            deadline: p.deadline,
            revisions_included: p.revisions_included ?? 1,
            key_requirements: p.key_requirements,
            status: p.status as DealProposalStatus,
            version: p.version || 1,
            supersedes_proposal_id: p.supersedes_proposal_id,
            accepted_by: p.accepted_by,
            accepted_at: p.accepted_at,
            created_at: p.created_at,
            updated_at: p.updated_at,
          };
        });

        setDealProposals((prev) => ({
          ...prev,
          [conversationId]: mapped,
        }));

        const activeP =
          mapped.slice().reverse().find((p) => p.status === 'ACTIVE') ||
          mapped[mapped.length - 1];

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, proposals: mapped, active_proposal: activeP }
              : c
          )
        );

        return mapped;
      } catch (err) {
        console.error('Error in fetchConversationProposals:', err);
        return dealProposalsRef.current[conversationId] || [];
      }
    },
    []
  );

  const createDealProposal = async (params: {
    conversationId: string;
    requestId?: string;
    deliverable: string;
    price: number;
    deadline: string;
    revisionsIncluded?: number;
    keyRequirements: string;
    supersedesProposalId?: string;
  }): Promise<DealProposal> => {
    if (!currentUser) throw new Error('Must be logged in to create a proposal');
    const conv = conversations.find((c) => c.id === params.conversationId);
    if (!conv) throw new Error('Conversation not found');

    const now = new Date().toISOString();
    let version = 1;

    if (isSupabaseConfigured) {
      if (params.supersedesProposalId) {
        const { data: prevP } = await supabase
          .from('deal_proposals')
          .select('version')
          .eq('id', params.supersedesProposalId)
          .maybeSingle();

        version = ((prevP as any)?.version || 1) + 1;

        await supabase
          .from('deal_proposals')
          .update({ status: 'SUPERSEDED', updated_at: now })
          .eq('id', params.supersedesProposalId);
      }

      const { data: inserted, error: insErr } = await supabase
        .from('deal_proposals')
        .insert({
          conversation_id: params.conversationId,
          request_id: params.requestId || conv.request_id || null,
          proposed_by: currentUser.id,
          deliverable: params.deliverable,
          price: params.price,
          deadline: new Date(params.deadline).toISOString(),
          revisions_included: params.revisionsIncluded ?? 1,
          key_requirements: params.keyRequirements,
          status: 'ACTIVE',
          version,
          supersedes_proposal_id: params.supersedesProposalId || null,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();

      if (insErr || !inserted) {
        console.error('Failed to insert deal proposal:', insErr);
        throw new Error(insErr?.message || 'Failed to create deal proposal');
      }

      const isBiz = currentUser.id === conv.business_user_id;
      const proposerName = isBiz
        ? conv.business?.business_name || 'Business'
        : conv.creator?.display_name || 'Creator';

      const createdProposal: DealProposal = {
        id: inserted.id,
        request_id: inserted.request_id,
        conversation_id: inserted.conversation_id,
        order_id: inserted.order_id,
        proposed_by: inserted.proposed_by,
        proposer_name: proposerName,
        proposer_role: isBiz ? 'business' : 'creator',
        deliverable: inserted.deliverable,
        price: Number(inserted.price),
        deadline: inserted.deadline,
        revisions_included: inserted.revisions_included,
        key_requirements: inserted.key_requirements,
        status: 'ACTIVE',
        version: inserted.version,
        supersedes_proposal_id: inserted.supersedes_proposal_id,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at,
      };

      // 1. Immediately update local state synchronously with the real DB record
      setDealProposals((prev) => {
        const existingList = (prev[params.conversationId] || []).filter(
          (p) => p.id !== createdProposal.id
        );
        const updatedList = params.supersedesProposalId
          ? existingList.map((p) =>
              p.id === params.supersedesProposalId
                ? { ...p, status: 'SUPERSEDED' as DealProposalStatus }
                : p
            )
          : existingList;
        return {
          ...prev,
          [params.conversationId]: [...updatedList, createdProposal],
        };
      });

      setConversations((prev) =>
        prev.map((c) =>
          c.id === params.conversationId
            ? {
                ...c,
                active_proposal: createdProposal,
                proposals: [
                  ...(c.proposals || []).map((p) =>
                    p.id === params.supersedesProposalId
                      ? { ...p, status: 'SUPERSEDED' as DealProposalStatus }
                      : p
                  ),
                  createdProposal,
                ],
              }
            : c
        )
      );

      // 2. Dispatch conversation system message in the background without holding the modal hostage
      sendMessage(
        params.conversationId,
        `📋 [Deal Proposal v${version}] ${params.deliverable} • ₹${params.price.toLocaleString('en-IN')} • Deadline: ${new Date(params.deadline).toLocaleDateString('en-IN')}`
      ).catch((err) => {
        console.warn('Background message dispatch for proposal note:', err);
      });

      // 3. Return the real created proposal immediately so dialog closes without delay
      return createdProposal;
    }

    throw new Error('Supabase is required for deal proposals');
  };

  const acceptDealProposal = async (proposalId: string): Promise<Order> => {
    if (!currentUser) throw new Error('Must be logged in to accept deal proposal');

    if (isSupabaseConfigured) {
      const { data, error } = await (supabase as any).rpc('accept_deal_proposal', {
        p_proposal_id: proposalId,
      });

      if (error) {
        console.error('Failed to accept deal proposal:', error);
        throw new Error(error.message);
      }

      const res = data as any;
      if (!res?.order_id) {
        throw new Error('Failed to create order from proposal');
      }

      // Find the accepted proposal across conversations
      let convId: string | undefined;
      let targetProposal: DealProposal | undefined;
      for (const [cId, plist] of Object.entries(dealProposals)) {
        const found = plist.find((p) => p.id === proposalId);
        if (found) {
          convId = cId;
          targetProposal = found;
          break;
        }
      }

      const now = new Date().toISOString();

      // 1. Immediately update dealProposals state synchronously
      if (convId) {
        setDealProposals((prev) => {
          const list = prev[convId!] || [];
          return {
            ...prev,
            [convId!]: list.map((p) =>
              p.id === proposalId
                ? {
                    ...p,
                    status: 'ACCEPTED' as DealProposalStatus,
                    accepted_at: now,
                    accepted_by: currentUser.id,
                    order_id: res.order_id,
                  }
                : p.status === 'ACTIVE'
                ? { ...p, status: 'SUPERSEDED' as DealProposalStatus }
                : p
            ),
          };
        });

        // 2. Immediately update conversations state synchronously
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  order_id: res.order_id,
                  active_proposal: targetProposal
                    ? {
                        ...targetProposal,
                        status: 'ACCEPTED' as DealProposalStatus,
                        order_id: res.order_id,
                      }
                    : c.active_proposal,
                }
              : c
          )
        );
      }

      // 3. Immediately synthesize and add the new order into orders state
      const targetConv = conversations.find((c) => c.id === convId);
      const targetReqId = targetProposal?.request_id || targetConv?.request_id;
      const targetRequest = collaborationRequests.find((r) => r.id === targetReqId);

      const newOrder: Order = {
        id: res.order_id,
        order_number: res.order_number,
        business_id: targetConv?.business_user_id || currentUser.id,
        business_user_id: targetConv?.business_user_id || currentUser.id,
        business: targetConv?.business,
        creator_id: targetConv?.creator_user_id || currentUser.id,
        creator_user_id: targetConv?.creator_user_id || currentUser.id,
        creator: targetConv?.creator,
        request_id: targetReqId || null,
        campaign_id: targetRequest?.campaign_id || null,
        package_id: targetRequest?.package_id || '00000000-0000-0000-0000-000000000000',
        order_status: 'DEAL_CONFIRMED',
        payment_status: 'PENDING',
        payout_status: 'UNRELEASED',
        subtotal: targetProposal?.price || Number(res.total_amount) || 0,
        platform_fee: Math.round((targetProposal?.price || 0) * 0.05),
        total_amount: Number(res.total_amount) || (targetProposal?.price || 0) * 1.05,
        deadline: targetProposal?.deadline || now,
        included_revisions: res.included_revisions ?? targetProposal?.revisions_included ?? 1,
        revisions_used: 0,
        requirements: targetProposal?.key_requirements,
        created_at: now,
        updated_at: now,
      };

      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

      // 4. Background refresh full user data
      if (currentUser?.id) {
        fetchUserData(currentUser.id, activeRole).catch(console.error);
      }

      return newOrder;
    }

    throw new Error('Supabase required');
  };

  const endCollaboration = async (
    conversationId: string,
    reason?: string
  ): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to end collaboration');

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('end_collaboration', {
        p_conversation_id: conversationId,
        p_reason: reason || 'Collaboration ended during negotiation.',
      });

      if (error) {
        console.error('Failed to end collaboration:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
      await fetchConversationProposals(conversationId);
    }
  };

  const cancelConfirmedDeal = async (
    orderId: string,
    reason?: string
  ): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to cancel deal');

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('cancel_confirmed_deal', {
        p_order_id: orderId,
        p_reason: reason || 'Business cancelled deal before payment.',
      });

      if (error) {
        console.error('Failed to cancel confirmed deal:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
    }
  };

  const simulatePaymentSuccess = async (orderId: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to simulate payment');

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('simulate_payment_success', {
        p_order_id: orderId,
      });

      if (error) {
        console.error('Failed to simulate payment:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
    }
  };

  const payOrderWithRazorpay = async (
    orderId: string,
    customerName?: string,
    customerEmail?: string
  ): Promise<{ success: boolean; status: string; error?: string }> => {
    if (!currentUser) throw new Error('Must be logged in to pay for an order');

    const result = await startRazorpayPayment({
      orderId,
      customerName: customerName || currentUser.display_name,
      customerEmail: customerEmail || currentUser.email,
    });

    if (result.success) {
      // Synchronously transition local order to PAID so UI updates instantaneously
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                order_status: 'PAID',
                payment_status: 'PAID',
                updated_at: new Date().toISOString(),
              }
            : o
        )
      );

      if (currentUser?.id) {
        fetchUserData(currentUser.id, activeRole).catch(console.error);
      }
    }

    return result;
  };

  const markWorkStarted = async (orderId: string): Promise<void> => {
    if (!currentUser) throw new Error('Must be logged in to mark work started');

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('mark_work_started', {
        p_order_id: orderId,
      });

      if (error) {
        console.error('Failed to mark work started:', error);
        throw new Error(error.message);
      }

      // Synchronously transition local order to WORK_STARTED
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                order_status: 'WORK_STARTED',
                work_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : o
        )
      );

      if (currentUser?.id) {
        fetchUserData(currentUser.id, activeRole).catch(console.error);
      }
    }
  };

  const uploadDeliveryProofFile = async (
    file: File
  ): Promise<{ publicUrl: string; storagePath: string }> => {
    if (!isSupabaseConfigured) {
      const fakeUrl = URL.createObjectURL(file);
      return { publicUrl: fakeUrl, storagePath: file.name };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `proofs/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from('deliveries').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Failed to upload delivery file to storage:', error);
      throw new Error(error.message || 'File upload failed');
    }

    const { data: publicUrlData } = supabase.storage
      .from('deliveries')
      .getPublicUrl(path);

    return { publicUrl: publicUrlData.publicUrl, storagePath: path };
  };

  // --------------------------------------------------------------------------
  // DEAL CONFIRMATION & ORDER CREATION (FALLBACK)
  // --------------------------------------------------------------------------
  const createOrderFromCollaboration = async (params: {
    requestId?: string;
    creatorId: string;
    packageId?: string;
    campaignId?: string;
    agreedAmount: number;
    includedRevisions?: number;
    brief: {
      objective: string;
      requirements: string;
      dos: string;
      donts: string;
      deadline: string;
      additionalNotes?: string;
    };
  }): Promise<Order> => {
    if (!currentUser) throw new Error('Must be logged in to confirm deal and create order');

    const creator = creators.find((c) => c.user_id === params.creatorId);
    const pkg = creator?.packages?.find((p) => p.id === params.packageId) || creator?.packages?.[0];
    const campaign = campaigns.find((c) => c.id === params.campaignId);
    const business = businesses.find((b) => b.user_id === currentUser.id) || {
      user_id: currentUser.id,
      business_name: currentUser.display_name,
      industry: 'Technology & SaaS',
      city: currentUser.city || 'India',
      description: '',
      verification_status: 'unverified' as const,
    };

    const platformFee = paymentService.calculatePlatformFee(params.agreedAmount);
    const totalAmount = params.agreedAmount + platformFee;
    const orderNum = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

    let orderId = `o_${Date.now()}`;
    let createdAt = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          business_id: currentUser.id,
          business_user_id: currentUser.id,
          creator_id: params.creatorId,
          creator_user_id: params.creatorId,
          package_id: pkg?.id || params.packageId || '00000000-0000-0000-0000-000000000000',
          campaign_id: params.campaignId || null,
          request_id: params.requestId || null,
          order_status: 'PAYMENT_PENDING',
          payment_status: 'PENDING',
          payout_status: 'UNRELEASED',
          subtotal: params.agreedAmount,
          platform_fee: platformFee,
          total_amount: totalAmount,
          deadline: params.brief.deadline,
          included_revisions: params.includedRevisions ?? 1,
          revisions_used: 0,
        })
        .select('*')
        .single();

      if (orderErr || !orderData) {
        console.error('Failed to create order in Supabase:', orderErr);
        throw new Error(orderErr?.message || 'Failed to create order row');
      }

      orderId = orderData.id;
      createdAt = orderData.created_at;

      // Insert brief
      await supabase.from('order_briefs').insert({
        order_id: orderId,
        objective: params.brief.objective,
        requirements: params.brief.requirements,
        dos: params.brief.dos || null,
        donts: params.brief.donts || null,
        deadline: params.brief.deadline,
        additional_notes: params.brief.additionalNotes || null,
      });

      // Insert event
      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'DRAFT',
        to_status: 'PAYMENT_PENDING',
        actor_id: currentUser.id,
        reason: 'Collaboration deal finalized; order created with payment pending',
      });

      // Link conversation to order if it exists
      if (params.requestId) {
        await supabase
          .from('conversations')
          .update({ order_id: orderId, updated_at: new Date().toISOString() })
          .eq('request_id', params.requestId);
      }
    }

    const newOrder: Order = {
      id: orderId,
      order_number: orderNum,
      campaign_id: params.campaignId || null,
      campaign,
      request_id: params.requestId || null,
      business_id: currentUser.id,
      business_user_id: currentUser.id,
      business,
      creator_id: params.creatorId,
      creator_user_id: params.creatorId,
      creator,
      package_id: pkg?.id || params.packageId || '',
      package: pkg,
      order_status: 'PAYMENT_PENDING',
      payment_status: 'PENDING',
      payout_status: 'UNRELEASED',
      subtotal: params.agreedAmount,
      platform_fee: platformFee,
      total_amount: totalAmount,
      deadline: params.brief.deadline,
      included_revisions: params.includedRevisions ?? 1,
      revisions_used: 0,
      created_at: createdAt,
      updated_at: createdAt,
      brief: {
        id: `b_${orderId}`,
        order_id: orderId,
        objective: params.brief.objective,
        requirements: params.brief.requirements,
        dos: params.brief.dos,
        donts: params.brief.donts,
        deadline: params.brief.deadline,
        additional_notes: params.brief.additionalNotes,
        created_at: createdAt,
      },
      events: [
        {
          id: `ev_${Date.now()}`,
          order_id: orderId,
          from_status: 'DRAFT',
          to_status: 'PAYMENT_PENDING',
          actor_id: currentUser.id,
          reason: 'Collaboration deal finalized; order created with payment pending',
          created_at: createdAt,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Also update conversations in local state with order_id
    if (params.requestId) {
      setConversations((prev) =>
        prev.map((c) => (c.request_id === params.requestId ? { ...c, order_id: orderId } : c))
      );
    }

    return newOrder;
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
    const creator = creators.find((c) => c.user_id === params.creatorId);
    const pkg = creator?.packages?.find((p) => p.id === params.packageId);
    const price = pkg?.price || 5000;

    return createOrderFromCollaboration({
      creatorId: params.creatorId,
      packageId: params.packageId,
      agreedAmount: price,
      brief: params.brief,
    });
  };

  const acceptOrder = async (orderId: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({ order_status: 'ACCEPTED', updated_at: now })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'PAYMENT_PENDING',
        to_status: 'ACCEPTED',
        actor_id: currentUser?.id,
        reason: 'Creator accepted order',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'ACCEPTED',
              updated_at: now,
              events: [
                ...(o.events || []),
                {
                  id: `ev_${Date.now()}`,
                  order_id: orderId,
                  from_status: o.order_status,
                  to_status: 'ACCEPTED',
                  reason: 'Creator accepted order',
                  created_at: now,
                },
              ],
            }
          : o
      )
    );
  };

  const declineOrder = async (orderId: string, reason?: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({ order_status: 'CANCELLED', updated_at: now })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'PAYMENT_PENDING',
        to_status: 'CANCELLED',
        actor_id: currentUser?.id,
        reason: reason || 'Creator declined order',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'CANCELLED',
              updated_at: now,
              events: [
                ...(o.events || []),
                {
                  id: `ev_${Date.now()}`,
                  order_id: orderId,
                  from_status: o.order_status,
                  to_status: 'CANCELLED',
                  reason: reason || 'Creator declined order',
                  created_at: now,
                },
              ],
            }
          : o
      )
    );
  };

  const startOrderProgress = async (orderId: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({ order_status: 'IN_PROGRESS', updated_at: now })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'ACCEPTED',
        to_status: 'IN_PROGRESS',
        actor_id: currentUser?.id,
        reason: 'Creator began work on deliverables',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'IN_PROGRESS',
              updated_at: now,
            }
          : o
      )
    );
  };

  const checkAutoApprovals = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    try {
      await (supabase as any).rpc('process_auto_approvals');
    } catch (e) {
      console.warn('Auto approval check RPC:', e);
    }
  }, []);

  const submitDelivery = async (
    orderId: string,
    proofUrl: string,
    notes: string,
    instagramPostUrl?: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const fourDaysLater = new Date(Date.now() + 4 * 86400000).toISOString();
    const currentOrder = orders.find((o) => o.id === orderId);

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('submit_order_delivery', {
        p_order_id: orderId,
        p_proof_url: proofUrl,
        p_instagram_post_url: instagramPostUrl || null,
        p_notes: notes || null,
      });

      if (error) {
        console.error('Failed to submit delivery via RPC:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'DELIVERED',
              delivered_at: now,
              auto_approve_deadline: fourDaysLater,
              delivery: {
                id: `del_${Date.now()}`,
                order_id: orderId,
                submitted_by: currentUser?.id || o.creator_id,
                proof_url: proofUrl,
                instagram_post_url: instagramPostUrl,
                notes,
                submitted_at: now,
                status: 'pending_review',
              },
              updated_at: now,
              events: [
                ...(o.events || []),
                {
                  id: `ev_${Date.now()}`,
                  order_id: orderId,
                  from_status: o.order_status,
                  to_status: 'DELIVERED',
                  actor_id: currentUser?.id,
                  reason: 'Creator submitted deliverables for 4-day business review',
                  created_at: now,
                },
              ],
            }
          : o
      )
    );
  };

  const approveDelivery = async (orderId: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('accept_order_delivery', {
        p_order_id: orderId,
      });

      if (error) {
        console.error('Failed to accept delivery via RPC:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'COMPLETED',
              payout_status: 'PAYOUT_PENDING',
              auto_approve_deadline: null,
              updated_at: now,
              events: [
                ...(o.events || []),
                {
                  id: `ev_${Date.now()}`,
                  order_id: orderId,
                  from_status: o.order_status,
                  to_status: 'COMPLETED',
                  actor_id: currentUser?.id,
                  reason: 'Business approved deliverables',
                  created_at: now,
                },
              ],
            }
          : o
      )
    );
  };

  const requestRevision = async (orderId: string, notes: string): Promise<void> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const included = order.included_revisions ?? 1;
    const used = order.revisions_used ?? 0;
    if (used >= included) {
      throw new Error(`All included revisions (${included}) have already been used for this order.`);
    }

    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error } = await (supabase as any).rpc('request_order_revision', {
        p_order_id: orderId,
        p_notes: notes,
      });

      if (error) {
        console.error('Failed to request revision via RPC:', error);
        throw new Error(error.message);
      }

      if (currentUser?.id) {
        await fetchUserData(currentUser.id, activeRole);
      }
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'REVISION_REQUESTED',
              revisions_used: (o.revisions_used ?? 0) + 1,
              auto_approve_deadline: null,
              updated_at: now,
            }
          : o
      )
    );
  };

  const requestSystemReview = async (params: {
    orderId: string;
    reason: string;
    description: string;
    evidenceUrl?: string;
  }): Promise<void> => {
    const order = orders.find((o) => o.id === params.orderId);
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          order_status: 'SYSTEM_REVIEW',
          system_review_reason: params.reason,
          system_review_description: params.description,
          system_review_evidence_url: params.evidenceUrl || null,
          auto_approve_deadline: null,
          updated_at: now,
        })
        .eq('id', params.orderId);

      await supabase.from('disputes').insert({
        order_id: params.orderId,
        opened_by: currentUser?.id,
        reason: params.reason as any,
        description: params.description,
        evidence_url: params.evidenceUrl || null,
        status: 'open',
      });

      await supabase.from('order_events').insert({
        order_id: params.orderId,
        from_status: order?.order_status || 'DELIVERED',
        to_status: 'SYSTEM_REVIEW',
        actor_id: currentUser?.id,
        reason: `System Review requested: ${params.reason}. ${params.description}`,
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === params.orderId
          ? {
              ...o,
              order_status: 'SYSTEM_REVIEW',
              system_review_reason: params.reason,
              system_review_description: params.description,
              system_review_evidence_url: params.evidenceUrl,
              auto_approve_deadline: null,
              dispute: {
                id: `disp_${Date.now()}`,
                order_id: params.orderId,
                opened_by: currentUser?.id || '',
                reason: params.reason as any,
                description: params.description,
                evidence_url: params.evidenceUrl,
                status: 'open',
                created_at: now,
              },
              updated_at: now,
              events: [
                ...(o.events || []),
                {
                  id: `ev_${Date.now()}`,
                  order_id: params.orderId,
                  from_status: o.order_status,
                  to_status: 'SYSTEM_REVIEW',
                  actor_id: currentUser?.id,
                  reason: `System Review requested: ${params.reason}`,
                  created_at: now,
                },
              ],
            }
          : o
      )
    );
  };

  const markWaitingForBusiness = async (orderId: string, reason: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          order_status: 'WAITING_FOR_BUSINESS',
          waiting_reason: reason,
          updated_at: now,
        })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'IN_PROGRESS',
        to_status: 'WAITING_FOR_BUSINESS',
        actor_id: currentUser?.id,
        reason: `Creator waiting for business material: ${reason}`,
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'WAITING_FOR_BUSINESS',
              waiting_reason: reason,
              updated_at: now,
            }
          : o
      )
    );
  };

  const resumeFromWaiting = async (orderId: string): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          order_status: 'IN_PROGRESS',
          waiting_reason: null,
          updated_at: now,
        })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'WAITING_FOR_BUSINESS',
        to_status: 'IN_PROGRESS',
        actor_id: currentUser?.id,
        reason: 'Work resumed after receiving required business materials',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              order_status: 'IN_PROGRESS',
              waiting_reason: null,
              updated_at: now,
            }
          : o
      )
    );
  };

  const requestDeadlineExtension = async (
    orderId: string,
    requestedDeadline: string,
    reason: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          extension_status: 'REQUESTED',
          extension_requested_deadline: requestedDeadline,
          extension_reason: reason,
          updated_at: now,
        })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: 'IN_PROGRESS',
        to_status: 'IN_PROGRESS',
        actor_id: currentUser?.id,
        reason: `Creator requested deadline extension to ${new Date(requestedDeadline).toLocaleDateString()}: ${reason}`,
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              extension_status: 'REQUESTED',
              extension_requested_deadline: requestedDeadline,
              extension_reason: reason,
              updated_at: now,
            }
          : o
      )
    );
  };

  const respondDeadlineExtension = async (orderId: string, accept: boolean): Promise<void> => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const now = new Date().toISOString();
    const newDeadline = accept && order.extension_requested_deadline ? order.extension_requested_deadline : order.deadline;
    const status = accept ? 'ACCEPTED' : 'DECLINED';

    if (isSupabaseConfigured) {
      await supabase
        .from('orders')
        .update({
          deadline: newDeadline,
          extension_status: status,
          updated_at: now,
        })
        .eq('id', orderId);

      await supabase.from('order_events').insert({
        order_id: orderId,
        from_status: order.order_status,
        to_status: order.order_status,
        actor_id: currentUser?.id,
        reason: accept
          ? `Business accepted deadline extension to ${new Date(newDeadline).toLocaleDateString()}`
          : 'Business declined deadline extension request',
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              deadline: newDeadline,
              extension_status: status,
              updated_at: now,
            }
          : o
      )
    );
  };

  const disputeDelivery = async (params: {
    orderId: string;
    reason: DisputeReason;
    description: string;
    evidenceUrl?: string;
  }): Promise<void> => {
    return requestSystemReview(params);
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
        reason: notes || 'System Review refund to business',
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
              reason: `System Review resolved: ${resolution}. ${notes || ''}`,
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
      reason: 'System Review initiated platform refund',
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
        authInitialized,
        isLoading,
        switchUser,
        signOut,
        creators,
        businesses,
        orders,
        campaigns,
        collaborationRequests,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        dealProposals,
        adminActions,
        sendCollaborationRequest,
        acceptCollaborationRequest,
        declineCollaborationRequest,
        cancelCollaborationRequest,
        fetchConversationMessages,
        fetchConversationProposals,
        createDealProposal,
        acceptDealProposal,
        endCollaboration,
        cancelConfirmedDeal,
        simulatePaymentSuccess,
        payOrderWithRazorpay,
        markWorkStarted,
        uploadDeliveryProofFile,
        createOrderFromCollaboration,
        getOrder,
        getCreator,
        createOrder,
        acceptOrder,
        declineOrder,
        startOrderProgress,
        submitDelivery,
        approveDelivery,
        requestRevision,
        requestSystemReview,
        markWaitingForBusiness,
        resumeFromWaiting,
        requestDeadlineExtension,
        respondDeadlineExtension,
        checkAutoApprovals,
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
