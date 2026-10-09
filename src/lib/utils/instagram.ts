/**
 * Instagram URL Validation and Media Extraction Utilities
 * Supports Instagram Profiles, Reels, and Posts for creator manual submissions and work samples.
 */

export interface ParsedInstagramUrl {
  isValid: boolean;
  type: 'reel' | 'post' | 'unknown';
  shortcode: string | null;
  canonicalUrl: string | null;
  normalizedUrl?: string | null;
  embedUrl: string | null;
  error?: string;
}

export interface ParsedInstagramProfileUrl {
  isValid: boolean;
  username: string | null;
  canonicalUrl: string | null;
  profileUrl?: string | null;
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
      error: 'Please provide an Instagram Reel URL',
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
      error: 'Please provide an Instagram Reel URL',
    };
  }

  // Regex to match Instagram Reel or Post URLs:
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
      error: 'Invalid Instagram Reel URL. Format: https://www.instagram.com/reel/...',
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
    normalizedUrl: canonicalUrl,
    embedUrl,
  };
}

/**
 * Validates and normalizes an Instagram profile URL or handle.
 * Accepts:
 * - https://www.instagram.com/username/
 * - https://instagram.com/username?igsh=xyz
 * - instagram.com/username
 * - @username
 * - username
 *
 * Rejects unrelated domains (facebook.com, tiktok.com, youtube.com, etc.) and invalid handles.
 */
export function parseInstagramProfileUrl(rawUrl: string | null | undefined): ParsedInstagramProfileUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      username: null,
      canonicalUrl: null,
      profileUrl: null,
      error: 'Please provide an Instagram profile URL',
    };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      username: null,
      canonicalUrl: null,
      profileUrl: null,
      error: 'Please provide an Instagram profile URL',
    };
  }

  // Reject foreign domains explicitly if a protocol/domain is provided
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('.com') || trimmed.includes('/')) {
    const isInstagramHost = /^(?:https?:\/\/)?(?:www\.)?instagram\.com/i.test(trimmed);
    if (!isInstagramHost) {
      return {
        isValid: false,
        username: null,
        canonicalUrl: null,
        profileUrl: null,
        error: 'Invalid domain. Please provide a link on instagram.com (e.g. https://www.instagram.com/username/)',
      };
    }
  }

  // Extract username from URL path or handle
  let username = '';
  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (urlMatch && urlMatch[1]) {
    // Exclude reserved system paths (reel, p, stories, explore, direct, etc.)
    const reservedPaths = ['reel', 'reels', 'p', 'tv', 'stories', 'explore', 'direct', 'accounts', 'developer', 'about'];
    if (reservedPaths.includes(urlMatch[1].toLowerCase())) {
      return {
        isValid: false,
        username: null,
        canonicalUrl: null,
        profileUrl: null,
        error: 'Please provide your creator profile URL, not a Reel or post link.',
      };
    }
    username = urlMatch[1];
  } else {
    // Strip leading @ if entered as handle
    username = trimmed.replace(/^@+/, '').split(/[?#/]/)[0];
  }

  // Instagram username rules: 1-30 chars, alphanumeric + dots + underscores, cannot end with dot
  const isValidUsername = /^[a-zA-Z0-9._]{1,30}$/.test(username) && !username.endsWith('.');

  if (!isValidUsername || !username) {
    return {
      isValid: false,
      username: null,
      canonicalUrl: null,
      profileUrl: null,
      error: 'Invalid Instagram username. Format: https://www.instagram.com/your_username/',
    };
  }

  const profileUrl = `https://www.instagram.com/${username}/`;
  return {
    isValid: true,
    username,
    canonicalUrl: profileUrl,
    profileUrl,
  };
}

/**
 * Checks if a given URL is an Instagram URL.
 */
export function isInstagramUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(url.trim());
}
