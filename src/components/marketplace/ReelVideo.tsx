'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';
import { reelStorageService } from '@/lib/services/reelStorageService';

export interface ReelVideoProps {
  /** Video URL or Supabase Storage relative path */
  src: string;
  /** Optional poster image URL (used while loading or if video fails/autoplay is blocked) */
  poster?: string;
  /** Alt or title text for accessibility */
  title?: string;
  /** Whether the video should autoplay (default: true) */
  autoPlay?: boolean;
  /** Whether the video should loop (default: true) */
  loop?: boolean;
  /** Whether the video is muted by default (default: true, required for autoplay) */
  muted?: boolean;
  /** Whether the video plays inline on mobile devices (default: true) */
  playsInline?: boolean;
  /** Video preload strategy */
  preload?: 'auto' | 'metadata' | 'none';
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the video element */
  videoClassName?: string;
  /** Whether to show a mute/unmute control overlay (default: false) */
  showMuteToggle?: boolean;
  /** Whether to show a play/pause toggle overlay on click (default: false) */
  interactive?: boolean;
  /** Callback when video enters playback */
  onPlay?: () => void;
  /** Callback when video errors */
  onError?: (err: any) => void;
}

/**
 * Reusable production ReelVideo component.
 * Ensures consistent autoplay, muted, playsInline, and loop behaviors
 * across mobile browsers and desktop without duplicating video logic.
 */
export function ReelVideo({
  src,
  poster,
  title,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  className = '',
  videoClassName = '',
  showMuteToggle = false,
  interactive = false,
  onPlay,
  onError,
}: ReelVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(muted);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Resolve storage path or direct URL
  const resolvedSrc = reelStorageService.getPublicUrl(src);

  // Setup video element with required autoplay attributes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Mobile Safari & Chrome require muted on the element property
    video.defaultMuted = true;
    video.muted = isMuted;

    if (autoPlay) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoplayBlocked(false);
            if (onPlay) onPlay();
          })
          .catch((err) => {
            // Autoplay was prevented by browser policy (e.g., low power mode or user interaction policy)
            console.debug('Autoplay prevented by browser policy:', err);
            setAutoplayBlocked(true);
            setIsPlaying(false);
          });
      }
    }
  }, [resolvedSrc, autoPlay, isMuted, onPlay]);

  // Handle visibility changes via IntersectionObserver to save bandwidth & performance
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !video.paused) {
            // Pause video when out of viewport to optimize browser performance
            video.pause();
            setIsPlaying(false);
          } else if (entry.isIntersecting && autoPlay && !autoplayBlocked) {
            // Resume playback when scrolled back into view
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlay, autoplayBlocked]);

  const handleVideoLoadedData = () => {
    setIsLoading(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn(`ReelVideo failed to load: ${resolvedSrc}`, e);
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(e);
  };

  const handleContainerClick = () => {
    if (!interactive) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch((e) => console.warn('Play error:', e));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative overflow-hidden bg-[#121214] select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
      title={title}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={resolvedSrc}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        preload={preload}
        onLoadedData={handleVideoLoadedData}
        onError={handleVideoError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-40' : 'opacity-100'} ${videoClassName}`}
      />

      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
        </div>
      )}

      {/* Fallback Poster if Video Fails */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18181B] text-zinc-400 p-4 text-center">
          {poster ? (
            <img src={poster} alt={title || 'Reel poster'} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 z-10">
              <AlertCircle className="w-6 h-6 text-zinc-500" />
              <span className="text-[11px] font-mono">Video unavailable</span>
            </div>
          )}
        </div>
      )}

      {/* Autoplay fallback button (when browser aggressively blocks initial autoplay) */}
      {autoplayBlocked && !isPlaying && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              videoRef.current?.play().then(() => {
                setIsPlaying(true);
                setAutoplayBlocked(false);
              }).catch(() => {});
            }}
            className="w-12 h-12 rounded-full bg-white/90 dark:bg-black/80 text-[#121214] dark:text-white flex items-center justify-center shadow-lg border border-white/20 hover:scale-105 transition-transform"
            aria-label="Play video"
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </button>
        </div>
      )}

      {/* Optional Mute/Unmute Overlay Button */}
      {showMuteToggle && !hasError && (
        <div className="absolute top-2.5 right-2.5 z-20">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-full bg-black/60 text-white/90 hover:bg-black/80 hover:text-white transition-colors backdrop-blur-xs"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
