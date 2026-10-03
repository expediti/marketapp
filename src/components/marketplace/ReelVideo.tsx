'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { reelStorageService } from '@/lib/services/reelStorageService';
import { parseInstagramUrl } from '@/lib/utils/instagram';

export interface ReelVideoProps {
  /** Video URL or Supabase Storage relative path */
  src: string;
  /** Optional poster image URL (used while loading or if video fails) */
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
  /** Optional mute toggle support (default: false) */
  showMuteToggle?: boolean;
  /** Optional interactive click toggle (default: false) */
  interactive?: boolean;
  /** Callback when video enters playback */
  onPlay?: () => void;
  /** Callback when video errors */
  onError?: (err: any) => void;
}

/**
 * Reusable production ReelVideo component.
 * Supports both direct HTML5 videos and Instagram Reel/Post embeds.
 * Ensures consistent automatic playback and responsive sizing.
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
  onPlay,
  onError,
}: ReelVideoProps) {
  // If this is an Instagram Reel/Post URL, render the official Instagram iframe embed
  const parsedIg = parseInstagramUrl(src);
  if (parsedIg.isValid && parsedIg.embedUrl) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden bg-black select-none ${className}`}
        title={title || 'Instagram Reel'}
      >
        <iframe
          src={parsedIg.embedUrl}
          className={`w-full h-full border-0 ${videoClassName}`}
          title={title || 'Instagram Reel'}
          allowFullScreen
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>
    );
  }

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Resolve storage path or direct URL from Supabase Storage / local assets
  const resolvedSrc = reelStorageService.getPublicUrl(src);

  // Directly enforce DOM properties for browser autoplay compatibility
  const applyDOMProperties = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
  }, []);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    applyDOMProperties(video);
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (onPlay) onPlay();
        })
        .catch((err) => {
          console.debug('Autoplay attempt caught:', err);
        });
    }
  }, [applyDOMProperties, onPlay]);

  // Initial playback attempt on mount and source change
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;
    applyDOMProperties(video);

    if (autoPlay) {
      startPlayback();
    }
  }, [resolvedSrc, autoPlay, applyDOMProperties, startPlayback]);

  // IntersectionObserver: play when visible, pause when far outside the viewport
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!video) return;
          if (entry.isIntersecting) {
            applyDOMProperties(video);
            if (autoPlay) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          } else {
            // When sufficiently far outside the viewport: pause
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '100px 50px 100px 50px',
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlay, applyDOMProperties]);

  // Autoplay fallback: retry playback on first user touch/click/scroll in the window
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const resumePlaybackIfVisible = () => {
      const v = videoRef.current;
      const c = containerRef.current;
      if (!v || !c || !v.paused) return;

      const rect = c.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (inView) {
        applyDOMProperties(v);
        v.play().catch(() => {});
      }
    };

    window.addEventListener('touchstart', resumePlaybackIfVisible, { passive: true, once: true });
    window.addEventListener('click', resumePlaybackIfVisible, { passive: true, once: true });
    window.addEventListener('scroll', resumePlaybackIfVisible, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', resumePlaybackIfVisible);
      window.removeEventListener('click', resumePlaybackIfVisible);
      window.removeEventListener('scroll', resumePlaybackIfVisible);
    };
  }, [autoPlay, applyDOMProperties]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    applyDOMProperties(video);
    if (autoPlay) {
      video.play().catch(() => {});
    }
  };

  const handleVideoLoadedData = () => {
    setIsLoading(false);
  };

  // Continuous looping: automatically restart from 0 when video reaches the end
  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (loop) {
      video.play().catch(() => {});
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.warn(`ReelVideo failed to load: ${resolvedSrc}`, e);
    setIsLoading(false);
    setHasError(true);
    if (onError) onError(e);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-[#121214] select-none ${className}`}
      title={title}
    >
      {/* Background Poster (graceful fallback, no flash of black) */}
      {poster && (
        <img
          src={poster}
          alt={title || 'Reel preview'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            isLoading || hasError ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          loading="lazy"
        />
      )}

      {/* HTML5 Video Element with automated muted looped inline playback and NO controls */}
      {!hasError && resolvedSrc && (
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el) applyDOMProperties(el);
          }}
          src={resolvedSrc}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload={preload}
          controls={false}
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleVideoLoadedData}
          onEnded={handleEnded}
          onError={handleVideoError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${videoClassName}`}
        />
      )}

      {/* Fallback Display if Video Fails or is empty (shows poster image, no play button) */}
      {(hasError || !resolvedSrc) && !poster && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#18181B] text-zinc-400 p-4 text-center">
          <AlertCircle className="w-5 h-5 text-zinc-500 mb-1" />
          <span className="text-[11px] font-mono">Video preview</span>
        </div>
      )}
    </div>
  );
}
