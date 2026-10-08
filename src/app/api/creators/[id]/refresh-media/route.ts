import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchInstagramUserMedia, fetchInstagramProfile } from '@/lib/server/instagram';
import type { TablesUpdate, TablesInsert } from '@/types/database';

export const dynamic = 'force-dynamic';

/**
 * POST /api/creators/[id]/refresh-media
 *
 * Server-side media & metrics refresher for connected Instagram creators.
 * Safely uses the private server-side stored Instagram access token to refresh
 * temporary CDN URLs (video_url, thumbnail_url) and live engagement metrics.
 * Preserves the creator's curated `is_featured` and `is_visible` portfolio selections.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: creatorUserId } = await params;

  if (!creatorUserId) {
    return NextResponse.json({ error: 'Creator ID is required' }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();

    // 1. Fetch creator profile with private access token
    const { data: creatorProf, error: profError } = await serviceClient
      .from('creator_profiles')
      .select('id, user_id, instagram_connected, instagram_access_token, instagram_username, follower_count')
      .eq('user_id', creatorUserId)
      .maybeSingle();

    if (profError || !creatorProf) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    if (!creatorProf.instagram_connected || !creatorProf.instagram_access_token) {
      return NextResponse.json({
        synced: false,
        message: 'Instagram account is not connected or lacks stored access token.',
      });
    }

    const token = creatorProf.instagram_access_token;
    const now = new Date().toISOString();

    // 2. Fetch fresh profile data
    try {
      const freshProfile = await fetchInstagramProfile(token);
      if (freshProfile) {
        const updatePayload: TablesUpdate<'creator_profiles'> = {
          instagram_verified: true,
          updated_at: now,
        };
        if (typeof freshProfile.followerCount === 'number' && freshProfile.followerCount > 0) {
          updatePayload.follower_count = freshProfile.followerCount;
        }
        if (freshProfile.profilePictureUrl) {
          updatePayload.profile_image_path = freshProfile.profilePictureUrl;
        }
        await serviceClient
          .from('creator_profiles')
          .update(updatePayload)
          .eq('user_id', creatorUserId);
      }
    } catch (profErr) {
      console.warn('[Refresh Media] Profile info refresh note:', profErr);
    }

    // 3. Fetch fresh media items
    const mediaItems = await fetchInstagramUserMedia(token);
    if (!mediaItems || mediaItems.length === 0) {
      return NextResponse.json({
        synced: true,
        count: 0,
        message: 'No Instagram media items returned from Graph API.',
      });
    }

    // 4. Map existing database reels for this creator
    const { data: existingReels } = await serviceClient
      .from('creator_reels')
      .select('id, instagram_media_id, is_featured, is_visible, sort_order')
      .eq('creator_id', creatorUserId);

    const existingMap = new Map<string, { id: string; is_featured: boolean; is_visible: boolean }>();
    if (Array.isArray(existingReels)) {
      for (const r of existingReels) {
        if (r.instagram_media_id) {
          existingMap.set(r.instagram_media_id, {
            id: r.id,
            is_featured: Boolean(r.is_featured),
            is_visible: r.is_visible !== false,
          });
        }
      }
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (let idx = 0; idx < mediaItems.length; idx++) {
      const m = mediaItems[idx];
      const title = m.caption
        ? m.caption.length > 70
          ? `${m.caption.slice(0, 67)}...`
          : m.caption
        : `Instagram Reel #${idx + 1}`;
      const description = m.caption || null;
      const permalink = m.permalink || null;
      const reelUrl = m.permalink || null;
      const videoUrl = m.mediaUrl || m.permalink || '';
      const thumbnailUrl = m.thumbnailUrl || (m.mediaType === 'IMAGE' ? m.mediaUrl : null);

      const existing = existingMap.get(m.id);

      const reelPayload: TablesUpdate<'creator_reels'> = {
        title,
        description,
        video_url: videoUrl,
        reel_url: reelUrl,
        permalink,
        thumbnail_url: thumbnailUrl,
        instagram_media_id: m.id,
        media_type: m.mediaType || 'VIDEO',
        media_product_type: m.mediaProductType || 'REELS',
        like_count: m.likeCount ?? 0,
        comments_count: m.commentsCount ?? 0,
        view_count: m.viewsCount ?? 0,
        reach: m.reach ?? 0,
        shares_count: m.shares ?? 0,
        saved_count: m.saved ?? 0,
        posted_at: m.timestamp || null,
        last_synced_at: now,
        updated_at: now,
      };

      if (existing) {
        // Update fresh media URLs and metrics while strictly preserving featured/visible selection
        await serviceClient
          .from('creator_reels')
          .update(reelPayload)
          .eq('id', existing.id);
        updatedCount++;
      } else {
        const insertPayload: TablesInsert<'creator_reels'> = {
          ...reelPayload,
          title,
          video_url: videoUrl,
          creator_id: creatorUserId,
          type: 'client_work',
          sort_order: idx + 1,
          is_featured: existingMap.size === 0 && idx === 0,
          is_visible: true,
        };
        await serviceClient.from('creator_reels').insert(insertPayload);
        insertedCount++;
      }
    }

    // 5. Query and return the fresh synced reels
    const { data: freshReels } = await serviceClient
      .from('creator_reels')
      .select('*')
      .eq('creator_id', creatorUserId)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      success: true,
      synced: true,
      updated_count: updatedCount,
      inserted_count: insertedCount,
      total_reels: freshReels?.length || 0,
      reels: freshReels || [],
    });
  } catch (err: unknown) {
    console.error('[Refresh Media] Failed:', err);
    const message = err instanceof Error ? err.message : 'Failed to refresh Instagram media';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
