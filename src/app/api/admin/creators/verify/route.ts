import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server database configuration missing.' },
        { status: 500 }
      );
    }

    // Get Auth header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Administrator authentication required.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify token with Supabase
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: 'Invalid or expired administrative token.' },
        { status: 401 }
      );
    }

    const adminUserId = userData.user.id;

    // Check if user is an administrator
    const { data: adminProfile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', adminUserId)
      .maybeSingle();

    if (profError || adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Caller is not a platform administrator.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      creatorId,
      status,
      reviewedFollowers,
      reviewedEngagement,
      reviewedViews,
      reviewNotes,
    } = body;

    if (!creatorId || typeof creatorId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid creatorId.' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'verified',
      'verified_manual',
      'rejected',
      'resubmission_required',
      'unverified',
      'pending_review',
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid verification status. Allowed: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const isApproved = status === 'verified' || status === 'verified_manual';

    // Parse numeric metrics safely
    const parsedFollowers =
      typeof reviewedFollowers === 'number' && !isNaN(reviewedFollowers)
        ? Math.max(0, Math.round(reviewedFollowers))
        : null;

    const parsedEngagement =
      typeof reviewedEngagement === 'number' && !isNaN(reviewedEngagement)
        ? Math.max(0, Number(reviewedEngagement.toFixed(2)))
        : null;

    const parsedViews =
      typeof reviewedViews === 'number' && !isNaN(reviewedViews)
        ? Math.max(0, Math.round(reviewedViews))
        : null;

    // Build update object
    const updatePayload: Record<string, any> = {
      verification_status: status,
      instagram_verified: isApproved,
      reviewed_at: now,
      reviewed_by: adminUserId,
      review_notes: typeof reviewNotes === 'string' ? reviewNotes.trim() : null,
      updated_at: now,
    };

    if (parsedFollowers !== null) {
      updatePayload.reviewed_follower_count = parsedFollowers;
      updatePayload.follower_count = parsedFollowers;
    }
    if (parsedEngagement !== null) {
      updatePayload.reviewed_engagement_rate = parsedEngagement;
      updatePayload.engagement_rate = parsedEngagement;
    }
    if (parsedViews !== null) {
      updatePayload.reviewed_avg_reel_views = parsedViews;
    }

    // Update creator_profiles
    const { error: updateError } = await supabaseAdmin
      .from('creator_profiles')
      .update(updatePayload)
      .eq('user_id', creatorId);

    if (updateError) {
      console.error('Failed to update creator verification status:', updateError);
      return NextResponse.json(
        { error: 'Database update failed: ' + updateError.message },
        { status: 500 }
      );
    }

    // Record audit trail in admin_actions
    await supabaseAdmin.from('admin_actions').insert({
      admin_id: adminUserId,
      action: 'VERIFY_CREATOR_MANUAL',
      target_type: 'creator_profile',
      target_id: creatorId,
      metadata: {
        new_status: status,
        reviewed_followers: parsedFollowers,
        reviewed_engagement: parsedEngagement,
        reviewed_views: parsedViews,
        notes: reviewNotes || null,
        timestamp: now,
      },
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      creatorId,
      status,
      reviewedFollowers: parsedFollowers,
      reviewedEngagement: parsedEngagement,
      reviewedViews: parsedViews,
      reviewedAt: now,
    });
  } catch (err: any) {
    console.error('Admin creator verification API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
