'use client';

import React, { useState, useRef } from 'react';
import { CreatorReel } from '@/types/marketplace';
import { parseInstagramUrl } from '@/lib/utils/instagram';
import { ExternalLink, Play, Pause, Volume2, VolumeX, Heart, MessageCircle, Eye, Sparkles } from 'lucide-react';

interface ReelCardProps {
  reel: CreatorReel & {
    creator_name?: string | null;
    creator_city?: string | null;
    category?: string | null;
    like_count?: number | null;
    comments_count?: number | null;
    views_count?: number | null;
    view_count?: number | null;
  };
  showCreatorInfo?: boolean;
  isFeatured?: boolean;
  className?: string;
}

function formatDate(dateString?: string): string | null {
  if (!dateString) return null;
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function formatCompactNumber(num?: number | null): string | null {
  if (typeof num !== 'number' || isNaN(num) || num === null || num < 0) return null;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function ReelCard({
  reel,
  showCreatorInfo = true,
  isFeatured = false,
  className = '',
}: ReelCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [hasThumbnailError, setHasThumbnailError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const parsedIg = parseInstagramUrl(reel.reel_url || reel.permalink || reel.video_url);
  const targetUrl =
    parsedIg.isValid && parsedIg.canonicalUrl
      ? parsedIg.canonicalUrl
      : reel.permalink || reel.reel_url || reel.video_url || '';
  const isInstagram = Boolean(parsedIg.isValid || reel.instagram_media_id);
  const formattedDate = formatDate(reel.posted_at || reel.created_at);
  const thumbnail =
    reel.thumbnail_url && (reel.thumbnail_url.startsWith('http') || reel.thumbnail_url.startsWith('/'))
      ? reel.thumbnail_url
      : undefined;

  // Check if video_url is a direct playable media source (direct CDN video URL or mp4)
  const isPlayableDirectVideo = Boolean(
    reel.video_url &&
      (reel.video_url.includes('.mp4') ||
        reel.video_url.includes('fbcdn.net') ||
        reel.video_url.includes('cdninstagram.com')) &&
      !hasVideoError
  );

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlayableDirectVideo || !videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setHasVideoError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const likesDisplay = formatCompactNumber(reel.like_count);
  const commentsDisplay = formatCompactNumber(reel.comments_count);
  const viewsDisplay = formatCompactNumber(reel.views_count ?? reel.view_count);

  return (
    <div
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border ${
        isFeatured || reel.is_featured
          ? 'border-orange-500/50 shadow-md ring-1 ring-orange-500/20'
          : 'border-zinc-200 dark:border-zinc-800 shadow-sm'
      } transition-all duration-200 hover:border-orange-500/50 hover:shadow-md ${className}`}
    >
      {/* Media / Video Box */}
      <div className="relative aspect-[9/16] w-full bg-zinc-950 overflow-hidden select-none">
        {/* Playable Video Element if direct stream available */}
        {isPlayableDirectVideo && (
          <video
            ref={videoRef}
            src={reel.video_url}
            poster={thumbnail}
            muted={isMuted}
            loop
            playsInline
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setHasVideoError(true);
              setIsPlaying(false);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Static Thumbnail / Poster */}
        {thumbnail && !hasThumbnailError ? (
          <img
            src={thumbnail}
            alt={reel.title || 'Instagram Reel'}
            onError={() => setHasThumbnailError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isPlaying ? 'opacity-0 pointer-events-none' : 'group-hover:scale-105'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-400 p-4 text-center">
            <div className="w-full pt-4 flex justify-center">
              <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center border border-zinc-700">
                <Play className="w-5 h-5 text-orange-400 ml-0.5" />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-white block line-clamp-2">
                {reel.title || 'Instagram Reel'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block">
                {likesDisplay ? `${likesDisplay} likes` : 'Verified Content'}
              </span>
            </div>
          </div>
        )}

        {/* Gradient Overlay for bottom text clarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          {/* Featured indicator if applicable */}
          {(isFeatured || reel.is_featured) ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-orange-400 bg-black/80 px-2 py-0.5 rounded backdrop-blur-md border border-orange-500/40 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 text-orange-400" />
              <span>Featured Reel</span>
            </span>
          ) : <span />}

          {/* View on Instagram Badge */}
          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto inline-flex items-center gap-1 text-[10px] font-mono font-medium text-white bg-black/75 hover:bg-black px-2 py-0.5 rounded backdrop-blur-md border border-white/20 transition-colors shadow-sm"
              title="Open Reel on Instagram"
            >
              <span>{isInstagram ? 'Instagram' : 'Watch'}</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-300" />
            </a>
          )}
        </div>

        {/* Play/Pause Button Overlay for direct playable video */}
        {isPlayableDirectVideo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all duration-200 transform ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 hover:scale-110'
              }`}
              title={isPlaying ? 'Pause' : 'Play inline'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </button>
          </div>
        )}

        {/* Mute toggle button when playing */}
        {isPlaying && isPlayableDirectVideo && (
          <div className="absolute top-10 right-2.5 z-10">
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Floating Bottom Media Info & Real Metrics */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white space-y-1.5 pointer-events-none">
          {showCreatorInfo && (reel.creator_name || reel.category) && (
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
              <span className="font-semibold truncate max-w-[140px]">
                {reel.creator_name}
              </span>
              {reel.creator_city && (
                <span className="text-zinc-400 text-[9px] shrink-0">
                  {reel.creator_city}
                </span>
              )}
            </div>
          )}

          <h4 className="font-mono text-xs font-bold text-white line-clamp-2 leading-tight">
            {reel.title || 'Instagram Showcase'}
          </h4>

          {/* Genuine API metrics row: Views, Likes, Comments */}
          <div className="flex items-center gap-3 pt-0.5 text-[10px] font-mono text-zinc-300">
            {viewsDisplay && (
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-zinc-400" />
                <span>{viewsDisplay}</span>
              </span>
            )}
            {likesDisplay && (
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>{likesDisplay}</span>
              </span>
            )}
            {commentsDisplay && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-sky-400" />
                <span>{commentsDisplay}</span>
              </span>
            )}
            {formattedDate && (
              <span className="text-zinc-400 ml-auto">
                {formattedDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {targetUrl && (
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <span className="font-medium">View on Instagram</span>
          <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
        </a>
      )}
    </div>
  );
}

