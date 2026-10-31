import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/campaigns/[id]/preview/upload
 * 
 * Creator uploads a watermarked, lower-resolution preview video.
 * Stored in private Supabase Storage bucket 'campaign-previews'.
 * Receives a 24-hour expiry timestamp.
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await props.params;

    // 1. Authenticate user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 2. Fetch order and check caller is the assigned creator
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isCreator =
      order.creator_id === user.id ||
      order.creator_user_id === user.id;

    if (!isCreator) {
      return NextResponse.json(
        { error: 'Forbidden. Only the assigned creator can upload campaign previews.' },
        { status: 403 }
      );
    }

    // 3. Workflow gate: creator must have verified first payment before submitting work
    const isFirstPaymentVerified = Boolean(
      order.initial_paid_at ||
      ['WORK_STARTED', 'IN_PROGRESS', 'REVISION_REQUESTED', 'PREVIEW_SUBMITTED', 'AWAITING_FINAL_PAYMENT'].includes(order.order_status)
    );

    if (!isFirstPaymentVerified) {
      return NextResponse.json(
        { error: 'First instalment payment must be confirmed before uploading previews.' },
        { status: 400 }
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const notes = formData.get('notes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Server-side file validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file format (${file.type}). Supported preview formats: MP4, WebM, MOV.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum preview limit of 100MB.`,
        },
        { status: 400 }
      );
    }

    // 5. Determine preview version
    const { count: existingCount } = await (supabase as any)
      .from('campaign_previews')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId);

    const previewVersion = (existingCount || 0) + 1;
    const fileExt = file.name.split('.').pop() || 'mp4';
    const storagePath = `${orderId}/previews/v${previewVersion}_${Date.now()}.${fileExt}`;

    // 6. Upload to private bucket 'campaign-previews'
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('campaign-previews')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiry

    // 7. Store preview metadata in public.campaign_previews
    const { data: previewRecord, error: previewInsertError } = await (supabase as any)
      .from('campaign_previews')
      .insert({
        order_id: orderId,
        uploaded_by: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        preview_version: previewVersion,
        notes: notes ? notes.trim() : null,
        is_watermarked: true,
        uploaded_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        preview_status: 'ACTIVE',
      })
      .select()
      .single();

    if (previewInsertError) {
      console.error('Database preview insert error:', previewInsertError);
      return NextResponse.json(
        { error: 'Failed to record preview in database' },
        { status: 500 }
      );
    }

    // 8. Update order state to PREVIEW_SUBMITTED
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'PREVIEW_SUBMITTED',
        current_preview_id: previewRecord.id,
        preview_submitted_at: now.toISOString(),
        preview_notes: notes ? notes.trim() : null,
        updated_at: now.toISOString(),
      })
      .eq('id', orderId);

    // 9. Preserved Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'PREVIEW_SUBMITTED',
      from_status: order.order_status,
      to_status: 'PREVIEW_SUBMITTED',
      reason: `Creator uploaded preview v${previewVersion} (watermarked). 24-hour review countdown initiated.`,
      metadata: {
        preview_id: previewRecord.id,
        preview_version: previewVersion,
        file_name: file.name,
        file_size: file.size,
        expires_at: expiresAt.toISOString(),
      },
    });

    // 10. In-app notification to Business
    const businessUserId = order.business_user_id || order.business_id;
    await (supabase as any).from('notifications').insert({
      user_id: businessUserId,
      related_order_id: orderId,
      type: 'ORDER_DELIVERED',
      title: 'Campaign Preview Submitted',
      body: 'Creator has submitted your campaign preview. Please review the preview before the 24-hour window expires.',
    });

    // 11. Conversation system message
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        order_id: orderId,
        sender_id: user.id,
        sender_user_id: user.id,
        sender_role: 'creator',
        body: `🎬 Watermarked preview v${previewVersion} uploaded for review. (Expires in 24 hours).${notes ? `\nNotes: ${notes}` : ''}`,
        message: `🎬 Watermarked preview v${previewVersion} uploaded for review. (Expires in 24 hours).${notes ? `\nNotes: ${notes}` : ''}`,
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      preview: previewRecord,
      order_status: 'PREVIEW_SUBMITTED',
      message: 'Preview uploaded successfully. Review window: 24 hours.',
    });
  } catch (err: any) {
    console.error('Error uploading preview:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while uploading preview' },
      { status: 500 }
    );
  }
}
