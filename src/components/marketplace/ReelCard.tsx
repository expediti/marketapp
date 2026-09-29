'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Eye } from 'lucide-react';
import { CreatorReel } from '@/types/marketplace';

interface ReelCardProps {
  reel: CreatorReel & {
    creator_name?: string;
    creator_city?: string;
    category?: string;
  };
  showCreatorInfo?: boolean;
}

export function ReelCard({ reel, showCreatorInfo = true }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div
      onClick={togglePlay}
      className="group relative aspect-[9/16] w-full max-w-[280px] sm:max-w-[300px] rounded-xl overflow-hidden bg-[#18181B] border border-[#27272A] shadow-md cursor-pointer select-none transition-all duration-200 hover:border-[#FF5416]/50 hover:shadow-lg"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumbnail_url}
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        onError={() => setHasError(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Fallback image if video fails to load */}
      {hasError && reel.thumbnail_url && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${reel.thumbnail_url})` }}
        />
      )}

      {/* Top Controls: Mute toggle */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <button
          onClick={toggleMute}
          className="p-1.5 rounded-full bg-black/60 text-white/90 hover:bg-black/80 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Center Play/Pause indicator on hover or when paused */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ${
          isPlaying ? 'opacity-0 group-hover:opacity-90' : 'opacity-90'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
        </div>
      </div>

      {/* Bottom Gradient and Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white space-y-1">
        {showCreatorInfo && (reel.creator_name || reel.category) && (
          <div className="flex items-center justify-between text-[11px] font-mono text-[#D4D4D8]">
            <span className="font-semibold text-white truncate max-w-[160px]">
              {reel.creator_name}
            </span>
            {reel.creator_city && (
              <span className="text-[#A1A1AA] text-[10px] shrink-0">
                {reel.creator_city}
              </span>
            )}
          </div>
        )}

        <h4 className="font-mono text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
          {reel.title}
        </h4>

        {reel.category && (
          <span className="inline-block text-[10px] font-mono text-[#FF5416] bg-[#FF5416]/10 px-1.5 py-0.5 rounded border border-[#FF5416]/20">
            {reel.category}
          </span>
        )}
      </div>
    </div>
  );
}
