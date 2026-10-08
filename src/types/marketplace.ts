export type UserRole =
  | 'advertiser'
  | 'influencer'
  | 'creator'
  | 'business'
  | 'promoter'
  | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'verified_manual' | 'verified_oauth' | 'rejected';

export type OrderStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'PAYMENT_PENDING'
  | 'ACCEPTED_AWAITING_PAYMENT'
  | 'NEGOTIATING'
  | 'DEAL_CONFIRMED'
  | 'FUNDED'
  | 'PAID_IN_ESCROW'
  | 'CREATOR_PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'WORK_STARTED'
  | 'WAITING_FOR_BUSINESS'
  | 'OVERDUE'
  | 'DELIVERED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'AUTO_APPROVED'
  | 'DISPUTED'
  | 'SYSTEM_REVIEW'
  | 'ADMIN_REVIEW'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'PAYOUT_PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'COMPLETED';

export type PaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'FUNDED';

export type PayoutStatus = 'UNRELEASED' | 'PAYOUT_PENDING' | 'PAID' | 'HELD' | 'CANCELLED';

export type DisputeReason =
  | "Didn't follow brief"
  | 'Wrong content'
  | 'Late delivery'
  | "Didn't publish"
  | 'Other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type DisputeResolution =
  | 'release_payment'
  | 'refund_business'
  | 'partial_resolve'
  | 'cancelled';

export interface Profile {
  id: string;
  role: UserRole | null;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  city?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AudienceLocation {
  city: string;
  percentage: number;
}

export type ReelType = 'client_work' | 'demo';

export interface CreatorReel {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  storage_path?: string;
  video_url: string;
  thumbnail_path?: string;
  thumbnail_url?: string;
  mime_type?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  type: ReelType;
  sort_order: number;
  is_featured: boolean;
  is_visible: boolean;
  instagram_media_id?: string | null;
  reel_url?: string | null;
  view_count?: number | null;
  like_count?: number | null;
  comments_count?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface CreatorSample {
  id: string;
  creator_id: string;
  image_url: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface CreatorPackage {
  id: string;
  creator_id: string;
  name: string;
  platform?: string;
  content_type?: string;
  price: number;
  currency?: string;
  description: string;
  deliverables?: string | string[];
  delivery_days: number;
  revision_count?: number;
  revisions?: number;
  active: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatorProfile {
  id?: string;
  user_id: string;
  profile?: Profile;
  display_name?: string;
  niche: string;
  bio: string;
  profile_image_path?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  languages?: string[];
  categories?: string[];
  instagram_connected: boolean;
  instagram_verified: boolean;
  instagram_user_id?: string | null;
  instagram_username?: string | null;
  instagram_connected_at?: string | null;
  follower_count: number;
  followers_count?: number;
  average_reach: number;
  engagement_rate: number;
  metrics_source?: 'platform_manual' | 'instagram_meta_verified' | 'instagram_api' | string;
  metrics_verified_at?: string | null;
  audience_gender: { female: number; male: number };
  audience_age: { '18-24': number; '25-34': number; '35+': number };
  audience_locations: AudienceLocation[];
  verification_status: VerificationStatus;
  packages?: CreatorPackage[];
  samples?: CreatorSample[];
  reels?: CreatorReel[];
  starting_price?: number;
  local_reach_percentage?: number;
  /** Private payout UPI ID (VPA) for manual payouts; never exposed to businesses or public discovery */
  payout_upi_id?: string | null;
}

export interface BusinessProfile {
  user_id: string;
  profile?: Profile;
  business_name: string;
  industry: string;
  city: string;
  state?: string | null;
  country?: string | null;
  logo_path?: string | null;
  logo_url?: string | null;
  website?: string | null;
  app_url?: string | null;
  description: string;
  business_type?: 'app' | 'website' | 'product' | 'service';
  category?: string;
  target_audience?: string;
  target_locations?: string[];
  budget_range?: string;
  verification_status: VerificationStatus;
}

export interface Campaign {
  id: string;
  business_id: string;
  campaign_name: string;
  product_name: string;
  product_type: 'app' | 'website' | 'saas' | 'product' | 'service';
  app_url?: string | null;
  website_url?: string | null;
  category?: string | null;
  description?: string | null;
  campaign_brief?: string | null;
  target_locations?: string[] | null;
  budget: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at?: string;
}

export interface OrderBrief {
  id: string;
  order_id: string;
  objective: string;
  requirements: string;
  dos: string;
  donts: string;
  deadline: string;
  additional_notes?: string;
  created_at?: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type?: string;
  from_status?: OrderStatus | string | null;
  to_status: OrderStatus | string;
  actor_id?: string | null;
  triggered_by?: string;
  reason?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DeliverySubmission {
  id: string;
  order_id: string;
  submitted_by: string;
  proof_url: string;
  instagram_post_url?: string;
  file_storage_path?: string;
  notes: string;
  submitted_at: string;
  status: 'pending_review' | 'approved' | 'disputed' | 'revised';
}

export interface DisputeRecord {
  id: string;
  order_id: string;
  opened_by: string;
  reason: DisputeReason;
  description: string;
  evidence_url?: string;
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export type DealProposalStatus =
  | 'ACTIVE'
  | 'ACCEPTED'
  | 'SUPERSEDED'
  | 'DECLINED'
  | 'CANCELLED';

export interface DealProposal {
  id: string;
  request_id?: string | null;
  conversation_id: string;
  order_id?: string | null;
  proposed_by: string;
  proposer_name?: string;
  proposer_role?: UserRole;
  deliverable: string;
  price: number;
  deadline: string;
  revisions_included: number;
  key_requirements: string;
  status: DealProposalStatus;
  version: number;
  supersedes_proposal_id?: string | null;
  accepted_by?: string | null;
  accepted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type CollaborationRequestStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'ACCEPTED'
  | 'NEGOTIATING'
  | 'DEAL_CONFIRMED'
  | 'DECLINED'
  | 'CANCELLED'
  | 'ENDED'
  | 'EXPIRED';

export interface CollaborationRequest {
  id: string;
  business_user_id: string;
  business?: BusinessProfile;
  creator_user_id: string;
  creator?: CreatorProfile;
  campaign_id?: string | null;
  campaign?: Campaign;
  package_id?: string | null;
  package?: CreatorPackage;
  message?: string | null;
  proposed_budget?: number | null;
  status: CollaborationRequestStatus;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  request_id?: string | null;
  order_id?: string | null;
  business_user_id: string;
  business?: BusinessProfile;
  creator_user_id: string;
  creator?: CreatorProfile;
  created_at: string;
  updated_at: string;
  last_message?: ChatMessage;
  proposals?: DealProposal[];
  active_proposal?: DealProposal;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  order_id?: string;
  sender_id: string;
  sender_user_id?: string;
  sender_name?: string;
  sender_role?: UserRole;
  body: string;
  message?: string;
  moderation_status: 'clean' | 'flagged' | 'blocked';
  created_at: string;
  read_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  campaign_id?: string | null;
  campaign?: Campaign;
  request_id?: string | null;
  business_id: string;
  business_user_id?: string;
  business?: BusinessProfile;
  creator_id: string;
  creator_user_id?: string;
  creator?: CreatorProfile;
  package_id: string;
  package?: CreatorPackage;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payout_status: PayoutStatus;
  subtotal: number;
  platform_fee: number;
  total_amount: number;
  deadline: string;
  created_at: string;
  updated_at: string;
  brief?: OrderBrief;
  delivery?: DeliverySubmission;
  dispute?: DisputeRecord;
  events?: OrderEvent[];
  included_revisions?: number;
  revisions_used?: number;
  work_started_at?: string | null;
  agreed_price?: number;
  agreed_deadline?: string;
  requirements?: string;
  delivered_at?: string | null;
  auto_approve_deadline?: string | null;
  waiting_reason?: string | null;
  extension_requested_deadline?: string | null;
  extension_reason?: string | null;
  extension_status?: 'NONE' | 'REQUESTED' | 'ACCEPTED' | 'DECLINED';
  system_review_reason?: string | null;
  system_review_description?: string | null;
  system_review_evidence_url?: string | null;
  payment?: Payment;
}

export interface Payment {
  id: string;
  order_id: string;
  payer_user_id?: string | null;
  provider: string;
  provider_payment_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_signature?: string | null;
  failure_reason?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
