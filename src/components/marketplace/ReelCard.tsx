'use client';

import React from 'react';
import { CreatorReel } from '@/types/marketplace';
import { parseInstagramUrl } from '@/lib/utils/instagram';
import { ExternalLink, Play } from 'lucide-react';

interface ReelCardProps {
  reel: CreatorReel & {
    creator_name?: string;
    creator_city?: string;
    category?: string;
  };
  showCreatorInfo?: boolean;
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

export function ReelCard({ reel, showCreatorInfo = true, className = '' }: ReelCardProps) {
  const parsedIg = parseInstagramUrl(reel.reel_url || reel.video_url);
  const targetUrl = parsedIg.isValid && parsedIg.canonicalUrl ? parsedIg.canonicalUrl : (reel.reel_url || reel.video_url || '');
  const isInstagram = Boolean(parsedIg.isValid || reel.instagram_media_id);
  const formattedDate = formatDate(reel.created_at);
  const thumbnail = reel.thumbnail_url || (reel.video_url?.startsWith('http') && !reel.video_url.includes('.mp4') ? reel.video_url : undefined);

  return (
    <div
      className={`group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:border-orange-500/40 dark:hover:border-orange-500/40 hover:shadow-md ${className}`}
    >
      {/* Media / Thumbnail Box */}
      <div className="relative aspect-[9/16] w-full bg-zinc-950 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={reel.title || 'Recent Instagram Reel'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-4 text-center">
            <Play className="w-8 h-8 text-zinc-600 mb-2" />
            <span className="text-[11px] font-mono">Instagram Reel</span>
          </div>
        )}

        {/* Gradient Overlay for bottom text clarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

        {/* Top-Right Badge: Instagram / Reel */}
        {targetUrl && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-white bg-black/70 hover:bg-black px-2.5 py-1 rounded-md backdrop-blur-md border border-white/20 transition-colors shadow-sm"
              title="Open on Instagram"
            >
              <span>{isInstagram ? 'Instagram' : 'Watch'}</span>
              <ExternalLink className="w-2.5 h-2.5 text-zinc-300" />
            </a>
          </div>
        )}

        {/* Floating Bottom Media Info */}
        <div className="absolute inset-x-0 bottom-0 p-3 text-white space-y-1">
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

          {formattedDate && (
            <div className="text-[10px] font-mono text-zinc-400 pt-0.5">
              {formattedDate}
            </div>
          )}
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

