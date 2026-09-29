'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { CreatorReel, ReelType } from '@/types/marketplace';
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
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const {
    orders,
    acceptOrder,
    declineOrder,
    currentUser,
    creators,
    addCreatorReel,
    deleteCreatorReel,
    toggleFeaturedReel,
    toggleReelVisibility,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'packages' | 'orders' | 'profile'>('overview');

  const creatorProfile = creators[0]; // Current logged-in creator demo
  const creatorId = creatorProfile.user_id;

  // Orders for this creator
  const creatorOrders = orders.filter(
    (o) => o.creator_id === creatorId || o.creator?.user_id === creatorId
  );

  const pendingRequests = creatorOrders.filter((o) => o.order_status === 'FUNDED');
  const activeOrders = creatorOrders.filter(
    (o) =>
      o.order_status === 'ACCEPTED' ||
      o.order_status === 'IN_PROGRESS' ||
      o.order_status === 'DELIVERED'
  );
  const completedOrders = creatorOrders.filter(
    (o) => o.order_status === 'COMPLETED' || o.order_status === 'APPROVED'
  );

  const totalEarnings = 12400;
  const pendingEarnings = 2500;

  // Reels management
  const reels = creatorProfile.reels || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [newReelTitle, setNewReelTitle] = useState('');
  const [newReelType, setNewReelType] = useState<ReelType>('client_work');
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleUploadReel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    const validation = reelStorageService.validateReelFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format');
      setIsUploading(false);
      return;
    }

    const res = await reelStorageService.uploadReel(file, creatorId);
    if (!res.success || !res.videoUrl) {
      setUploadError(res.error || 'Failed to upload video');
      setIsUploading(false);
      return;
    }

    addCreatorReel(creatorId, {
      creator_id: creatorId,
      title: newReelTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
      video_url: res.videoUrl,
      type: newReelType,
      sort_order: reels.length + 1,
      is_featured: reels.length === 0,
      is_visible: true,
    });

    setNewReelTitle('');
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-label text-[#FF5416]">Creator Workspace</span>
            <span className="text-[11px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              Verified Creator
            </span>
          </div>
          <h1 className="font-mono text-3xl font-extrabold text-[#121214] mt-1">
            {creatorProfile.profile?.display_name || 'Creator Studio'}
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            {creatorProfile.niche} • {creatorProfile.profile?.city} • {(creatorProfile.follower_count / 1000).toFixed(1)}K Followers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/creators/${creatorProfile.user_id}`}>
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
          label="Total Earnings"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          subtext="Direct bank settlements"
          badge="SETTLED"
        />
        <StatCard
          label="Active Protected Value"
          value={`₹${pendingEarnings.toLocaleString('en-IN')}`}
          subtext="Ready upon content delivery"
          badge="PROTECTED"
        />
        <StatCard
          label="Active Orders"
          value={activeOrders.length || 1}
          subtext="Deliverables in progress"
        />
        <StatCard
          label="Portfolio Reels"
          value={reels.length}
          subtext="Visible on profile"
        />
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E5DE] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'work', label: `My Work (${reels.length})` },
          { key: 'packages', label: 'Packages' },
          { key: 'orders', label: `Orders (${creatorOrders.length})` },
          { key: 'profile', label: 'Profile' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#121214] text-white font-bold'
                : 'text-[#71717A] hover:text-[#121214] hover:bg-[#F4F4F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* New Collaboration Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-label text-[#FF5416]">Collaboration Requests</span>
                <h3 className="font-mono text-lg font-bold text-[#121214]">
                  New Requests
                </h3>
              </div>
              <span className="text-xs font-mono text-[#71717A]">
                {pendingRequests.length} pending review
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E5E5DE] rounded-xl p-8 text-center text-xs text-[#71717A] font-mono">
                No new pending collaboration requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border-2 border-[#121214] rounded-xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="editorial-label text-[#FF5416]">
                          {req.business?.business_name}
                        </span>
                        <h4 className="font-mono text-lg font-bold text-[#121214] mt-0.5">
                          {req.package?.name}
                        </h4>
                        <p className="text-xs text-[#71717A]">
                          Deadline: 5 days • {req.business?.city}
                        </p>
                      </div>
                      <span className="font-mono text-xl font-bold text-[#121214]">
                        ₹{req.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-[#52525B] line-clamp-2 bg-[#FBFBFA] p-2.5 rounded-lg border border-[#E5E5DE]">
                      {req.brief?.objective || 'New collaboration brief received.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6]">
                      <Link href={`/orders/${req.id}`}>
                        <Button variant="outline" size="sm">
                          View Brief
                        </Button>
                      </Link>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => declineOrder(req.id, 'Creator schedule conflict')}
                          className="text-[#71717A]"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptOrder(req.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders */}
          <div className="bg-white border border-[#E5E5DE] rounded-xl overflow-hidden shadow-sm space-y-4 p-6">
            <div className="border-b border-[#ECECE6] pb-3">
              <span className="editorial-label text-[#71717A]">Work in Progress</span>
              <h3 className="font-mono text-base font-bold text-[#121214] mt-0.5">
                Active Collaborations
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#ECECE6] text-[#71717A] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Order #</th>
                    <th className="py-2.5 px-3">Business</th>
                    <th className="py-2.5 px-3">Package</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECE6]">
                  {creatorOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FBFBFA]">
                      <td className="py-3 px-3 font-bold text-[#121214]">{ord.order_number}</td>
                      <td className="py-3 px-3 text-[#52525B]">{ord.business?.business_name}</td>
                      <td className="py-3 px-3 text-[#121214]">{ord.package?.name}</td>
                      <td className="py-3 px-3 font-bold text-[#121214]">
                        ₹{ord.subtotal.toLocaleString('en-IN')}
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
          </div>
        </div>
      )}

      {/* TAB 2: MY WORK (FIRST-CLASS SECTION) */}
      {activeTab === 'work' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Portfolio Management</span>
                <h2 className="font-mono text-xl font-bold text-[#121214]">My Work & Video Samples</h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Upload promotional client work or demo reels to show businesses your production quality.
                </p>
              </div>

              <div className="text-xs font-mono text-[#71717A]">
                {reels.length} reel{reels.length === 1 ? '' : 's'} in portfolio
              </div>
            </div>

            {/* Upload Reel Form */}
            <div className="p-4 bg-[#FBFBFA] border border-[#E5E5DE] rounded-xl space-y-4">
              <span className="editorial-label text-[#FF5416]">Add New Reel to Portfolio</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-[#121214] block mb-1">Reel Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cafe Aesthetic & Pour-Over Tasting"
                    value={newReelTitle}
                    onChange={(e) => setNewReelTitle(e.target.value)}
                    className="w-full py-2 px-3 bg-white border border-[#E5E5DE] rounded-md focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#121214] block mb-1">Classification (Internal)</label>
                  <select
                    value={newReelType}
                    onChange={(e) => setNewReelType(e.target.value as ReelType)}
                    className="w-full py-2 px-3 bg-white border border-[#E5E5DE] rounded-md font-mono text-xs"
                  >
                    <option value="client_work">Client Work</option>
                    <option value="demo">Demo / Sample Reel</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleUploadReel}
                  className="hidden"
                  id="dashboard-reel-upload"
                />

                <label
                  htmlFor="dashboard-reel-upload"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#121214] bg-[#121214] text-white hover:bg-[#FF5416] hover:border-[#FF5416] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading Video...' : 'Upload Video File (MP4/WebM)'}</span>
                </label>

                <span className="text-[11px] text-[#71717A] font-mono">
                  Vertical 9:16 format recommended. File size limit: 100MB.
                </span>
              </div>

              {uploadError && (
                <p className="text-xs text-red-600 font-mono">{uploadError}</p>
              )}
            </div>

            {/* Reels Grid / Management List */}
            <div className="space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214]">Current Portfolio Reels</h3>

              {reels.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E5E5DE] rounded-xl text-xs font-mono text-[#71717A]">
                  No reels uploaded yet. Add a reel above to make your portfolio discoverable.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="border border-[#E5E5DE] rounded-xl p-4 bg-[#FBFBFA] flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-32 bg-[#18181B] rounded-lg overflow-hidden relative shrink-0">
                          {reel.thumbnail_url ? (
                            <img src={reel.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={reel.video_url} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <Film className="w-5 h-5 text-white/80" />
                          </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-[#E5E5DE] text-[#71717A]">
                              {reel.type === 'client_work' ? 'Client Work' : 'Demo Reel'}
                            </span>
                            {reel.is_featured && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#FFF2EC] border border-[#FFD2C1] text-[#FF5416] font-bold flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-[#FF5416]" />
                                Featured
                              </span>
                            )}
                            {!reel.is_visible && (
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600">
                                Hidden
                              </span>
                            )}
                          </div>

                          <h4 className="font-mono text-sm font-bold text-[#121214] truncate">
                            {reel.title}
                          </h4>

                          <p className="text-[11px] text-[#71717A] font-mono truncate">
                            {reel.video_url}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6] text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFeaturedReel(creatorId, reel.id)}
                            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
                              reel.is_featured
                                ? 'border-[#FF5416] bg-[#FFF2EC] text-[#FF5416]'
                                : 'border-[#E5E5DE] bg-white text-[#71717A] hover:text-[#121214]'
                            }`}
                          >
                            <Star className="w-3 h-3" />
                            <span>{reel.is_featured ? 'Featured' : 'Make Featured'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleReelVisibility(creatorId, reel.id)}
                            className="px-2 py-1 rounded border border-[#E5E5DE] bg-white text-[11px] text-[#71717A] hover:text-[#121214] flex items-center gap-1 transition-colors"
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
                          onClick={() => deleteCreatorReel(creatorId, reel.id)}
                          className="p-1.5 text-[#71717A] hover:text-red-600 transition-colors"
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
          </div>
        </div>
      )}

      {/* TAB 3: PACKAGES */}
      {activeTab === 'packages' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#ECECE6] pb-4">
            <div>
              <span className="editorial-label text-[#FF5416]">Rate Card</span>
              <h3 className="font-mono text-lg font-bold text-[#121214]">Configured Packages</h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Standard packages that businesses can purchase directly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creatorProfile.packages?.map((pkg) => (
              <div key={pkg.id} className="p-5 border border-[#E5E5DE] rounded-xl bg-[#FBFBFA] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-mono font-bold text-sm text-[#121214]">{pkg.name}</h4>
                  <span className="font-mono font-bold text-base text-[#FF5416]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-[#52525B] leading-relaxed">{pkg.description}</p>
                <div className="pt-2 border-t border-[#ECECE6] text-[11px] font-mono text-[#71717A]">
                  Delivery: {pkg.delivery_days} days • {pkg.revision_count} Revisions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-mono text-base font-bold text-[#121214]">All Collaborations</h3>
          <div className="divide-y divide-[#ECECE6]">
            {creatorOrders.map((ord) => (
              <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="font-mono text-[#121214]">{ord.order_number}</strong>
                    <StatusBadge status={ord.order_status} size="sm" />
                  </div>
                  <p className="text-xs text-[#71717A] mt-1 font-mono">
                    Brand: {ord.business?.business_name} • Package: {ord.package?.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-sm text-[#121214]">
                    ₹{ord.subtotal.toLocaleString('en-IN')}
                  </span>
                  <Link href={`/orders/${ord.id}`}>
                    <Button variant="outline" size="sm">
                      Workspace
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-[#E5E5DE] rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] pb-4">
            <span className="editorial-label text-[#FF5416]">Profile Settings</span>
            <h3 className="font-mono text-lg font-bold text-[#121214]">Creator Profile Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-[#121214] block mb-1">Display Name</span>
              <p className="p-2.5 bg-[#FBFBFA] border border-[#E5E5DE] rounded font-mono text-[#121214]">
                {creatorProfile.profile?.display_name}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] block mb-1">Primary City</span>
              <p className="p-2.5 bg-[#FBFBFA] border border-[#E5E5DE] rounded font-mono text-[#121214]">
                {creatorProfile.profile?.city}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold text-[#121214] block mb-1">Bio</span>
              <p className="p-2.5 bg-[#FBFBFA] border border-[#E5E5DE] rounded text-[#52525B] leading-relaxed">
                {creatorProfile.bio}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6]">
            <Link href={`/creators/${creatorProfile.user_id}`}>
              <Button variant="primary" size="sm">
                <span>View Live Profile</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
