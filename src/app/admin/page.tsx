'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { DisputeResolution, CreatorReel, CreatorProfile, VerificationStatus } from '@/types/marketplace';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Layers,
  History,
  Lock,
  Film,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Building,
  User,
  BadgeCheck,
  Clock,
  X,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    authInitialized,
    orders,
    creators,
    businesses,
    adminActions,
    resolveDispute,
    adminReleasePayout,
    adminRefundOrder,
    adminToggleCreatorStatus,
    adminModerateReel,
    adminVerifyCreatorManual,
    refreshData,
  } = useMarketplace();

  useEffect(() => {
    if (authInitialized) {
      if (!currentUser || currentUser.role !== 'admin') {
        router.replace('/');
      }
    }
  }, [authInitialized, currentUser, router]);

  const [activeTab, setActiveTab] = useState<'overview' | 'reels' | 'disputes' | 'orders' | 'creators' | 'businesses' | 'audit'>('overview');

  if (!authInitialized || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center font-mono text-xs text-[#71717A] dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-[#FF5416] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Creator manual verification review state
  const [selectedCreatorForReview, setSelectedCreatorForReview] = useState<CreatorProfile | null>(null);
  const [reviewFollowerCount, setReviewFollowerCount] = useState<string>('');
  const [reviewEngagementRate, setReviewEngagementRate] = useState<string>('');
  const [reviewAvgReelViews, setReviewAvgReelViews] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);
  const [reviewActionSuccess, setReviewActionSuccess] = useState<string | null>(null);

  const openCreatorReviewModal = (c: CreatorProfile) => {
    setSelectedCreatorForReview(c);
    setReviewFollowerCount(
      c.reviewed_follower_count != null
        ? String(c.reviewed_follower_count)
        : (c.claimed_followers != null ? String(c.claimed_followers) : String(c.follower_count || ''))
    );
    setReviewEngagementRate(
      c.reviewed_engagement_rate != null
        ? String(c.reviewed_engagement_rate)
        : String(c.engagement_rate || '')
    );
    setReviewAvgReelViews(
      c.reviewed_avg_reel_views != null
        ? String(c.reviewed_avg_reel_views)
        : ''
    );
    setReviewNotes(c.review_notes || '');
    setReviewActionError(null);
    setReviewActionSuccess(null);
  };

  const handleExecuteVerification = async (targetStatus: VerificationStatus) => {
    if (!selectedCreatorForReview) return;
    setIsSubmittingReview(true);
    setReviewActionError(null);
    setReviewActionSuccess(null);

    try {
      const followersNum = reviewFollowerCount.trim() ? Number(reviewFollowerCount.replace(/[^0-9]/g, '')) : undefined;
      const engRateNum = reviewEngagementRate.trim() ? Number(reviewEngagementRate) : undefined;
      const viewsNum = reviewAvgReelViews.trim() ? Number(reviewAvgReelViews.replace(/[^0-9]/g, '')) : undefined;

      const res = await adminVerifyCreatorManual(selectedCreatorForReview.user_id, {
        status: targetStatus,
        reviewedFollowerCount: followersNum,
        reviewedEngagementRate: engRateNum,
        reviewedAvgReelViews: viewsNum,
        reviewNotes: reviewNotes.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to apply verification decision');
      }

      setReviewActionSuccess(`Verification status successfully updated to ${targetStatus}`);
      if (refreshData) {
        await refreshData();
      }
      setTimeout(() => {
        setSelectedCreatorForReview(null);
      }, 1000);
    } catch (err: any) {
      setReviewActionError(err?.message || 'Failed to update verification status.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Financial aggregations
  const totalGMV = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const platformRevenue = orders.reduce((sum, o) => sum + o.platform_fee, 0);
  const activeOrdersCount = orders.filter((o) => o.order_status !== 'COMPLETED' && o.order_status !== 'CANCELLED').length;
  const completedOrdersCount = orders.filter((o) => o.order_status === 'COMPLETED').length;
  const disputedOrders = orders.filter((o) => o.order_status === 'DISPUTED' || o.order_status === 'ADMIN_REVIEW');

  // Collect all creator reels across the platform
  const allReels: { reel: CreatorReel; creatorName: string; creatorId: string; creatorCity: string }[] = [];
  creators.forEach((c) => {
    (c.reels || []).forEach((r) => {
      allReels.push({
        reel: r,
        creatorName: c.profile?.display_name || 'Creator',
        creatorId: c.user_id,
        creatorCity: c.profile?.city || 'India',
      });
    });
  });

  const handleResolve = async (orderId: string, resolution: DisputeResolution) => {
    setIsProcessing(true);
    await resolveDispute(orderId, resolution, resolutionNotes || 'Mediation concluded by Platform Ops');
    setIsProcessing(false);
    setSelectedDisputeId(null);
    setResolutionNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#B91C1C]">Restricted Access</span>
            <span className="text-[11px] font-mono text-white bg-[#121214] px-2 py-0.5 rounded">
              Platform Admin Operations
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">
            Platform Management & Moderation
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Manage creators, businesses, portfolio reels, orders, dispute resolution, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
          <span>Platform Health: Operational</span>
        </div>
      </div>

      {/* ADMIN STATS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Volume (GMV)"
          value={`₹${totalGMV.toLocaleString('en-IN')}`}
          subtext="Total transaction volume"
        />
        <StatCard
          label="Platform Commission (5%)"
          value={`₹${platformRevenue.toLocaleString('en-IN')}`}
          subtext="Net platform revenue"
          trend="+5.0% fee"
        />
        <StatCard
          label="Creator Work / Reels"
          value={allReels.length}
          subtext="Across all creator profiles"
        />
        <StatCard
          label="Pending Disputes"
          value={disputedOrders.length}
          subtext={disputedOrders.length > 0 ? 'Requires immediate mediation' : 'All clear'}
          badge={disputedOrders.length > 0 ? 'ATTENTION' : 'CLEAR'}
        />
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'reels', label: `Creator Work / Reels (${allReels.length})` },
          { key: 'creators', label: `Creators (${creators.length})` },
          { key: 'businesses', label: `Businesses (${businesses.length})` },
          { key: 'orders', label: `Orders (${orders.length})` },
          { key: 'disputes', label: `Disputes (${disputedOrders.length})` },
          { key: 'audit', label: `Audit Log (${adminActions.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white font-bold'
                : 'text-[#71717A] hover:text-[#121214] hover:bg-[#F4F4F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DEDICATED TAB: CREATOR WORK / REELS */}
      {activeTab === 'reels' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Content Moderation</span>
              <h2 className="font-mono text-xl font-bold text-[#121214]">Creator Work / Reels Directory</h2>
              <p className="text-xs text-[#71717A] mt-0.5">
                Review video samples, manage visibility, feature high quality work, or remove inappropriate content.
              </p>
            </div>

            <div className="text-xs font-mono text-[#71717A]">
              {allReels.length} total videos tracked
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allReels.map(({ reel, creatorName, creatorId, creatorCity }) => (
              <div
                key={reel.id}
                className="border border-[#E5E5DE] rounded-xl p-4 bg-[#FBFBFA] flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Video / Thumbnail preview */}
                  <div className="aspect-[9/14] w-full rounded-lg bg-[#18181B] overflow-hidden relative mb-3">
                    <ReelVideo
                      src={reel.video_url}
                      poster={reel.thumbnail_url}
                      autoPlay={true}
                      loop={true}
                      muted={true}
                      playsInline={true}
                      className="w-full h-full"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur">
                        {reel.type === 'client_work' ? 'Client Work' : 'Demo Reel'}
                      </span>
                      {reel.is_featured && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FF5416] text-white font-bold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reel details */}
                  <div className="space-y-1">
                    <h4 className="font-mono text-sm font-bold text-[#121214] leading-tight">
                      {reel.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs font-mono text-[#71717A]">
                      <Link
                        href={`/creators/${creatorId}`}
                        className="text-[#FF5416] hover:underline font-semibold"
                      >
                        {creatorName}
                      </Link>
                      <span>{creatorCity}</span>
                    </div>
                    <p className="text-[11px] font-mono text-[#A1A1AA] truncate pt-1">
                      Path: {reel.video_url}
                    </p>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="pt-3 border-t border-[#ECECE6] flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        adminModerateReel(creatorId, reel.id, reel.is_featured ? 'unfeature' : 'feature')
                      }
                      className={`px-2 py-1 rounded border text-[11px] transition-colors flex items-center gap-1 ${
                        reel.is_featured
                          ? 'border-[#FF5416] bg-[#FFF2EC] text-[#FF5416]'
                          : 'border-[#E5E5DE] bg-white text-[#71717A] hover:text-[#121214]'
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      <span>{reel.is_featured ? 'Unfeature' : 'Feature'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        adminModerateReel(creatorId, reel.id, 'toggle_visibility')
                      }
                      className="px-2 py-1 rounded border border-[#E5E5DE] bg-white text-[11px] text-[#71717A] hover:text-[#121214] transition-colors flex items-center gap-1"
                    >
                      {reel.is_visible ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => adminModerateReel(creatorId, reel.id, 'remove')}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove Reel (Moderation Violation)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERVIEW / DISPUTES QUEUE TAB */}
      {(activeTab === 'overview' || activeTab === 'disputes') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-3">
            <div>
              <span className="editorial-label text-[#B91C1C]">Mediation</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">
                Disputes Requiring Admin Resolution
              </h3>
            </div>
            <span className="text-xs font-mono text-[#71717A]">
              {disputedOrders.length} pending mediation
            </span>
          </div>

          {disputedOrders.length === 0 ? (
            <div className="bg-white border border-dashed border-[#E5E5DE] rounded-xl p-8 text-center text-xs text-[#71717A] font-mono">
              Zero active disputes. All current orders are running smoothly.
            </div>
          ) : (
            <div className="space-y-4">
              {disputedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border-2 border-[#B91C1C]/40 rounded-xl p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECECE6] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-base text-[#121214]">{ord.order_number}</strong>
                        <span className="text-xs font-mono bg-[#FEF2F2] text-[#B91C1C] px-2 py-0.5 rounded border border-[#FECACA]">
                          Reason: {ord.dispute?.reason || 'Deliverable conflict'}
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A] font-mono mt-1">
                        Brand: {ord.business?.business_name} vs. Creator: {ord.creator?.profile?.display_name}
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-base font-bold text-[#121214] block">
                        ₹{ord.total_amount.toLocaleString('en-IN')} Held
                      </span>
                      <span className="text-[10px] text-[#B91C1C]">Payout frozen</span>
                    </div>
                  </div>

                  {/* Dispute Details */}
                  <div className="bg-[#FEF2F2]/40 border border-[#FECACA] rounded-lg p-4 text-xs space-y-2 text-[#7F1D1D]">
                    <div className="font-semibold">Brand Claim:</div>
                    <p className="leading-relaxed">{ord.dispute?.description}</p>
                  </div>

                  {/* Deliverable info */}
                  <div className="text-xs font-mono text-[#52525B] bg-[#FBFBFA] p-3 rounded-lg border border-[#E5E5DE]">
                    <span>Brief Objective: </span>
                    <strong className="text-[#121214]">{ord.brief?.objective}</strong>
                  </div>

                  {/* Resolution Controls */}
                  <div className="pt-3 border-t border-[#ECECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm">
                        Inspect Order Workspace & Chat
                      </Button>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolve(ord.id, 'refund_business')}
                        className="text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
                      >
                        Refund Business (₹{ord.total_amount.toLocaleString('en-IN')})
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolve(ord.id, 'release_payment')}
                        className="bg-[#047857] hover:bg-[#065F46]"
                      >
                        Release Payout to Creator (₹{ord.subtotal.toLocaleString('en-IN')})
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALL ORDERS TABLE TAB */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#71717A]">Ledger</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              All Collaboration Transactions
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#ECECE6] text-[#71717A] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Creator</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Payout</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECE6]">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#FBFBFA]">
                    <td className="py-3 px-3 font-bold text-[#121214]">{ord.order_number}</td>
                    <td className="py-3 px-3 text-[#52525B]">{ord.business?.business_name}</td>
                    <td className="py-3 px-3 text-[#121214]">{ord.creator?.profile?.display_name}</td>
                    <td className="py-3 px-3 font-bold text-[#121214]">
                      ₹{ord.total_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.order_status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ord.payout_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {ord.payout_status === 'UNRELEASED' && ord.order_status !== 'DISPUTED' && (
                          <button
                            onClick={() => adminReleasePayout(ord.id)}
                            className="px-2 py-1 bg-[#F4F4F0] hover:bg-[#ECECE6] rounded text-[10px] text-[#047857] font-semibold"
                          >
                            Release Payout
                          </button>
                        )}
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATORS DIRECTORY TAB */}
      {activeTab === 'creators' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3 flex items-center justify-between">
            <div>
              <span className="editorial-label text-[#71717A]">Verification Governance</span>
              <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
                Manual Instagram Creator Verification ({creators.length})
              </h3>
            </div>
          </div>

          <div className="divide-y divide-[#ECECE6]">
            {creators.map((c) => {
              const hasSubmitted = Boolean(c.instagram_profile_url || (c.submitted_reels && c.submitted_reels.length > 0));
              const isVerified = c.verification_status === 'verified' || c.verification_status === 'verified_manual' || c.verification_status === 'verified_oauth';
              const isPending = c.verification_status === 'pending_review' || c.verification_status === 'pending';
              const isResubmission = c.verification_status === 'resubmission_required';
              const isRejected = c.verification_status === 'rejected';

              return (
                <div key={c.user_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-mono text-sm text-[#121214]">{c.profile?.display_name}</strong>
                      <span className="text-xs font-mono text-[#71717A]">({c.profile?.city || c.city || 'India'})</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                          isVerified
                            ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isResubmission
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : isRejected
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                            : 'bg-[#F4F4F0] text-[#71717A] border-[#E5E5DE]'
                        }`}
                      >
                        {c.verification_status || 'unverified'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#52525B]">
                      <span>{c.niche}</span>
                      <span>•</span>
                      <span>
                        Followers: <strong>{c.reviewed_follower_count != null ? `${c.reviewed_follower_count.toLocaleString('en-IN')} (Reviewed)` : `${(c.claimed_followers || c.follower_count || 0).toLocaleString('en-IN')} (Claimed)`}</strong>
                      </span>
                      {c.reviewed_engagement_rate != null && (
                        <>
                          <span>•</span>
                          <span>Eng: <strong>{c.reviewed_engagement_rate}%</strong></span>
                        </>
                      )}
                      {c.reviewed_avg_reel_views != null && (
                        <>
                          <span>•</span>
                          <span>Avg Views: <strong>{c.reviewed_avg_reel_views.toLocaleString('en-IN')}</strong></span>
                        </>
                      )}
                    </div>

                    {/* Instagram Link & Reels snippet */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                      {c.instagram_profile_url ? (
                        <a
                          href={c.instagram_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-[#FF5416] bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                        >
                          <span>Profile: {c.instagram_profile_url.replace(/.*instagram\.com\//, '').replace(/\/.*$/, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-zinc-400">No profile link</span>
                      )}

                      {c.submitted_reels && c.submitted_reels.length > 0 ? (
                        <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                          {c.submitted_reels.length} Reel{c.submitted_reels.length === 1 ? '' : 's'} Submitted
                        </span>
                      ) : null}

                      {c.review_notes && (
                        <span className="text-zinc-500 italic truncate max-w-xs" title={c.review_notes}>
                          Note: "{c.review_notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/creators/${c.user_id}`}>
                      <Button variant="outline" size="sm">
                        Public View
                      </Button>
                    </Link>

                    <Button
                      variant={isPending ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => openCreatorReviewModal(c)}
                      className={isPending ? 'bg-[#FF5416] text-white hover:bg-[#E04810]' : ''}
                    >
                      <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                      <span>{isPending ? 'Review & Verify' : 'Edit Review'}</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BUSINESSES DIRECTORY TAB */}
      {activeTab === 'businesses' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#71717A]">Business Accounts</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              Registered Brands & Businesses
            </h3>
          </div>

          <div className="divide-y divide-[#ECECE6]">
            {businesses.map((b) => (
              <div key={b.user_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-sm text-[#121214]">{b.business_name}</strong>
                    <span className="text-xs font-mono text-[#71717A]">({b.city})</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] uppercase">
                      {b.verification_status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#52525B] mt-1">
                    Industry: {b.industry} • Website: {b.website || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-3">
            <span className="editorial-label text-[#FF5416]">Audit Trail</span>
            <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
              Platform Admin Actions
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {adminActions.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-[#FBFBFA] border border-[#ECECE6] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF5416] font-bold">{act.action}</span>
                    <span className="text-[#71717A]">• Target: {act.target_type} ({act.target_id.slice(0, 10)})</span>
                  </div>
                  {act.metadata && (
                    <p className="text-[#71717A] text-[11px] mt-1 truncate max-w-lg">
                      {JSON.stringify(act.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-[#A1A1AA] shrink-0">
                  {new Date(act.created_at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATOR VERIFICATION REVIEW MODAL */}
      {selectedCreatorForReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E5DE] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#ECECE6] pb-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-[#FF5416]" />
                <h3 className="font-mono text-base font-bold text-[#121214]">
                  Creator Manual Verification Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCreatorForReview(null)}
                className="text-[#71717A] hover:text-[#121214]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewActionError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-mono">
                {reviewActionError}
              </div>
            )}

            {reviewActionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono">
                {reviewActionSuccess}
              </div>
            )}

            {/* Creator Overview & Submitted Links */}
            <div className="p-4 bg-[#FBFBFA] border border-[#ECECE6] rounded-xl space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-[#121214] block">
                    {selectedCreatorForReview.profile?.display_name}
                  </span>
                  <span className="text-[#71717A]">
                    {selectedCreatorForReview.niche} • {selectedCreatorForReview.city || selectedCreatorForReview.profile?.city || 'India'}
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-bold uppercase">
                  Current: {selectedCreatorForReview.verification_status || 'unverified'}
                </span>
              </div>

              {/* Submitted Profile URL */}
              <div className="pt-2 border-t border-[#ECECE6] space-y-1">
                <span className="text-[10px] text-[#71717A] uppercase font-bold block">Submitted Instagram Profile</span>
                {selectedCreatorForReview.instagram_profile_url ? (
                  <a
                    href={selectedCreatorForReview.instagram_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-purple-700 hover:text-[#FF5416] font-bold text-xs underline"
                  >
                    <span>{selectedCreatorForReview.instagram_profile_url}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">No Instagram profile URL provided</span>
                )}
              </div>

              {/* Submitted Reels */}
              <div className="pt-2 border-t border-[#ECECE6] space-y-1">
                <span className="text-[10px] text-[#71717A] uppercase font-bold block">Submitted Featured Reels (Click to open on Instagram)</span>
                {selectedCreatorForReview.submitted_reels && selectedCreatorForReview.submitted_reels.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedCreatorForReview.submitted_reels.map((reelUrl, idx) => {
                      const isPrimary = reelUrl === selectedCreatorForReview.primary_reel_url || idx === 0;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isPrimary ? 'bg-orange-100 text-orange-800' : 'bg-zinc-200 text-zinc-700'}`}>
                            {isPrimary ? 'Primary Reel' : `Reel #${idx + 1}`}
                          </span>
                          <a
                            href={reelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline truncate max-w-md text-xs"
                          >
                            <span className="truncate">{reelUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-zinc-400 italic">No reels submitted</span>
                )}
              </div>
            </div>

            {/* Admin Review Inputs */}
            <div className="space-y-3 text-xs font-mono">
              <span className="editorial-label text-[#FF5416]">Administrator Observation & Metric Review</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#121214] mb-1">
                    Observed Followers *
                  </label>
                  <input
                    type="text"
                    value={reviewFollowerCount}
                    onChange={(e) => setReviewFollowerCount(e.target.value)}
                    placeholder="e.g. 52000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DE] bg-white text-[#121214] focus:outline-none focus:border-[#FF5416]"
                  />
                  <span className="text-[10px] text-[#71717A] mt-0.5 block">
                    Claimed: {selectedCreatorForReview.claimed_followers || selectedCreatorForReview.follower_count || 0}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] mb-1">
                    Reviewed Eng. Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={reviewEngagementRate}
                    onChange={(e) => setReviewEngagementRate(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DE] bg-white text-[#121214] focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#121214] mb-1">
                    Reviewed Avg Views
                  </label>
                  <input
                    type="text"
                    value={reviewAvgReelViews}
                    onChange={(e) => setReviewAvgReelViews(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DE] bg-white text-[#121214] focus:outline-none focus:border-[#FF5416]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#121214] mb-1">
                  Internal Review Notes / Feedback to Creator
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified profile handle and recent reel analytics. High engagement in tech vertical."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5DE] bg-white text-[#121214] focus:outline-none focus:border-[#FF5416]"
                />
              </div>
            </div>

            {/* Decision Action Buttons */}
            <div className="pt-3 border-t border-[#ECECE6] flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCreatorForReview(null)}
              >
                Cancel
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleExecuteVerification('unverified')}
                  className="text-zinc-700"
                >
                  Revoke / Unverify
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleExecuteVerification('rejected')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  Reject
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleExecuteVerification('resubmission_required')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  Request Resubmission
                </Button>

                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingReview}
                  onClick={() => handleExecuteVerification('verified')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Approve & Verify</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
