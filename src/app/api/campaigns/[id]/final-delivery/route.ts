import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { parseInstagramUrl } from '@/lib/utils/instagram';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'application/zip'];
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * GET /api/campaigns/[id]/final-delivery
 * 
 * Retrieves final deliverable info and signed URL for viewing.
 * Strictly gated: final deliverables are NEVER accessible before verified second payment!
 */
export async function GET(
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

    // 2. Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAuthorized =
      order.business_id === user.id ||
      order.business_user_id === user.id ||
      order.creator_id === user.id ||
      order.creator_user_id === user.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Security Gate: Verify Second Payment
    const isFinalPaymentVerified = Boolean(
      order.final_paid_at ||
      (order.payment_status === 'PAID' &&
        order.order_status !== 'WORK_STARTED' &&
        order.order_status !== 'PREVIEW_SUBMITTED' &&
        order.order_status !== 'AWAITING_FINAL_PAYMENT') ||
      order.order_status === 'READY_FOR_FINAL_DELIVERY' ||
      order.order_status === 'READY_TO_PUBLISH' ||
      order.order_status === 'DELIVERED' ||
      order.order_status === 'COMPLETED'
    );

    if (!isFinalPaymentVerified) {
      return NextResponse.json(
        {
          error: 'Final delivery is locked. The remaining 50% payment must be confirmed by the brand before accessing final deliverables.',
          is_unlocked: false,
        },
        { status: 403 }
      );
    }

    // 4. Fetch final delivery record
    const { data: finalDelivery } = await (supabase as any)
      .from('campaign_final_deliveries')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let signedUrl: string | null = null;
    if (finalDelivery?.storage_path) {
      const { data: signedData } = await supabase.storage
        .from('campaign-final-deliveries')
        .createSignedUrl(finalDelivery.storage_path, 3600);
      signedUrl = signedData?.signedUrl || null;
    }

    return NextResponse.json({
      is_unlocked: true,
      has_delivery: Boolean(finalDelivery || order.final_delivery_url),
      delivery: finalDelivery
        ? {
            ...finalDelivery,
            signed_url: signedUrl,
          }
        : {
            instagram_url: order.final_delivery_url,
            notes: order.final_delivery_notes,
            uploaded_at: order.final_delivered_at,
            delivery_status: order.order_status === 'COMPLETED' ? 'COMPLETED' : 'DELIVERED',
          },
    });
  } catch (err: any) {
    console.error('Error fetching final delivery:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/[id]/final-delivery
 * 
 * Creator uploads clean final video and submits Instagram publication link.
 * Strictly gated: final delivery can only be submitted after verified second payment.
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

    // 2. Fetch order
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
        { error: 'Forbidden. Only the assigned creator can submit final campaign deliverables.' },
        { status: 403 }
      );
    }

    // 3. Security Gate: Verify Second Payment
    const isFinalPaymentVerified = Boolean(
      order.final_paid_at ||
      ['READY_FOR_FINAL_DELIVERY', 'READY_TO_PUBLISH', 'DELIVERED', 'COMPLETED'].includes(order.order_status)
    );

    if (!isFinalPaymentVerified) {
      return NextResponse.json(
        {
          error: 'Second payment not verified. The brand must pay the remaining 50% before final clean delivery can be submitted.',
        },
        { status: 403 }
      );
    }

    // 4. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const instagramUrlRaw = formData.get('instagram_url') as string | null;
    const notes = formData.get('notes') as string | null;

    let canonicalInstagramUrl: string | null = null;
    if (instagramUrlRaw && instagramUrlRaw.trim().length > 0) {
      const parsed = parseInstagramUrl(instagramUrlRaw.trim());
      canonicalInstagramUrl = parsed.isValid ? parsed.canonicalUrl || instagramUrlRaw.trim() : instagramUrlRaw.trim();
    }

    if (!file && !canonicalInstagramUrl) {
      return NextResponse.json(
        { error: 'Please upload the clean final video file or submit the live Instagram publication URL.' },
        { status: 400 }
      );
    }

    let storagePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file format (${file.type}). Allowed: MP4, WebM, MOV, ZIP.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File exceeds maximum 500MB size limit.` },
          { status: 400 }
        );
      }

      const fileExt = file.name.split('.').pop() || 'mp4';
      storagePath = `${orderId}/final/clean_${Date.now()}.${fileExt}`;
      fileName = file.name;
      fileSize = file.size;
      mimeType = file.type;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('campaign-final-deliveries')
        .upload(storagePath, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: `Storage upload error: ${uploadError.message}` }, { status: 500 });
      }
    }

    const now = new Date().toISOString();

    // 5. Store record in public.campaign_final_deliveries
    const { data: finalRecord, error: insertError } = await (supabase as any)
      .from('campaign_final_deliveries')
      .insert({
        order_id: orderId,
        uploaded_by: user.id,
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        instagram_url: canonicalInstagramUrl,
        notes: notes ? notes.trim() : null,
        uploaded_at: now,
        publication_submitted_at: canonicalInstagramUrl ? now : null,
        delivery_status: 'DELIVERED',
      })
      .select()
      .single();

    if (insertError) {
      console.warn('Database final delivery insert notice:', insertError);
    }

    // 6. Update order status
    await (supabase as any)
      .from('orders')
      .update({
        order_status: 'DELIVERED',
        final_delivery_url: canonicalInstagramUrl || storagePath,
        final_delivery_notes: notes ? notes.trim() : null,
        final_delivered_at: now,
        delivered_at: now,
        current_final_delivery_id: finalRecord?.id,
        updated_at: now,
      })
      .eq('id', orderId);

    // 7. Audit event
    await (supabase as any).from('order_events').insert({
      order_id: orderId,
      actor_id: user.id,
      event_type: 'FINAL_DELIVERY_SUBMITTED',
      from_status: order.order_status,
      to_status: 'DELIVERED',
      reason: 'Creator submitted clean final deliverable and/or live Instagram URL.',
      metadata: {
        file_name: fileName,
        instagram_url: canonicalInstagramUrl,
        has_file: Boolean(file),
      },
    });

    // 8. In-app notification to Business
    const businessUserId = order.business_user_id || order.business_id;
    await (supabase as any).from('notifications').insert({
      user_id: businessUserId,
      related_order_id: orderId,
      type: 'ORDER_DELIVERED',
      title: 'Final Campaign Deliverables Submitted!',
      body: `Creator has uploaded the clean final deliverable${canonicalInstagramUrl ? ' and submitted live Instagram publication' : ''} for Order #${order.order_number}. Please verify and confirm completion.`,
    });

    // 9. Conversation message
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
        body: `🚀 Clean final deliverables submitted!${canonicalInstagramUrl ? `\nLive Instagram URL: ${canonicalInstagramUrl}` : ''}${notes ? `\nNotes: ${notes}` : ''}`,
        message: `🚀 Clean final deliverables submitted!${canonicalInstagramUrl ? `\nLive Instagram URL: ${canonicalInstagramUrl}` : ''}${notes ? `\nNotes: ${notes}` : ''}`,
        moderation_status: 'clean',
      });
    }

    return NextResponse.json({
      success: true,
      delivery: finalRecord,
      order_status: 'DELIVERED',
      message: 'Final deliverables submitted successfully.',
    });
  } catch (err: any) {
    console.error('Error submitting final delivery:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while submitting final deliverable' },
      { status: 500 }
    );
  }
}
