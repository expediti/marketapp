'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useMarketplace } from '@/lib/store/marketplaceStore';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { ReelVideo } from '@/components/marketplace/ReelVideo';
import { CreatorReel, ReelType, CreatorPackage } from '@/types/marketplace';
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

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const creatorProfile = creators[0] || {
    id: 'c1',
    user_id: 'creator_01',
    profile: {
      id: 'p1',
      role: 'influencer',
      display_name: 'Rahul Sharma',
      city: 'Delhi NCR',
      created_at: new Date().toISOString(),
    },
    niche: 'Technology',
    bio: 'Tech, AI and SaaS app reviewer. Creating high-converting vertical demo reels for mobile apps.',
    follower_count: 125000,
    average_reach: 48000,
    engagement_rate: 4.8,
    packages: [],
    reels: [],
  };

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

  const totalEarnings = 14800;
  const pendingEarnings = 3500;

  // Reels management
  const reels = creatorProfile.reels || [];
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

    addCreatorReel(creatorId, {
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
    });

    setNewReelTitle('');
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim()) return;

    const newPkg: CreatorPackage = {
      id: `pkg_${Date.now()}`,
      creator_id: creatorId,
      name: newPkgName,
      platform: 'Instagram',
      content_type: 'Reel',
      price: newPkgPrice,
      delivery_days: newPkgDelivery,
      revisions: 1,
      description: newPkgDesc || 'Promotional app video package.',
      deliverables: ['1 Vertical Reel', 'Link in bio'],
      active: true,
    };

    creatorProfile.packages = [...(creatorProfile.packages || []), newPkg];
    setIsAddingPkg(false);
    setNewPkgName('');
    setNewPkgDesc('');
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
            {creatorProfile.profile?.display_name || 'Creator Studio'}
          </h1>
          <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
            {creatorProfile.niche} • {creatorProfile.profile?.city || 'India'} •{' '}
            {(creatorProfile.follower_count / 1000).toFixed(1)}K Followers
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
          label="Total Settlements"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          subtext="Direct bank transfers"
          badge="SETTLED"
        />
        <StatCard
          label="Protected Escrow"
          value={`₹${pendingEarnings.toLocaleString('en-IN')}`}
          subtext="Released upon approved delivery"
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
          { key: 'packages', label: `Packages (${creatorProfile.packages?.length || 0})` },
          { key: 'requests', label: `Collaboration Requests (${pendingRequests.length})` },
          { key: 'active', label: `Active Orders (${activeOrders.length})` },
          { key: 'completed', label: `Completed Orders (${completedOrders.length})` },
          { key: 'messages', label: 'Messages' },
          { key: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
            className={`px-3 py-1.5 rounded transition-colors shrink-0 ${
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
                No pending requests. Advertisers will send collaboration requests based on your packages.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#18181B] border-2 border-[#121214] dark:border-zinc-700 rounded-xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="editorial-label text-[#FF5416]">
                          {req.business?.business_name}
                        </span>
                        <h4 className="font-mono text-lg font-bold text-[#121214] dark:text-white mt-0.5">
                          {req.package?.name}
                        </h4>
                        <p className="text-xs text-[#71717A] dark:text-zinc-400">
                          Timeline: {req.package?.delivery_days || 4} days • {req.business?.city}
                        </p>
                      </div>
                      <span className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                        ₹{req.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <p className="text-xs text-[#52525B] dark:text-zinc-300 line-clamp-2 bg-[#FBFBFA] dark:bg-zinc-900 p-2.5 rounded-lg border border-[#E5E5DE] dark:border-zinc-800">
                      {req.brief?.objective || 'App promotion brief received.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6] dark:border-zinc-800">
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
                className="text-xs font-mono text-[#FF5416] hover:underline"
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
                        <td className="py-3 px-3 text-[#52525B] dark:text-zinc-300">{ord.business?.business_name}</td>
                        <td className="py-3 px-3 text-[#121214] dark:text-white">{ord.package?.name}</td>
                        <td className="py-3 px-3 font-bold text-[#121214] dark:text-white">
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
                {creatorProfile.profile?.display_name}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Primary City</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {creatorProfile.profile?.city}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Primary Niche</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {creatorProfile.niche}
              </p>
            </div>

            <div>
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Audience Reach</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white">
                {(creatorProfile.follower_count / 1000).toFixed(1)}K Followers • {(creatorProfile.average_reach / 1000).toFixed(1)}K Reach
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="font-semibold text-[#121214] dark:text-white block mb-1">Bio</span>
              <p className="p-2.5 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded text-[#52525B] dark:text-zinc-300 leading-relaxed">
                {creatorProfile.bio}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECECE6] dark:border-zinc-800">
            <Link href={`/creators/${creatorProfile.user_id}`}>
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
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
              <div>
                <span className="editorial-label text-[#FF5416]">Reels & Showcase</span>
                <h2 className="font-mono text-xl font-bold text-[#121214] dark:text-white">
                  Content Samples & Promos
                </h2>
                <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
                  Upload short reels to let app founders see your storytelling style. Max file size: 19 MB.
                </p>
              </div>

              <div className="text-xs font-mono text-[#71717A] dark:text-zinc-400">
                {reels.length} reel{reels.length === 1 ? '' : 's'} in portfolio
              </div>
            </div>

            {/* Upload Reel Box */}
            <div className="p-5 bg-[#FBFBFA] dark:bg-zinc-900 border border-dashed border-[#E5E5DE] dark:border-zinc-700 rounded-xl space-y-4">
              <span className="editorial-label text-[#FF5416]">Add Reel to Profile (Max 19 MB)</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">Reel Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fintech App UI Walkthrough"
                    value={newReelTitle}
                    onChange={(e) => setNewReelTitle(e.target.value)}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md text-[#121214] dark:text-white focus:outline-none focus:border-[#FF5416]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">Content Type</label>
                  <select
                    value={newReelType}
                    onChange={(e) => setNewReelType(e.target.value as ReelType)}
                    className="w-full py-2 px-3 bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 rounded-md font-mono text-xs text-[#121214] dark:text-white"
                  >
                    <option value="client_work">Promotional Campaign</option>
                    <option value="demo">Demo / Sample Reel</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleUploadReel}
                  className="hidden"
                  id="dashboard-reel-upload"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label
                    htmlFor="dashboard-reel-upload"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5416] text-white hover:bg-[#E04408] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? `Uploading (${uploadProgress}%)...` : 'Upload Video (MP4 / WebM)'}</span>
                  </label>

                  <span className="text-[11px] text-[#71717A] dark:text-zinc-400 font-mono">
                    9:16 vertical • Validated under 19 MB
                  </span>
                </div>

                {isUploading && (
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FF5416] h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Reels Grid */}
            <div className="space-y-4">
              <h3 className="font-mono text-sm font-bold text-[#121214] dark:text-white">Current Portfolio Reels</h3>

              {reels.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
                  No reels uploaded yet. Add a reel above to showcase your work to advertisers.
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
                            {reel.file_size_bytes ? `${(reel.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '19MB limit compliant'}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFeaturedReel(creatorId, reel.id)}
                            className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
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
                            onClick={() => toggleReelVisibility(creatorId, reel.id)}
                            className="px-2 py-1 rounded border border-[#E5E5DE] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] text-[#71717A] dark:text-zinc-300 flex items-center gap-1 transition-colors"
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
              <Button type="submit" variant="primary" size="sm">
                Save Package
              </Button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creatorProfile.packages?.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-mono font-bold text-sm text-[#121214] dark:text-white">{pkg.name}</h4>
                  <span className="font-mono font-bold text-base text-[#FF5416]">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-[#52525B] dark:text-zinc-300 leading-relaxed">{pkg.description}</p>
                <div className="pt-2 border-t border-[#ECECE6] dark:border-zinc-800 text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                  Delivery: {pkg.delivery_days} days • {pkg.revisions ?? 1} Revisions
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: COLLABORATION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-[#ECECE6] dark:border-zinc-800 pb-4">
            <span className="editorial-label text-[#FF5416]">Collaboration Requests</span>
            <h3 className="font-mono text-lg font-bold text-[#121214] dark:text-white">
              Pending Advertiser Requests
            </h3>
            <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-0.5">
              Review campaign goals, app links, and deadlines before accepting.
            </p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No pending collaboration requests at this time.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl bg-[#FBFBFA] dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="editorial-label text-[#FF5416]">{req.business?.business_name}</span>
                    <h4 className="font-mono text-base font-bold text-[#121214] dark:text-white">{req.package?.name}</h4>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400">{req.brief?.objective}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-[#121214] dark:text-white">
                      ₹{req.subtotal.toLocaleString('en-IN')}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => declineOrder(req.id, 'Declined by creator')}>
                      Decline
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => acceptOrder(req.id)}>
                      Accept Request
                    </Button>
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
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Active Promotions</h3>
          {activeOrders.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#E5E5DE] dark:border-zinc-800 rounded-xl text-xs font-mono text-[#71717A] dark:text-zinc-400">
              No active promotions right now.
            </div>
          ) : (
            <div className="divide-y divide-[#ECECE6] dark:divide-zinc-800">
              {activeOrders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-[#121214] dark:text-white">{ord.order_number}</strong>
                      <StatusBadge status={ord.order_status} size="sm" />
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-mono">
                      Advertiser: {ord.business?.business_name} • Package: {ord.package?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-sm text-[#121214] dark:text-white">
                      ₹{ord.subtotal.toLocaleString('en-IN')}
                    </span>
                    <Link href={`/orders/${ord.id}`}>
                      <Button variant="outline" size="sm">
                        Submit Reel / Workspace
                      </Button>
                    </Link>
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
                      <strong className="font-mono text-[#121214] dark:text-white">{ord.order_number}</strong>
                      <StatusBadge status={ord.order_status} size="sm" />
                    </div>
                    <p className="text-xs text-[#71717A] dark:text-zinc-400 mt-1 font-mono">
                      Advertiser: {ord.business?.business_name} • Package: {ord.package?.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{ord.subtotal.toLocaleString('en-IN')} Settled
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
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5DE] dark:border-zinc-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-mono text-base font-bold text-[#121214] dark:text-white">Messages</h3>
          <p className="text-xs text-[#71717A] dark:text-zinc-400">
            Campaign messages are tied directly to orders for clarity.
          </p>

          <div className="space-y-3">
            {creatorOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-[#E5E5DE] dark:border-zinc-700 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#FF5416]" />
                  </div>
                  <div>
                    <h4 className="font-mono text-sm font-bold text-[#121214] dark:text-white">
                      {ord.business?.business_name}
                    </h4>
                    <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
                      Order #{ord.order_number} • {ord.package?.name}
                    </span>
                  </div>
                </div>

                <Link href={`/orders/${ord.id}`}>
                  <Button variant="outline" size="sm">
                    Open Chat
                  </Button>
                </Link>
              </div>
            ))}
          </div>
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
                    defaultValue="rahul.sharma@okhdfcbank"
                    className="w-full py-2 px-3 bg-[#FBFBFA] dark:bg-zinc-900 border border-[#E5E5DE] dark:border-zinc-700 rounded font-mono text-[#121214] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#121214] dark:text-white block mb-1">PAN Verification</label>
                  <input
                    type="text"
                    defaultValue="ABCDE1234F"
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
