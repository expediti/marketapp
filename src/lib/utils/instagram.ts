/**
 * Instagram URL Validation and Media Extraction Utilities
 * Supports Instagram Reels and Posts for creator work samples and deliveries.
 */

export interface ParsedInstagramUrl {
  isValid: boolean;
  type: 'reel' | 'post' | 'unknown';
  shortcode: string | null;
  canonicalUrl: string | null;
  embedUrl: string | null;
  error?: string;
}

/**
 * Validates and extracts the shortcode / media identifier from an Instagram Reel or Post link.
 * Examples:
 * - https://www.instagram.com/reel/C8xYz12345/
 * - https://instagram.com/reels/C8xYz12345/?igsh=xyz
 * - https://www.instagram.com/p/C8xYz12345/
 */
export function parseInstagramUrl(rawUrl: string | null | undefined): ParsedInstagramUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      type: 'unknown',
      shortcode: null,
      canonicalUrl: null,
      embedUrl: null,
      error: 'Please provide an Instagram URL',
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      type: 'unknown',
      shortcode: null,
      canonicalUrl: null,
      embedUrl: null,
      error: 'Please provide an Instagram URL',
    };
  }

  // Regex to match Instagram Reel or Post URLs:
  // Matches:
  // - https://www.instagram.com/reel/{code}/
  // - https://instagram.com/reels/{code}/
  // - https://www.instagram.com/p/{code}/
  // - https://www.instagram.com/tv/{code}/
  const igRegex =
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p|tv)\/([a-zA-Z0-9_-]+)/i;

  const match = trimmed.match(igRegex);
  if (!match || !match[1]) {
    return {
      isValid: false,
      type: 'unknown',
      shortcode: null,
      canonicalUrl: null,
      embedUrl: null,
      error: 'Invalid Instagram URL. Format should be: https://www.instagram.com/reel/...',
    };
  }

  const shortcode = match[1];
  const isReel = trimmed.toLowerCase().includes('/reel');
  const type: 'reel' | 'post' = isReel ? 'reel' : 'post';
  const canonicalUrl = `https://www.instagram.com/${type}/${shortcode}/`;
  const embedUrl = `https://www.instagram.com/${type}/${shortcode}/embed/`;

  return {
    isValid: true,
    type,
    shortcode,
    canonicalUrl,
    embedUrl,
  };
}

/**
 * Checks if a given URL is an Instagram URL.
 */
export function isInstagramUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(url.trim());
}
