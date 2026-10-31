import { NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/server/payment';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create-order
 * 
 * Provider-independent server-side order creation.
 * Handles two equal 50% instalments (INITIAL and FINAL).
 * 
 * Guarantees:
 * 1. User must be authenticated.
 * 2. User must be the business owning the campaign order.
 * 3. Amount is strictly read from database order record (integer minor units / paise).
 * 4. Workflow state is verified per instalment.
 * 5. Fails safely and informs user if payment provider credentials are not yet configured.
 * 6. Never exposes secret keys to the browser.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user server-side
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to complete payment.' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const { order_id, stage = 'INITIAL', preferred_provider } = body;
    const paymentStage: 'INITIAL' | 'FINAL' = stage === 'FINAL' ? 'FINAL' : 'INITIAL';

    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    // 3. Fetch order from Supabase
    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, business_id, business_user_id, creator_id, creator_user_id, order_status, payment_status, total_amount, first_payment_amount, second_payment_amount, first_payment_amount_paise, second_payment_amount_paise, initial_payment_amount, final_payment_amount, initial_paid_at, final_paid_at, platform_commission_percentage, platform_commission_amount, creator_total_amount')
      .eq('id', order_id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 4. Ownership verification: caller must be the business
    const isOwner =
      order.business_id === user.id ||
      order.business_user_id === user.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to pay for this order.' },
        { status: 403 }
      );
    }

    // 5. Amount verification (Source of truth: database)
    const lockedTotalAmount = Number(order.total_amount);
    if (isNaN(lockedTotalAmount) || lockedTotalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount in database.' },
        { status: 400 }
      );
    }

    // Calculate Two-Stage (50% initial + 50% final) amounts
    const initialAmount = order.first_payment_amount
      ? Number(order.first_payment_amount)
      : Math.round(lockedTotalAmount * 0.5 * 100) / 100;
    const finalAmount = order.second_payment_amount
      ? Number(order.second_payment_amount)
      : Math.round((lockedTotalAmount - initialAmount) * 100) / 100;

    const stageAmount = paymentStage === 'FINAL' ? finalAmount : initialAmount;
    const amountInPaise = Math.round(stageAmount * 100);

    // Commission calculations for Easy Split
    const commissionPct = Number(order.platform_commission_percentage || 10.00);
    const platformInstalmentShare = Math.round(stageAmount * (commissionPct / 100.0) * 100) / 100;
    const creatorInstalmentShare = Math.round((stageAmount - platformInstalmentShare) * 100) / 100;

    // 6. Workflow state verification per stage
    if (paymentStage === 'INITIAL') {
      if (order.initial_paid_at || order.payment_status === 'PARTIALLY_PAID' || (order.payment_status === 'PAID' && order.initial_paid_at)) {
        return NextResponse.json(
          { error: 'Initial 50% payment has already been completed for this order.' },
          { status: 400 }
        );
      }

      const allowedInitialStatuses = [
        'DEAL_CONFIRMED',
        'AWAITING_FIRST_PAYMENT',
        'FIRST_PAYMENT_PENDING',
        'PAYMENT_PENDING',
        'ACCEPTED_AWAITING_PAYMENT',
        'DRAFT',
        'ACCEPTED'
      ];
      if (!allowedInitialStatuses.includes(order.order_status)) {
        return NextResponse.json(
          {
            error: `Initial payment cannot be initiated for order in '${order.order_status}' status.`,
          },
          { status: 400 }
        );
      }
    } else {
      // paymentStage === 'FINAL'
      if (order.final_paid_at || (order.payment_status === 'PAID' && order.final_paid_at)) {
        return NextResponse.json(
          { error: 'Final 50% payment has already been completed for this order.' },
          { status: 400 }
        );
      }

      const allowedFinalStatuses = [
        'PREVIEW_SUBMITTED',
        'AWAITING_FINAL_PAYMENT',
        'FINAL_PAYMENT_PENDING',
        'DELIVERED',
        'WORK_STARTED',
        'IN_PROGRESS',
        'PAID',
        'READY_TO_PUBLISH',
        'READY_FOR_FINAL_DELIVERY'
      ];
      if (!allowedFinalStatuses.includes(order.order_status)) {
        return NextResponse.json(
          {
            error: `Final payment cannot be initiated for order in '${order.order_status}' status. Creator must share preview first.`,
          },
          { status: 400 }
        );
      }
    }

    // 7. Resolve Payment Provider
    const provider = getPaymentProvider(preferred_provider);

    // If live credentials are not yet configured:
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment provider (${provider.providerName}) credentials are not configured yet. Credentials will be connected in the next phase.`,
          provider: provider.providerName,
          is_configured: false,
          order_id: order.id,
          order_number: order.order_number,
          stage: paymentStage,
          amount: stageAmount,
        },
        { status: 503 }
      );
    }

    // 8. Fetch creator profile for vendor split ID if available
    const creatorUserId = order.creator_user_id || order.creator_id;
    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('payout_upi_id, user_id')
      .eq('user_id', creatorUserId)
      .maybeSingle();

    // 9. Call provider-independent order creation
    const orderResult = await provider.createPaymentOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      instalmentType: paymentStage,
      amountInPaise,
      currency: 'INR',
      customer: {
        id: user.id,
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Business Partner',
        email: user.email || '',
      },
      splitDetails: {
        creatorVendorId: creatorProfile?.payout_upi_id || creatorUserId,
        creatorAmountInPaise: Math.round(creatorInstalmentShare * 100),
        platformAmountInPaise: Math.round(platformInstalmentShare * 100),
      },
      notes: {
        creator_user_id: creatorUserId,
        commission_percentage: String(commissionPct),
      },
    });

    // 10. Record payment in Supabase payments table
    const { data: paymentRecord, error: paymentInsertError } = await (supabase as any)
      .from('payments')
      .upsert(
        {
          order_id: order.id,
          payer_user_id: user.id,
          provider: provider.providerName,
          provider_order_id: orderResult.providerOrderId,
          provider_payment_id: orderResult.providerOrderId,
          amount: stageAmount,
          amount_in_paise: amountInPaise,
          currency: 'INR',
          status: 'PENDING',
          stage: paymentStage,
          instalment_type: paymentStage,
          razorpay_order_id: provider.providerName === 'razorpay' ? orderResult.providerOrderId : null,
          metadata: {
            stage: paymentStage,
            instalment_type: paymentStage,
            stage_amount: stageAmount,
            amount_in_paise: amountInPaise,
            total_amount: lockedTotalAmount,
            platform_share: platformInstalmentShare,
            creator_share: creatorInstalmentShare,
            commission_percentage: commissionPct,
            provider: provider.providerName,
          },
        },
        { onConflict: 'provider_order_id' }
      )
      .select()
      .maybeSingle();

    if (paymentInsertError) {
      console.warn('Payment record upsert notice:', paymentInsertError);
    }

    // 11. Record pending split entries in public.campaign_splits
    const targetPaymentId = paymentRecord?.id;
    if (targetPaymentId) {
      try {
        await (supabase as any).from('campaign_splits').insert([
          {
            payment_id: targetPaymentId,
            order_id: order.id,
            instalment_type: paymentStage,
            vendor_id: creatorProfile?.payout_upi_id || creatorUserId,
            vendor_role: 'creator',
            amount: creatorInstalmentShare,
            amount_in_paise: Math.round(creatorInstalmentShare * 100),
            currency: 'INR',
            split_status: 'PENDING',
            settlement_status: 'UNSETTLED',
          },
          {
            payment_id: targetPaymentId,
            order_id: order.id,
            instalment_type: paymentStage,
            vendor_id: 'PLATFORM_MARKETMYIDEA',
            vendor_role: 'platform',
            amount: platformInstalmentShare,
            amount_in_paise: Math.round(platformInstalmentShare * 100),
            currency: 'INR',
            split_status: 'PENDING',
            settlement_status: 'UNSETTLED',
          },
        ]);
      } catch (splitErr) {
        console.warn('Notice inserting campaign_splits:', splitErr);
      }
    }

    return NextResponse.json({
      success: true,
      provider: provider.providerName,
      provider_order_id: orderResult.providerOrderId,
      payment_session_id: orderResult.paymentSessionId,
      checkout_url: orderResult.checkoutUrl,
      amount: stageAmount,
      amount_in_paise: amountInPaise,
      currency: orderResult.currency,
      order_number: order.order_number,
      stage: paymentStage,
      instalment_type: paymentStage,
      key_id: provider.getPublicConfig().keyId || provider.getPublicConfig().appId || '',
    });
  } catch (err: any) {
    console.error('Error in /api/payments/create-order:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while creating payment order' },
      { status: 500 }
    );
  }
}
